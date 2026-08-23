const iposModule = {
  async init() {
    this.wrap = document.getElementById("ipo-table-wrap");
    this.updatedAtEl = document.getElementById("ipo-updated-at");
    await this.render();
  },

  async render() {
    let data;
    try {
      const res = await fetch(window.DATA.ipos, { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status}`);
      data = await res.json();
    } catch (err) {
      console.error("Failed to load IPO data:", err);
      this.wrap.innerHTML = `<div class="empty-note">Couldn't load IPO data yet — data/ipos.json hasn't been generated. See the README to run the GitHub Action, or edit data/ipos_manual.json directly.</div>`;
      return;
    }

    const ipos = data.ipos || [];
    if (data.updatedAt) {
      this.updatedAtEl.textContent = `Updated ${new Date(data.updatedAt).toLocaleString()}`;
    }

    if (ipos.length === 0) {
      this.wrap.innerHTML = `<div class="empty-note">No upcoming or open IPOs tracked right now. Add entries to data/ipos_manual.json to track your own list.</div>`;
      return;
    }

    const rows = ipos
      .map((ipo) => {
        const priceRange =
          ipo.priceRangeMin != null && ipo.priceRangeMax != null
            ? `₹${ipo.priceRangeMin}–${ipo.priceRangeMax}`
            : "—";

        let gmpCell = `<span class="gmp-na">—</span>`;
        if (ipo.gmp != null) {
          const dir = ipo.gmp >= 0 ? "up" : "down";
          const pct = ipo.gmpPercent != null ? ` (${ipo.gmpPercent >= 0 ? "+" : ""}${ipo.gmpPercent.toFixed(1)}%)` : "";
          gmpCell = `<span class="gmp-val ${dir}">${ipo.gmp >= 0 ? "+" : ""}₹${ipo.gmp}${pct}</span>`;
        }

        const estListing =
          ipo.priceRangeMax != null && ipo.gmp != null
            ? `₹${(ipo.priceRangeMax + ipo.gmp).toFixed(0)}`
            : "—";

        return `
          <tr>
            <td class="ipo-name">
              ${escapeHtml(ipo.name)}
              <span class="type-tag">${escapeHtml(ipo.type || "Mainboard")}</span>
            </td>
            <td>${fmtDate(ipo.openDate)}</td>
            <td>${fmtDate(ipo.closeDate)}</td>
            <td>${fmtDate(ipo.listingDate)}</td>
            <td>${priceRange}</td>
            <td>${gmpCell}</td>
            <td>${estListing}</td>
            <td><span class="status-badge ${ipo.status || "upcoming"}">${ipo.status || "upcoming"}</span></td>
          </tr>
        `;
      })
      .join("");

    this.wrap.innerHTML = `
      <table class="ipo-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Opens</th>
            <th>Closes</th>
            <th>Listing date</th>
            <th>Price band</th>
            <th>GMP</th>
            <th>Est. listing price</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  },
};

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}
