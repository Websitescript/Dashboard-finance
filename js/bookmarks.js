const bookmarksModule = {
  KEY: "newtab.bookmarks",

  init() {
    this.grid = document.getElementById("links-grid");
    document.getElementById("add-link-tile").addEventListener("click", () => this.openAddModal());
    this.render();
  },

  getAll() {
    return store.read(this.KEY, []);
  },

  saveAll(items) {
    store.write(this.KEY, items);
  },

  render() {
    const items = this.getAll();
    this.grid.querySelectorAll(".link-card").forEach((el) => el.remove());
    const addTile = document.getElementById("add-link-tile");

    items.forEach((b) => {
      const card = document.createElement("div");
      card.className = "link-card";
      card.title = b.url;
      card.innerHTML = `
        <button class="remove-btn" aria-label="Remove">✕</button>
        <img class="favicon" src="${ui.faviconFor(b.url)}" alt="" />
        <span class="name">${escapeHtml(b.name)}</span>
      `;
      card.addEventListener("click", (e) => {
        if (e.target.closest(".remove-btn")) return;
        window.open(ui.normalizeUrl(b.url), "_blank");
      });
      card.querySelector(".remove-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        this.saveAll(this.getAll().filter((x) => x.id !== b.id));
        this.render();
      });
      this.grid.insertBefore(card, addTile);
    });
  },

  openAddModal() {
    ui.openModal({
      title: "Add quick link",
      submitLabel: "Add",
      fields: [
        { key: "name", label: "Name", placeholder: "e.g. Gmail" },
        { key: "url", label: "URL", placeholder: "e.g. mail.google.com" },
      ],
      onSubmit: async ({ name, url }) => {
        if (!name || !url) throw new Error("Name and URL are required.");
        const items = this.getAll();
        items.push({ id: store.uid(), name, url: ui.normalizeUrl(url) });
        this.saveAll(items);
        this.render();
      },
    });
  },
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
