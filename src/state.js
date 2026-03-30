import { STORAGE_KEY, THEME_KEY, defaultSettings, defaultGroupState } from "./constants.js";
import { uid, clone } from "./utils.js";

// Central mutable app state — all modules reference app.*
export const app = {
  store: null,
  ui: {
    view: "match",
    quickDraft: null,
    editingPlayerId: null,
    profilePlayerId: null,
    historySelectedId: null,
    historyPlayerFilter: [],
    historyRange: "all",
    historyTagFilter: "all",
    rankingRange: "all",
    rankingMode: "solo",
    tagFilter: "all",
    matchDraft: null,
    dartDraft: [],
    dartMultiplier: 1,
    cricketTurn: {},
  },
  cloud: {
    session: null,
    groups: [],
    loading: false,
    error: null,
    awaitingOtp: false,
  },
};

// app.state is a live accessor to the active group
Object.defineProperty(app, "state", {
  get() { return this.store?.groups[this.store.activeGroupId]; },
  set(v) { if (this.store) this.store.groups[this.store.activeGroupId] = v; },
  enumerable: true,
});

// ── Storage ─────────────────────────────────────────────────────────────────

export function saveState() {
  app.store.groups[app.store.activeGroupId] = app.state;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(app.store));
  } catch (e) {
    console.error("saveState error", e);
  }
}

export function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultStore();
    const data = JSON.parse(raw);
    if (data.groups && data.groupList) {
      return normalizeStore(data);
    }
    // Legacy single-group format
    const groupId = uid();
    return {
      groups: { [groupId]: normalizeGroup(data) },
      groupList: [{ id: groupId, name: "Principal" }],
      activeGroupId: groupId,
      onboardingDone: true, // don't show onboarding to existing users
      gist: { token: "", gistId: "" },
    };
  } catch (err) {
    console.error("loadStore error", err);
    return createDefaultStore();
  }
}

// ── Normalize ────────────────────────────────────────────────────────────────

export function createDefaultStore() {
  const groupId = uid();
  return {
    groups: { [groupId]: clone(defaultGroupState) },
    groupList: [{ id: groupId, name: "Principal" }],
    activeGroupId: groupId,
    onboardingDone: false,
    gist: { token: "", gistId: "" },
  };
}

export function normalizeStore(data) {
  if (!data?.groups || !data?.groupList) return createDefaultStore();
  const groups = {};
  const groupList = Array.isArray(data.groupList) ? data.groupList : [];
  groupList.forEach((group) => {
    groups[group.id] = normalizeGroup(data.groups[group.id] || clone(defaultGroupState));
  });
  const activeGroupId = groups[data.activeGroupId] ? data.activeGroupId : groupList[0]?.id;
  return {
    groups,
    groupList,
    activeGroupId,
    onboardingDone: data.onboardingDone ?? true,
    gist: data.gist || { token: "", gistId: "" },
  };
}

export function normalizeGroup(group) {
  const matches = Array.isArray(group.matches) ? group.matches.map(normalizeMatch) : [];
  const activeMatch = group.activeMatch ? normalizeActiveMatch(group.activeMatch) : null;
  const baseSettings = { ...defaultSettings, ...(group.settings || {}) };
  baseSettings.rankingWeights = {
    ...defaultSettings.rankingWeights,
    ...(group.settings?.rankingWeights || {}),
  };
  return {
    ...clone(defaultGroupState),
    ...group,
    matches,
    activeMatch,
    settings: baseSettings,
  };
}

export function normalizeMatch(match) {
  if (!match) return match;
  const teamNames = Array.isArray(match.teamNames)
    ? { A: match.teamNames[0] || "Équipe A", B: match.teamNames[1] || "Équipe B" }
    : match.teamNames || { A: "Équipe A", B: "Équipe B" };
  return {
    ...match,
    teamMode: !!match.teamMode,
    teamAssignments: match.teamAssignments || {},
    teamNames,
    winnerTeamId: match.winnerTeamId || null,
    turns: Array.isArray(match.turns) ? match.turns : [],
    settings: { ...defaultSettings, ...(match.settings || {}) },
  };
}

export function normalizeActiveMatch(match) {
  if (!match) return null;
  const normalized = normalizeMatch(match);
  normalized.status = match.status || "live";
  normalized.progress = match.progress || null;
  if (normalized.type === "x01" && !normalized.scoreboard) return null;
  if (normalized.type === "cricket" && !normalized.cricket?.scores) return null;
  return normalized;
}

// ── Group management ─────────────────────────────────────────────────────────

export function setActiveGroup(groupId) {
  if (!app.store.groups[groupId]) return;
  app.store.activeGroupId = groupId;
  app.ui.view = "match";
  app.ui.quickDraft = null;
  app.ui.editingPlayerId = null;
  app.ui.profilePlayerId = null;
  app.ui.historySelectedId = null;
  app.ui.historyPlayerFilter = [];
  if (app.ui.matchDraft) app.ui.matchDraft.selectedPlayers = [];
  app.ui.dartDraft = [];
  app.ui.dartMultiplier = 1;
  saveState();
}

export function createGroup(name) {
  const groupId = uid();
  app.store.groups[groupId] = clone(defaultGroupState);
  app.store.groupList.push({ id: groupId, name: name || "Nouveau groupe" });
  setActiveGroup(groupId);
}

export function renameGroup(groupId, name) {
  const group = app.store.groupList.find((item) => item.id === groupId);
  if (group) { group.name = name || group.name; saveState(); }
}

export function deleteGroup(groupId) {
  if (app.store.groupList.length <= 1) return false;
  app.store.groupList = app.store.groupList.filter((item) => item.id !== groupId);
  delete app.store.groups[groupId];
  if (app.store.activeGroupId === groupId) {
    app.store.activeGroupId = app.store.groupList[0].id;
  }
  saveState();
  return true;
}

// ── Player helpers ───────────────────────────────────────────────────────────

export function getPlayer(id) {
  return app.state?.players?.find((p) => p.id === id);
}

export function getPlayerName(id) {
  return getPlayer(id)?.name || "Joueur supprimé";
}

// ── Theme ────────────────────────────────────────────────────────────────────

export function loadTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

export function applyTheme(theme) {
  document.body.classList.toggle("theme-dark", theme === "dark");
  localStorage.setItem(THEME_KEY, theme);
}

// ── Match helpers ─────────────────────────────────────────────────────────────

export function getMatchTeamId(match, playerId) {
  if (!match.teamMode || !match.teamAssignments) return null;
  return match.teamAssignments[playerId] || null;
}

export function getMatchTeamName(match, teamId) {
  if (!teamId) return null;
  return match.teamNames?.[teamId] || teamId;
}

export function getPlayersByTeam(players, assignments, teamId) {
  return players.filter((id) => assignments[id] === teamId);
}

export function getMatchSideIds(match) {
  if (match.teamMode) {
    const teams = new Set(Object.values(match.teamAssignments || {}));
    return Array.from(teams);
  }
  return match.players || [];
}

export function getMatchTeams(match) {
  if (!match.teamMode) return [];
  const teams = {};
  Object.entries(match.teamAssignments || {}).forEach(([playerId, teamId]) => {
    if (!teams[teamId]) teams[teamId] = { id: teamId, name: match.teamNames?.[teamId] || teamId, players: [] };
    teams[teamId].players.push(playerId);
  });
  return Object.values(teams);
}

export function getMatchWinnerLabel(match) {
  if (!match.winnerIds?.length) return null;
  if (match.teamMode && match.winnerTeamId) {
    return getMatchTeamName(match, match.winnerTeamId);
  }
  return match.winnerIds.map((id) => getPlayerName(id)).join(", ");
}

export function getMatchSideSummaries(match) {
  if (match.teamMode) {
    return getMatchTeams(match).map((team) => ({
      id: team.id,
      label: team.name,
      players: team.players,
    }));
  }
  return match.players.map((id) => ({ id, label: getPlayerName(id), players: [id] }));
}

export function formatMatchParticipants(match) {
  if (!match) return "";
  if (match.teamMode) {
    const a = match.teamNames?.A || "Équipe A";
    const b = match.teamNames?.B || "Équipe B";
    return `${a} vs ${b}`;
  }
  return match.players.map((id) => getPlayerName(id)).join(" vs ");
}

export function getRankingWeights() {
  return { ...defaultSettings.rankingWeights, ...(app.state?.settings?.rankingWeights || {}) };
}

export function getAvailableTags() {
  if (!app.state?.matches) return [];
  const tags = new Set(app.state.matches.map((m) => m.tag).filter(Boolean));
  return Array.from(tags).sort();
}

export function getLastSetup() {
  return app.state?.lastSetup || null;
}

export function saveLastSetup(setup) {
  if (app.state) app.state.lastSetup = setup;
}

export function getMatchSettings(overrides) {
  return {
    doubleIn: overrides?.doubleIn ?? app.state?.settings?.doubleIn ?? false,
    doubleOut: overrides?.doubleOut ?? app.state?.settings?.doubleOut ?? true,
    bust: overrides?.bust ?? app.state?.settings?.bust ?? true,
    legsToWin: Math.max(1, Number(overrides?.legsToWin ?? app.state?.settings?.legsToWin ?? 1)),
    setsToWin: Math.max(1, Number(overrides?.setsToWin ?? app.state?.settings?.setsToWin ?? 1)),
  };
}

export function sanitizePlayerIds(playerIds) {
  const valid = new Set((app.state?.players || []).map((p) => p.id));
  return (playerIds || []).filter((id) => valid.has(id));
}

export function getMatchesFiltered(range, tagFilter) {
  let matches = app.state?.matches || [];
  if (tagFilter && tagFilter !== "all") {
    matches = matches.filter((m) => m.tag === tagFilter);
  }
  if (!range || range === "all") return matches;
  const now = Date.now();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : null;
  if (!days) return matches;
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return matches.filter((m) => new Date(m.date).getTime() >= cutoff);
}

export function ensureMatchDraft() {
  if (!app.ui.matchDraft) {
    app.ui.matchDraft = {
      type: "solo",
      teamNames: ["Équipe A", "Équipe B"],
      teamAssignments: {},
      selectedPlayers: [],
    };
  }
  if (!Array.isArray(app.ui.matchDraft.teamNames) || app.ui.matchDraft.teamNames.length < 2) {
    app.ui.matchDraft.teamNames = ["Équipe A", "Équipe B"];
  }
}
