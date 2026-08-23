const store = {
  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  uid() {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  },
};
