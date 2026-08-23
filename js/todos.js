const todosModule = {
  KEY: "newtab.todos",

  init() {
    this.list = document.getElementById("todo-list");
    const form = document.getElementById("todo-form");
    const input = document.getElementById("todo-input");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      const items = this.getAll();
      items.unshift({ id: store.uid(), text, done: false });
      this.saveAll(items);
      input.value = "";
      this.render();
    });

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
    this.list.innerHTML = "";

    if (items.length === 0) {
      this.list.innerHTML = `<li class="empty-note">Nothing saved yet — add a link or note above.</li>`;
      return;
    }

    items.forEach((t) => {
      const li = document.createElement("li");
      li.className = `todo-item${t.done ? " done" : ""}`;

      const check = document.createElement("span");
      check.className = `checkbox${t.done ? " checked" : ""}`;
      check.textContent = t.done ? "✓" : "";
      check.addEventListener("click", () => {
        const all = this.getAll();
        const target = all.find((x) => x.id === t.id);
        target.done = !target.done;
        this.saveAll(all);
        this.render();
      });

      const txt = document.createElement("span");
      txt.className = "txt";
      txt.textContent = t.text;

      const del = document.createElement("button");
      del.className = "icon-btn";
      del.textContent = "✕";
      del.addEventListener("click", () => {
        this.saveAll(this.getAll().filter((x) => x.id !== t.id));
        this.render();
      });

      li.append(check, txt, del);
      this.list.appendChild(li);
    });
  },
};
