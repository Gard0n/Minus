import { cricketNumbers } from "../../constants.js";
import { escapeHtml } from "../../utils.js";
import { app, getPlayer, getPlayerName, getMatchTeamName, getMatchTeamId, getMatchSideSummaries, formatMatchParticipants } from "../../state.js";

function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

export function toggleFullscreen() {
  const el = document.documentElement;
  if (isFullscreen()) {
    document.exitFullscreen?.() || document.webkitExitFullscreen?.();
  } else {
    el.requestFullscreen?.() || el.webkitRequestFullscreen?.();
  }
}

function renderProgressTable(match) {
  if (!match.progress) return "";
  const sides = getMatchSideSummaries(match);
  const rows = sides.map((side) => `
    <tr>
      <td>${escapeHtml(side.label)}</td>
      <td>${match.progress.sets[side.id] ?? 0}</td>
      <td>${match.progress.legs[side.id] ?? 0}</td>
    </tr>
  `).join("");
  return `
    <table class="table" style="margin-top:10px;">
      <thead><tr><th>${match.teamMode ? "Équipe" : "Joueur"}</th><th>Sets</th><th>Legs</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

export function renderBoard() {
  const view = document.getElementById("view-board");
  if (!view) return;
  const match = app.state.activeMatch;

  if (!match) {
    view.innerHTML = `
      <div class="card">
        <div class="card-header"><h3 class="card-title">Tableau plein écran</h3></div>
        <p class="subtle">Aucune partie en cours.</p>
        <div class="inline-actions">
          <button class="btn" data-action="nav" data-view="match">Lancer une partie</button>
        </div>
      </div>
    `;
    return;
  }

  const currentPlayerId = match.players[match.currentTurnIndex];
  const isPaused = match.status === "paused";
  const fullscreenLabel = isFullscreen() ? "Quitter plein écran" : "Plein écran";
  const lastTurns = match.turns.slice(-6).reverse();

  const scoreCards = match.players.map((pid, index) => {
    const player = getPlayer(pid);
    const teamName = match.teamMode ? getMatchTeamName(match, getMatchTeamId(match, pid)) : null;
    const isActive = index === match.currentTurnIndex;
    if (match.type === "x01") {
      const data = match.scoreboard[pid];
      return `
        <div class="score-card ${isActive ? "active" : ""}">
          <div><strong>${escapeHtml(player?.name || "Joueur supprimé")}</strong></div>
          ${teamName ? `<div class="score-meta">${escapeHtml(teamName)}</div>` : ""}
          <div class="score-value">${data.score}</div>
          <div class="score-meta">${match.settings.doubleIn && !data.started ? "Double-in requis" : "En jeu"}</div>
        </div>
      `;
    }
    const data = match.cricket.scores[pid];
    return `
      <div class="score-card ${isActive ? "active" : ""}">
        <div><strong>${escapeHtml(player?.name || "Joueur supprimé")}</strong></div>
        ${teamName ? `<div class="score-meta">${escapeHtml(teamName)}</div>` : ""}
        <div class="score-value">${data.points} pts</div>
        <div class="mark-grid">
          ${cricketNumbers.map((num) => {
            const m = data.marks[num.key] || 0;
            const sym = m === 0 ? "·" : m === 1 ? "/" : m === 2 ? "✕" : "⊗";
            return `<div class="mark-pill"><span>${num.label}</span><strong>${sym}</strong></div>`;
          }).join("")}
        </div>
      </div>
    `;
  }).join("");

  view.innerHTML = `
    <div class="board">
      <div class="board-header">
        <div>
          <h2 class="board-title">Tableau live</h2>
          <div class="subtle">${match.mode.toUpperCase()} · ${escapeHtml(formatMatchParticipants(match))}</div>
        </div>
        <div class="inline-actions">
          <button class="btn ghost" data-action="toggle-fullscreen">${fullscreenLabel}</button>
          <button class="btn ghost" data-action="nav" data-view="match">Retour</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Tour de ${escapeHtml(getPlayerName(currentPlayerId))}</h3>
            ${isPaused ? `<span class="badge">Pause</span>` : ""}
          </div>
          ${match.type === "x01" ? `<div class="subtle">Reste : ${match.scoreboard[currentPlayerId].score}</div>` : ""}
        </div>
        ${renderProgressTable(match)}
      </div>

      <div class="score-grid">${scoreCards}</div>

      <div class="card">
        <div class="card-header"><h3 class="card-title">Derniers tours</h3></div>
        ${lastTurns.length ? `
          <div class="pill-list">
            ${lastTurns.map((turn) => {
              const label = match.type === "x01"
                ? `${getPlayerName(turn.playerId)} · ${turn.appliedScore} pts${turn.finished ? " 🏆" : ""}`
                : `${getPlayerName(turn.playerId)} · +${turn.pointsGained} pts`;
              return `<div class="pill">${escapeHtml(label)}</div>`;
            }).join("")}
          </div>
        ` : `<p class="subtle">Aucun tour.</p>`}
      </div>
    </div>
  `;
}
