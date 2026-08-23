function startClock() {
  const timeEl = document.getElementById("clock-time");
  const dateEl = document.getElementById("clock-date");

  function tick() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    timeEl.textContent = `${hours}:${minutes}:${seconds} ${period}`;
    dateEl.textContent = now.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  tick();
  setInterval(tick, 1000);
}
