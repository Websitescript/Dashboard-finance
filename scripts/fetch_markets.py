"""
Fetches the watchlist (NIFTY 50, Gold India, Gold USA, US market, Mirae
Asset FANG+ ETF) from Yahoo Finance's public chart endpoint and writes
data/markets.json for the static site to read.

Run manually:  python scripts/fetch_markets.py
Run in CI:      see .github/workflows/refresh-data.yml
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
OUT_FILE = ROOT / "data" / "markets.json"

# Gold India is tracked via Gold BeES (an NSE ETF that mirrors domestic gold
# prices in INR) since MCX futures aren't available on a free data feed.
# Gold USA is COMEX gold futures, priced in USD per troy ounce.
WATCHLIST = [
    {"symbol": "^NSEI", "label": "NIFTY 50", "unit": "index"},
    {"symbol": "GOLDBEES.NS", "label": "Gold India (Gold BeES, NSE)", "unit": "per unit"},
    {"symbol": "GC=F", "label": "Gold USA (COMEX)", "unit": "per troy oz"},
    {"symbol": "^GSPC", "label": "US Stock Market (S&P 500)", "unit": "index"},
    {"symbol": "MAFANG.NS", "label": "Mirae Asset NYSE FANG+ ETF", "unit": "per unit"},
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "application/json",
}


def fetch_quote(symbol: str) -> dict:
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=5d"
    resp = requests.get(url, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    payload = resp.json()

    result = (payload.get("chart") or {}).get("result") or []
    if not result:
        error = (payload.get("chart") or {}).get("error") or {}
        raise ValueError(f"No chart data for {symbol}: {error.get('description', 'unknown error')}")

    meta = result[0]["meta"]
    price = meta.get("regularMarketPrice")
    previous_close = meta.get("chartPreviousClose", meta.get("previousClose"))

    if price is None or previous_close is None:
        raise ValueError(f"Missing price data for {symbol}")

    change = price - previous_close
    change_percent = (change / previous_close * 100) if previous_close else 0

    return {
        "price": round(price, 4),
        "previousClose": round(previous_close, 4),
        "change": round(change, 4),
        "changePercent": round(change_percent, 4),
        "currency": meta.get("currency", ""),
    }


def main() -> None:
    now = datetime.now(timezone.utc).isoformat()
    quotes = []

    for entry in WATCHLIST:
        symbol, label, unit = entry["symbol"], entry["label"], entry["unit"]
        try:
            data = fetch_quote(symbol)
            quote = {"symbol": symbol, "label": label, "unit": unit, "fetchedAt": now, **data}
            print(f"OK  {label:35s} {data['price']:>12} ({data['changePercent']:+.2f}%)")
        except Exception as exc:  # noqa: BLE001
            print(f"::warning::Failed to fetch {symbol}: {exc}", file=sys.stderr)
            quote = {
                "symbol": symbol,
                "label": label,
                "unit": unit,
                "price": None,
                "previousClose": None,
                "change": None,
                "changePercent": None,
                "currency": "",
                "fetchedAt": now,
                "unavailable": True,
            }

        quotes.append(quote)

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps({"updatedAt": now, "quotes": quotes}, indent=2))
    print(f"Wrote {OUT_FILE}")


if __name__ == "__main__":
    main()
