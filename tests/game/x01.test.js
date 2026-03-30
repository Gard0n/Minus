import { describe, it, expect } from "vitest";
import { processX01Turn, undoX01Turn, getCheckoutSuggestion } from "../../src/game/x01.js";

function makeMatch(startScore = 501, players = ["p1", "p2"], settings = {}) {
  const scoreboard = {};
  players.forEach((id) => { scoreboard[id] = { score: startScore, started: true }; });
  return {
    players,
    currentTurnIndex: 0,
    scoreboard,
    turns: [],
    progress: { currentLeg: 1, currentSet: 1 },
    settings: { doubleIn: false, doubleOut: true, bust: true, ...settings },
  };
}

function dart(base, multiplier = 1) {
  return { base, multiplier, score: base * multiplier };
}

// ── getCheckoutSuggestion ────────────────────────────────────────────────────

describe("getCheckoutSuggestion", () => {
  it("returns null below 2", () => {
    expect(getCheckoutSuggestion(1, true)).toBeNull();
    expect(getCheckoutSuggestion(0, true)).toBeNull();
  });

  it("returns null above 170", () => {
    expect(getCheckoutSuggestion(171, true)).toBeNull();
  });

  it("returns suggestion for 170 (doubleOut)", () => {
    expect(getCheckoutSuggestion(170, true)).toBe("T20 T20 Bull");
  });

  it("returns simple value without doubleOut for small scores", () => {
    expect(getCheckoutSuggestion(15, false)).toBe("15");
    expect(getCheckoutSuggestion(50, false)).toBe("Bull");
    expect(getCheckoutSuggestion(40, false)).toBe("D20");
    expect(getCheckoutSuggestion(60, false)).toBe("T20");
  });

  it("returns null for non-achievable scores without doubleOut", () => {
    expect(getCheckoutSuggestion(100, false)).toBeNull();
  });
});

// ── processX01Turn ───────────────────────────────────────────────────────────

describe("processX01Turn — basic scoring", () => {
  it("subtracts the dart score", () => {
    const match = makeMatch(501);
    processX01Turn(match, [dart(20), dart(20), dart(20)]);
    expect(match.scoreboard["p1"].score).toBe(441);
  });

  it("advances turn to next player", () => {
    const match = makeMatch(501);
    processX01Turn(match, [dart(20)]);
    expect(match.currentTurnIndex).toBe(1);
  });

  it("records the turn in match.turns", () => {
    const match = makeMatch(501);
    processX01Turn(match, [dart(20), dart(20), dart(1)]);
    expect(match.turns).toHaveLength(1);
    expect(match.turns[0].playerId).toBe("p1");
    expect(match.turns[0].rawScore).toBe(41);
    expect(match.turns[0].appliedScore).toBe(41);
  });

  it("returns correct metadata", () => {
    const match = makeMatch(501);
    const result = processX01Turn(match, [dart(20), dart(20), dart(20)]);
    expect(result.playerId).toBe("p1");
    expect(result.finished).toBe(false);
    expect(result.bust).toBe(false);
    expect(result.nextPlayerId).toBe("p2");
  });
});

describe("processX01Turn — bust", () => {
  it("does not subtract on bust (score would go negative)", () => {
    const match = makeMatch(10);
    processX01Turn(match, [dart(20)]);
    expect(match.scoreboard["p1"].score).toBe(10);
    expect(match.turns[0].bust).toBe(true);
    expect(match.turns[0].appliedScore).toBe(0);
  });

  it("busts when finishing without double (doubleOut)", () => {
    const match = makeMatch(20, ["p1"], { doubleOut: true });
    processX01Turn(match, [dart(20, 1)]); // single 20, not a double
    expect(match.scoreboard["p1"].score).toBe(20);
    expect(match.turns[0].bust).toBe(true);
  });

  it("finishes when last dart is double (doubleOut)", () => {
    const match = makeMatch(40, ["p1"], { doubleOut: true });
    const result = processX01Turn(match, [dart(20, 2)]); // D20 = 40
    expect(result.finished).toBe(true);
    expect(match.scoreboard["p1"].score).toBe(0);
  });

  it("finishes without double when doubleOut disabled", () => {
    const match = makeMatch(20, ["p1"], { doubleOut: false });
    const result = processX01Turn(match, [dart(20, 1)]);
    expect(result.finished).toBe(true);
    expect(match.scoreboard["p1"].score).toBe(0);
  });
});

describe("processX01Turn — doubleIn", () => {
  it("does not score without a double when doubleIn is required", () => {
    const match = makeMatch(501, ["p1"], { doubleIn: true });
    match.scoreboard["p1"].started = false;
    processX01Turn(match, [dart(20), dart(20), dart(20)]);
    expect(match.scoreboard["p1"].score).toBe(501);
    expect(match.turns[0].appliedScore).toBe(0);
  });

  it("scores when the turn includes a double (doubleIn)", () => {
    const match = makeMatch(501, ["p1"], { doubleIn: true, doubleOut: false, bust: false });
    match.scoreboard["p1"].started = false;
    processX01Turn(match, [dart(20, 2), dart(1), dart(1)]);
    expect(match.scoreboard["p1"].score).toBe(501 - 42);
  });
});

// ── undoX01Turn ──────────────────────────────────────────────────────────────

describe("undoX01Turn", () => {
  it("restores previous score", () => {
    const match = makeMatch(501);
    processX01Turn(match, [dart(20), dart(20), dart(20)]);
    undoX01Turn(match);
    expect(match.scoreboard["p1"].score).toBe(501);
    expect(match.turns).toHaveLength(0);
  });

  it("restores current turn to the correct player", () => {
    const match = makeMatch(501);
    processX01Turn(match, [dart(20)]);
    expect(match.currentTurnIndex).toBe(1);
    undoX01Turn(match);
    expect(match.currentTurnIndex).toBe(0);
  });

  it("returns false when no turns to undo", () => {
    const match = makeMatch(501);
    expect(undoX01Turn(match)).toBe(false);
  });

  it("restores started flag after undo", () => {
    const match = makeMatch(501, ["p1"], { doubleIn: true, doubleOut: false, bust: false });
    match.scoreboard["p1"].started = false;
    processX01Turn(match, [dart(20, 2)]);
    expect(match.scoreboard["p1"].started).toBe(true);
    undoX01Turn(match);
    expect(match.scoreboard["p1"].started).toBe(false);
  });
});
