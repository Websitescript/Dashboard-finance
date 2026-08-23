const ui = {
  backdrop: null,

  init() {
    this.backdrop = document.getElementById("modal-backdrop");
    this.backdrop.addEventListener("click", (e) => {
      if (e.target === this.backdrop) this.closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.closeModal();
    });
  },

  /**
   * fields: [{ key, label, placeholder, type }]
   * onSubmit: async (values) => void   — throwing shows the error inline
   */
  openModal({ title, fields, submitLabel = "Save", onSubmit }) {
    this.backdrop.innerHTML = "";
    const modal = document.createElement("div");
    modal.className = "modal";

    const h3 = document.createElement("h3");
    h3.textContent = title;
    modal.appendChild(h3);

    const inputs = {};
    fields.forEach((f) => {
      const label = document.createElement("label");
      label.textContent = f.label;
      modal.appendChild(label);
      const input = document.createElement("input");
      input.type = f.type || "text";
      input.placeholder = f.placeholder || "";
      if (f.value !== undefined) input.value = f.value;
      modal.appendChild(input);
      inputs[f.key] = input;
    });

    const errorEl = document.createElement("div");
    errorEl.style.color = "var(--coral)";
    errorEl.style.fontSize = "12.5px";
    errorEl.style.marginTop = "10px";
    modal.appendChild(errorEl);

    const actions = document.createElement("div");
    actions.className = "modal-actions";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn-ghost";
    cancelBtn.textContent = "Cancel";
    cancelBtn.type = "button";
    cancelBtn.onclick = () => this.closeModal();

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn-primary";
    saveBtn.textContent = submitLabel;
    saveBtn.type = "button";
    saveBtn.onclick = async () => {
      const values = Object.fromEntries(
        Object.entries(inputs).map(([k, el]) => [k, el.value.trim()])
      );
      saveBtn.disabled = true;
      try {
        await onSubmit(values);
        this.closeModal();
      } catch (err) {
        errorEl.textContent = err.message || "Something went wrong.";
      } finally {
        saveBtn.disabled = false;
      }
    };

    actions.append(cancelBtn, saveBtn);
    modal.appendChild(actions);

    this.backdrop.appendChild(modal);
    this.backdrop.classList.remove("hidden");
    const firstInput = modal.querySelector("input");
    if (firstInput) firstInput.focus();
  },

  closeModal() {
    this.backdrop.classList.add("hidden");
    this.backdrop.innerHTML = "";
  },

  faviconFor(url) {
    try {
      return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`;
    } catch {
      return "";
    }
  },

  normalizeUrl(url) {
    if (!/^https?:\/\//i.test(url)) return `https://${url}`;
    return url;
  },
};
