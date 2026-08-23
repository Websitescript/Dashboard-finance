function initSearch() {
  const form = document.getElementById("search-form");
  const input = document.getElementById("search-input");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    const isUrl = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(q);
    const target = isUrl
      ? (q.startsWith("http") ? q : `https://${q}`)
      : `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    window.open(target, "_blank");
    input.value = "";
  });
}
