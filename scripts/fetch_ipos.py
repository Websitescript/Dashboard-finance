"""
Builds the IPO watchlist from two sources:

  1. data/ipos_manual.json — entries you maintain by hand (edit the file,
     commit, done). This is all you need if you don't want to sign up for
     an external API — including for entering GMP yourself.
  2. ipoalerts.in's API (https://ipoalerts.in) — optional. Set the
     IPOALERTS_API_KEY secret to pull live "upcoming"/"open" IPOs
     automatically. Note: GMP on ipoalerts.in is a paid add-on; without it
     you'll still get dates/price band/lot size live, and can add GMP by
     hand in ipos_manual.json for the same company name.

Both sources are merged (live data wins on overlapping fields; a manual
GMP is kept if the live source doesn't have one) and written to
data/ipos.json for the static site to read.

Run manually:  IPOALERTS_API_KEY="..." python scripts/fetch_ipos.py
Run in CI:      see .github/workflows/refresh-data.yml
"""

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
MANUAL_FILE = ROOT / "data" / "ipos_manual.json"
OUT_FILE = ROOT / "data" / "ipos.json"

IPOALERTS_BASE = "https://api.ipoalerts.in"


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def load_manual() -> list[dict]:
    if not MANUAL_FILE.exists():
        return []
    try:
        entries = json.loads(MANUAL_FILE.read_text())
    except json.JSONDecodeError as exc:
        print(f"::warning::Couldn't parse {MANUAL_FILE}: {exc}", file=sys.stderr)
        return []

    for e in entries:
        e["source"] = "manual"
        e.setdefault("type", "Mainboard")
        e.setdefault("status", "upcoming")
    return entries


def parse_price_range(price_range: str | None) -> tuple[float | None, float | None]:
    if not price_range:
        return None, None
    nums = re.findall(r"[\d.]+", price_range)
    if len(nums) >= 2:
        return float(nums[0]), float(nums[1])
    if len(nums) == 1:
        return float(nums[0]), float(nums[0])
    return None, None


def fetch_live() -> list[dict]:
    api_key = os.environ.get("IPOALERTS_API_KEY")
    if not api_key:
        print("IPOALERTS_API_KEY not set — using data/ipos_manual.json only.")
        return []

    live = []
    for status in ("upcoming", "open"):
        url = f"{IPOALERTS_BASE}/ipos?status={status}&limit=50&includeGmp=true"
        try:
            resp = requests.get(url, headers={"x-api-key": api_key}, timeout=15)
            resp.raise_for_status()
        except requests.RequestException as exc:
            print(f"::warning::ipoalerts.in request failed for status={status}: {exc}", file=sys.stderr)
            continue

        for raw in resp.json().get("ipos", []):
            min_price, max_price = parse_price_range(raw.get("priceRange"))
            gmp_block = raw.get("gmp") or {}
            gmp_sources = gmp_block.get("sources") or []

            live.append({
                "name": raw.get("name"),
                "type": "SME" if raw.get("type") == "SME" else ("Other" if raw.get("type") == "DEBT" else "Mainboard"),
                "openDate": raw.get("startDate"),
                "closeDate": raw.get("endDate"),
                "listingDate": raw.get("listingDate"),
                "priceRangeMin": min_price,
                "priceRangeMax": max_price,
                "lotSize": raw.get("minQty"),
                "issueSize": raw.get("issueSize"),
                "gmp": gmp_block.get("aggregations", {}).get("median", gmp_sources[0].get("gmpPrice") if gmp_sources else None),
                "status": raw.get("status") if raw.get("status") in ("upcoming", "open", "closed", "listed") else "upcoming",
                "infoUrl": raw.get("infoUrl") or raw.get("nseInfoUrl"),
                "source": "ipoalerts",
            })

    return live


def merge(manual: list[dict], live: list[dict]) -> list[dict]:
    by_key: dict[str, dict] = {}

    for entry in manual:
        by_key[slugify(entry["name"])] = dict(entry)

    for entry in live:
        key = slugify(entry["name"])
        if key in by_key:
            manual_gmp = by_key[key].get("gmp")
            merged = {**by_key[key], **{k: v for k, v in entry.items() if v is not None}}
            if entry.get("gmp") is None and manual_gmp is not None:
                merged["gmp"] = manual_gmp
            by_key[key] = merged
        else:
            by_key[key] = entry

    return list(by_key.values())


def compute_gmp_percent(entry: dict) -> dict:
    price_max = entry.get("priceRangeMax")
    gmp = entry.get("gmp")
    if price_max and gmp is not None:
        entry["gmpPercent"] = round((gmp / price_max) * 100, 2)
    else:
        entry.setdefault("gmpPercent", None)
    return entry


def main() -> None:
    now = datetime.now(timezone.utc).isoformat()
    manual = load_manual()
    live = fetch_live()
    merged = [compute_gmp_percent(e) for e in merge(manual, live)]

    # Keep only companies that haven't listed yet, soonest opening first.
    merged = [e for e in merged if e.get("status") != "listed"]
    merged.sort(key=lambda e: e.get("openDate") or "9999-99-99")

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps({"updatedAt": now, "ipos": merged}, indent=2))
    print(f"Wrote {OUT_FILE} ({len(merged)} IPOs)")


if __name__ == "__main__":
    main()
