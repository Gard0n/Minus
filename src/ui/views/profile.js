import { escapeHtml, formatDate, formatNumber, formatPercent } from "../../utils.js";
import { app, getPlayer, getMatchWinnerLabel } from "../../state.js";
import { computePlayerStats } from "../../game/stats.js";

function renderEvolutionChart(playerId, matches) {
  const sorted = [...matches].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-15);
  if (!sorted.length) return "";
  const dots = sorted.map((match) => {
    const won = (match.winnerIds || []).includes(playerId);
    return `<span class="${won ? "evo-dot win" : "evo-dot loss"}" title="${formatDate(match.date)}">${won ? "V" : "D"}</span>`;
  }).join("");
  const x01Matches = sorted.filter((m) => m.type === "x01" && m.scoringMode === "live" && Array.isArray(m.turns));
  let barChart = "";
  if (x01Matches.length >= 2) {
    const avgs = x01Matches.map((match) => {
      const turns = match.turns.filter((t) => t.playerId === playerId);
      if (!turns.length) return null;
      const total = turns.reduce((s, t) => s + (Number.isFinite(t.appliedScore) ? t.appliedScore : 0), 0);
      return { avg: total / turns.length, won: (match.winnerIds || []).includes(playerId), date: match.date };
    }).filter(Boolean);
    if (avgs.length >= 2) {
      const maxAvg = Math.max(...avgs.map((a) => a.avg), 1);
      const barH = 48;
      const barW = Math.max(12, Math.floor(220 / avgs.length) - 3);
      const bars = avgs.map((a, i) => {
        const h = Math.round((a.avg / maxAvg) * barH);
        const fill = a.won ? "var(--color-win, #4caf50)" : "var(--color-loss, #e53935)";
        return `<rect x="${i * (barW + 3)}" y="${barH - h}" width="${barW}" height="${h}" fill="${fill}" rx="2" title="${formatDate(a.date)} · ${formatNumber(a.avg, 1)} pts/tour"/>`;
      }).join("");
      const totalW = avgs.length * (barW + 3) - 3;
      barChart = `
        <div class="evo-chart-label">Moy./tour (X01 live)</div>
        <svg class="evo-bar-chart" width="${totalW}" height="${barH}" viewBox="0 0 ${totalW} ${barH}">${bars}</svg>`;
    }
  }
  return `
    <div class="card">
      <div class="card-header"><h3 class="card-title">Évolution (${sorted.length} dernières parties)</h3></div>
      <div class="evo-dots">${dots}</div>
      ${barChart}
    </div>`;
}

export function renderProfile() {
  const view = document.getElementById("view-profile");
  if (!view) return;
  const player = app.ui.profilePlayerId ? getPlayer(app.ui.profilePlayerId) : null;
  if (!player) {
    view.innerHTML = `<div class="card"><p class="subtle">Sélectionne un joueur pour voir son profil.</p></div>`;
    return;
  }
  const matches = app.state.matches.filter((m) => m.players.includes(player.id));
  const statsMap = computePlayerStats([player], matches);
  const stats = statsMap[player.id] || {};
  const recent = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

  view.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">${escapeHtml(player.name)}</h3>
          ${player.team ? `<div class="subtle">${escapeHtml(player.team)}</div>` : ""}
        </div>
        <button class="btn ghost" data-action="nav" data-view="settings">Retour</button>
      </div>
      <div class="grid three">
        <div><div class="stats-number">${stats.matches || 0}</div><div class="stats-label">Matchs</div></div>
        <div><div class="stats-number">${stats.wins || 0}</div><div class="stats-label">Victoires</div></div>
        <div><div class="stats-number">${formatPercent(stats.winrate)}</div><div class="stats-label">Winrate</div></div>
        <div><div class="stats-number">${formatNumber(stats.avgTurn, 1)}</div><div class="stats-label">Moy./tour</div></div>
        <div><div class="stats-number">${formatNumber(stats.avgThreeDart, 1)}</div><div class="stats-label">Moy./3 fléchettes</div></div>
        <div><div class="stats-number">${stats.bestCheckout || "—"}</div><div class="stats-label">Checkout max</div></div>
      </div>
      <div class="grid three" style="margin-top:12px;">
        <div><div class="stats-number">${stats.count180 || 0}</div><div class="stats-label">180</div></div>
        <div><div class="stats-number">${stats.darts || 0}</div><div class="stats-label">Fléchettes</div></div>
      </div>
    </div>

    ${renderEvolutionChart(player.id, matches)}

    <div class="card">
      <div class="card-header"><h3 class="card-title">Dernières parties</h3></div>
      ${recent.length ? `
        <div class="pill-list">
          ${recent.map((match) => `<div class="pill">${escapeHtml(formatDate(match.date))} · ${match.mode.toUpperCase()} · ${escapeHtml(getMatchWinnerLabel(match) || "—")}</div>`).join("")}
        </div>
      ` : `<p class="subtle">Aucune partie pour ce joueur.</p>`}
    </div>
  `;
}
