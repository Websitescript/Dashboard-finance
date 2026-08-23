const foldersModule = {
  KEY: "newtab.folders",

  init() {
    this.grid = document.getElementById("folders-grid");
    document.getElementById("add-folder-tile").addEventListener("click", () => this.openAddFolderModal());
    if (this.getAll().length === 0) this.seedDefaults();
    this.render();
  },

  getAll() {
    return store.read(this.KEY, []);
  },

  saveAll(folders) {
    store.write(this.KEY, folders);
  },

  // A couple of sensible starting groups, mirroring the original dashboard —
  // feel free to delete or edit these from the UI at any time.
  seedDefaults() {
    this.saveAll([
      {
        id: store.uid(),
        name: "AI Chatbots",
        links: [
          { id: store.uid(), name: "Gemini", url: "https://gemini.google.com/" },
          { id: store.uid(), name: "ChatGPT", url: "https://chatgpt.com/" },
          { id: store.uid(), name: "Claude", url: "https://claude.ai/" },
        ],
      },
      {
        id: store.uid(),
        name: "Microsoft",
        links: [
          { id: store.uid(), name: "Office", url: "https://www.office.com/" },
          { id: store.uid(), name: "Outlook", url: "https://outlook.office365.com/mail/" },
        ],
      },
    ]);
  },

  render() {
    const folders = this.getAll();
    this.grid.querySelectorAll(".folder-card").forEach((el) => el.remove());
    const addTile = document.getElementById("add-folder-tile");

    folders.forEach((folder) => {
      const card = document.createElement("div");
      card.className = "card folder-card";

      const head = document.createElement("div");
      head.className = "folder-head";
      head.innerHTML = `<h4>${escapeHtml(folder.name)}</h4>`;

      const headBtns = document.createElement("div");
      headBtns.style.display = "flex";
      headBtns.style.gap = "6px";

      const addLinkBtn = document.createElement("button");
      addLinkBtn.className = "icon-btn";
      addLinkBtn.textContent = "+";
      addLinkBtn.title = "Add link";
      addLinkBtn.addEventListener("click", () => this.openAddLinkModal(folder));

      const removeBtn = document.createElement("button");
      removeBtn.className = "icon-btn";
      removeBtn.textContent = "✕";
      removeBtn.title = "Delete folder";
      removeBtn.addEventListener("click", () => {
        this.saveAll(this.getAll().filter((f) => f.id !== folder.id));
        this.render();
      });

      headBtns.append(addLinkBtn, removeBtn);
      head.appendChild(headBtns);
      card.appendChild(head);

      const linksWrap = document.createElement("div");
      linksWrap.className = "folder-links";

      if (folder.links.length === 0) {
        const empty = document.createElement("span");
        empty.className = "m-unit";
        empty.textContent = "No links yet";
        linksWrap.appendChild(empty);
      }

      folder.links.forEach((link) => {
        const mini = document.createElement("span");
        mini.className = "mini-link";
        mini.innerHTML = `<img src="${ui.faviconFor(link.url)}" alt="" />${escapeHtml(link.name)}`;
        mini.addEventListener("click", () => window.open(ui.normalizeUrl(link.url), "_blank"));

        const del = document.createElement("span");
        del.textContent = "✕";
        del.style.opacity = "0.5";
        del.style.marginLeft = "2px";
        del.addEventListener("click", (e) => {
          e.stopPropagation();
          folder.links = folder.links.filter((l) => l.id !== link.id);
          this.saveAll(folders);
          this.render();
        });
        mini.appendChild(del);

        linksWrap.appendChild(mini);
      });

      card.appendChild(linksWrap);
      this.grid.insertBefore(card, addTile);
    });
  },

  openAddFolderModal() {
    ui.openModal({
      title: "New folder",
      submitLabel: "Create",
      fields: [{ key: "name", label: "Folder name", placeholder: "e.g. Work Tools" }],
      onSubmit: async ({ name }) => {
        if (!name) throw new Error("Folder name is required.");
        const folders = this.getAll();
        folders.push({ id: store.uid(), name, links: [] });
        this.saveAll(folders);
        this.render();
      },
    });
  },

  openAddLinkModal(folder) {
    ui.openModal({
      title: `Add link to "${folder.name}"`,
      submitLabel: "Add",
      fields: [
        { key: "name", label: "Name", placeholder: "e.g. Outlook" },
        { key: "url", label: "URL", placeholder: "e.g. outlook.office.com" },
      ],
      onSubmit: async ({ name, url }) => {
        if (!name || !url) throw new Error("Name and URL are required.");
        const folders = this.getAll();
        const target = folders.find((f) => f.id === folder.id);
        target.links.push({ id: store.uid(), name, url: ui.normalizeUrl(url) });
        this.saveAll(folders);
        this.render();
      },
    });
  },
};
