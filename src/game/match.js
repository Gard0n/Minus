import { defaultSettings } from "../constants.js";
import { uid, shuffle, clone } from "../utils.js";
import { initCricketMarks } from "./cricket.js";
import {
  app, saveState, saveLastSetup, getMatchSettings, sanitizePlayerIds,
  setActiveGroup, getMatchTeamId, getMatchSideIds, getPlayersByTeam,
} from "../state.js";

export function initMatchProgress(match) {
  const sideIds = getMatchSideIds(match);
  const legs = {};
  const sets = {};
  sideIds.forEach((id) => { legs[id] = 0; sets[id] = 0; });
  return { currentLeg: 1, currentSet: 1, legs, sets, legResults: [] };
}

export function ensureMatchProgress(match) {
  if (!match.progress?.legs || !match.progress?.sets) {
    match.progress = initMatchProgress(match);
  }
  if (!Array.isArray(match.progress.legResults)) match.progress.legResults = [];
  const sideIds = getMatchSideIds(match);
  sideIds.forEach((id) => {
    if (match.progress.legs[id] == null) match.progress.legs[id] = 0;
    if (match.progress.sets[id] == null) match.progress.sets[id] = 0;
  });
}

export function buildTeamTurnOrder(players, assignments, randomize) {
  const teams = {};
  players.forEach((id) => {
    const teamId = assignments[id] || "A";
    if (!teams[teamId]) teams[teamId] = [];
    teams[teamId].push(id);
  });
  const teamIds = Object.keys(teams);
  const maxLen = Math.max(...teamIds.map((t) => teams[t].length));
  const order = [];
  for (let i = 0; i < maxLen; i++) {
    teamIds.forEach((t) => { if (teams[t][i]) order.push(teams[t][i]); });
  }
  return randomize ? shuffle(order) : order;
}

/**
 * Start a live match. Mutates app.state.
 */
export function startLiveMatch({ mode, players, settings, teamMode, teamAssignments, teamNames, tag }) {
  const now = new Date().toISOString();
  const matchTeams = {
    teamMode: !!teamMode,
    teamAssignments: teamAssignments || {},
    teamNames: teamNames || { A: "Équipe A", B: "Équipe B" },
    winnerTeamId: null,
  };
  const matchBase = {
    id: uid(),
    mode,
    scoringMode: "live",
    tag: tag || "",
    players,
    settings,
    ...matchTeams,
    status: "live",
    startedAt: now,
    currentTurnIndex: 0,
    turns: [],
  };
  matchBase.progress = initMatchProgress(matchBase);

  if (mode === "cricket") {
    const scores = {};
    players.forEach((id) => { scores[id] = { marks: initCricketMarks(), points: 0 }; });
    app.state.activeMatch = { ...matchBase, type: "cricket", cricket: { scores } };
  } else {
    const startScore = Number(mode);
    const scoreboard = {};
    players.forEach((id) => { scoreboard[id] = { score: startScore, started: !settings.doubleIn }; });
    app.state.activeMatch = { ...matchBase, type: "x01", scoreboard };
  }

  saveLastSetup({ mode, players, settings, teamMode: matchTeams.teamMode, teamAssignments: matchTeams.teamAssignments, teamNames: matchTeams.teamNames, scoringMode: "live", tag: tag || "" });
  app.ui.dartDraft = [];
  app.ui.dartMultiplier = 1;
  app.ui.cricketTurn = {};
  saveState();
}

export function startMatchFromSetup({ mode, players, settings, teamMode, teamAssignments, teamNames, scoringMode, tag, randomStart }) {
  const validPlayers = sanitizePlayerIds(players);
  if (validPlayers.length < 2) return false;
  const mergedSettings = getMatchSettings(settings);
  const orderedPlayers = randomStart ? shuffle(validPlayers) : validPlayers;
  startLiveMatch({ mode, players: orderedPlayers, settings: mergedSettings, teamMode, teamAssignments, teamNames, tag });
  app.ui.view = "match";
  app.ui.quickDraft = null;
  return true;
}

export function getFinalScores(match) {
  const scores = {};
  match.players.forEach((id) => { scores[id] = match.scoreboard[id].score; });
  return scores;
}

export function getFinalPoints(match) {
  const points = {};
  match.players.forEach((id) => { points[id] = match.cricket.scores[id].points; });
  return points;
}

/**
 * Finalize a match (record it, clear activeMatch). Mutates app.state.
 */
export function finalizeMatch(match, winnerIds) {
  const winnerTeamId = match.teamMode && winnerIds.length ? getMatchTeamId(match, winnerIds[0]) : null;
  const record = {
    id: match.id,
    date: new Date().toISOString(),
    type: match.type,
    mode: match.mode,
    scoringMode: match.scoringMode,
    players: match.players,
    settings: match.settings,
    teamMode: match.teamMode,
    teamAssignments: match.teamAssignments,
    teamNames: match.teamNames,
    winnerTeamId,
    tag: match.tag || "",
    progress: match.progress || null,
    winnerIds,
    turns: match.turns,
    finalScores: match.type === "x01" ? getFinalScores(match) : null,
    finalPoints: match.type === "cricket" ? getFinalPoints(match) : null,
  };
  app.state.matches.push(record);
  app.state.lastSummaryId = record.id;
  app.state.activeMatch = null;
  app.ui.dartDraft = [];
  app.ui.dartMultiplier = 1;
  saveState();
  return record;
}

/**
 * Reset leg state. Mutates match in place.
 */
export function resetLeg(match, winnerPlayerId) {
  if (match.type === "x01") {
    const startScore = Number(match.mode);
    match.players.forEach((id) => {
      match.scoreboard[id] = { score: startScore, started: !match.settings.doubleIn };
    });
  } else if (match.type === "cricket") {
    match.players.forEach((id) => {
      match.cricket.scores[id] = { marks: initCricketMarks(), points: 0 };
    });
  }
  const startIndex = match.players.indexOf(winnerPlayerId);
  match.currentTurnIndex = startIndex >= 0 ? startIndex : 0;
  app.ui.dartDraft = [];
  app.ui.dartMultiplier = 1;
}

/**
 * Process a leg win. Mutates match and possibly app.state.
 * Returns { matchFinished, winnerIds, legWon, newSet }.
 */
export function processLegWin(match, winnerPlayerId) {
  ensureMatchProgress(match);
  const settings = match.settings || defaultSettings;
  const legsToWin = Math.max(1, Number(settings.legsToWin) || 1);
  const setsToWin = Math.max(1, Number(settings.setsToWin) || 1);

  const winnerSideId = match.teamMode
    ? (getMatchTeamId(match, winnerPlayerId) || winnerPlayerId)
    : winnerPlayerId;

  match.lastLeg = { winnerPlayerId, winnerSideId, set: match.progress.currentSet, leg: match.progress.currentLeg, ts: new Date().toISOString() };
  if (!match.progress.legs[winnerSideId]) match.progress.legs[winnerSideId] = 0;
  if (!match.progress.sets[winnerSideId]) match.progress.sets[winnerSideId] = 0;

  match.progress.legs[winnerSideId] += 1;
  match.progress.legResults.push({
    set: match.progress.currentSet, leg: match.progress.currentLeg,
    winnerPlayerId, winnerSideId, finishedAt: new Date().toISOString(),
  });

  let matchFinished = false;
  let newSet = false;

  if (match.progress.legs[winnerSideId] >= legsToWin) {
    match.progress.sets[winnerSideId] += 1;
    Object.keys(match.progress.legs).forEach((id) => { match.progress.legs[id] = 0; });
    match.progress.currentSet += 1;
    match.progress.currentLeg = 1;
    newSet = true;
  }

  if (match.progress.sets[winnerSideId] >= setsToWin) {
    matchFinished = true;
  }

  if (!matchFinished && !newSet) match.progress.currentLeg += 1;

  const winnerIds = match.teamMode
    ? getPlayersByTeam(match.players, match.teamAssignments, winnerSideId)
    : [winnerPlayerId];

  return { matchFinished, winnerIds, legWon: true, newSet };
}

export function replayMatch(matchId) {
  const match = app.state.matches.find((m) => m.id === matchId);
  if (!match) return false;
  return startMatchFromSetup({
    mode: match.mode, players: match.players, teamMode: match.teamMode,
    teamAssignments: match.teamAssignments, teamNames: match.teamNames,
    settings: match.settings, scoringMode: match.scoringMode, tag: match.tag || "",
  });
}

export function applyTemplate(template) {
  const players = sanitizePlayerIds(app.state.players.map((p) => p.id));
  if (players.length < 2) return false;
  if (template === "duel-501") {
    startMatchFromSetup({ mode: "501", players: players.slice(0, 2), settings: {} });
  } else if (template === "duel-301") {
    startMatchFromSetup({ mode: "301", players: players.slice(0, 2), settings: {} });
  } else if (template === "cricket") {
    startMatchFromSetup({ mode: "cricket", players: players.slice(0, 2), settings: {} });
  } else if (template === "teams-2v2" && players.length >= 4) {
    const four = players.slice(0, 4);
    const assignments = { [four[0]]: "A", [four[2]]: "A", [four[1]]: "B", [four[3]]: "B" };
    startMatchFromSetup({ mode: "501", players: four, teamMode: true, teamAssignments: assignments, teamNames: { A: "Équipe A", B: "Équipe B" }, settings: {} });
  } else if (template === "last") {
    const last = app.state.lastSetup;
    if (!last) return false;
    startMatchFromSetup(last);
  }
  app.ui.view = "match";
  return true;
}
