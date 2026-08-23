const marketsModule = {
  async init() {
    this.tickerTrack = document.getElementById("ticker-track");
    this.marketsGrid = document.getElementById("markets-grid");
    this.updatedAtEl = document.getElementById("markets-updated-at");
    await this.render();
  },

  async render() {
    let data;
    try {
      const res = await fetch(window.DATA.markets, { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status}`);
      data = await res.json();
    } catch (err) {
      console.error("Failed to load market data:", err);
      this.marketsGrid.innerHTML = `<div class="empty-note">Couldn't load market data yet — data/markets.json hasn't been generated. See the README to run the GitHub Action.</div>`;
      return;
    }

    const quotes = data.quotes || [];
    this.renderTicker(quotes);
    this.renderCards(quotes);
    if (data.updatedAt) {
      this.updatedAtEl.textContent = `Updated ${new Date(data.updatedAt).toLocaleString()}`;
    }
  },

  fmtPrice(q) {
    if (q.price == null) return "—";
    return q.price.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  },

  direction(q) {
    if (q.change == null) return "flat";
    if (q.change > 0) return "up";
    if (q.change < 0) return "down";
    return "flat";
  },

  renderTicker(quotes) {
    const build = () =>
      quotes
        .map((q) => {
          const dir = this.direction(q);
          const arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "•";
          const pct = q.changePercent != null ? `${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%` : "—";
          return `
            <span class="ticker-item">
              <span class="t-label">${escapeHtml(q.label)}</span>
              <span class="t-price">${this.fmtPrice(q)}</span>
              <span class="t-change ${dir}">${arrow} ${pct}</span>
            </span>
          `;
        })
        .join("");

    this.tickerTrack.innerHTML = `
      <span class="live-dot"></span>
      ${build()}
      ${build()}
    `;
  },

  renderCards(quotes) {
    this.marketsGrid.innerHTML = "";
    quotes.forEach((q) => {
      const dir = this.direction(q);
      const pct = q.changePercent != null ? `${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%` : "—";
      const change = q.change != null ? `${q.change >= 0 ? "+" : ""}${q.change.toFixed(2)}` : "—";

      const card = document.createElement("div");
      card.className = "card market-card";
      card.innerHTML = `
        <div class="m-label">${escapeHtml(q.label)}</div>
        <div class="m-price">${q.currency ? `${q.currency} ` : ""}${this.fmtPrice(q)}</div>
        <div class="m-meta">
          <span class="pill ${dir}">${change} · ${pct}</span>
          <span class="m-unit">${escapeHtml(q.unit || "")}</span>
        </div>
      `;
      this.marketsGrid.appendChild(card);
    });
  },
};
