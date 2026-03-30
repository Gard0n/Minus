export function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

export function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatNumber(value, decimals = 1) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(decimals);
}

export function formatPercent(value) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(0)} %`;
}

export function formatDart(dart) {
  if (!dart) return "";
  const prefix = dart.multiplier === 2 ? "D" : dart.multiplier === 3 ? "T" : "";
  if (dart.base === 0) return "Miss";
  if (dart.base === 25) return `${prefix}Bull`;
  return `${prefix}${dart.base}`;
}

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatCSVNumber(value, decimals) {
  if (value == null || !Number.isFinite(value)) return "";
  return value.toFixed(decimals);
}

export function formatMatchParticipants(match) {
  if (!match) return "";
  if (match.teamMode) {
    const a = match.teamNames?.A || "Équipe A";
    const b = match.teamNames?.B || "Équipe B";
    return `${a} vs ${b}`;
  }
  return match.players.slice(0, 4).join(", ");
}
