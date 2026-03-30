let toastTimer = null;

export function showToast(message) {
  const el = document.getElementById("toast");
  if (!el) return;
  if (toastTimer) clearTimeout(toastTimer);
  el.textContent = message;
  el.classList.add("visible");
  toastTimer = setTimeout(() => el.classList.remove("visible"), 2500);
}
