// Pure static site — no backend. These point at the JSON snapshots that the
// GitHub Action (scripts/fetch_markets.py, scripts/fetch_ipos.py) regenerates
// on a schedule and commits into /data. Cache-bust with a timestamp so
// GitHub Pages' CDN doesn't serve a stale copy between refreshes.
window.DATA = {
  markets: `data/markets.json?t=${Date.now()}`,
  ipos: `data/ipos.json?t=${Date.now()}`,
};
