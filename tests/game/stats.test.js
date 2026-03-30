import { describe, it, expect } from "vitest";
import { computePlayerStats } from "../../src/game/stats.js";

function makePlayer(id, name) {
  return { id, name: name || id };
}

function makeMatch(overrides = {}) {
  return {
    players: ["p1", "p2"],
    winnerIds: [],
    scoringMode: "live",
    type: "x01",
    turns: [],
    ...overrides,
  };
}

function makeTurn(playerId, appliedScore, darts = 3, options = {}) {
  return {
    playerId,
    appliedScore,
    darts: Array(darts).fill({ score: 1, multiplier: 1 }),
    ...options,
  };
}

// ── computePlayerStats ───────────────────────────────────────────────────────

describe("computePlayerStats — basic counts", () => {
  it("counts matches per player", () => {
    const players = [makePlayer("p1"), makePlayer("p2")];
    const matches = [makeMatch({ players: ["p1", "p2"] })];
    const stats = computePlayerStats(players, matches);
    expect(stats["p1"].matches).toBe(1);
    expect(stats["p2"].matches).toBe(1);
  });

  it("counts wins correctly", () => {
    const players = [makePlayer("p1"), makePlayer("p2")];
    const matches = [makeMatch({ winnerIds: ["p1"] })];
    const stats = computePlayerStats(players, matches);
    expect(stats["p1"].wins).toBe(1);
    expect(stats["p2"].wins).toBe(0);
  });

  it("handles multiple matches", () => {
    const players = [makePlayer("p1"), makePlayer("p2")];
    const matches = [
      makeMatch({ winnerIds: ["p1"] }),
      makeMatch({ winnerIds: ["p1"] }),
      makeMatch({ winnerIds: ["p2"] }),
    ];
    const stats = computePlayerStats(players, matches);
    expect(stats["p1"].wins).toBe(2);
    expect(stats["p2"].wins).toBe(1);
    expect(stats["p1"].matches).toBe(3);
    expect(stats["p2"].matches).toBe(3);
  });
});

describe("computePlayerStats — winrate", () => {
  it("computes winrate as wins / matches", () => {
    const players = [makePlayer("p1")];
    const matches = [
      makeMatch({ players: ["p1"], winnerIds: ["p1"] }),
      makeMatch({ players: ["p1"], winnerIds: [] }),
    ];
    const stats = computePlayerStats(players, matches);
    expect(stats["p1"].winrate).toBeCloseTo(0.5);
  });

  it("returns 0 winrate with no matches", () => {
    const players = [makePlayer("p1")];
    const stats = computePlayerStats(players, []);
    expect(stats["p1"].winrate).toBe(0);
  });
});

describe("computePlayerStats — turn stats (x01 live)", () => {
  it("computes average turn score", () => {
    const players = [makePlayer("p1"), makePlayer("p2")];
    const turns = [
      makeTurn("p1", 60, 3),
      makeTurn("p1", 45, 3),
    ];
    const matches = [makeMatch({ turns })];
    const stats = computePlayerStats(players, matches);
    expect(stats["p1"].avgTurn).toBeCloseTo(52.5);
  });

  it("computes average dart score", () => {
    const players = [makePlayer("p1")];
    const turns = [makeTurn("p1", 60, 3)]; // 60 / 3 darts = 20 per dart
    const matches = [makeMatch({ players: ["p1"], turns })];
    const stats = computePlayerStats(players, matches);
    expect(stats["p1"].avgDart).toBeCloseTo(20);
    expect(stats["p1"].avgThreeDart).toBeCloseTo(60);
  });

  it("counts 180s", () => {
    const players = [makePlayer("p1")];
    const turns = [
      makeTurn("p1", 180, 3),
      makeTurn("p1", 180, 3),
      makeTurn("p1", 60, 3),
    ];
    const matches = [makeMatch({ players: ["p1"], turns })];
    const stats = computePlayerStats(players, matches);
    expect(stats["p1"].count180).toBe(2);
  });

  it("tracks best checkout", () => {
    const players = [makePlayer("p1")];
    const turns = [
      makeTurn("p1", 40, 2, { checkout: 40 }),
      makeTurn("p1", 100, 3, { checkout: 100 }),
      makeTurn("p1", 60, 3),
    ];
    const matches = [makeMatch({ players: ["p1"], turns })];
    const stats = computePlayerStats(players, matches);
    expect(stats["p1"].bestCheckout).toBe(100);
  });

  it("returns null avgTurn when no live turns", () => {
    const players = [makePlayer("p1")];
    const matches = [makeMatch({ players: ["p1"] })];
    const stats = computePlayerStats(players, matches);
    expect(stats["p1"].avgTurn).toBeNull();
  });

  it("ignores turns from non-x01 or non-live matches", () => {
    const players = [makePlayer("p1")];
    const turns = [makeTurn("p1", 60, 3)];
    const matches = [
      makeMatch({ players: ["p1"], scoringMode: "manual", turns }),
      makeMatch({ players: ["p1"], type: "cricket", turns }),
    ];
    const stats = computePlayerStats(players, matches);
    expect(stats["p1"].turns).toBe(0);
    expect(stats["p1"].avgTurn).toBeNull();
  });
});

describe("computePlayerStats — unknown players", () => {
  it("ignores turns from unknown player ids", () => {
    const players = [makePlayer("p1")];
    const turns = [makeTurn("unknown", 60, 3)];
    const matches = [makeMatch({ players: ["p1"], turns })];
    const stats = computePlayerStats(players, matches);
    expect(stats["p1"].turns).toBe(0);
    expect(stats["unknown"]).toBeUndefined();
  });
});
