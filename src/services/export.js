import { app, saveState, normalizeStore, normalizeGroup } from "../state.js";
import { slugify, formatCSVNumber } from "../utils.js";
import { getPlayerRanking, getTeamRanking } from "../game/stats.js";

export function exportData() {
  const date = new Date().toISOString().slice(0, 10);
  const groupName = app.store.groupList.find((g) => g.id === app.store.activeGroupId)?.name || "groupe";
  downloadFile(JSON.stringify(app.state, null, 2), `minus-${slugify(groupName) || "groupe"}-${date}.json`, "application/json");
}

export function exportAllData() {
  const date = new Date().toISOString().slice(0, 10);
  const payload = { ...app.store, gist: { gistId: app.store.gist?.gistId || "", token: "" } };
  downloadFile(JSON.stringify(payload, null, 2), `minus-backup-complet-${date}.json`, "application/json");
}

export function importData(file, { onSuccess, onError }) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const isStore = data?.groups && data?.groupList;
      if (isStore) {
        if (!confirm("Importer ce fichier va remplacer tous les groupes locaux. Continuer ?")) return;
        app.store = normalizeStore(data);
      } else if (data?.players && Array.isArray(data.matches)) {
        if (!confirm("Importer ce fichier va remplacer le groupe actif. Continuer ?")) return;
        app.state = normalizeGroup(data);
        app.store.groups[app.store.activeGroupId] = app.state;
      } else {
        throw new Error("invalid");
      }
      saveState();
      onSuccess?.();
    } catch (err) {
      console.error(err);
      onError?.();
    }
  };
  reader.readAsText(file);
}

export function exportPlayersCSV() {
  const ranking = getPlayerRanking("all", "all");
  const header = ["rank","player","matches","wins","winrate_pct","avg_turn","avg_dart","avg_3_dart","count_180","best_checkout","rank_score"];
  const rows = ranking.map((row, i) => [
    i + 1, row.player?.name || "", row.matches || 0, row.wins || 0,
    formatCSVNumber((row.winrate || 0) * 100, 1),
    formatCSVNumber(row.avgTurn, 1), formatCSVNumber(row.avgDart, 2),
    formatCSVNumber(row.avgThreeDart, 1), row.count180 || 0,
    row.bestCheckout || "", formatCSVNumber(row.rankScore, 3),
  ]);
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(toCSV([header, ...rows]), `minus-joueurs-${date}.csv`, "text/csv");
}

export function exportTeamsCSV() {
  const ranking = getTeamRanking("all", "all");
  const header = ["rank","team","matches","wins","winrate_pct","avg_turn","count_180","best_checkout"];
  const rows = ranking.map((row, i) => [
    i + 1, row.team || "", row.matches || 0, row.wins || 0,
    formatCSVNumber((row.winrate || 0) * 100, 1),
    formatCSVNumber(row.avgTurn, 1), row.count180 || 0, row.bestCheckout || "",
  ]);
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(toCSV([header, ...rows]), `minus-equipes-${date}.csv`, "text/csv");
}

export function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function toCSV(rows, delimiter = ",") {
  return rows.map((row) => row.map((v) => csvEscape(v, delimiter)).join(delimiter)).join("\n");
}

function csvEscape(value, delimiter) {
  const str = String(value ?? "");
  if (str.includes(delimiter) || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
