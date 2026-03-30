import { escapeHtml } from "../../utils.js";
import { formatNumber, formatPercent } from "../../utils.js";
import { app, getMatchesFiltered, getAvailableTags } from "../../state.js";
import { computePlayerStats, getPlayerRanking, getTeamRanking } from "../../game/stats.js";
import { getRangeLabel } from "../../game/dart.js";
import { renderRangeOptions, renderTagOptions } from "../helpers.js";

function renderRankingTable(ranking, { compact }) {
  return `
    <table class="table">
      <thead><tr>
        <th>#</th><th>Joueur</th><th>Matchs</th><th>Victoires</th>
        <th>Winrate</th><th>Moy./tour</th><th>180</th>
        ${compact ? "" : "<th>Checkout</th>"}
      </tr></thead>
      <tbody>
        ${ranking.map((row, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><button class="btn-link" data-action="view-player" data-id="${row.player.id}">${escapeHtml(row.player.name)}</button></td>
            <td>${row.matches || 0}</td>
            <td>${row.wins || 0}</td>
            <td>${formatPercent(row.winrate)}</td>
            <td>${formatNumber(row.avgTurn, 1)}</td>
            <td>${row.count180 || 0}</td>
            ${compact ? "" : `<td>${row.bestCheckout || "—"}</td>`}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderTeamRankingTable(ranking) {
  return `
    <table class="table">
      <thead><tr>
        <th>#</th><th>Équipe</th><th>Matchs</th><th>Victoires</th>
        <th>Winrate</th><th>Moy./tour</th><th>180</th><th>Checkout</th>
      </tr></thead>
      <tbody>
        ${ranking.map((row, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(row.team)}</td>
            <td>${row.matches || 0}</td>
            <td>${row.wins || 0}</td>
            <td>${formatPercent(row.winrate)}</td>
            <td>${formatNumber(row.avgTurn, 1)}</td>
            <td>${row.count180 || 0}</td>
            <td>${row.bestCheckout || "—"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderTop3(rows, type) {
  if (!rows.length) return "";
  return `
    <div class="pill-list" style="margin-bottom:12px;">
      ${rows.slice(0, 3).map((row, i) => {
        const label = type === "team" ? row.team : row.player.name;
        return `<div class="pill">#${i + 1} ${escapeHtml(label)}</div>`;
      }).join("")}
    </div>
  `;
}

export function renderStats() {
  const view = document.getElementById("view-stats");
  if (!view) return;
  const matches = getMatchesFiltered(app.ui.rankingRange, app.ui.tagFilter);
  const statsMap = computePlayerStats(app.state.players, matches);
  const totalMatches = matches.length;
  const totalTurns = Object.values(statsMap).reduce((s, st) => s + (st.turns || 0), 0);
  const totalPoints = Object.values(statsMap).reduce((s, st) => s + (st.totalPoints || 0), 0);
  const avgTurnGlobal = totalTurns ? totalPoints / totalTurns : null;

  let rankingContent = "";
  let topMarkup = "";
  if (app.ui.rankingMode === "teams") {
    const teamRanking = getTeamRanking(app.ui.rankingRange);
    topMarkup = renderTop3(teamRanking, "team");
    rankingContent = teamRanking.length ? renderTeamRankingTable(teamRanking) : `<p class="subtle">Aucune équipe.</p>`;
  } else {
    const ranking = getPlayerRanking(app.ui.rankingRange);
    topMarkup = renderTop3(ranking, "player");
    rankingContent = ranking.length ? renderRankingTable(ranking, { compact: false }) : `<p class="subtle">Aucune donnée.</p>`;
  }

  const tags = getAvailableTags();

  view.innerHTML = `
    <div class="card">
      <div class="card-header"><h3 class="card-title">Filtres</h3></div>
      <div class="form-row">
        <div>
          <label>Période</label>
          <select data-change="ranking-range">${renderRangeOptions(app.ui.rankingRange)}</select>
        </div>
        <div>
          <label>Événement</label>
          <select data-change="tag-filter">${renderTagOptions(app.ui.tagFilter, tags)}</select>
        </div>
        <div>
          <label>Classement</label>
          <select data-change="ranking-mode">
            <option value="players" ${app.ui.rankingMode !== "teams" ? "selected" : ""}>Joueurs</option>
            <option value="teams" ${app.ui.rankingMode === "teams" ? "selected" : ""}>Équipes</option>
          </select>
        </div>
      </div>
    </div>

    <div class="grid two" style="margin-top:18px;">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Stats globales</h3>
          <span class="subtle">${getRangeLabel(app.ui.rankingRange)}</span>
        </div>
        <div class="grid three">
          <div><div class="stats-number">${totalMatches}</div><div class="stats-label">Parties</div></div>
          <div><div class="stats-number">${totalTurns}</div><div class="stats-label">Tours (x01)</div></div>
          <div><div class="stats-number">${formatNumber(avgTurnGlobal, 1)}</div><div class="stats-label">Moy./tour</div></div>
        </div>
        <div class="notice" style="margin-top:12px;">Stats détaillées issues des parties notées tour par tour.</div>
      </div>
      <div class="card">
        <div class="card-header"><h3 class="card-title">Classement</h3></div>
        ${topMarkup}
        ${rankingContent}
      </div>
    </div>
  `;
}
