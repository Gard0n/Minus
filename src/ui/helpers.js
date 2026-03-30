import { escapeHtml } from "../utils.js";
import { app, getMatchSideIds, getMatchTeamName } from "../state.js";

export function renderModeOptions(selected) {
  return [
    { value: "501", label: "501" },
    { value: "301", label: "301" },
    { value: "cricket", label: "Cricket" },
  ].map((o) => `<option value="${o.value}" ${o.value === selected ? "selected" : ""}>${o.label}</option>`).join("");
}

export function renderScoringOptions(selected) {
  return [
    { value: "live", label: "Tour par tour" },
    { value: "quick", label: "Saisie rapide" },
  ].map((o) => `<option value="${o.value}" ${o.value === selected ? "selected" : ""}>${o.label}</option>`).join("");
}

export function renderRangeOptions(selected) {
  return [
    { value: "all", label: "Global" },
    { value: "7d", label: "7 derniers jours" },
    { value: "30d", label: "30 derniers jours" },
  ].map((o) => `<option value="${o.value}" ${o.value === selected ? "selected" : ""}>${o.label}</option>`).join("");
}

export function renderTagOptions(selected, tags) {
  const opts = [{ value: "all", label: "Tous" }, ...tags.map((t) => ({ value: t, label: t }))];
  return opts.map((o) => `<option value="${o.value}" ${o.value === selected ? "selected" : ""}>${escapeHtml(o.label)}</option>`).join("");
}

export function renderMatchProgress(match) {
  if (!match?.progress) return "";
  const legsToWin = match.settings?.legsToWin || 1;
  const setsToWin = match.settings?.setsToWin || 1;
  if (legsToWin === 1 && setsToWin === 1) return "";
  const sideIds = getMatchSideIds(match);
  const cells = sideIds.map((sideId) => {
    const name = match.teamMode ? (getMatchTeamName(match, sideId) || sideId) : (app.state?.players?.find((p) => p.id === sideId)?.name || sideId);
    const sets = match.progress.sets[sideId] || 0;
    const legs = match.progress.legs[sideId] || 0;
    return `
      <div class="progress-cell">
        <div class="progress-name">${escapeHtml(name)}</div>
        ${setsToWin > 1 ? `<div class="progress-sets">Sets : <strong>${sets}</strong></div>` : ""}
        <div class="progress-legs">Legs : <strong>${legs}</strong></div>
      </div>
    `;
  }).join("");
  return `
    <div class="card progress-card">
      <div class="card-header">
        <span class="subtle">Set ${match.progress.currentSet} · Leg ${match.progress.currentLeg}</span>
      </div>
      <div class="progress-row">${cells}</div>
    </div>
  `;
}

export function renderLastLegNotice(match) {
  if (!match?.lastLeg) return "";
  const { winnerPlayerId } = match.lastLeg;
  const name = app.state?.players?.find((p) => p.id === winnerPlayerId)?.name || "Joueur";
  return `<div class="notice" style="margin-bottom:10px;">🏆 Dernier leg remporté par <strong>${escapeHtml(name)}</strong></div>`;
}

export function renderRulesMenu(match) {
  if (!match) return "";
  const rules = [];
  if (match.settings?.doubleIn) rules.push("Double-in");
  if (match.settings?.doubleOut) rules.push("Double-out");
  if (match.settings?.bust) rules.push("Bust");
  if (!rules.length) return "";
  return `<div class="rules-menu">${rules.map((r) => `<span class="pill">${r}</span>`).join("")}</div>`;
}

export function renderInlineProgress(match) {
  if (!match?.progress) return "";
  const legsToWin = match.settings?.legsToWin || 1;
  const setsToWin = match.settings?.setsToWin || 1;
  if (legsToWin === 1 && setsToWin === 1) return "";
  return `<div class="subtle" style="margin-top:6px;">Set ${match.progress.currentSet}/${setsToWin} · Leg ${match.progress.currentLeg}/${legsToWin}</div>`;
}
