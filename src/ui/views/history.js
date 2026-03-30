import { escapeHtml, formatDate } from "../../utils.js";
import { app, getPlayer, getPlayerName, getMatchTeamId, getMatchTeamName, getMatchTeams, getMatchWinnerLabel, formatMatchParticipants, getMatchesFiltered, getAvailableTags } from "../../state.js";
import { renderRangeOptions, renderTagOptions } from "../helpers.js";

function filterMatchesByPlayers(matches, playerIds) {
  if (!playerIds?.length) return matches;
  return matches.filter((m) => m.players.some((id) => playerIds.includes(id)));
}

function renderProgressTable(match) {
  if (!match.progress) return "";
  const rows = [];
  if (match.teamMode) {
    const teams = getMatchTeams(match);
    teams.forEach((team) => {
      rows.push(`<tr><td>${escapeHtml(team.name)}</td><td>${match.progress.sets[team.id] || 0}</td><td>${match.progress.legs[team.id] || 0}</td></tr>`);
    });
  } else {
    match.players.forEach((id) => {
      rows.push(`<tr><td>${escapeHtml(getPlayerName(id))}</td><td>${match.progress.sets[id] || 0}</td><td>${match.progress.legs[id] || 0}</td></tr>`);
    });
  }
  return `
    <table class="table" style="margin-top:10px;">
      <thead><tr><th>${match.teamMode ? "Équipe" : "Joueur"}</th><th>Sets</th><th>Legs</th></tr></thead>
      <tbody>${rows.join("")}</tbody>
    </table>
  `;
}

function renderHistoryDetail(match) {
  const isTeamMode = match.teamMode;
  const teams = getMatchTeams(match);
  const winnerValue = isTeamMode
    ? (match.winnerTeamId || "")
    : (match.winnerIds?.[0] || "");
  const scoreLabel = match.type === "cricket" ? "Points" : "Score restant";

  const scoreRows = match.players.map((pid) => {
    const player = getPlayer(pid);
    const teamName = isTeamMode ? getMatchTeamName(match, getMatchTeamId(match, pid)) : null;
    const scoreValue = match.type === "cricket" ? match.finalPoints?.[pid] : match.finalScores?.[pid];
    return `
      <tr>
        <td>${escapeHtml(player?.name || "Joueur supprimé")}</td>
        ${isTeamMode ? `<td>${escapeHtml(teamName || "—")}</td>` : ""}
        <td>${Number.isFinite(scoreValue) ? scoreValue : "—"}</td>
      </tr>
    `;
  }).join("");

  return `
    <div class="grid two">
      <div>
        <div class="small-muted">${escapeHtml(formatDate(match.date))}</div>
        <div><strong>${match.mode.toUpperCase()}</strong> · Tour par tour</div>
        ${match.type === "x01" ? `<div class="small-muted">${match.settings.doubleIn ? "Double-in" : ""} ${match.settings.doubleOut ? "· Double-out" : ""} ${match.settings.bust ? "· Bust" : ""}</div>` : ""}
        ${match.tag ? `<div class="small-muted">Événement : ${escapeHtml(match.tag)}</div>` : ""}
        <div class="small-muted">Participants : ${escapeHtml(formatMatchParticipants(match))}</div>
      </div>
      <div>
        <table class="table">
          <thead><tr><th>Joueur</th>${isTeamMode ? "<th>Équipe</th>" : ""}<th>${scoreLabel}</th></tr></thead>
          <tbody>${scoreRows}</tbody>
        </table>
        ${renderProgressTable(match)}
      </div>
    </div>

    <form data-form="match-edit" data-id="${match.id}" style="margin-top:16px;">
      <div class="form-row">
        <div>
          <label>Vainqueur</label>
          <select name="winner">
            <option value="">Choisir</option>
            ${isTeamMode
              ? teams.map((team) => `<option value="${team.id}" ${team.id === winnerValue ? "selected" : ""}>${escapeHtml(team.name)}</option>`).join("")
              : match.players.map((pid) => `<option value="${pid}" ${pid === winnerValue ? "selected" : ""}>${escapeHtml(getPlayer(pid)?.name || "Joueur supprimé")}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="inline-actions" style="margin-top:12px;">
        <button class="btn">Sauvegarder</button>
        <button type="button" class="btn ghost" data-action="replay-match" data-id="${match.id}">Rejouer</button>
        <button type="button" class="btn danger" data-action="delete-match" data-id="${match.id}">Supprimer</button>
      </div>
    </form>
  `;
}

export function renderHistory() {
  const view = document.getElementById("view-history");
  if (!view) return;
  let matches = getMatchesFiltered(app.ui.historyRange, app.ui.historyTagFilter);
  matches = filterMatchesByPlayers(matches, app.ui.historyPlayerFilter)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const selectedMatch = app.ui.historySelectedId
    ? app.state.matches.find((m) => m.id === app.ui.historySelectedId)
    : null;
  const tags = getAvailableTags();

  view.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Historique des parties</h3>
        <div class="split">
          <select data-change="history-range">${renderRangeOptions(app.ui.historyRange)}</select>
          <select data-change="history-tag">${renderTagOptions(app.ui.historyTagFilter, tags)}</select>
        </div>
      </div>
      <div style="margin-top:12px;">
        <label>Filtrer par joueur</label>
        <div class="pill-list">
          ${app.state.players.map((player) => `
            <label class="player-pill">
              <input type="checkbox" name="historyPlayers" value="${player.id}" ${app.ui.historyPlayerFilter.includes(player.id) ? "checked" : ""} />
              <span>${escapeHtml(player.name)}</span>
            </label>
          `).join("")}
        </div>
      </div>
      ${matches.length ? `
        <div>
          ${matches.map((match) => `
            <div class="history-item">
              <div>
                <strong>${escapeHtml(formatDate(match.date))} · ${match.mode.toUpperCase()}</strong>
                <div class="small-muted">${escapeHtml(formatMatchParticipants(match))}</div>
                ${match.tag ? `<div class="small-muted">Événement : ${escapeHtml(match.tag)}</div>` : ""}
                <div class="small-muted">Vainqueur : ${escapeHtml(getMatchWinnerLabel(match) || "—")}</div>
              </div>
              <button class="btn small ghost" data-action="select-match" data-id="${match.id}">Voir</button>
            </div>
          `).join("")}
        </div>
      ` : `<p class="subtle">Aucune partie.</p>`}
    </div>

    <div class="card" style="margin-top:18px;">
      <div class="card-header"><h3 class="card-title">Détails</h3></div>
      ${selectedMatch ? renderHistoryDetail(selectedMatch) : `<p class="subtle">Sélectionne une partie pour voir le détail.</p>`}
    </div>
  `;
}
