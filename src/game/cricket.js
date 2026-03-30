import { cricketNumbers } from "../constants.js";
import { uid } from "../utils.js";

export function initCricketMarks() {
  const marks = {};
  cricketNumbers.forEach((num) => { marks[num.key] = 0; });
  return marks;
}

/**
 * Check if any OPPONENT (not a teammate) has not yet closed numKey.
 * Fixes the team mode bug where teammates counted as opponents.
 */
export function anyOpponentOpen(match, playerId, numKey) {
  return match.players.some((id) => {
    if (id === playerId) return false;
    // In team mode, skip teammates
    if (match.teamMode && match.teamAssignments) {
      if (match.teamAssignments[id] === match.teamAssignments[playerId]) return false;
    }
    return (match.cricket.scores[id]?.marks[numKey] ?? 0) < 3;
  });
}

/**
 * Check if a player has won the cricket game (all numbers closed, points >= all opponents).
 */
export function isCricketWinner(match, playerId) {
  const playerScore = match.cricket.scores[playerId];
  const allClosed = cricketNumbers.every((num) => playerScore.marks[num.key] >= 3);
  if (!allClosed) return false;
  const maxOpponentPoints = Math.max(
    0,
    ...match.players
      .filter((id) => {
        if (id === playerId) return false;
        if (match.teamMode && match.teamAssignments?.[id] === match.teamAssignments?.[playerId]) return false;
        return true;
      })
      .map((id) => match.cricket.scores[id]?.points ?? 0)
  );
  return playerScore.points >= maxOpponentPoints;
}

/**
 * Process one Cricket turn. Mutates match in place.
 * Returns metadata for the caller to handle side effects.
 */
export function processCricketTurn(match, darts) {
  const playerId = match.players[match.currentTurnIndex];
  const playerScore = match.cricket.scores[playerId];
  const prevMarks = { ...playerScore.marks };
  const prevPoints = playerScore.points;

  let pointsGained = 0;
  const hitsLog = {};

  darts.forEach((dart) => {
    const numKey = dart.base === 25 ? "bull" : String(dart.base);
    if (!cricketNumbers.some((num) => num.key === numKey)) return;
    const hits = dart.multiplier;
    hitsLog[numKey] = (hitsLog[numKey] || 0) + hits;
    for (let i = 0; i < hits; i++) {
      if (playerScore.marks[numKey] < 3) {
        playerScore.marks[numKey] += 1;
      } else if (anyOpponentOpen(match, playerId, numKey)) {
        const numValue = cricketNumbers.find((n) => n.key === numKey)?.value || 0;
        pointsGained += numValue;
      }
    }
  });

  playerScore.points += pointsGained;

  match.turns.push({
    id: uid(),
    playerId,
    darts: [...darts],
    hits: hitsLog,
    prevMarks,
    prevPoints,
    pointsGained,
    leg: match.progress?.currentLeg || 1,
    set: match.progress?.currentSet || 1,
    ts: new Date().toISOString(),
  });

  const isWinner = isCricketWinner(match, playerId);

  if (!isWinner) {
    match.currentTurnIndex = (match.currentTurnIndex + 1) % match.players.length;
  }

  const nextPlayerId = match.players[match.currentTurnIndex];
  const nextPoints = match.cricket.scores[nextPlayerId]?.points ?? 0;

  return { playerId, isWinner, nextPlayerId, nextPoints, pointsGained };
}

/**
 * Undo last Cricket turn. Mutates match in place.
 */
export function undoCricketTurn(match) {
  const lastTurn = match.turns[match.turns.length - 1];
  if (!lastTurn) return false;
  match.turns.pop();
  match.cricket.scores[lastTurn.playerId].marks = { ...lastTurn.prevMarks };
  match.cricket.scores[lastTurn.playerId].points = lastTurn.prevPoints;
  match.currentTurnIndex = match.players.indexOf(lastTurn.playerId);
  return true;
}
