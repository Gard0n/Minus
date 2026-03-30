import { describe, it, expect } from "vitest";
import { initCricketMarks, anyOpponentOpen, isCricketWinner, processCricketTurn, undoCricketTurn } from "../../src/game/cricket.js";
import { cricketNumbers } from "../../src/constants.js";

function makeMatch(players = ["p1", "p2"], teamMode = false, teamAssignments = {}) {
  const scores = {};
  players.forEach((id) => { scores[id] = { marks: initCricketMarks(), points: 0 }; });
  return {
    players,
    currentTurnIndex: 0,
    cricket: { scores },
    turns: [],
    progress: { currentLeg: 1, currentSet: 1 },
    teamMode,
    teamAssignments,
    settings: {},
  };
}

function dart(base, multiplier = 1) {
  return { base, multiplier, score: base * multiplier };
}

function closeNumber(match, playerId, numKey) {
  match.cricket.scores[playerId].marks[numKey] = 3;
}

function closeAllNumbers(match, playerId) {
  cricketNumbers.forEach((n) => { match.cricket.scores[playerId].marks[n.key] = 3; });
}

// ── anyOpponentOpen ──────────────────────────────────────────────────────────

describe("anyOpponentOpen", () => {
  it("returns true when opponent has not closed a number", () => {
    const match = makeMatch();
    // p2 has 0 marks on "20"
    expect(anyOpponentOpen(match, "p1", "20")).toBe(true);
  });

  it("returns false when all opponents have closed the number", () => {
    const match = makeMatch();
    closeNumber(match, "p2", "20");
    expect(anyOpponentOpen(match, "p1", "20")).toBe(false);
  });

  it("ignores the player itself", () => {
    const match = makeMatch(["p1"]);
    // Only one player — no opponents
    expect(anyOpponentOpen(match, "p1", "20")).toBe(false);
  });

  it("skips teammates in team mode", () => {
    const match = makeMatch(["p1", "p2", "p3", "p4"], true, {
      p1: "A", p2: "A", p3: "B", p4: "B",
    });
    // p3 and p4 are opponents; close both on "20"
    closeNumber(match, "p3", "20");
    closeNumber(match, "p4", "20");
    // p2 is a teammate of p1 — should be ignored
    expect(anyOpponentOpen(match, "p1", "20")).toBe(false);
  });

  it("returns true when at least one opponent is still open (team mode)", () => {
    const match = makeMatch(["p1", "p2", "p3", "p4"], true, {
      p1: "A", p2: "A", p3: "B", p4: "B",
    });
    // Only p3 is closed; p4 is still open
    closeNumber(match, "p3", "20");
    expect(anyOpponentOpen(match, "p1", "20")).toBe(true);
  });
});

// ── isCricketWinner ──────────────────────────────────────────────────────────

describe("isCricketWinner", () => {
  it("returns false when not all numbers are closed", () => {
    const match = makeMatch();
    expect(isCricketWinner(match, "p1")).toBe(false);
  });

  it("returns true when all numbers closed and points >= opponent", () => {
    const match = makeMatch();
    closeAllNumbers(match, "p1");
    // p2 has 0 points, p1 also has 0 → p1 >= p2
    expect(isCricketWinner(match, "p1")).toBe(true);
  });

  it("returns false when all numbers closed but opponent has more points", () => {
    const match = makeMatch();
    closeAllNumbers(match, "p1");
    match.cricket.scores["p2"].points = 100;
    expect(isCricketWinner(match, "p1")).toBe(false);
  });

  it("returns true with equal points", () => {
    const match = makeMatch();
    closeAllNumbers(match, "p1");
    match.cricket.scores["p2"].points = 0;
    match.cricket.scores["p1"].points = 0;
    expect(isCricketWinner(match, "p1")).toBe(true);
  });
});

// ── processCricketTurn ───────────────────────────────────────────────────────

describe("processCricketTurn — marks", () => {
  it("adds marks for a valid cricket number", () => {
    const match = makeMatch();
    processCricketTurn(match, [dart(20, 1)]);
    expect(match.cricket.scores["p1"].marks["20"]).toBe(1);
  });

  it("adds up to 3 marks (closes the number)", () => {
    const match = makeMatch();
    processCricketTurn(match, [dart(20, 3)]); // treble = 3 marks
    expect(match.cricket.scores["p1"].marks["20"]).toBe(3);
  });

  it("does not exceed 3 marks — overflow becomes points if opponent is open", () => {
    const match = makeMatch();
    // p1 already has 2 marks on 20
    match.cricket.scores["p1"].marks["20"] = 2;
    // p2 has 0 marks on 20 (opponent open)
    processCricketTurn(match, [dart(20, 3)]); // 3 hits: 1 mark → close, 2 extra → 40 pts
    expect(match.cricket.scores["p1"].marks["20"]).toBe(3);
    expect(match.cricket.scores["p1"].points).toBe(40);
  });

  it("does not add points if no opponent is open", () => {
    const match = makeMatch();
    closeNumber(match, "p2", "20");
    match.cricket.scores["p1"].marks["20"] = 3; // p1 already closed
    processCricketTurn(match, [dart(20, 2)]); // p1 closed, p2 closed → no points
    expect(match.cricket.scores["p1"].points).toBe(0);
  });

  it("handles bull (base 25)", () => {
    const match = makeMatch();
    processCricketTurn(match, [dart(25, 1)]);
    expect(match.cricket.scores["p1"].marks["bull"]).toBe(1);
  });

  it("ignores non-cricket numbers", () => {
    const match = makeMatch();
    processCricketTurn(match, [dart(14, 1)]);
    const totalMarks = Object.values(match.cricket.scores["p1"].marks).reduce((a, b) => a + b, 0);
    expect(totalMarks).toBe(0);
    expect(match.cricket.scores["p1"].points).toBe(0);
  });
});

describe("processCricketTurn — turn rotation", () => {
  it("advances to next player after a normal turn", () => {
    const match = makeMatch();
    processCricketTurn(match, [dart(20)]);
    expect(match.currentTurnIndex).toBe(1);
  });

  it("records the turn in match.turns", () => {
    const match = makeMatch();
    processCricketTurn(match, [dart(20, 2)]);
    expect(match.turns).toHaveLength(1);
    expect(match.turns[0].playerId).toBe("p1");
  });

  it("returns isWinner=false for a normal turn", () => {
    const match = makeMatch();
    const result = processCricketTurn(match, [dart(20)]);
    expect(result.isWinner).toBe(false);
    expect(result.playerId).toBe("p1");
  });

  it("returns isWinner=true when player wins", () => {
    const match = makeMatch(["p1", "p2"]);
    // Close all numbers for p1 — p2 has no points so p1 wins immediately
    closeAllNumbers(match, "p1");
    // p1 has all marks, 0 points — p2 also 0 pts → wins
    // Force win by playing a turn that closes bull
    // Reset and play properly
    const match2 = makeMatch(["p1", "p2"]);
    // Manually set up near-win: all closed except bull, p2 has no points
    cricketNumbers.filter(n => n.key !== "bull").forEach(n => {
      match2.cricket.scores["p1"].marks[n.key] = 3;
    });
    match2.cricket.scores["p2"].points = 0; // p2 behind
    const result = processCricketTurn(match2, [dart(25, 3)]); // close bull
    expect(result.isWinner).toBe(true);
  });
});

// ── undoCricketTurn ──────────────────────────────────────────────────────────

describe("undoCricketTurn", () => {
  it("restores marks and points", () => {
    const match = makeMatch();
    match.cricket.scores["p1"].marks["20"] = 2;
    // p2 has 0 marks on "20" → opponent open → points are awarded
    processCricketTurn(match, [dart(20, 3)]); // 1 mark → close, 2 extra hits × 20 = 40 pts
    expect(match.cricket.scores["p1"].points).toBe(40);

    undoCricketTurn(match);
    expect(match.cricket.scores["p1"].marks["20"]).toBe(2);
    expect(match.cricket.scores["p1"].points).toBe(0);
    expect(match.turns).toHaveLength(0);
  });

  it("restores current turn index", () => {
    const match = makeMatch();
    processCricketTurn(match, [dart(20)]);
    expect(match.currentTurnIndex).toBe(1);
    undoCricketTurn(match);
    expect(match.currentTurnIndex).toBe(0);
  });

  it("returns false when no turns to undo", () => {
    const match = makeMatch();
    expect(undoCricketTurn(match)).toBe(false);
  });
});
