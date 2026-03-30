let flashTimer = null;

export function showFlashOverlay(icon, title, subtitle = "", duration = 900) {
  const overlay = document.getElementById("flash-overlay");
  const iconEl = document.getElementById("flash-icon");
  const titleEl = document.getElementById("flash-title");
  const subtitleEl = document.getElementById("flash-subtitle");
  if (!overlay) return;
  if (flashTimer) { clearTimeout(flashTimer); }
  iconEl.textContent = icon;
  titleEl.textContent = title;
  subtitleEl.textContent = subtitle;
  overlay.classList.remove("hidden");
  flashTimer = setTimeout(() => overlay.classList.add("hidden"), duration);
}

export function dismissFlash() {
  const overlay = document.getElementById("flash-overlay");
  if (overlay) overlay.classList.add("hidden");
  if (flashTimer) { clearTimeout(flashTimer); flashTimer = null; }
}
