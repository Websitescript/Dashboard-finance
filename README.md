# New Tab Dashboard

A personal new-tab page: quick links, folders, saved notes, a live markets
ticker (NIFTY 50, Gold India, Gold USA, US market, Mirae Asset NYSE FANG+
ETF), and an upcoming-IPO watchlist with grey market premium (GMP).

It runs entirely on **GitHub Pages** — no server, no database, no Node.

| Piece | What it does | Where it runs |
|---|---|---|
| The site (`index.html`, `css/`, `js/`) | Renders everything. Bookmarks/folders/notes are saved in your browser's `localStorage`. Markets & IPOs are read from two small JSON files. | Your browser, served statically by GitHub Pages |
| `scripts/*.py` + the GitHub Action | Fetches live quotes & IPO info and regenerates `data/markets.json` / `data/ipos.json` | GitHub's servers, on a schedule (Python, not Node) |

Every refresh simply overwrites the two JSON files with the latest snapshot
— there's no database in the loop. That keeps the whole thing to two
moving parts: a static site, and a scheduled script that keeps two JSON
files fresh.

---

## 1. (Optional) Get an IPO data API key

By default, the IPO section is powered entirely by `data/ipos_manual.json`
— you edit that file directly (name, dates, price band, and GMP if you want
to track it yourself). This is genuinely a fine way to run it; GMP isn't
available from any free, reliable official source anyway.

If you'd rather pull live upcoming/open IPOs from India automatically:

1. Sign up at [ipoalerts.in](https://ipoalerts.in) and grab a free API key.
2. Note: GMP on ipoalerts.in is a paid add-on. Without it you'll still get
   live dates, price bands, and lot sizes — just add GMP by hand in
   `data/ipos_manual.json` using the *same company name*; the fetch script
   merges the two automatically.

If you'd rather skip this entirely, do nothing — the site works fine off
`data/ipos_manual.json` alone.

## 2. Push this project to GitHub

```bash
cd newtab-site
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 3. (Optional) Add your IPO API key as a secret

Only needed if you did step 1. In your GitHub repo:
**Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
|---|---|
| `IPOALERTS_API_KEY` | The key from step 1 |

## 4. Turn on GitHub Pages

**Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, folder: `/ (root)` → Save.

GitHub gives you a URL like `https://<your-username>.github.io/<your-repo>/`.
(To set it as your browser's actual new-tab page, most browsers need an
extension like "Custom New Tab URL" pointed at that link.)

## 5. Run the data refresh

Go to the **Actions** tab → you'll see two workflows: *Refresh market data*
and *Refresh IPO data*. Click into each and hit *Run workflow* to trigger
them immediately the first time. After that they run on their own schedules:

- **Markets** — every 30 minutes (`.github/workflows/refresh-markets.yml`)
- **IPOs** — every 2 hours (`.github/workflows/refresh-ipos.yml`)

Each writes only its own JSON file and commits separately. Refresh your
Pages site after they finish.

### Changing either timer

Open the workflow file and edit the `cron:` line — each uses standard
5-field cron (`minute hour day month weekday`, all in UTC):

| Schedule | Cron |
|---|---|
| Every 15 minutes | `*/15 * * * *` |
| Every 30 minutes | `*/30 * * * *` |
| Every hour | `0 * * * *` |
| Every 2 hours | `0 */2 * * *` |
| Every 6 hours | `0 */6 * * *` |
| Once a day at 9am UTC | `0 9 * * *` |
| Weekdays only, every hour | `0 * * * 1-5` |

[crontab.guru](https://crontab.guru) is handy for building/checking any
custom pattern. Note GitHub Actions' schedules are UTC and can drift a few
minutes under load — fine for this use case, but don't rely on
second-level precision.

---

## Running it locally

No install needed for the site itself — open `index.html` directly, or serve it:

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

To test the data scripts locally:

```bash
cd scripts
pip install -r requirements.txt
export IPOALERTS_API_KEY="..."   # optional
python3 fetch_markets.py
python3 fetch_ipos.py
```

## Editing IPOs by hand

Open `data/ipos_manual.json` and add an entry:

```json
{
  "name": "Example Corp Ltd",
  "type": "Mainboard",
  "openDate": "2026-09-10",
  "closeDate": "2026-09-12",
  "listingDate": "2026-09-17",
  "priceRangeMin": 200,
  "priceRangeMax": 212,
  "lotSize": 65,
  "issueSize": "₹800 Cr",
  "gmp": 25,
  "status": "upcoming",
  "infoUrl": "https://www.nseindia.com/..."
}
```

Commit it — the next Action run (or a manual trigger) picks it up and
folds it into `data/ipos.json`. Update `"gmp"` whenever you want to log a
new reading.

## Where each market symbol comes from

| Section | Source | Ticker |
|---|---|---|
| NIFTY 50 | Yahoo Finance | `^NSEI` |
| Gold India | Nippon India ETF Gold BeES (NSE, mirrors domestic gold price) | `GOLDBEES.NS` |
| Gold USA | COMEX gold futures, USD/troy oz | `GC=F` |
| US Stock Market | S&P 500 | `^GSPC` |
| Mirae Asset NYSE FANG+ ETF | NSE-listed | `MAFANG.NS` |

Yahoo Finance's endpoint here is free and unofficial — it can occasionally
rate-limit or change shape without notice. If a symbol fails on a given
run, the site just keeps showing the last good value rather than breaking.

## What changed from the original project

The original was a ~13MB Bootstrap admin-template rebuild (Corona Admin)
with most of its vendor libraries, demo pages (charts/forms/tables/icons),
and separate bookmark/folder/tab management pages unused by the actual new
tab functionality. This version keeps only what the dashboard needs: no
jQuery, no Bootstrap, no unused vendor assets — a single page, a small
hand-written CSS file, and plain JS modules.

## Want history back?

Right now each refresh overwrites the JSON files, so you only ever see the
latest snapshot — no trend lines, no "NIFTY over the last 30 days." If you
want that later, the simplest add is having the scripts append to a
running log file (e.g. `data/markets_history.jsonl`) instead of just
overwriting `markets.json`, with no database required.
