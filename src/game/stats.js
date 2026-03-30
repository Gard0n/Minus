import { app, getMatchesFiltered, getRankingWeights, getMatchTeamId, getMatchTeamName, getMatchTeams } from "../state.js";

/**
 * Compute per-player stats. Pure — takes explicit players + matches arrays.
 */
export function computePlayerStats(players, matches) {
  const stats = {};
  players.forEach((player) => {
    stats[player.id] = {
      playerId: player.id,
      matches: 0, wins: 0, turns: 0, totalPoints: 0, darts: 0,
      count180: 0, bestCheckout: null, winrate: 0, avgTurn: null, avgDart: null, avgThreeDart: null,
    };
  });

  matches.forEach((match) => {
    match.players.forEach((id) => { if (stats[id]) stats[id].matches += 1; });
    (match.winnerIds || []).forEach((id) => { if (stats[id]) stats[id].wins += 1; });
    if (match.scoringMode === "live" && match.type === "x01" && Array.isArray(match.turns)) {
      match.turns.forEach((turn) => {
        const s = stats[turn.playerId];
        if (!s) return;
        const applied = Number.isFinite(turn.appliedScore) ? turn.appliedScore : 0;
        const dartCount = Array.isArray(turn.darts) ? turn.darts.length : 3;
        s.turns += 1; s.totalPoints += applied; s.darts += dartCount;
        if (applied === 180) s.count180 += 1;
        if (turn.checkout) s.bestCheckout = s.bestCheckout ? Math.max(s.bestCheckout, turn.checkout) : turn.checkout;
      });
    }
  });

  Object.values(stats).forEach((s) => {
    s.winrate = s.matches ? s.wins / s.matches : 0;
    s.avgTurn = s.turns ? s.totalPoints / s.turns : null;
    s.avgDart = s.darts ? s.totalPoints / s.darts : null;
    s.avgThreeDart = s.avgDart ? s.avgDart * 3 : null;
  });

  return stats;
}

export function applyRankingScore(rows) {
  if (!rows.length) return;
  const weights = getRankingWeights();
  const total = weights.wins + weights.winrate + weights.avgTurn + weights.avgDart;
  if (total === 0) { rows.forEach((r) => { r.rankScore = 0; }); return; }
  const maxWins = Math.max(...rows.map((r) => r.wins || 0), 1);
  const maxAvgTurn = Math.max(...rows.map((r) => r.avgTurn || 0), 1);
  const maxAvgDart = Math.max(...rows.map((r) => r.avgDart || 0), 1);
  rows.forEach((r) => {
    r.rankScore =
      ((r.wins || 0) / maxWins) * weights.wins +
      (r.winrate || 0) * weights.winrate +
      ((r.avgTurn || 0) / maxAvgTurn) * weights.avgTurn +
      ((r.avgDart || 0) / maxAvgDart) * weights.avgDart;
  });
}

function sortRankingRows(rows, keyFn) {
  rows.sort((a, b) => {
    const sd = (b.rankScore || 0) - (a.rankScore || 0);
    if (sd !== 0) return sd;
    const wd = b.wins - a.wins;
    if (wd !== 0) return wd;
    const rd = (b.winrate || 0) - (a.winrate || 0);
    if (rd !== 0) return rd;
    const ad = (b.avgTurn || 0) - (a.avgTurn || 0);
    if (ad !== 0) return ad;
    return (keyFn(a) || "").localeCompare(keyFn(b) || "");
  });
}

export function getPlayerRanking(range, tagFilterOverride) {
  const tagFilter = tagFilterOverride ?? app.ui.tagFilter;
  const matches = getMatchesFiltered(range, tagFilter);
  const statsMap = computePlayerStats(app.state.players, matches);
  const rows = app.state.players.map((player) => ({ player, ...statsMap[player.id] }));
  applyRankingScore(rows);
  sortRankingRows(rows, (r) => r.player.name);
  return rows;
}

export function getTeamRanking(range, tagFilterOverride) {
  const tagFilter = tagFilterOverride ?? app.ui.tagFilter;
  const matches = getMatchesFiltered(range, tagFilter);
  const teams = {};

  matches.forEach((match) => {
    getMatchTeams(match).forEach((team) => {
      if (!teams[team.name]) {
        teams[team.name] = { team: team.name, matches: 0, wins: 0, turns: 0, totalPoints: 0, darts: 0, count180: 0, bestCheckout: null, winrate: 0, avgTurn: null, avgDart: null, avgThreeDart: null };
      }
      teams[team.name].matches += 1;
    });
    const winnerTeamId = match.teamMode
      ? match.winnerTeamId
      : (match.winnerIds?.[0] ? getMatchTeamId(match, match.winnerIds[0]) : null);
    if (winnerTeamId) {
      const wName = getMatchTeamName(match, winnerTeamId);
      if (wName && teams[wName]) teams[wName].wins += 1;
    }
    if (match.scoringMode === "live" && match.type === "x01" && Array.isArray(match.turns)) {
      match.turns.forEach((turn) => {
        const teamId = getMatchTeamId(match, turn.playerId);
        if (!teamId) return;
        const teamName = getMatchTeamName(match, teamId);
        const t = teams[teamName];
        if (!t) return;
        const applied = Number.isFinite(turn.appliedScore) ? turn.appliedScore : 0;
        const dartCount = Array.isArray(turn.darts) ? turn.darts.length : 3;
        t.turns += 1; t.totalPoints += applied; t.darts += dartCount;
        if (applied === 180) t.count180 += 1;
        if (turn.checkout) t.bestCheckout = t.bestCheckout ? Math.max(t.bestCheckout, turn.checkout) : turn.checkout;
      });
    }
  });

  const rows = Object.values(teams);
  rows.forEach((t) => {
    t.winrate = t.matches ? t.wins / t.matches : 0;
    t.avgTurn = t.turns ? t.totalPoints / t.turns : null;
    t.avgDart = t.darts ? t.totalPoints / t.darts : null;
    t.avgThreeDart = t.avgDart ? t.avgDart * 3 : null;
  });
  applyRankingScore(rows);
  sortRankingRows(rows, (r) => r.team);
  return rows;
}
