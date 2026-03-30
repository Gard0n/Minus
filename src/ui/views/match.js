import { cricketNumbers } from "../../constants.js";
import { escapeHtml, formatDate } from "../../utils.js";
import { app, getPlayerName, getMatchTeamName, getAvailableTags, formatMatchParticipants, ensureMatchDraft, getLastSetup, getMatchWinnerLabel } from "../../state.js";
import { getDartValues, getCricketDartValues, formatDart } from "../../game/dart.js";
import { getCheckoutSuggestion } from "../../game/x01.js";
import { renderModeOptions, renderMatchProgress, renderLastLegNotice, renderRulesMenu, renderInlineProgress } from "../helpers.js";

export function renderMatch() {
  const view = document.getElementById("view-match");
  if (!view) return;

  if (app.state.activeMatch) {
    view.innerHTML = renderActiveMatch();
    return;
  }

  const hasPlayers = app.state.players.length >= 2;
  ensureMatchDraft();
  const teamMode = app.ui.matchDraft.type === "teams";
  const teamNameA = app.ui.matchDraft.teamNames[0] || "Équipe A";
  const teamNameB = app.ui.matchDraft.teamNames[1] || "Équipe B";
  const selectedPlayers = app.ui.matchDraft.selectedPlayers || [];
  const defaultLegs = app.state.settings.legsToWin || 1;
  const defaultSets = app.state.settings.setsToWin || 1;
  const summaryCard = renderMatchSummaryCard();
  const lastSetup = getLastSetup();

  view.innerHTML = `
    ${summaryCard}
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Nouvelle partie</h3>
        ${lastSetup ? `<button type="button" class="btn small ghost" data-action="quick-start" data-preset="last">↩ Rejouer</button>` : ""}
      </div>
      <form data-form="match-setup">
        <div class="form-row" style="margin-top:4px;">
          <div>
            <label>Mode</label>
            <select name="matchMode">
              ${renderModeOptions(app.state.settings.defaultMode)}
            </select>
          </div>
          <div>
            <label>Type</label>
            <select name="matchType" data-change="match-type">
              <option value="solo" ${!teamMode ? "selected" : ""}>Individuel</option>
              <option value="teams" ${teamMode ? "selected" : ""}>Équipes</option>
            </select>
          </div>
        </div>

        ${teamMode ? `
          <div class="form-row" style="margin-top:12px;">
            <div>
              <label>Équipe A</label>
              <input type="text" name="teamNameA" value="${escapeHtml(teamNameA)}" data-change="team-name" data-index="0" />
            </div>
            <div>
              <label>Équipe B</label>
              <input type="text" name="teamNameB" value="${escapeHtml(teamNameB)}" data-change="team-name" data-index="1" />
            </div>
          </div>
        ` : ""}

        <div style="margin-top:14px;">
          <label>Joueurs</label>
          <div class="pill-list">
            ${app.state.players.map((player) => {
              const assigned = app.ui.matchDraft.teamAssignments[player.id] || "A";
              const isSelected = selectedPlayers.includes(player.id);
              return `
                <div class="player-row">
                  <label class="player-pill">
                    <input type="checkbox" name="matchPlayers" value="${player.id}" ${isSelected ? "checked" : ""} />
                    <span>${escapeHtml(player.name)}</span>
                  </label>
                  ${teamMode ? `
                    <select class="team-select" name="team-${player.id}" data-change="team-assign" data-player-id="${player.id}">
                      <option value="A" ${assigned === "A" ? "selected" : ""}>${escapeHtml(teamNameA)}</option>
                      <option value="B" ${assigned === "B" ? "selected" : ""}>${escapeHtml(teamNameB)}</option>
                    </select>
                  ` : ""}
                </div>
              `;
            }).join("")}
          </div>
          <div class="form-row" style="margin-top:8px;">
            <input type="text" id="inline-player-name" placeholder="Nouveau joueur…" />
            <button type="button" class="btn ghost" data-action="inline-add-player">+ Ajouter</button>
          </div>
        </div>

        <div style="margin-top:14px;">
          <label>Règles</label>
          <div class="pill-list">
            <label class="player-pill">
              <input type="checkbox" name="doubleIn" ${app.state.settings.doubleIn ? "checked" : ""} />
              <span>Double-in</span>
            </label>
            <label class="player-pill">
              <input type="checkbox" name="doubleOut" ${app.state.settings.doubleOut ? "checked" : ""} />
              <span>Double-out</span>
            </label>
            <label class="player-pill">
              <input type="checkbox" name="bust" ${app.state.settings.bust ? "checked" : ""} />
              <span>Bust</span>
            </label>
          </div>
        </div>

        <details style="margin-top:14px;">
          <summary style="cursor:pointer;font-weight:600;font-size:13px;color:var(--muted);">Options avancées</summary>
          <div class="form-row" style="margin-top:10px;">
            <div>
              <label>Legs pour gagner</label>
              <input type="number" name="legsToWin" min="1" value="${defaultLegs}" />
            </div>
            <div>
              <label>Sets pour gagner</label>
              <input type="number" name="setsToWin" min="1" value="${defaultSets}" />
            </div>
            <div>
              <label>Événement</label>
              <input type="text" name="matchTag" list="tag-list" placeholder="Hebdo…" />
              <datalist id="tag-list">
                ${getAvailableTags().map((t) => `<option value="${escapeHtml(t)}"></option>`).join("")}
              </datalist>
            </div>
          </div>
          <div style="margin-top:10px;">
            <label class="player-pill" style="display:inline-flex;">
              <input type="checkbox" name="randomStart" />
              <span>Départ aléatoire</span>
            </label>
          </div>
        </details>

        <div class="inline-actions" style="margin-top:16px;">
          <button class="btn" style="flex:1;" ${hasPlayers ? "" : "disabled"}>🎯 Démarrer</button>
        </div>
      </form>
    </div>
  `;
}

function renderMatchSummaryCard() {
  if (!app.state.lastSummaryId) return "";
  const match = app.state.matches.find((m) => m.id === app.state.lastSummaryId);
  if (!match) return "";
  const winnerLabel = getMatchWinnerLabel(match) || "—";
  return `
    <div class="card" style="margin-bottom:18px;">
      <div class="card-header">
        <h3 class="card-title">Résumé de la dernière partie</h3>
        <span class="badge">Terminée</span>
      </div>
      <div class="small-muted">${escapeHtml(formatDate(match.date))}</div>
      <div><strong>${match.mode.toUpperCase()}</strong> · Tour par tour</div>
      <div class="small-muted">Participants : ${escapeHtml(formatMatchParticipants(match))}</div>
      ${match.tag ? `<div class="small-muted">Événement : ${escapeHtml(match.tag)}</div>` : ""}
      <div class="small-muted">Vainqueur : ${escapeHtml(winnerLabel)}</div>
      <div class="inline-actions" style="margin-top:12px;">
        <button class="btn" data-action="replay-match" data-id="${match.id}">Rejouer</button>
        <button class="btn ghost" data-action="nav" data-view="history">Historique</button>
        <button class="btn ghost" data-action="dismiss-summary">Fermer</button>
      </div>
    </div>
  `;
}

export function renderActiveMatch() {
  const match = app.state.activeMatch;
  const playerNames = formatMatchParticipants(match);
  const isPaused = match.status === "paused";
  const pauseLabel = isPaused ? "Reprendre" : "Pause";
  const pauseBadge = isPaused ? `<span class="badge">Pause</span>` : "";
  const disabledAttr = isPaused ? "disabled" : "";
  const progressCard = renderMatchProgress(match);
  const legNotice = renderLastLegNotice(match);
  const rulesMenu = renderRulesMenu(match);

  if (match.type === "x01") {
    const currentPlayerId = match.players[match.currentTurnIndex];
    const currentState = match.scoreboard[currentPlayerId];
    const dartTotal = app.ui.dartDraft.reduce((s, d) => s + d.score, 0);
    const rawRemaining = currentState.score - dartTotal;
    const isBust = match.settings.bust && rawRemaining < 0;
    const displayScore = isBust ? currentState.score : rawRemaining;
    const scoreClass = isBust ? "score-bust" : rawRemaining === 0 ? "score-checkout" : "";
    const checkoutHint = !isBust && rawRemaining > 1 && rawRemaining <= 170
      ? getCheckoutSuggestion(rawRemaining, match.settings.doubleOut)
      : null;

    const rows = match.players.map((pid, i) => {
      const player = app.state.players.find((p) => p.id === pid);
      const data = match.scoreboard[pid];
      const teamName = match.teamMode ? getMatchTeamName(match, match.teamAssignments?.[pid]) : null;
      return `
        <tr class="${i === match.currentTurnIndex ? "current" : ""}">
          <td>${escapeHtml(player?.name || "Joueur supprimé")}</td>
          ${match.teamMode ? `<td>${escapeHtml(teamName || "—")}</td>` : ""}
          <td><strong>${data.score}</strong></td>
          <td>${match.settings.doubleIn && !data.started ? "Double-in" : "En jeu"}</td>
        </tr>
      `;
    }).join("");

    const lastTurns = match.turns.slice(-5).reverse();
    const lastDart = app.ui.dartDraft[app.ui.dartDraft.length - 1];
    const undoLabel = lastDart ? `Annuler ${formatDart(lastDart)}` : "Annuler";

    return `
      ${progressCard}${legNotice}
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Partie ${match.mode}</h3>
            <div class="subtle">${playerNames}</div>
          </div>
          <div class="inline-actions">
            <button class="btn ghost match-action-secondary" data-action="nav" data-view="board">Tableau</button>
            <button class="btn ghost match-action-secondary" data-action="toggle-pause">${pauseLabel}</button>
            <button class="btn small ghost" data-action="undo-turn">↩ Annuler tour</button>
            <button class="btn small danger" data-action="cancel-match">Abandonner</button>
          </div>
        </div>
        <div class="turn-banner">Tour : <strong>${escapeHtml(getPlayerName(currentPlayerId))}</strong></div>
        ${rulesMenu}
        <table class="table match-scores-table">
          <thead><tr>
            <th>Joueur</th>
            ${match.teamMode ? "<th>Équipe</th>" : ""}
            <th>Score</th><th>Statut</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <div class="card match-dartpad-card">
        <div class="match-player-bar">
          <span class="match-player-name">${escapeHtml(getPlayerName(currentPlayerId))}</span>
          <div class="match-player-badges">
            ${pauseBadge}
            ${match.settings.doubleIn && !currentState.started ? `<span class="badge">Double-in</span>` : ""}
          </div>
        </div>
        <div class="match-score-display ${scoreClass}">
          <div class="match-score-big">${displayScore}</div>
          ${isBust ? `<div class="match-score-hint bust-hint">BUST</div>` : ""}
          ${checkoutHint ? `<div class="match-score-hint">💡 ${escapeHtml(checkoutHint)}</div>` : ""}
        </div>
        <div class="dart-slots">
          ${[0, 1, 2].map((i) => {
            const dart = app.ui.dartDraft[i];
            return `<div class="dart-slot ${dart ? "filled" : "empty"}">${dart ? escapeHtml(formatDart(dart)) : ""}</div>`;
          }).join("")}
        </div>
        <div class="dartpad">
          <div class="multiplier-row">
            <button class="btn small ghost ${app.ui.dartMultiplier === 2 ? "active" : ""}" data-action="dart-multiplier" data-multiplier="2" ${disabledAttr}>× 2 Double</button>
            <button class="btn small ghost ${app.ui.dartMultiplier === 3 ? "active" : ""}" data-action="dart-multiplier" data-multiplier="3" ${disabledAttr}>× 3 Triple</button>
          </div>
          <div class="dart-grid">
            ${getDartValues().map((v) => `<button type="button" class="dart-btn" data-action="dart-add" data-value="${v}" ${disabledAttr}>${v === 25 ? "Bull" : v === 0 ? "Miss" : v}</button>`).join("")}
          </div>
        </div>
        <div class="dart-actions">
          <button class="btn ghost" data-action="dart-undo" ${disabledAttr || app.ui.dartDraft.length === 0 ? "disabled" : ""}>${escapeHtml(undoLabel)}</button>
          <button class="btn ghost" data-action="dart-clear" ${disabledAttr}>Vider</button>
          <button class="btn" data-action="submit-darts" ${disabledAttr}>Valider</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title">Historique récent</h3></div>
        ${lastTurns.length ? `
          <div class="pill-list">
            ${lastTurns.map((turn) => {
              const label = `${getPlayerName(turn.playerId)} · ${turn.appliedScore} pts${turn.bust ? " (bust)" : ""}${turn.finished ? " 🏆" : ""}`;
              return `<div class="pill">${escapeHtml(label)}</div>`;
            }).join("")}
          </div>
        ` : `<p class="subtle">Aucun tour.</p>`}
      </div>
    `;
  }

  // Cricket
  const currentPlayerId = match.players[match.currentTurnIndex];
  const rows = match.players.map((pid, i) => {
    const player = app.state.players.find((p) => p.id === pid);
    const data = match.cricket.scores[pid];
    const teamName = match.teamMode ? getMatchTeamName(match, match.teamAssignments?.[pid]) : null;
    return `
      <tr class="${i === match.currentTurnIndex ? "current" : ""}">
        <td>${escapeHtml(player?.name || "Joueur supprimé")}</td>
        ${match.teamMode ? `<td>${escapeHtml(teamName || "—")}</td>` : ""}
        ${cricketNumbers.map((num) => {
          const m = data.marks[num.key] || 0;
          const sym = m === 0 ? '<span class="cmark cmark-0">·</span>'
                    : m === 1 ? '<span class="cmark cmark-1">/</span>'
                    : m === 2 ? '<span class="cmark cmark-2">✕</span>'
                    : '<span class="cmark cmark-3">⊗</span>';
          return `<td>${sym}</td>`;
        }).join("")}
        <td><strong>${data.points}</strong></td>
      </tr>
    `;
  }).join("");

  const lastTurns = match.turns.slice(-5).reverse();
  const lastDart = app.ui.dartDraft[app.ui.dartDraft.length - 1];
  const undoLabel = lastDart ? `Annuler ${formatDart(lastDart)}` : "Annuler";

  return `
    ${progressCard}${legNotice}
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Cricket</h3>
          <div class="subtle">${playerNames}</div>
        </div>
        <div class="inline-actions">
          <button class="btn ghost match-action-secondary" data-action="nav" data-view="board">Tableau</button>
          <button class="btn ghost match-action-secondary" data-action="toggle-pause">${pauseLabel}</button>
          <button class="btn small ghost" data-action="undo-turn">↩ Annuler tour</button>
          <button class="btn small danger" data-action="cancel-match">Abandonner</button>
        </div>
      </div>
      <div class="turn-banner">Tour : <strong>${escapeHtml(getPlayerName(currentPlayerId))}</strong></div>
      ${rulesMenu}
      <table class="table match-scores-table">
        <thead><tr>
          <th>Joueur</th>
          ${match.teamMode ? "<th>Équipe</th>" : ""}
          ${cricketNumbers.map((n) => `<th>${n.label}</th>`).join("")}
          <th>Pts</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="card match-dartpad-card">
      <div class="match-player-bar">
        <span class="match-player-name">${escapeHtml(getPlayerName(currentPlayerId))}</span>
        <div class="match-player-badges">${pauseBadge}</div>
      </div>
      <div class="dart-slots">
        ${[0, 1, 2].map((i) => {
          const dart = app.ui.dartDraft[i];
          return `<div class="dart-slot ${dart ? "filled" : "empty"}">${dart ? escapeHtml(formatDart(dart)) : ""}</div>`;
        }).join("")}
      </div>
      <div class="dartpad">
        <div class="multiplier-row">
          <button class="btn small ghost ${app.ui.dartMultiplier === 2 ? "active" : ""}" data-action="dart-multiplier" data-multiplier="2" ${disabledAttr}>× 2 Double</button>
          <button class="btn small ghost ${app.ui.dartMultiplier === 3 ? "active" : ""}" data-action="dart-multiplier" data-multiplier="3" ${disabledAttr}>× 3 Triple</button>
        </div>
        <div class="dart-grid">
          ${getCricketDartValues().map((v) => `<button type="button" class="dart-btn" data-action="dart-add" data-value="${v}" ${disabledAttr}>${v === 25 ? "Bull" : v === 0 ? "Miss" : v}</button>`).join("")}
        </div>
      </div>
      <div class="dart-actions">
        <button class="btn ghost" data-action="dart-undo" ${app.ui.dartDraft.length === 0 ? "disabled" : disabledAttr}>${escapeHtml(undoLabel)}</button>
        <button class="btn ghost" data-action="dart-clear" ${disabledAttr}>Vider</button>
        <button class="btn" data-action="submit-cricket-darts" ${disabledAttr}>Valider</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Historique récent</h3></div>
      ${lastTurns.length ? `
        <div class="pill-list">
          ${lastTurns.map((turn) => `<div class="pill">${escapeHtml(getPlayerName(turn.playerId))} · +${turn.pointsGained} pts</div>`).join("")}
        </div>
      ` : `<p class="subtle">Aucun tour.</p>`}
    </div>
  `;
}
