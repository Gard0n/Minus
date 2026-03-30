import { CHECKOUT_TABLE } from "../constants.js";
import { uid } from "../utils.js";

export function getCheckoutSuggestion(score, doubleOut) {
  if (score < 2 || score > 170) return null;
  if (!doubleOut) {
    if (score <= 20) return String(score);
    if (score === 25 || score === 50) return "Bull";
    if (score <= 40 && score % 2 === 0) return `D${score / 2}`;
    if (score <= 60 && score % 3 === 0) return `T${score / 3}`;
    return null;
  }
  return CHECKOUT_TABLE[score] || null;
}

/**
 * Process one X01 turn. Mutates match in place.
 * Returns metadata for the caller to handle side effects.
 */
export function processX01Turn(match, darts) {
  const rawScore = darts.reduce((sum, d) => sum + d.score, 0);
  const hasDouble = darts.some((d) => d.multiplier === 2);
  const lastDartDouble = darts[darts.length - 1]?.multiplier === 2;
  const playerId = match.players[match.currentTurnIndex];
  const playerState = match.scoreboard[playerId];
  const prevScore = playerState.score;
  const prevStarted = playerState.started;

  let started = playerState.started;
  let canScore = true;
  let bust = false;
  let finished = false;
  let checkout = null;
  let appliedScore = 0;
  let nextScore = prevScore;

  if (match.settings.doubleIn && !started) {
    if (hasDouble) started = true;
    else canScore = false;
  }

  if (canScore) {
    nextScore = prevScore - rawScore;
    if (match.settings.bust && nextScore < 0) {
      bust = true;
      nextScore = prevScore;
    } else if (nextScore === 0) {
      if (match.settings.doubleOut && !lastDartDouble) {
        bust = true;
        nextScore = prevScore;
      } else {
        finished = true;
        checkout = prevScore;
      }
    }
    if (!bust) appliedScore = rawScore;
  }

  playerState.score = nextScore;
  playerState.started = started;

  match.turns.push({
    id: uid(),
    playerId,
    darts: [...darts],
    rawScore,
    appliedScore,
    prevScore,
    nextScore,
    prevStarted,
    started,
    bust,
    doubleIn: hasDouble,
    doubleOut: lastDartDouble,
    finished,
    checkout,
    leg: match.progress?.currentLeg || 1,
    set: match.progress?.currentSet || 1,
    ts: new Date().toISOString(),
  });

  const nextTurnIndex = finished
    ? match.currentTurnIndex
    : (match.currentTurnIndex + 1) % match.players.length;

  if (!finished) {
    match.currentTurnIndex = nextTurnIndex;
  }

  const nextPlayerId = match.players[nextTurnIndex];
  const nextPlayerScore = match.scoreboard[nextPlayerId]?.score;
  const checkoutHint = nextPlayerScore != null && nextPlayerScore <= 170
    ? getCheckoutSuggestion(nextPlayerScore, match.settings.doubleOut)
    : null;

  return { playerId, finished, bust, nextPlayerId, nextPlayerScore, checkoutHint };
}

/**
 * Undo last X01 turn. Mutates match in place.
 */
export function undoX01Turn(match) {
  const lastTurn = match.turns[match.turns.length - 1];
  if (!lastTurn) return false;
  match.turns.pop();
  match.scoreboard[lastTurn.playerId].score = lastTurn.prevScore;
  match.scoreboard[lastTurn.playerId].started = lastTurn.prevStarted;
  match.currentTurnIndex = match.players.indexOf(lastTurn.playerId);
  return true;
}
