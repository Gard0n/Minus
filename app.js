import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const STORAGE_KEY = "minus_darts_v1";
const THEME_KEY = "minus_theme";
const SUPABASE_URL = "https://qhpwwjogxawnxbvjsddt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFocHd3am9neGF3bnhidmpzZGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTQ1OTIsImV4cCI6MjA4OTY5MDU5Mn0.jK_9ari6-WkA8yc3hXTyLmLUWIxGHlaNyFUIOl6viPU";

const cricketNumbers = [
  { key: "20", label: "20", value: 20 },
  { key: "19", label: "19", value: 19 },
  { key: "18", label: "18", value: 18 },
  { key: "17", label: "17", value: 17 },
  { key: "16", label: "16", value: 16 },
  { key: "15", label: "15", value: 15 },
  { key: "bull", label: "Bull", value: 25 },
];

const dartValues = [
  20, 19, 18, 17, 16, 15, 14, 13, 12, 11,
  10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
  25, 0,
];

const defaultSettings = {
  defaultMode: "501",
  scoringMode: "live",
  doubleIn: false,
  doubleOut: true,
  bust: true,
  legsToWin: 1,
  setsToWin: 1,
  rankingWeights: {
    wins: 1,
    winrate: 1,
    avgTurn: 1,
    avgDart: 1,
  },
};

const defaultGroupState = {
  players: [],
  matches: [],
  settings: defaultSettings,
  activeMatch: null,
  lastSetup: null,
  lastSummaryId: null,
  cloudGroupId: null,
};

// Checkout suggestions (double-out)
const CHECKOUT_TABLE = {
  170:"T20 T20 Bull", 167:"T20 T19 Bull", 164:"T20 T18 Bull",
  161:"T20 T17 Bull", 160:"T20 T20 D20", 158:"T20 T20 D19",
  157:"T20 T19 D20",  156:"T20 T20 D18", 155:"T20 T19 D19",
  154:"T20 T18 D20",  153:"T20 T19 D18", 152:"T20 T20 D16",
  151:"T20 T17 D20",  150:"T20 T18 D18", 149:"T20 T19 D16",
  148:"T20 T20 D14",  147:"T20 T17 D18", 146:"T20 T18 D16",
  145:"T20 T15 D20",  144:"T20 T20 D12", 143:"T20 T17 D16",
  142:"T20 T14 D20",  141:"T20 T19 D12", 140:"T20 T20 D10",
  139:"T20 T13 D20",  138:"T20 T18 D12", 137:"T20 T15 D16",
  136:"T20 T20 D8",   135:"T20 T15 D15", 134:"T20 T14 D16",
  133:"T20 T19 D8",   132:"T20 T16 D12", 131:"T20 T13 D16",
  130:"T20 T20 D5",   129:"T19 T16 D12", 128:"T20 T16 D10",
  127:"T20 T17 D8",   126:"T19 T19 D6",  125:"T20 T15 D10",
  124:"T20 T16 D8",   123:"T19 T16 D9",  122:"T18 T18 D7",
  121:"T20 T11 D14",  120:"T20 20 D20",  119:"T19 12 D20",
  118:"T20 18 D20",   117:"T20 17 D20",  116:"T20 16 D20",
  115:"T20 15 D20",   114:"T20 14 D20",  113:"T20 13 D20",
  112:"T20 12 D20",   111:"T20 11 D20",  110:"T20 D25",
  109:"T19 12 D20",   108:"T20 16 D16",  107:"T19 10 D20",
  106:"T20 14 D16",   105:"T20 13 D16",  104:"T18 18 D16",
  103:"T19 10 D18",   102:"T20 10 D16",  101:"T17 18 D16",
  100:"T20 D20",       99:"T19 10 D16",   98:"T20 D19",
   97:"T19 D20",       96:"T20 D18",      95:"T19 D19",
   94:"T18 D20",       93:"T19 D18",      92:"T20 D16",
   91:"T17 D20",       90:"T18 D18",      89:"T19 D16",
   88:"T20 D14",       87:"T17 D18",      86:"T18 D16",
   85:"T15 D20",       84:"T20 D12",      83:"T17 D16",
   82:"T14 D20",       81:"T19 D12",      80:"T20 D10",
   79:"T13 D20",       78:"T18 D12",      77:"T15 D16",
   76:"T20 D8",        75:"T15 D15",      74:"T14 D16",
   73:"T19 D8",        72:"T16 D12",      71:"T13 D16",
   70:"T10 D20",       69:"T19 D6",       68:"T20 D4",
   67:"T9 D20",        66:"T10 D18",      65:"T11 D16",
   64:"T16 D8",        63:"T13 D12",      62:"T10 D16",
   61:"T15 D8",        60:"20 D20",       59:"19 D20",
   58:"18 D20",        57:"17 D20",       56:"16 D20",
   55:"15 D20",        54:"14 D20",       53:"13 D20",
   52:"12 D20",        51:"11 D20",       50:"D25",
   49:"9 D20",         48:"16 D16",       47:"15 D16",
   46:"6 D20",         45:"13 D16",       44:"4 D20",
   43:"3 D20",         42:"10 D16",       41:"9 D16",
   40:"D20",           38:"D19",          36:"D18",
   34:"D17",           32:"D16",          30:"D15",
   28:"D14",           26:"D13",          24:"D12",
   22:"D11",           20:"D10",          18:"D9",
   16:"D8",            14:"D7",           12:"D6",
   10:"D5",             8:"D4",            6:"D3",
    4:"D2",             2:"D1",
};

function getCheckoutSuggestion(score, doubleOut) {
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


let store = loadStore();
let state = store.groups[store.activeGroupId];
let currentTheme = loadTheme();
let supabase = null;
let realtimeChannel = null;
const cloud = {
  session: null,
  groups: [],
  loading: false,
  error: null,
};

const ui = {
  view: "home",
  quickDraft: null,
  editingPlayerId: null,
  rankingRange: "all",
  rankingMode: "players",
  cricketTurn: {},
  matchDraft: {
    type: "solo",
    teamNames: ["Équipe A", "Équipe B"],
    teamAssignments: {},
    selectedPlayers: [],
  },
  dartDraft: [],
  dartMultiplier: 1,
  historyRange: "all",
  historySelectedId: null,
  historyPlayerFilter: [],
  tagFilter: "all",
  historyTagFilter: "all",
  profilePlayerId: null,
};

applyTheme(currentTheme);
init();

function init() {
  bindEvents();
  registerServiceWorker();
  initSupabase();
  render();
}

function bindEvents() {
  document.addEventListener("click", handleClick);
  document.addEventListener("submit", handleSubmit);
  document.addEventListener("change", handleChange);
  document.addEventListener("fullscreenchange", () => {
    if (ui.view === "board") render();
  });
}

async function handleClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;

  if (action === "nav") {
    ui.view = target.dataset.view;
    render();
    return;
  }

  if (action === "export") {
    exportData();
    return;
  }

  if (action === "toggle-theme") {
    toggleTheme();
    return;
  }

  if (action === "quick-start") {
    const preset = target.dataset.preset;
    if (preset) startQuickPreset(preset);
    return;
  }

  if (action === "dismiss-overlay") {
    const overlay = document.getElementById("flash-overlay");
    if (overlay) overlay.classList.add("hidden");
    clearTimeout(showFlashOverlay._timer);
    return;
  }

  if (action === "dismiss-summary") {
    state.lastSummaryId = null;
    saveState();
    render();
    return;
  }

  if (action === "replay-match") {
    const matchId = target.dataset.id;
    if (matchId) replayMatch(matchId);
    return;
  }

  if (action === "apply-template") {
    const template = target.dataset.template;
    if (template) applyTemplate(template);
    return;
  }

  if (action === "toggle-fullscreen") {
    toggleFullscreen();
    return;
  }

  if (action === "export-all") {
    exportAllData();
    return;
  }

  if (action === "export-players-csv") {
    exportPlayersCSV();
    return;
  }

  if (action === "export-teams-csv") {
    exportTeamsCSV();
    return;
  }

  if (action === "gist-push") {
    pushToGist();
    return;
  }

  if (action === "gist-pull") {
    pullFromGist();
    return;
  }

  if (action === "cloud-refresh") {
    await loadCloudGroups();
    return;
  }

  if (action === "cloud-push") {
    await cloudPush();
    return;
  }

  if (action === "cloud-pull") {
    await cloudPull();
    return;
  }

  if (action === "supabase-logout") {
    await cloudSignOut();
    return;
  }

  if (action === "cloud-copy-code") {
    const code = target.dataset.code;
    copyInviteCode(code);
    return;
  }

  if (action === "run-diagnostics") {
    runDiagnostics();
    return;
  }

  if (action === "switch-group") {
    const groupId = target.dataset.id;
    if (groupId) {
      setActiveGroup(groupId);
      render();
      showToast("Groupe activé");
    }
    return;
  }

  if (action === "rename-group") {
    const groupId = target.dataset.id;
    const group = store.groupList.find((item) => item.id === groupId);
    if (!group) return;
    const name = prompt("Nouveau nom du groupe", group.name || "");
    if (name && name.trim()) {
      renameGroup(groupId, name.trim());
      render();
      showToast("Groupe renommé");
    }
    return;
  }

  if (action === "delete-group") {
    const groupId = target.dataset.id;
    const group = store.groupList.find((item) => item.id === groupId);
    if (!group) return;
    if (confirm(`Supprimer le groupe "${group.name}" ?`)) {
      deleteGroup(groupId);
      render();
      showToast("Groupe supprimé");
    }
    return;
  }

  if (action === "edit-player") {
    ui.editingPlayerId = target.dataset.id;
    ui.view = "players";
    render();
    return;
  }

  if (action === "view-player") {
    ui.profilePlayerId = target.dataset.id;
    ui.view = "profile";
    render();
    return;
  }

  if (action === "delete-player") {
    const playerId = target.dataset.id;
    const player = getPlayer(playerId);
    if (!player) return;
    if (confirm(`Supprimer ${player.name} ? Les parties existantes resteront.`)) {
      state.players = state.players.filter((p) => p.id !== playerId);
      saveState();
      if (ui.editingPlayerId === playerId) {
        ui.editingPlayerId = null;
      }
      render();
      showToast("Joueur supprimé");
    }
    return;
  }

  if (action === "clear-player-form") {
    ui.editingPlayerId = null;
    render();
    return;
  }

  if (action === "undo-turn") {
    undoLastTurn();
    return;
  }

  if (action === "cancel-match") {
    const match = state.activeMatch;
    const label = match
      ? `${match.mode.toUpperCase()} · ${formatMatchParticipants(match)}`
      : "partie en cours";
    if (confirm(`Annuler ${label} ?`)) {
      state.activeMatch = null;
      saveState();
      ui.dartDraft = [];
      ui.dartMultiplier = 1;
      render();
      showToast("Partie annulée");
    }
    return;
  }

  if (action === "toggle-pause") {
    if (!state.activeMatch) return;
    state.activeMatch.status = state.activeMatch.status === "paused" ? "live" : "paused";
    saveState();
    render();
    showToast(state.activeMatch.status === "paused" ? "Partie en pause" : "Partie reprise");
    return;
  }

  if (action === "quick-cancel") {
    ui.quickDraft = null;
    render();
    return;
  }

  if (action === "cricket-add") {
    const num = target.dataset.num;
    const count = Number(target.dataset.count || 1);
    ui.cricketTurn[num] = (ui.cricketTurn[num] || 0) + count;
    render();
    return;
  }

  if (action === "cricket-clear") {
    ui.cricketTurn = {};
    render();
    return;
  }

  if (action === "dart-multiplier") {
    const mult = Number(target.dataset.multiplier || 1);
    ui.dartMultiplier = ui.dartMultiplier === mult ? 1 : mult;
    render();
    return;
  }

  if (action === "dart-add") {
    const base = Number(target.dataset.value);
    addDart(base);
    return;
  }

  if (action === "dart-undo") {
    ui.dartDraft.pop();
    render();
    return;
  }

  if (action === "dart-clear") {
    ui.dartDraft = [];
    ui.dartMultiplier = 1;
    render();
    return;
  }

  if (action === "submit-darts") {
    submitX01TurnFromDarts();
    return;
  }

  if (action === "submit-cricket-darts") {
    submitCricketTurnFromDarts();
    return;
  }

  if (action === "select-match") {
    ui.historySelectedId = target.dataset.id || null;
    ui.view = "history";
    render();
    return;
  }

  if (action === "delete-match") {
    const matchId = target.dataset.id;
    if (!matchId) return;
    if (confirm("Supprimer cette partie ?")) {
      state.matches = state.matches.filter((match) => match.id !== matchId);
      if (ui.historySelectedId === matchId) ui.historySelectedId = null;
      saveState();
      render();
      showToast("Partie supprimée");
    }
    return;
  }

  if (action === "reset-data") {
    const groupName = store.groupList.find((group) => group.id === store.activeGroupId)?.name || "groupe actif";
    if (confirm(`Réinitialiser les données de "${groupName}" ?`)) {
      state = clone(defaultGroupState);
      saveState();
      ui.quickDraft = null;
      ui.editingPlayerId = null;
      ui.profilePlayerId = null;
      ui.view = "home";
      render();
      showToast("Données réinitialisées");
    }
    return;
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const formType = form.dataset.form;

  if (formType === "player") {
    const name = form.playerName.value.trim();
    const team = form.playerTeam.value.trim();
    if (!name) {
      showToast("Nom obligatoire");
      return;
    }
    if (ui.editingPlayerId) {
      const player = getPlayer(ui.editingPlayerId);
      if (player) {
        player.name = name;
        player.team = team;
        saveState();
        showToast("Joueur mis à jour");
      }
      ui.editingPlayerId = null;
    } else {
      const newPlayer = {
        id: uid(),
        name,
        team,
        createdAt: new Date().toISOString(),
      };
      state.players.push(newPlayer);
      saveState();
      showToast("Joueur ajouté");
    }
    form.reset();
    render();
    return;
  }

  if (formType === "match-setup") {
    const mode = form.matchMode.value;
    const scoringMode = form.scoringMode.value;
    const matchType = form.matchType?.value || "solo";
    const teamMode = matchType === "teams";
    const randomStart = form.randomStart.checked;
    const selectedPlayers = Array.from(form.querySelectorAll("input[name='matchPlayers']:checked")).map(
      (input) => input.value
    );

    if (selectedPlayers.length < 2) {
      showToast("Choisis au moins 2 joueurs");
      return;
    }

    const settings = {
      doubleIn: form.doubleIn.checked,
      doubleOut: form.doubleOut.checked,
      bust: form.bust.checked,
      legsToWin: Math.max(1, Number(form.legsToWin?.value) || 1),
      setsToWin: Math.max(1, Number(form.setsToWin?.value) || 1),
    };

    state.settings.legsToWin = settings.legsToWin;
    state.settings.setsToWin = settings.setsToWin;
    saveState();

    const teamNames = {
      A: (form.teamNameA?.value || "Équipe A").trim() || "Équipe A",
      B: (form.teamNameB?.value || "Équipe B").trim() || "Équipe B",
    };

    const matchTag = (form.matchTag?.value || "").trim();

    const teamAssignments = {};
    if (teamMode) {
      selectedPlayers.forEach((playerId, index) => {
        const select = form.querySelector(`select[name='team-${playerId}']`);
        const assigned = select?.value || (index % 2 === 0 ? "A" : "B");
        teamAssignments[playerId] = assigned;
      });
    }

    if (teamMode) {
      const uniqueTeams = new Set(Object.values(teamAssignments));
      if (uniqueTeams.size < 2) {
        showToast("Attribue au moins un joueur par équipe");
        return;
      }
    }

    let players = selectedPlayers;
    if (!teamMode && randomStart) {
      players = shuffle([...selectedPlayers]);
    }
    if (teamMode) {
      players = buildTeamTurnOrder(selectedPlayers, teamAssignments, randomStart);
    }

    if (scoringMode === "live") {
      startLiveMatch({ mode, players, settings, teamMode, teamAssignments, teamNames, tag: matchTag });
    } else {
      ui.quickDraft = {
        mode,
        players,
        settings,
        scoringMode,
        teamMode,
        teamAssignments,
        teamNames,
        tag: matchTag,
      };
      ui.view = "match";
      render();
    }
    return;
  }

  if (formType === "quick") {
    if (!ui.quickDraft) return;
    const winnerValue = form.winner?.value || "";
    if (!winnerValue) {
      showToast("Sélectionne un vainqueur");
      return;
    }
    const scores = {};
    ui.quickDraft.players.forEach((playerId) => {
      const input = form.querySelector(`input[name='score-${playerId}']`);
      if (input && input.value !== "") {
        scores[playerId] = Number(input.value);
      }
    });

    const winnerIds = ui.quickDraft.teamMode
      ? getPlayersByTeam(ui.quickDraft.players, ui.quickDraft.teamAssignments, winnerValue)
      : [winnerValue];

    const matchRecord = {
      id: uid(),
      date: new Date().toISOString(),
      type: ui.quickDraft.mode === "cricket" ? "cricket" : "x01",
      mode: ui.quickDraft.mode,
      scoringMode: "quick",
      tag: ui.quickDraft.tag || "",
      players: ui.quickDraft.players,
      settings: ui.quickDraft.settings,
      teamMode: ui.quickDraft.teamMode,
      teamAssignments: ui.quickDraft.teamAssignments,
      teamNames: ui.quickDraft.teamNames,
      winnerTeamId: ui.quickDraft.teamMode ? winnerValue : null,
      winnerIds,
      finalScores: ui.quickDraft.mode === "cricket" ? null : scores,
      finalPoints: ui.quickDraft.mode === "cricket" ? scores : null,
    };

    saveLastSetup({
      mode: ui.quickDraft.mode,
      players: ui.quickDraft.players,
      settings: ui.quickDraft.settings,
      teamMode: ui.quickDraft.teamMode,
      teamAssignments: ui.quickDraft.teamAssignments,
      teamNames: ui.quickDraft.teamNames,
      scoringMode: "quick",
      tag: ui.quickDraft.tag || "",
    });

    state.matches.push(matchRecord);
    saveState();
    ui.quickDraft = null;
    render();
    showToast("Partie enregistrée");
    return;
  }

  if (formType === "x01-turn") {
    submitX01TurnFromDarts();
    return;
  }

  if (formType === "cricket-turn") {
    submitCricketTurnFromDarts();
    return;
  }

  if (formType === "match-edit") {
    const matchId = form.dataset.id;
    const match = state.matches.find((item) => item.id === matchId);
    if (!match) return;

    const winnerValue = form.winner?.value || "";
    if (match.teamMode) {
      match.winnerTeamId = winnerValue || null;
      match.winnerIds = winnerValue
        ? getPlayersByTeam(match.players, match.teamAssignments, winnerValue)
        : [];
    } else {
      match.winnerTeamId = null;
      match.winnerIds = winnerValue ? [winnerValue] : [];
    }

    if (match.scoringMode === "quick") {
      const scores = {};
      match.players.forEach((playerId) => {
        const input = form.querySelector(`input[name='score-${playerId}']`);
        if (input && input.value !== "") {
          scores[playerId] = Number(input.value);
        }
      });
      if (match.type === "cricket") {
        match.finalPoints = scores;
      } else {
        match.finalScores = scores;
      }
    }

    saveState();
    render();
    showToast("Partie mise à jour");
    return;
  }

  if (formType === "supabase-login") {
    const email = form.email?.value?.trim();
    if (!email) {
      showToast("Email requis");
      return;
    }
    await cloudSignIn(email);
    return;
  }

  if (formType === "cloud-create") {
    const name = form.cloudName?.value?.trim();
    if (!name) {
      showToast("Nom requis");
      return;
    }
    await cloudCreateGroup(name);
    form.reset();
    return;
  }

  if (formType === "cloud-join") {
    const code = form.inviteCode?.value?.trim();
    if (!code) {
      showToast("Code requis");
      return;
    }
    await cloudJoinGroup(code);
    form.reset();
    return;
  }

  if (formType === "group-create") {
    const name = form.groupName?.value?.trim();
    if (!name) {
      showToast("Nom de groupe requis");
      return;
    }
    createGroup(name);
    form.reset();
    render();
    showToast("Groupe créé");
  }
}

function handleChange(event) {
  const target = event.target;

  if (target.dataset.setting) {
    const key = target.dataset.setting;
    if (key === "gistToken" || key === "gistId") {
      if (!store.gist) store.gist = { token: "", gistId: "" };
      if (key === "gistToken") {
        store.gist.token = target.value.trim();
      } else {
        store.gist.gistId = target.value.trim();
      }
      saveState();
      return;
    }

    const rankKeyMap = {
      rankWins: "wins",
      rankWinrate: "winrate",
      rankAvgTurn: "avgTurn",
      rankAvgDart: "avgDart",
    };

    if (rankKeyMap[key]) {
      const weightValue = Math.max(0, Number(target.value) || 0);
      const current = getRankingWeights();
      const updated = { ...current, [rankKeyMap[key]]: weightValue };
      state.settings = { ...state.settings, rankingWeights: updated };
      saveState();
      render();
      return;
    }

    let value;
    if (target.type === "checkbox") {
      value = target.checked;
    } else if (target.type === "number") {
      value = Number(target.value);
    } else {
      value = target.value;
    }
    if (key === "legsToWin" || key === "setsToWin") {
      value = Math.max(1, Number(value) || 1);
    }
    state.settings = { ...state.settings, [key]: value };
    saveState();
    render();
    return;
  }

  if (target.dataset.change === "ranking-range") {
    ui.rankingRange = target.value;
    render();
    return;
  }

  if (target.dataset.change === "ranking-mode") {
    ui.rankingMode = target.value;
    render();
    return;
  }

  if (target.dataset.change === "tag-filter") {
    ui.tagFilter = target.value;
    render();
    return;
  }

  if (target.dataset.change === "history-tag") {
    ui.historyTagFilter = target.value;
    render();
    return;
  }

  if (target.dataset.change === "match-type") {
    ui.matchDraft.type = target.value;
    ensureMatchDraft();
    render();
    return;
  }

  if (target.dataset.change === "team-name") {
    const index = Number(target.dataset.index);
    if (Number.isFinite(index)) {
      ui.matchDraft.teamNames[index] = target.value;
    }
    return;
  }

  if (target.dataset.change === "team-assign") {
    const playerId = target.dataset.playerId;
    if (playerId) {
      ui.matchDraft.teamAssignments[playerId] = target.value;
    }
    return;
  }

  if (target.dataset.change === "history-range") {
    ui.historyRange = target.value;
    render();
    return;
  }

  if (target.name === "historyPlayers") {
    const selected = new Set(ui.historyPlayerFilter || []);
    if (target.checked) {
      selected.add(target.value);
    } else {
      selected.delete(target.value);
    }
    ui.historyPlayerFilter = Array.from(selected);
    render();
    return;
  }

  if (target.name === "matchPlayers") {
    const playerId = target.value;
    const selected = new Set(ui.matchDraft.selectedPlayers || []);
    if (target.checked) {
      selected.add(playerId);
    } else {
      selected.delete(playerId);
    }
    ui.matchDraft.selectedPlayers = Array.from(selected);
    return;
  }

  if (target.dataset.change === "group-select") {
    setActiveGroup(target.value);
    render();
    return;
  }

  if (target.dataset.change === "cloud-group-select") {
    state.cloudGroupId = target.value || null;
    saveState();
    subscribeRealtime();
    render();
    return;
  }

  if (target.dataset.action === "import-file" && target.files?.length) {
    importData(target.files[0]);
    target.value = "";
  }

  if (target.dataset.action === "import-players" && target.files?.length) {
    importPlayersCSV(target.files[0]);
    target.value = "";
  }
}

function render() {
  renderNav();
  renderGroupSwitcher();
  renderHome();
  renderPlayers();
  renderMatch();
  renderBoard();
  renderStats();
  renderHistory();
  renderProfile();
  renderSettings();
  showView(ui.view);
  document.body.classList.toggle("board-view", ui.view === "board");
  updateFooter();
}

function renderNav() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === ui.view);
  });
}

function renderGroupSwitcher() {
  const container = document.getElementById("group-switcher");
  if (!container) return;
  const options = store.groupList
    .map(
      (group) =>
        `<option value="${group.id}" ${group.id === store.activeGroupId ? "selected" : ""}>${escapeHtml(group.name)}</option>`
    )
    .join("");
  container.innerHTML = `
    <select class="group-select" data-change="group-select">
      ${options}
    </select>
  `;
}

function showView(view) {
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("active", section.id === `view-${view}`);
  });
}

function renderHome() {
  const view = document.getElementById("view-home");
  const matchCount = state.matches.length;
  const playerCount = state.players.length;
  const activeMatch = state.activeMatch;
  const recentMatches = [...state.matches]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const ranking = getPlayerRanking(ui.rankingRange).slice(0, 5);
  const rangeLabel = getRangeLabel(ui.rankingRange);
  const quickCard = renderQuickStartCard();

  view.innerHTML = `
    <div class="grid two">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Raccourcis</h3>
          ${activeMatch ? `<span class="badge">Partie en cours</span>` : ""}
        </div>
        <p class="subtle">Lance une partie ou ajoute des joueurs en deux clics.</p>
        <div class="inline-actions">
          <button class="btn" data-action="nav" data-view="match">Lancer une partie</button>
          <button class="btn ghost" data-action="nav" data-view="players">Ajouter des joueurs</button>
        </div>
        ${activeMatch ? `<div class="notice" style="margin-top:12px;">Une partie est en cours, tu peux la reprendre.</div>` : ""}
      </div>
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Vue d'ensemble</h3>
        </div>
        <div class="grid three">
          <div>
            <div class="stats-number">${playerCount}</div>
            <div class="stats-label">Joueurs</div>
          </div>
          <div>
            <div class="stats-number">${matchCount}</div>
            <div class="stats-label">Parties</div>
          </div>
          <div>
            <div class="stats-number">${activeMatch ? "1" : "0"}</div>
            <div class="stats-label">En cours</div>
          </div>
        </div>
      </div>
    </div>

    ${quickCard}

    <div class="grid two" style="margin-top:18px;">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Classement express</h3>
          <select data-change="ranking-range">
            ${renderRangeOptions(ui.rankingRange)}
          </select>
        </div>
        ${ranking.length ? renderRankingTable(ranking, { compact: true }) : `<p class="subtle">Aucune donnée pour l'instant.</p>`}
      </div>
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Dernières parties</h3>
          <span class="subtle">${rangeLabel}</span>
        </div>
        ${recentMatches.length ? renderRecentMatches(recentMatches) : `<p class="subtle">Aucune partie enregistrée.</p>`}
      </div>
    </div>
  `;
}

function renderPlayers() {
  const view = document.getElementById("view-players");
  const editingPlayer = ui.editingPlayerId ? getPlayer(ui.editingPlayerId) : null;
  const statsMap = computePlayerStats(state.matches);

  const rows = state.players
    .map((player) => {
      const stats = statsMap[player.id] || {};
      return `
        <tr>
          <td>
            <strong>${escapeHtml(player.name)}</strong>
            ${player.team ? `<div class="small-muted">${escapeHtml(player.team)}</div>` : ""}
          </td>
          <td>${stats.matches || 0}</td>
          <td>${stats.wins || 0}</td>
          <td>${formatPercent(stats.winrate)}</td>
          <td>${formatNumber(stats.avgTurn, 1)}</td>
          <td>${stats.count180 || 0}</td>
          <td>${stats.bestCheckout || "—"}</td>
          <td>
            <div class="inline-actions">
              <button class="btn small ghost" data-action="view-player" data-id="${player.id}">Profil</button>
              <button class="btn small ghost" data-action="edit-player" data-id="${player.id}">Modifier</button>
              <button class="btn small danger" data-action="delete-player" data-id="${player.id}">Supprimer</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  view.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">${editingPlayer ? "Modifier un joueur" : "Ajouter un joueur"}</h3>
      </div>
      <form data-form="player">
        <div class="form-row">
          <div>
            <label>Nom</label>
            <input type="text" name="playerName" value="${editingPlayer ? escapeHtml(editingPlayer.name) : ""}" required />
          </div>
          <div>
            <label>Équipe (optionnel)</label>
            <input type="text" name="playerTeam" value="${editingPlayer ? escapeHtml(editingPlayer.team || "") : ""}" />
          </div>
        </div>
        <div class="inline-actions" style="margin-top:12px;">
          <button class="btn">${editingPlayer ? "Enregistrer" : "Ajouter"}</button>
          ${editingPlayer ? `<button type="button" class="btn ghost" data-action="clear-player-form">Annuler</button>` : ""}
        </div>
      </form>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Liste des joueurs</h3>
        <span class="subtle">${state.players.length} joueur(s)</span>
      </div>
      ${state.players.length ? `
        <table class="table">
          <thead>
            <tr>
              <th>Joueur</th>
              <th>Matchs</th>
              <th>Victoires</th>
              <th>Winrate</th>
              <th>Moy./tour</th>
              <th>180</th>
              <th>Checkout</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      ` : `<p class="subtle">Ajoute ton premier joueur pour démarrer.</p>`}
    </div>
  `;
}

function renderQuickStartCard() {
  const hasPlayers = state.players.length >= 2;
  const hasFour = state.players.length >= 4;
  const lastSetup = getLastSetup();
  const lastLabel = lastSetup
    ? `${lastSetup.mode.toUpperCase()} · ${formatPlayersList(lastSetup.players)}`
    : "Aucune partie récente";

  return `
    <div class="card" style="margin-top:18px;">
      <div class="card-header">
        <h3 class="card-title">Lancer en 1 clic</h3>
        <span class="subtle">${escapeHtml(lastLabel)}</span>
      </div>
      <div class="inline-actions">
        <button class="btn" data-action="quick-start" data-preset="last" ${lastSetup ? "" : "disabled"}>Rejouer</button>
        <button class="btn ghost" data-action="quick-start" data-preset="duel-501" ${hasPlayers ? "" : "disabled"}>Duel 501</button>
        <button class="btn ghost" data-action="quick-start" data-preset="duel-301" ${hasPlayers ? "" : "disabled"}>Duel 301</button>
        <button class="btn ghost" data-action="quick-start" data-preset="cricket" ${hasPlayers ? "" : "disabled"}>Cricket</button>
        <button class="btn ghost" data-action="quick-start" data-preset="teams-2v2" ${hasFour ? "" : "disabled"}>Équipes 2v2</button>
      </div>
      ${hasPlayers ? `<p class="small-muted" style="margin-top:10px;">Les presets utilisent les derniers joueurs ou les 2/4 premiers de la liste.</p>` : `<p class="subtle" style="margin-top:10px;">Ajoute au moins 2 joueurs pour démarrer.</p>`}
    </div>
  `;
}

function renderMatch() {
  const view = document.getElementById("view-match");

  if (state.activeMatch) {
    view.innerHTML = renderActiveMatch();
    return;
  }

  const hasPlayers = state.players.length >= 2;
  ensureMatchDraft();
  const teamMode = ui.matchDraft.type === "teams";
  const teamNameA = ui.matchDraft.teamNames[0] || "Équipe A";
  const teamNameB = ui.matchDraft.teamNames[1] || "Équipe B";
  const selectedPlayers = ui.matchDraft.selectedPlayers || [];
  const defaultLegs = state.settings.legsToWin || 1;
  const defaultSets = state.settings.setsToWin || 1;

  const summaryCard = renderMatchSummaryCard();

  view.innerHTML = `
    ${summaryCard}
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Nouvelle partie</h3>
      </div>
      ${hasPlayers ? "" : `<div class="notice">Ajoute au moins 2 joueurs pour démarrer une partie.</div>`}
      <form data-form="match-setup" style="margin-top:12px;">
        <div class="form-row">
          <div>
            <label>Mode</label>
            <select name="matchMode">
              ${renderModeOptions(state.settings.defaultMode)}
            </select>
          </div>
          <div>
            <label>Type de match</label>
            <select name="matchType" data-change="match-type">
              <option value="solo" ${!teamMode ? "selected" : ""}>Tous ensemble</option>
              <option value="teams" ${teamMode ? "selected" : ""}>Par équipes</option>
            </select>
          </div>
          <div>
            <label>Saisie</label>
            <select name="scoringMode">
              ${renderScoringOptions(state.settings.scoringMode)}
            </select>
          </div>
          <div>
            <label>Départ aléatoire</label>
            <div class="player-pill">
              <input type="checkbox" name="randomStart" />
              <span>Oui</span>
            </div>
          </div>
        </div>
        ${teamMode ? `
          <div class="form-row" style="margin-top:12px;">
            <div>
              <label>Nom équipe A</label>
              <input type="text" name="teamNameA" value="${escapeHtml(teamNameA)}" data-change="team-name" data-index="0" />
            </div>
            <div>
              <label>Nom équipe B</label>
              <input type="text" name="teamNameB" value="${escapeHtml(teamNameB)}" data-change="team-name" data-index="1" />
            </div>
          </div>
        ` : ""}
        <div style="margin-top:12px;">
          <label>Templates</label>
          <div class="inline-actions">
            <button type="button" class="btn small ghost" data-action="apply-template" data-template="duel">Duel 2 joueurs</button>
            <button type="button" class="btn small ghost" data-action="apply-template" data-template="four">4 joueurs</button>
            <button type="button" class="btn small ghost" data-action="apply-template" data-template="teams2v2">Équipes 2v2</button>
            <button type="button" class="btn small ghost" data-action="apply-template" data-template="all">Tout le monde</button>
          </div>
        </div>
        <div style="margin-top:12px;">
          <label>Joueurs</label>
          <div class="pill-list">
            ${state.players
              .map((player) => {
                const assigned = ui.matchDraft.teamAssignments[player.id] || "A";
                const isSelected = selectedPlayers.includes(player.id);
                return `
                  <div class="player-row">
                    <label class="player-pill">
                      <input type="checkbox" name="matchPlayers" value="${player.id}" ${isSelected ? "checked" : ""} />
                      <span>${escapeHtml(player.name)}</span>
                      ${player.team ? `<span class="small-muted">${escapeHtml(player.team)}</span>` : ""}
                    </label>
                    ${teamMode ? `
                      <select class="team-select" name="team-${player.id}" data-change="team-assign" data-player-id="${player.id}">
                        <option value="A" ${assigned === "A" ? "selected" : ""}>${escapeHtml(teamNameA)}</option>
                        <option value="B" ${assigned === "B" ? "selected" : ""}>${escapeHtml(teamNameB)}</option>
                      </select>
                    ` : ""}
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>
        <div style="margin-top:12px;">
          <label>Règles 301/501</label>
          <div class="pill-list">
            <label class="player-pill">
              <input type="checkbox" name="doubleIn" ${state.settings.doubleIn ? "checked" : ""} />
              <span>Double-in</span>
            </label>
            <label class="player-pill">
              <input type="checkbox" name="doubleOut" ${state.settings.doubleOut ? "checked" : ""} />
              <span>Double-out</span>
            </label>
            <label class="player-pill">
              <input type="checkbox" name="bust" ${state.settings.bust ? "checked" : ""} />
              <span>Bust</span>
            </label>
          </div>
        </div>
        <div class="form-row" style="margin-top:12px;">
          <div>
            <label>Événement (tag)</label>
            <input type="text" name="matchTag" list="tag-list" placeholder="Hebdo, Mensuel" />
            <datalist id="tag-list">
              ${getAvailableTags().map((tag) => `<option value="${escapeHtml(tag)}"></option>`).join("")}
            </datalist>
          </div>
          <div>
            <label>Legs pour gagner</label>
            <input type="number" name="legsToWin" min="1" value="${defaultLegs}" />
          </div>
          <div>
            <label>Sets pour gagner</label>
            <input type="number" name="setsToWin" min="1" value="${defaultSets}" />
          </div>
        </div>
        <div class="inline-actions" style="margin-top:14px;">
          <button class="btn" ${hasPlayers ? "" : "disabled"}>Démarrer</button>
          <span class="small-muted">En saisie rapide, tu notes juste le gagnant.</span>
        </div>
      </form>
    </div>
    ${ui.quickDraft ? renderQuickDraft() : ""}
  `;
}

function renderMatchSummaryCard() {
  if (!state.lastSummaryId) return "";
  const match = state.matches.find((item) => item.id === state.lastSummaryId);
  if (!match) return "";
  const winnerLabel = getMatchWinnerLabel(match) || "—";
  return `
    <div class="card" style="margin-bottom:18px;">
      <div class="card-header">
        <h3 class="card-title">Résumé de la dernière partie</h3>
        <span class="badge">Terminée</span>
      </div>
      <div class="small-muted">${escapeHtml(formatDate(match.date))}</div>
      <div><strong>${match.mode.toUpperCase()}</strong> · ${match.scoringMode === "live" ? "Tour par tour" : "Saisie rapide"}</div>
      <div class="small-muted">Participants : ${escapeHtml(formatMatchParticipants(match))}</div>
      ${match.tag ? `<div class="small-muted">Événement : ${escapeHtml(match.tag)}</div>` : ""}
      <div class="small-muted">Vainqueur : ${escapeHtml(winnerLabel)}</div>
      ${match.progress ? `<div class="small-muted">Sets/Legs : ${escapeHtml(renderInlineProgress(match))}</div>` : ""}
      <div class="inline-actions" style="margin-top:12px;">
        <button class="btn" data-action="replay-match" data-id="${match.id}">Rejouer</button>
        <button class="btn ghost" data-action="nav" data-view="history">Historique</button>
        <button class="btn ghost" data-action="dismiss-summary">Fermer</button>
      </div>
    </div>
  `;
}

function renderLastLegNotice(match) {
  if (!match.lastLeg) return "";
  const winnerName = match.teamMode
    ? getMatchTeamName(match, match.lastLeg.winnerSideId)
    : getPlayerName(match.lastLeg.winnerPlayerId);
  return `
    <div class="notice">
      Dernier leg : ${escapeHtml(winnerName || "—")} (Set ${match.lastLeg.set} · Leg ${match.lastLeg.leg})
    </div>
  `;
}

function renderRulesMenu(match) {
  const rules = match.type === "x01"
    ? `Double-in: ${match.settings.doubleIn ? "oui" : "non"} · Double-out: ${match.settings.doubleOut ? "oui" : "non"} · Bust: ${match.settings.bust ? "oui" : "non"}`
    : "Cricket classique (20 à 15 + bull).";
  const legs = match.settings.legsToWin || 1;
  const sets = match.settings.setsToWin || 1;
  return `
    <details class="rules-menu">
      <summary>Règles</summary>
      <div class="small-muted">${escapeHtml(rules)} · ${sets} set(s) · ${legs} leg(s) gagnants</div>
    </details>
  `;
}

function renderBoard() {
  const view = document.getElementById("view-board");
  const match = state.activeMatch;

  if (!match) {
    view.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Tableau plein écran</h3>
        </div>
        <p class="subtle">Aucune partie en cours. Lance une partie pour afficher le tableau.</p>
        <div class="inline-actions">
          <button class="btn" data-action="nav" data-view="match">Lancer une partie</button>
        </div>
      </div>
    `;
    return;
  }

  const currentPlayerId = match.players[match.currentTurnIndex];
  const currentName = getPlayerName(currentPlayerId);
  const isPaused = match.status === "paused";
  const fullscreenLabel = isFullscreen() ? "Quitter plein écran" : "Plein écran";
  const lastTurns = match.turns.slice(-6).reverse();

  const scoreCards = match.players
    .map((playerId, index) => {
      const player = getPlayer(playerId);
      const teamName = match.teamMode ? getMatchTeamName(match, getMatchTeamId(match, playerId)) : null;
      const isActive = index === match.currentTurnIndex;
      if (match.type === "x01") {
        const data = match.scoreboard[playerId];
        return `
          <div class="score-card ${isActive ? "active" : ""}">
            <div><strong>${escapeHtml(player?.name || "Joueur supprimé")}</strong></div>
            ${teamName ? `<div class="score-meta">${escapeHtml(teamName)}</div>` : ""}
            <div class="score-value">${data.score}</div>
            <div class="score-meta">${match.settings.doubleIn && !data.started ? "Double-in requis" : "En jeu"}</div>
          </div>
        `;
      }

      const data = match.cricket.scores[playerId];
      return `
        <div class="score-card ${isActive ? "active" : ""}">
          <div><strong>${escapeHtml(player?.name || "Joueur supprimé")}</strong></div>
          ${teamName ? `<div class="score-meta">${escapeHtml(teamName)}</div>` : ""}
          <div class="score-value">${data.points}</div>
          <div class="mark-grid">
            ${cricketNumbers
              .map((num) => `<div class="mark-pill"><span>${num.label}</span><strong>${data.marks[num.key]}/3</strong></div>`)
              .join("")}
          </div>
        </div>
      `;
    })
    .join("");

  const lastTurnsMarkup = lastTurns.length
    ? `
      <div class="pill-list">
        ${lastTurns
          .map((turn) => {
            if (match.type === "x01") {
              const label = `${getPlayerName(turn.playerId)} · ${turn.appliedScore} pts${turn.finished ? " (finish)" : ""}`;
              return `<div class="pill">${escapeHtml(label)}</div>`;
            }
            const label = `${getPlayerName(turn.playerId)} · +${turn.pointsGained} pts`;
            return `<div class="pill">${escapeHtml(label)}</div>`;
          })
          .join("")}
      </div>
    `
    : `<p class="subtle">Aucun tour enregistré.</p>`;

  view.innerHTML = `
    <div class="board">
      <div class="board-header">
        <div>
          <h2 class="board-title">Tableau live</h2>
          <div class="subtle">${match.mode.toUpperCase()} · ${escapeHtml(formatMatchParticipants(match))}</div>
        </div>
        <div class="inline-actions">
          <button class="btn ghost" data-action="toggle-fullscreen">${fullscreenLabel}</button>
          <button class="btn ghost" data-action="nav" data-view="match">Retour</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Tour de ${escapeHtml(currentName)}</h3>
            ${isPaused ? `<span class="badge">Pause</span>` : ""}
          </div>
          ${match.type === "x01" ? `<div class="subtle">Reste : ${match.scoreboard[currentPlayerId].score}</div>` : ""}
        </div>
        ${match.progress ? renderProgressTable(match) : ""}
      </div>

      <div class="score-grid">${scoreCards}</div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Derniers tours</h3>
        </div>
        ${lastTurnsMarkup}
      </div>
    </div>
  `;
}

function renderActiveMatch() {
  const match = state.activeMatch;
  const playerNames = formatMatchParticipants(match);
  const isPaused = match.status === "paused";
  const pauseLabel = isPaused ? "Reprendre" : "Mettre en pause";
  const pauseBadge = isPaused ? `<span class="badge">Pause</span>` : "";
  const disabledAttr = isPaused ? "disabled" : "";
  const progressCard = renderMatchProgress(match);
  const lastLegNotice = renderLastLegNotice(match);
  const rulesMenu = renderRulesMenu(match);

  if (match.type === "x01") {
    const currentPlayerId = match.players[match.currentTurnIndex];
    const currentState = match.scoreboard[currentPlayerId];
    const rows = match.players
      .map((playerId, index) => {
        const player = getPlayer(playerId);
        const data = match.scoreboard[playerId];
        const teamName = match.teamMode ? getMatchTeamName(match, playerId) : null;
        return `
          <tr class="${index === match.currentTurnIndex ? "current" : ""}">
            <td>${escapeHtml(player?.name || "Joueur supprimé")}</td>
            ${match.teamMode ? `<td>${escapeHtml(teamName || "—")}</td>` : ""}
            <td><strong>${data.score}</strong></td>
            <td>${match.settings.doubleIn && !data.started ? "Double-in" : "En jeu"}</td>
          </tr>
        `;
      })
      .join("");

    const lastTurns = match.turns.slice(-5).reverse();
    const dartTotal = ui.dartDraft.reduce((sum, dart) => sum + dart.score, 0);
    const rawRemaining = currentState.score - dartTotal;
    const isBust = match.settings.bust && rawRemaining < 0;
    const displayScore = isBust ? currentState.score : rawRemaining;
    const scoreClass = isBust ? "score-bust" : rawRemaining === 0 ? "score-checkout" : "";
    const checkoutHint = !isBust && rawRemaining > 1 && rawRemaining <= 170
      ? getCheckoutSuggestion(rawRemaining, match.settings.doubleOut)
      : null;

    return `
      ${progressCard}
      ${lastLegNotice}
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Partie ${match.mode}</h3>
            <div class="subtle">${playerNames}</div>
          </div>
          <div class="inline-actions">
            <button class="btn ghost" data-action="nav" data-view="board">Tableau</button>
            <button class="btn ghost" data-action="toggle-pause">${pauseLabel}</button>
            <button class="btn ghost" data-action="undo-turn">Annuler le dernier tour</button>
            <button class="btn danger" data-action="cancel-match">Annuler la partie</button>
          </div>
        </div>
        <div class="turn-banner">Tour en cours : ${escapeHtml(getPlayerName(currentPlayerId))}</div>
        ${rulesMenu}
        <table class="table">
          <thead>
            <tr>
              <th>Joueur</th>
              ${match.teamMode ? "<th>Équipe</th>" : ""}
              <th>Score</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <div class="card match-dartpad-card">
        <div class="match-player-bar">
          <span class="match-player-name">${escapeHtml(getPlayerName(currentPlayerId))}</span>
          <div class="match-player-badges">
            ${pauseBadge}
            ${match.settings.doubleIn && !currentState.started ? `<span class="badge">Double-in</span>` : ""}
          </div>
        </div>
        <div class="match-score-display ${scoreClass}">
          <div class="match-score-big">${displayScore}</div>
          ${isBust ? `<div class="match-score-hint bust-hint">BUST</div>` : ""}
          ${checkoutHint ? `<div class="match-score-hint">💡 ${escapeHtml(checkoutHint)}</div>` : ""}
        </div>
        <div class="dart-slots">
          ${[0, 1, 2].map((i) => {
            const dart = ui.dartDraft[i];
            return `<div class="dart-slot ${dart ? "filled" : "empty"}">${dart ? escapeHtml(formatDart(dart)) : ""}</div>`;
          }).join("")}
        </div>
        <div class="dartpad">
          <div class="multiplier-row">
            <button class="btn small ghost ${ui.dartMultiplier === 2 ? "active" : ""}" data-action="dart-multiplier" data-multiplier="2" ${disabledAttr}>× 2 Double</button>
            <button class="btn small ghost ${ui.dartMultiplier === 3 ? "active" : ""}" data-action="dart-multiplier" data-multiplier="3" ${disabledAttr}>× 3 Triple</button>
          </div>
          <div class="dart-grid">
            ${getDartValues()
              .map((value) => {
                const label = value === 25 ? "Bull" : value === 0 ? "Miss" : value;
                return `<button type="button" class="dart-btn" data-action="dart-add" data-value="${value}" ${disabledAttr}>${label}</button>`;
              })
              .join("")}
          </div>
        </div>
        <div class="dart-actions">
          <button class="btn ghost" data-action="dart-undo" ${disabledAttr}>Annuler</button>
          <button class="btn ghost" data-action="dart-clear" ${disabledAttr}>Vider</button>
          <button class="btn" data-action="submit-darts" ${disabledAttr}>Valider</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Historique récent</h3>
        </div>
        ${lastTurns.length ? `
          <div class="pill-list">
            ${lastTurns
              .map((turn) => {
                const label = `${getPlayerName(turn.playerId)} · ${turn.appliedScore} pts${turn.bust ? " (bust)" : ""}${turn.finished ? " (finish)" : ""}`;
                return `<div class="pill">${escapeHtml(label)}</div>`;
              })
              .join("")}
          </div>
        ` : `<p class="subtle">Aucun tour enregistré.</p>`}
      </div>
    `;
  }

  const currentPlayerId = match.players[match.currentTurnIndex];
  const rows = match.players
    .map((playerId, index) => {
      const player = getPlayer(playerId);
      const data = match.cricket.scores[playerId];
      const teamName = match.teamMode ? getMatchTeamName(match, playerId) : null;
      return `
        <tr class="${index === match.currentTurnIndex ? "current" : ""}">
          <td>${escapeHtml(player?.name || "Joueur supprimé")}</td>
          ${match.teamMode ? `<td>${escapeHtml(teamName || "—")}</td>` : ""}
          ${cricketNumbers
            .map((num) => {
              const m = data.marks[num.key] || 0;
              const sym = m === 0 ? '<span class="cmark cmark-0">·</span>'
                        : m === 1 ? '<span class="cmark cmark-1">/</span>'
                        : m === 2 ? '<span class="cmark cmark-2">✕</span>'
                        : '<span class="cmark cmark-3">⊗</span>';
              return `<td>${sym}</td>`;
            })
            .join("")}
          <td><strong>${data.points}</strong></td>
        </tr>
      `;
    })
    .join("");

  const lastTurns = match.turns.slice(-5).reverse();
  return `
    ${progressCard}
    ${lastLegNotice}
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Cricket</h3>
          <div class="subtle">${playerNames}</div>
        </div>
        <div class="inline-actions">
          <button class="btn ghost" data-action="nav" data-view="board">Tableau</button>
          <button class="btn ghost" data-action="toggle-pause">${pauseLabel}</button>
          <button class="btn ghost" data-action="undo-turn">Annuler le dernier tour</button>
          <button class="btn danger" data-action="cancel-match">Annuler la partie</button>
        </div>
      </div>
      <div class="turn-banner">Tour en cours : ${escapeHtml(getPlayerName(currentPlayerId))}</div>
      ${rulesMenu}
      <table class="table">
        <thead>
          <tr>
            <th>Joueur</th>
            ${match.teamMode ? "<th>Équipe</th>" : ""}
            ${cricketNumbers.map((num) => `<th>${num.label}</th>`).join("")}
            <th>Points</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="card match-dartpad-card">
      <div class="match-player-bar">
        <span class="match-player-name">${escapeHtml(getPlayerName(currentPlayerId))}</span>
        <div class="match-player-badges">${pauseBadge}</div>
      </div>
      <div class="dart-slots">
        ${[0, 1, 2].map((i) => {
          const dart = ui.dartDraft[i];
          return `<div class="dart-slot ${dart ? "filled" : "empty"}">${dart ? escapeHtml(formatDart(dart)) : ""}</div>`;
        }).join("")}
      </div>
      <div class="dartpad">
        <div class="multiplier-row">
          <button class="btn small ghost ${ui.dartMultiplier === 2 ? "active" : ""}" data-action="dart-multiplier" data-multiplier="2" ${disabledAttr}>× 2 Double</button>
          <button class="btn small ghost ${ui.dartMultiplier === 3 ? "active" : ""}" data-action="dart-multiplier" data-multiplier="3" ${disabledAttr}>× 3 Triple</button>
        </div>
        <div class="dart-grid">
          ${getCricketDartValues()
            .map((value) => {
              const label = value === 25 ? "Bull" : value === 0 ? "Miss" : value;
              return `<button type="button" class="dart-btn" data-action="dart-add" data-value="${value}" ${disabledAttr}>${label}</button>`;
            })
            .join("")}
        </div>
      </div>
      <div class="dart-actions">
        <button class="btn ghost" data-action="dart-undo" ${disabledAttr}>Annuler</button>
        <button class="btn ghost" data-action="dart-clear" ${disabledAttr}>Vider</button>
        <button class="btn" data-action="submit-cricket-darts" ${disabledAttr}>Valider</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Historique récent</h3>
      </div>
      ${lastTurns.length ? `
        <div class="pill-list">
          ${lastTurns
            .map((turn) => {
              const label = `${getPlayerName(turn.playerId)} · +${turn.pointsGained} pts`;
              return `<div class="pill">${escapeHtml(label)}</div>`;
            })
            .join("")}
        </div>
      ` : `<p class="subtle">Aucun tour enregistré.</p>`}
    </div>
  `;
}

function renderQuickDraft() {
  const draft = ui.quickDraft;
  if (!draft) return "";
  const isCricket = draft.mode === "cricket";
  const isTeamMode = !!draft.teamMode;
  const teamNameA = draft.teamNames?.A || "Équipe A";
  const teamNameB = draft.teamNames?.B || "Équipe B";

  return `
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Saisie rapide (${draft.mode})</h3>
          <div class="subtle">Note le gagnant et éventuellement les scores.</div>
        </div>
        <button class="btn ghost" data-action="quick-cancel">Annuler</button>
      </div>
      <form data-form="quick">
        ${isTeamMode ? `
          <div class="form-row" style="margin-bottom:12px;">
            <div>
              <label>Vainqueur</label>
              <select name="winner">
                <option value="">Choisir une équipe</option>
                <option value="A">${escapeHtml(teamNameA)}</option>
                <option value="B">${escapeHtml(teamNameB)}</option>
              </select>
            </div>
          </div>
        ` : ""}
        <table class="table">
          <thead>
            <tr>
              <th>Joueur</th>
              ${isTeamMode ? "<th>Équipe</th>" : ""}
              <th>${isCricket ? "Points" : "Score final"}</th>
              ${isTeamMode ? "" : "<th>Vainqueur</th>"}
            </tr>
          </thead>
          <tbody>
            ${draft.players
              .map((playerId) => {
                const player = getPlayer(playerId);
                const teamId = draft.teamAssignments?.[playerId] || "A";
                return `
                  <tr>
                    <td>${escapeHtml(player?.name || "Joueur supprimé")}</td>
                    ${isTeamMode ? `<td>${escapeHtml(teamId === "A" ? teamNameA : teamNameB)}</td>` : ""}
                    <td><input type="number" name="score-${playerId}" min="0" /></td>
                    ${isTeamMode ? "" : `<td><input type="radio" name="winner" value="${playerId}" /></td>`}
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
        <div class="inline-actions" style="margin-top:12px;">
          <button class="btn">Enregistrer</button>
        </div>
      </form>
    </div>
  `;
}

function renderStats() {
  const view = document.getElementById("view-stats");
  const matches = getMatchesFiltered(ui.rankingRange, ui.tagFilter);
  const statsMap = computePlayerStats(matches);
  const totalMatches = matches.length;

  const totalTurns = Object.values(statsMap).reduce((sum, stat) => sum + (stat.turns || 0), 0);
  const totalPoints = Object.values(statsMap).reduce((sum, stat) => sum + (stat.totalPoints || 0), 0);
  const avgTurnGlobal = totalTurns ? totalPoints / totalTurns : null;

  let rankingContent = "";
  let topMarkup = "";

  if (ui.rankingMode === "players") {
    const ranking = getPlayerRanking(ui.rankingRange);
    topMarkup = renderTop3(ranking, "player");
    rankingContent = ranking.length
      ? renderRankingTable(ranking, { compact: false })
      : `<p class="subtle">Aucune donnée.</p>`;
  } else {
    const teamRanking = getTeamRanking(ui.rankingRange);
    topMarkup = renderTop3(teamRanking, "team");
    rankingContent = teamRanking.length
      ? renderTeamRanking(teamRanking)
      : `<p class="subtle">Aucune équipe définie.</p>`;
  }

  view.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Filtres</h3>
      </div>
      <div class="form-row">
        <div>
          <label>Période</label>
          <select data-change="ranking-range">
            ${renderRangeOptions(ui.rankingRange)}
          </select>
        </div>
        <div>
          <label>Événement</label>
          <select data-change="tag-filter">
            ${renderTagOptions(ui.tagFilter)}
          </select>
        </div>
        <div>
          <label>Classement</label>
          <select data-change="ranking-mode">
            <option value="players" ${ui.rankingMode === "players" ? "selected" : ""}>Joueurs</option>
            <option value="teams" ${ui.rankingMode === "teams" ? "selected" : ""}>Équipes</option>
          </select>
        </div>
      </div>
    </div>

    <div class="grid two" style="margin-top:18px;">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Stats globales</h3>
          <span class="subtle">${getRangeLabel(ui.rankingRange)}</span>
        </div>
        <div class="grid three">
          <div>
            <div class="stats-number">${totalMatches}</div>
            <div class="stats-label">Parties</div>
          </div>
          <div>
            <div class="stats-number">${totalTurns}</div>
            <div class="stats-label">Tours (x01)</div>
          </div>
          <div>
            <div class="stats-number">${formatNumber(avgTurnGlobal, 1)}</div>
            <div class="stats-label">Moyenne / tour</div>
          </div>
        </div>
        <div class="notice" style="margin-top:12px;">Les stats détaillées viennent des parties notées tour par tour.</div>
      </div>
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Classement</h3>
        </div>
        ${topMarkup}
        ${rankingContent}
      </div>
    </div>
  `;
}

function renderHistory() {
  const view = document.getElementById("view-history");
  let matches = getMatchesFiltered(ui.historyRange, ui.historyTagFilter);
  matches = filterMatchesByPlayers(matches, ui.historyPlayerFilter)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const selectedMatch = ui.historySelectedId
    ? state.matches.find((match) => match.id === ui.historySelectedId)
    : null;

  view.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Historique des parties</h3>
        <div class="split">
          <select data-change="history-range">
            ${renderRangeOptions(ui.historyRange)}
          </select>
          <select data-change="history-tag">
            ${renderTagOptions(ui.historyTagFilter)}
          </select>
        </div>
      </div>
      <div style="margin-top:12px;">
        <label>Filtrer par joueur</label>
        <div class="pill-list">
          ${state.players
            .map((player) => {
              const checked = ui.historyPlayerFilter.includes(player.id);
              return `
                <label class="player-pill">
                  <input type="checkbox" name="historyPlayers" value="${player.id}" ${checked ? "checked" : ""} />
                  <span>${escapeHtml(player.name)}</span>
                </label>
              `;
            })
            .join("")}
        </div>
      </div>
      ${matches.length ? `
        <div>
          ${matches
            .map((match) => {
              const winnerLabel = getMatchWinnerLabel(match);
              return `
                <div class="history-item">
                  <div>
                    <strong>${escapeHtml(formatDate(match.date))} · ${match.mode.toUpperCase()}</strong>
                    <div class="small-muted">${escapeHtml(formatMatchParticipants(match))}</div>
                    ${match.tag ? `<div class="small-muted">Événement : ${escapeHtml(match.tag)}</div>` : ""}
                    <div class="small-muted">Vainqueur : ${escapeHtml(winnerLabel || "—")}</div>
                  </div>
                  <button class="btn small ghost" data-action="select-match" data-id="${match.id}">Voir</button>
                </div>
              `;
            })
            .join("")}
        </div>
      ` : `<p class="subtle">Aucune partie enregistrée.</p>`}
    </div>

    <div class="card" style="margin-top:18px;">
      <div class="card-header">
        <h3 class="card-title">Détails</h3>
      </div>
      ${selectedMatch ? renderHistoryDetail(selectedMatch) : `<p class="subtle">Sélectionne une partie pour voir le détail.</p>`}
    </div>
  `;
}

function renderHistoryDetail(match) {
  const isTeamMode = match.teamMode;
  const teams = getMatchTeams(match);
  const winnerValue = isTeamMode
    ? match.winnerTeamId || ""
    : (match.winnerIds && match.winnerIds[0]) || "";
  const scoreLabel = match.type === "cricket" ? "Points" : "Score restant";

  const scoreRows = match.players
    .map((playerId) => {
      const player = getPlayer(playerId);
      const teamName = isTeamMode ? getMatchTeamName(match, getMatchTeamId(match, playerId)) : null;
      const scoreValue = match.type === "cricket"
        ? match.finalPoints?.[playerId]
        : match.finalScores?.[playerId];
      return `
        <tr>
          <td>${escapeHtml(player?.name || "Joueur supprimé")}</td>
          ${isTeamMode ? `<td>${escapeHtml(teamName || "—")}</td>` : ""}
          <td>${Number.isFinite(scoreValue) ? scoreValue : "—"}</td>
        </tr>
      `;
    })
    .join("");

  const editScores = match.scoringMode === "quick"
    ? `
      <div style="margin-top:12px;">
        <label>${scoreLabel} (éditable)</label>
        <div class="pill-list">
          ${match.players
            .map((playerId) => {
              const player = getPlayer(playerId);
              const currentScore = match.type === "cricket"
                ? match.finalPoints?.[playerId]
                : match.finalScores?.[playerId];
              return `
                <div class="player-pill">
                  <span>${escapeHtml(player?.name || "Joueur supprimé")}</span>
                  <input type="number" name="score-${playerId}" value="${Number.isFinite(currentScore) ? currentScore : ""}" />
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `
    : `<div class="notice" style="margin-top:12px;">Les scores détaillés sont verrouillés pour les parties tour par tour.</div>`;

  return `
    <div class="grid two">
      <div>
        <div class="small-muted">${escapeHtml(formatDate(match.date))}</div>
        <div><strong>${match.mode.toUpperCase()}</strong> · ${match.scoringMode === "live" ? "Tour par tour" : "Saisie rapide"}</div>
        ${match.type === "x01" ? `<div class="small-muted">Règles : ${match.settings.doubleIn ? "Double-in" : "Sans double-in"} · ${match.settings.doubleOut ? "Double-out" : "Sans double-out"} · ${match.settings.bust ? "Bust" : "Sans bust"}</div>` : ""}
        ${match.tag ? `<div class="small-muted">Événement : ${escapeHtml(match.tag)}</div>` : ""}
        <div class="small-muted">Participants : ${escapeHtml(formatMatchParticipants(match))}</div>
        ${match.progress ? `<div class="small-muted">Set ${match.progress.currentSet} · Leg ${match.progress.currentLeg}</div>` : ""}
      </div>
      <div>
        <table class="table">
          <thead>
            <tr>
              <th>Joueur</th>
              ${isTeamMode ? "<th>Équipe</th>" : ""}
              <th>${scoreLabel}</th>
            </tr>
          </thead>
          <tbody>${scoreRows}</tbody>
        </table>
        ${match.progress ? renderProgressTable(match) : ""}
      </div>
    </div>

    <form data-form="match-edit" data-id="${match.id}" style="margin-top:16px;">
      <div class="form-row">
        <div>
          <label>Vainqueur</label>
          <select name="winner">
            <option value="">Choisir</option>
            ${isTeamMode
              ? teams
                  .map((team) => `<option value="${team.id}" ${team.id === winnerValue ? "selected" : ""}>${escapeHtml(team.name)}</option>`)
                  .join("")
              : match.players
                  .map((playerId) => {
                    const player = getPlayer(playerId);
                    return `<option value="${playerId}" ${playerId === winnerValue ? "selected" : ""}>${escapeHtml(player?.name || "Joueur supprimé")}</option>`;
                  })
                  .join("")}
          </select>
        </div>
      </div>
      ${editScores}
      <div class="inline-actions" style="margin-top:12px;">
        <button class="btn">Sauvegarder</button>
        <button type="button" class="btn ghost" data-action="replay-match" data-id="${match.id}">Rejouer</button>
        <button type="button" class="btn danger" data-action="delete-match" data-id="${match.id}">Supprimer</button>
      </div>
    </form>
  `;
}

function renderPlayerEvolutionChart(playerId, matches) {
  const sorted = [...matches].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-15);
  if (sorted.length === 0) return "";

  // Win/loss dots
  const dots = sorted.map((match) => {
    const won = (match.winnerIds || []).includes(playerId);
    const cls = won ? "evo-dot win" : "evo-dot loss";
    const label = won ? "V" : "D";
    return `<span class="${cls}" title="${formatDate(match.date)}">${label}</span>`;
  }).join("");

  // Avg turn per match (X01 live only)
  const x01Matches = sorted.filter(
    (m) => m.type === "x01" && m.scoringMode === "live" && Array.isArray(m.turns)
  );

  let barChart = "";
  if (x01Matches.length >= 2) {
    const avgs = x01Matches.map((match) => {
      const playerTurns = match.turns.filter((t) => t.playerId === playerId);
      if (!playerTurns.length) return null;
      const total = playerTurns.reduce((s, t) => s + (Number.isFinite(t.appliedScore) ? t.appliedScore : 0), 0);
      return { avg: total / playerTurns.length, won: (match.winnerIds || []).includes(playerId), date: match.date };
    }).filter(Boolean);

    if (avgs.length >= 2) {
      const maxAvg = Math.max(...avgs.map((a) => a.avg), 1);
      const barH = 48;
      const barW = Math.max(12, Math.floor(220 / avgs.length) - 3);
      const bars = avgs.map((a, i) => {
        const h = Math.round((a.avg / maxAvg) * barH);
        const y = barH - h;
        const fill = a.won ? "var(--color-win, #4caf50)" : "var(--color-loss, #e53935)";
        return `<rect x="${i * (barW + 3)}" y="${y}" width="${barW}" height="${h}" fill="${fill}" rx="2" title="${formatDate(a.date)} · ${formatNumber(a.avg, 1)} pts/tour"/>`;
      }).join("");
      const totalW = avgs.length * (barW + 3) - 3;
      barChart = `
        <div class="evo-chart-label">Moy./tour (X01 live)</div>
        <svg class="evo-bar-chart" width="${totalW}" height="${barH}" viewBox="0 0 ${totalW} ${barH}">
          ${bars}
        </svg>`;
    }
  }

  return `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Évolution (${sorted.length} dernières parties)</h3>
      </div>
      <div class="evo-dots">${dots}</div>
      ${barChart}
    </div>`;
}

function renderProfile() {
  const view = document.getElementById("view-profile");
  const player = ui.profilePlayerId ? getPlayer(ui.profilePlayerId) : null;
  if (!player) {
    view.innerHTML = `<div class="card"><p class="subtle">Sélectionne un joueur pour voir son profil.</p></div>`;
    return;
  }

  const matches = state.matches.filter((match) => match.players.includes(player.id));
  const statsMap = computePlayerStats(matches);
  const stats = statsMap[player.id] || {};
  const recent = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

  view.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">${escapeHtml(player.name)}</h3>
          ${player.team ? `<div class="subtle">${escapeHtml(player.team)}</div>` : ""}
        </div>
        <button class="btn ghost" data-action="nav" data-view="players">Retour</button>
      </div>
      <div class="grid three">
        <div>
          <div class="stats-number">${stats.matches || 0}</div>
          <div class="stats-label">Matchs</div>
        </div>
        <div>
          <div class="stats-number">${stats.wins || 0}</div>
          <div class="stats-label">Victoires</div>
        </div>
        <div>
          <div class="stats-number">${formatPercent(stats.winrate)}</div>
          <div class="stats-label">Winrate</div>
        </div>
        <div>
          <div class="stats-number">${formatNumber(stats.avgTurn, 1)}</div>
          <div class="stats-label">Moy./tour</div>
        </div>
        <div>
          <div class="stats-number">${formatNumber(stats.avgThreeDart, 1)}</div>
          <div class="stats-label">Moy./3 fléchettes</div>
        </div>
        <div>
          <div class="stats-number">${stats.bestCheckout || "—"}</div>
          <div class="stats-label">Checkout max</div>
        </div>
      </div>
      <div class="grid three" style="margin-top:12px;">
        <div>
          <div class="stats-number">${stats.count180 || 0}</div>
          <div class="stats-label">180</div>
        </div>
        <div>
          <div class="stats-number">${stats.darts || 0}</div>
          <div class="stats-label">Fléchettes</div>
        </div>
      </div>
    </div>

    ${renderPlayerEvolutionChart(player.id, matches)}

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Dernières parties</h3>
      </div>
      ${recent.length ? `
        <div class="pill-list">
          ${recent
            .map((match) => {
              const label = `${formatDate(match.date)} · ${match.mode.toUpperCase()} · ${getMatchWinnerLabel(match) || "—"}`;
              return `<div class="pill">${escapeHtml(label)}</div>`;
            })
            .join("")}
        </div>
      ` : `<p class="subtle">Aucune partie pour ce joueur.</p>`}
    </div>
  `;
}

function renderMatchProgress(match) {
  ensureMatchProgress(match);
  const sides = getMatchSideSummaries(match);
  const rows = sides
    .map((side) => {
      const legs = match.progress.legs[side.id] ?? 0;
      const sets = match.progress.sets[side.id] ?? 0;
      return `
        <tr>
          <td>${escapeHtml(side.name)}</td>
          <td>${sets}</td>
          <td>${legs}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Score du match</h3>
          <div class="subtle">Set ${match.progress.currentSet} · Leg ${match.progress.currentLeg}</div>
        </div>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>${match.teamMode ? "Équipe" : "Joueur"}</th>
            <th>Sets</th>
            <th>Legs</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderProgressTable(match) {
  ensureMatchProgress(match);
  const sides = getMatchSideSummaries(match);
  const rows = sides
    .map((side) => {
      const legs = match.progress.legs[side.id] ?? 0;
      const sets = match.progress.sets[side.id] ?? 0;
      return `
        <tr>
          <td>${escapeHtml(side.name)}</td>
          <td>${sets}</td>
          <td>${legs}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <table class="table" style="margin-top:12px;">
      <thead>
        <tr>
          <th>${match.teamMode ? "Équipe" : "Joueur"}</th>
          <th>Sets</th>
          <th>Legs</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderInlineProgress(match) {
  ensureMatchProgress(match);
  const sides = getMatchSideSummaries(match);
  return sides
    .map((side) => {
      const sets = match.progress.sets[side.id] ?? 0;
      const legs = match.progress.legs[side.id] ?? 0;
      return `${side.name}: ${sets}-${legs}`;
    })
    .join(" · ");
}

function renderCloudSection() {
  const loggedIn = Boolean(cloud.session?.user);
  const localGroupName = store.groupList.find((group) => group.id === store.activeGroupId)?.name || "Groupe actif";
  const linkedId = state.cloudGroupId || "";
  const linkedGroup = linkedId ? cloud.groups.find((group) => group.id === linkedId) : null;
  const options = cloud.groups
    .map(
      (group) =>
        `<option value="${group.id}" ${group.id === linkedId ? "selected" : ""}>${escapeHtml(group.name || "Sans nom")}</option>`
    )
    .join("");
  const loadingBadge = cloud.loading ? `<span class="badge">Sync...</span>` : "";
  const errorBlock = cloud.error
    ? `<p class="small-muted" style="color: var(--danger);">Erreur: ${escapeHtml(cloud.error)}</p>`
    : "";

  if (!loggedIn) {
    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Synchronisation Supabase</h3>
        </div>
        <p class="subtle">Connecte-toi pour sauvegarder et partager un groupe.</p>
        <form data-form="supabase-login" class="form-row">
          <div>
            <label>Email</label>
            <input type="email" name="email" placeholder="toi@exemple.com" />
          </div>
          <div class="inline-actions" style="align-items:flex-end;">
            <button class="btn">Recevoir un lien</button>
          </div>
        </form>
        ${errorBlock}
      </div>
    `;
  }

  const inviteCode = linkedGroup?.invite_code || "";
  const inviteBlock = inviteCode
    ? `
      <div class="notice" style="margin-top:12px;">
        Code d'invitation : <strong>${escapeHtml(inviteCode)}</strong>
      </div>
      <div class="inline-actions" style="margin-top:8px;">
        <button class="btn ghost" data-action="cloud-copy-code" data-code="${escapeHtml(inviteCode)}">Copier le code</button>
      </div>
    `
    : "";

  return `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Synchronisation Supabase</h3>
      </div>
      <div class="inline-actions" style="align-items:center;">
        <span class="badge">Connecté : ${escapeHtml(cloud.session?.user?.email || "compte")}</span>
        ${loadingBadge}
        <button class="btn ghost" data-action="cloud-refresh">Rafraîchir</button>
        <button class="btn ghost" data-action="supabase-logout">Se déconnecter</button>
      </div>
      ${errorBlock}
      <div class="form-row" style="margin-top:12px;">
        <div>
          <label>Groupe local actif</label>
          <div class="notice">${escapeHtml(localGroupName)}</div>
        </div>
        <div>
          <label>Groupe cloud lié</label>
          <select data-change="cloud-group-select">
            <option value="">Aucun</option>
            ${options}
          </select>
        </div>
      </div>
      <div class="inline-actions" style="margin-top:12px;">
        <button class="btn" data-action="cloud-push" ${linkedId ? "" : "disabled"}>Envoyer vers le cloud</button>
        <button class="btn ghost" data-action="cloud-pull" ${linkedId ? "" : "disabled"}>Importer depuis le cloud</button>
      </div>
      ${inviteBlock}
      <div class="grid two" style="margin-top:16px;">
        <form data-form="cloud-create">
          <label>Créer un groupe cloud</label>
          <div class="form-row">
            <div>
              <input type="text" name="cloudName" value="${escapeHtml(localGroupName)}" />
            </div>
            <div class="inline-actions">
              <button class="btn ghost">Créer & lier</button>
            </div>
          </div>
        </form>
        <form data-form="cloud-join">
          <label>Rejoindre avec un code</label>
          <div class="form-row">
            <div>
              <input type="text" name="inviteCode" placeholder="CODE" />
            </div>
            <div class="inline-actions">
              <button class="btn ghost">Rejoindre</button>
            </div>
          </div>
        </form>
      </div>
      <p class="subtle" style="margin-top:8px;">Les données locales sont remplacées lors d'un import.</p>
    </div>
  `;
}

function renderSettings() {
  const view = document.getElementById("view-settings");
  const weights = getRankingWeights();
  const gistToken = store.gist?.token || "";
  const gistId = store.gist?.gistId || "";

  view.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Réglages par défaut</h3>
      </div>
      <div class="form-row">
        <div>
          <label>Mode par défaut</label>
          <select data-setting="defaultMode">
            ${renderModeOptions(state.settings.defaultMode)}
          </select>
        </div>
        <div>
          <label>Saisie par défaut</label>
          <select data-setting="scoringMode">
            ${renderScoringOptions(state.settings.scoringMode)}
          </select>
        </div>
      </div>
      <div class="form-row" style="margin-top:12px;">
        <div>
          <label>Legs pour gagner</label>
          <input type="number" min="1" data-setting="legsToWin" value="${state.settings.legsToWin || 1}" />
        </div>
        <div>
          <label>Sets pour gagner</label>
          <input type="number" min="1" data-setting="setsToWin" value="${state.settings.setsToWin || 1}" />
        </div>
      </div>
      <div style="margin-top:12px;">
        <label>Règles 301/501</label>
        <div class="pill-list">
          <label class="player-pill">
            <input type="checkbox" data-setting="doubleIn" ${state.settings.doubleIn ? "checked" : ""} />
            <span>Double-in</span>
          </label>
          <label class="player-pill">
            <input type="checkbox" data-setting="doubleOut" ${state.settings.doubleOut ? "checked" : ""} />
            <span>Double-out</span>
          </label>
          <label class="player-pill">
            <input type="checkbox" data-setting="bust" ${state.settings.bust ? "checked" : ""} />
            <span>Bust</span>
          </label>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Apparence</h3>
      </div>
      <div class="inline-actions">
        <button class="btn ghost" data-action="toggle-theme">${currentTheme === "dark" ? "Mode clair" : "Mode sombre"}</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Classement pondéré</h3>
      </div>
      <div class="form-row">
        <div>
          <label>Poids victoires</label>
          <input type="number" step="0.1" min="0" data-setting="rankWins" value="${weights.wins}" />
        </div>
        <div>
          <label>Poids winrate</label>
          <input type="number" step="0.1" min="0" data-setting="rankWinrate" value="${weights.winrate}" />
        </div>
        <div>
          <label>Poids moyenne / tour</label>
          <input type="number" step="0.1" min="0" data-setting="rankAvgTurn" value="${weights.avgTurn}" />
        </div>
        <div>
          <label>Poids moyenne / 3 fléchettes</label>
          <input type="number" step="0.1" min="0" data-setting="rankAvgDart" value="${weights.avgDart}" />
        </div>
      </div>
      <p class="subtle" style="margin-top:8px;">Le classement utilise ces pondérations (normalisées) pour ordonner les joueurs/équipes.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Groupes</h3>
      </div>
      ${store.groupList
        .map((group) => `
          <div class="history-item">
            <div>
              <strong>${escapeHtml(group.name)}</strong>
              ${group.id === store.activeGroupId ? `<span class="badge">Actif</span>` : ""}
              ${store.groups[group.id]?.cloudGroupId ? `<span class="badge">Cloud</span>` : ""}
            </div>
            <div class="inline-actions">
              <button class="btn small ghost" data-action="switch-group" data-id="${group.id}">Activer</button>
              <button class="btn small ghost" data-action="rename-group" data-id="${group.id}">Renommer</button>
              <button class="btn small danger" data-action="delete-group" data-id="${group.id}">Supprimer</button>
            </div>
          </div>
        `)
        .join("")}
      <form data-form="group-create" style="margin-top:12px;">
        <div class="form-row">
          <div>
            <label>Nouveau groupe</label>
            <input type="text" name="groupName" placeholder="Ex: Bar du jeudi" />
          </div>
        </div>
        <div class="inline-actions" style="margin-top:12px;">
          <button class="btn">Créer</button>
        </div>
      </form>
    </div>

    ${renderCloudSection()}

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Sauvegarde JSON</h3>
      </div>
      <div class="inline-actions">
        <button class="btn" data-action="export">Exporter le groupe</button>
        <button class="btn ghost" data-action="export-all">Exporter tout</button>
        <label class="btn ghost" style="cursor:pointer;">
          Importer
          <input type="file" accept="application/json" data-action="import-file" style="display:none;" />
        </label>
      </div>
      <p class="subtle" style="margin-top:8px;">Les données restent sur ton navigateur. Pense à exporter de temps en temps.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">CSV</h3>
      </div>
      <div class="inline-actions">
        <button class="btn ghost" data-action="export-players-csv">Exporter classement joueurs</button>
        <button class="btn ghost" data-action="export-teams-csv">Exporter classement équipes</button>
        <label class="btn ghost" style="cursor:pointer;">
          Importer joueurs CSV
          <input type="file" accept=".csv,text/csv" data-action="import-players" style="display:none;" />
        </label>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Synchronisation GitHub Gist</h3>
      </div>
      <div class="form-row">
        <div>
          <label>Token GitHub</label>
          <input type="text" data-setting="gistToken" value="${escapeHtml(gistToken)}" placeholder="ghp_..." />
        </div>
        <div>
          <label>Gist ID</label>
          <input type="text" data-setting="gistId" value="${escapeHtml(gistId)}" placeholder="abcdef..." />
        </div>
      </div>
      <div class="inline-actions" style="margin-top:12px;">
        <button class="btn ghost" data-action="gist-push">Sauvegarder (push)</button>
        <button class="btn ghost" data-action="gist-pull">Restaurer (pull)</button>
      </div>
      <p class="subtle" style="margin-top:8px;">Le token reste stocké localement sur ton navigateur.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Diagnostic rapide</h3>
      </div>
      <p class="subtle">Vérifie la cohérence des joueurs, matchs et règles.</p>
      <div class="inline-actions" style="margin-top:12px;">
        <button class="btn ghost" data-action="run-diagnostics">Lancer le diagnostic</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Réinitialisation</h3>
      </div>
      <div class="inline-actions">
        <button class="btn danger" data-action="reset-data">Tout effacer (groupe actif)</button>
      </div>
    </div>
  `;
}

function startLiveMatch({ mode, players, settings, teamMode, teamAssignments, teamNames, tag }) {
  const now = new Date().toISOString();
  const matchTeams = {
    teamMode: !!teamMode,
    teamAssignments: teamAssignments || {},
    teamNames: teamNames || { A: "Équipe A", B: "Équipe B" },
    winnerTeamId: null,
  };
  const progress = initMatchProgress({
    players,
    settings,
    teamMode: matchTeams.teamMode,
    teamAssignments: matchTeams.teamAssignments,
    teamNames: matchTeams.teamNames,
  });

  if (mode === "cricket") {
    const scores = {};
    players.forEach((playerId) => {
      scores[playerId] = {
        marks: initCricketMarks(),
        points: 0,
      };
    });

    state.activeMatch = {
      id: uid(),
      type: "cricket",
      mode,
      scoringMode: "live",
      tag: tag || "",
      players,
      settings,
      ...matchTeams,
      status: "live",
      progress,
      startedAt: now,
      currentTurnIndex: 0,
      turns: [],
      cricket: { scores },
    };
  } else {
    const startScore = Number(mode);
    const scoreboard = {};
    players.forEach((playerId) => {
      scoreboard[playerId] = {
        score: startScore,
        started: !settings.doubleIn,
      };
    });

    state.activeMatch = {
      id: uid(),
      type: "x01",
      mode,
      scoringMode: "live",
      tag: tag || "",
      players,
      settings,
      ...matchTeams,
      status: "live",
      progress,
      startedAt: now,
      currentTurnIndex: 0,
      turns: [],
      scoreboard,
    };
  }

  saveLastSetup({
    mode,
    players,
    settings,
    teamMode: matchTeams.teamMode,
    teamAssignments: matchTeams.teamAssignments,
    teamNames: matchTeams.teamNames,
    scoringMode: "live",
    tag: tag || "",
  });

  saveState();
  ui.view = "match";
  ui.quickDraft = null;
  ui.cricketTurn = {};
  ui.dartDraft = [];
  ui.dartMultiplier = 1;
  render();
}

function submitX01TurnFromDarts() {
  const match = state.activeMatch;
  if (!match || match.type !== "x01") return;
  if (match.status === "paused") {
    showToast("Partie en pause");
    return;
  }

  if (ui.dartDraft.length === 0) {
    showToast("Ajoute au moins une fléchette");
    return;
  }

  const rawScore = ui.dartDraft.reduce((sum, dart) => sum + dart.score, 0);
  const hasDouble = ui.dartDraft.some((dart) => dart.multiplier === 2);
  const lastDartDouble = ui.dartDraft[ui.dartDraft.length - 1]?.multiplier === 2;

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
    if (hasDouble) {
      started = true;
    } else {
      canScore = false;
    }
  }

  if (canScore && (started || !match.settings.doubleIn)) {
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

    if (!bust) {
      appliedScore = rawScore;
    }
  }

  playerState.score = nextScore;
  playerState.started = started;

  match.turns.push({
    id: uid(),
    playerId,
    darts: [...ui.dartDraft],
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

  ui.dartDraft = [];
  ui.dartMultiplier = 1;
  if (navigator.vibrate) navigator.vibrate(finished ? [30, 20, 30] : 15);

  if (finished) {
    handleLegWin(match, playerId);
    return;
  }

  match.currentTurnIndex = (match.currentTurnIndex + 1) % match.players.length;
  saveState();
  render();
  const nextId = match.players[match.currentTurnIndex];
  const nextPlayerScore = match.scoreboard[nextId]?.score;
  const nextCheckout = nextPlayerScore != null && nextPlayerScore <= 170
    ? getCheckoutSuggestion(nextPlayerScore, match.settings.doubleOut)
    : null;
  const nextSubtitle = nextPlayerScore != null
    ? (nextCheckout ? `Reste : ${nextPlayerScore} · 💡 ${nextCheckout}` : `Reste : ${nextPlayerScore}`)
    : "";
  showFlashOverlay("🎯", getPlayerName(nextId), nextSubtitle);
  cloudPushAuto();
}

function submitCricketTurnFromDarts() {
  const match = state.activeMatch;
  if (!match || match.type !== "cricket") return;
  if (match.status === "paused") {
    showToast("Partie en pause");
    return;
  }

  if (ui.dartDraft.length === 0) {
    showToast("Ajoute au moins une fléchette");
    return;
  }

  const playerId = match.players[match.currentTurnIndex];
  const playerScore = match.cricket.scores[playerId];
  const prevMarks = { ...playerScore.marks };
  const prevPoints = playerScore.points;

  let pointsGained = 0;
  const hitsLog = {};

  ui.dartDraft.forEach((dart) => {
    const numKey = dart.base === 25 ? "bull" : String(dart.base);
    if (!cricketNumbers.some((num) => num.key === numKey)) {
      return;
    }
    const hits = dart.multiplier;
    hitsLog[numKey] = (hitsLog[numKey] || 0) + hits;
    for (let i = 0; i < hits; i += 1) {
      if (playerScore.marks[numKey] < 3) {
        playerScore.marks[numKey] += 1;
      } else if (anyOpponentOpen(match, playerId, numKey)) {
        const numValue = cricketNumbers.find((num) => num.key === numKey)?.value || 0;
        pointsGained += numValue;
      }
    }
  });

  playerScore.points += pointsGained;

  match.turns.push({
    id: uid(),
    playerId,
    darts: [...ui.dartDraft],
    hits: hitsLog,
    prevMarks,
    prevPoints,
    pointsGained,
    leg: match.progress?.currentLeg || 1,
    set: match.progress?.currentSet || 1,
    ts: new Date().toISOString(),
  });

  ui.dartDraft = [];
  ui.dartMultiplier = 1;
  const isWinner = isCricketWinner(match, playerId);
  if (navigator.vibrate) navigator.vibrate(isWinner ? [30, 20, 30] : 15);

  if (isWinner) {
    let winners = [playerId];
    if (match.teamMode) {
      const teamId = getMatchTeamId(match, playerId);
      winners = teamId ? getPlayersByTeam(match.players, match.teamAssignments, teamId) : [playerId];
    }
    handleLegWin(match, winners[0]);
    return;
  }

  match.currentTurnIndex = (match.currentTurnIndex + 1) % match.players.length;
  saveState();
  render();
  const nextId = match.players[match.currentTurnIndex];
  const nextPoints = match.cricket.scores[nextId]?.points ?? 0;
  showFlashOverlay("🎯", getPlayerName(nextId), `Points : ${nextPoints}`);
  cloudPushAuto();
}

function undoLastTurn() {
  const match = state.activeMatch;
  if (!match || match.turns.length === 0) return;

  const lastTurn = match.turns.pop();

  if (match.type === "x01") {
    const playerState = match.scoreboard[lastTurn.playerId];
    playerState.score = lastTurn.prevScore;
    playerState.started = lastTurn.prevStarted;
    match.currentTurnIndex = match.players.indexOf(lastTurn.playerId);
    ui.dartDraft = [];
    ui.dartMultiplier = 1;
  } else {
    const playerScore = match.cricket.scores[lastTurn.playerId];
    playerScore.marks = { ...lastTurn.prevMarks };
    playerScore.points = lastTurn.prevPoints;
    match.currentTurnIndex = match.players.indexOf(lastTurn.playerId);
  }

  saveState();
  render();
  showToast("Dernier tour annulé");
}

function finalizeMatch(match, winnerIds) {
  const winnerTeamId = match.teamMode && winnerIds.length
    ? getMatchTeamId(match, winnerIds[0])
    : null;
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

  state.matches.push(record);
  state.lastSummaryId = record.id;
  state.activeMatch = null;
  ui.dartDraft = [];
  ui.dartMultiplier = 1;
  saveState();
  render();
  showToast("Partie terminée");
  cloudPushAuto();
}

function getFinalScores(match) {
  const scores = {};
  match.players.forEach((playerId) => {
    scores[playerId] = match.scoreboard[playerId].score;
  });
  return scores;
}

function getFinalPoints(match) {
  const points = {};
  match.players.forEach((playerId) => {
    points[playerId] = match.cricket.scores[playerId].points;
  });
  return points;
}

function isCricketWinner(match, playerId) {
  const playerScore = match.cricket.scores[playerId];
  const allClosed = cricketNumbers.every((num) => playerScore.marks[num.key] >= 3);
  if (!allClosed) return false;

  const maxOpponentPoints = Math.max(
    ...match.players
      .filter((id) => id !== playerId)
      .map((id) => match.cricket.scores[id].points)
  );

  return playerScore.points >= maxOpponentPoints;
}

function anyOpponentOpen(match, playerId, numKey) {
  return match.players.some(
    (id) => id !== playerId && match.cricket.scores[id].marks[numKey] < 3
  );
}

function computePlayerStats(matches) {
  const stats = {};
  state.players.forEach((player) => {
    stats[player.id] = {
      playerId: player.id,
      matches: 0,
      wins: 0,
      turns: 0,
      totalPoints: 0,
      darts: 0,
      count180: 0,
      bestCheckout: null,
      winrate: 0,
      avgTurn: null,
      avgDart: null,
      avgThreeDart: null,
    };
  });

  matches.forEach((match) => {
    match.players.forEach((playerId) => {
      if (stats[playerId]) stats[playerId].matches += 1;
    });
    (match.winnerIds || []).forEach((playerId) => {
      if (stats[playerId]) stats[playerId].wins += 1;
    });

    if (match.scoringMode === "live" && match.type === "x01" && Array.isArray(match.turns)) {
      match.turns.forEach((turn) => {
        const playerStat = stats[turn.playerId];
        if (!playerStat) return;
        const applied = Number.isFinite(turn.appliedScore) ? turn.appliedScore : 0;
        const dartCount = Array.isArray(turn.darts) ? turn.darts.length : 3;
        playerStat.turns += 1;
        playerStat.totalPoints += applied;
        playerStat.darts += dartCount;
        if (applied === 180) playerStat.count180 += 1;
        if (turn.checkout) {
          playerStat.bestCheckout = playerStat.bestCheckout
            ? Math.max(playerStat.bestCheckout, turn.checkout)
            : turn.checkout;
        }
      });
    }
  });

  Object.values(stats).forEach((stat) => {
    stat.winrate = stat.matches ? stat.wins / stat.matches : 0;
    stat.avgTurn = stat.turns ? stat.totalPoints / stat.turns : null;
    stat.avgDart = stat.darts ? stat.totalPoints / stat.darts : null;
    stat.avgThreeDart = stat.avgDart ? stat.avgDart * 3 : null;
  });

  return stats;
}

function getPlayerRanking(range, tagFilterOverride) {
  const tagFilter = tagFilterOverride ?? ui.tagFilter;
  const matches = getMatchesFiltered(range, tagFilter);
  const statsMap = computePlayerStats(matches);

  const rows = state.players.map((player) => ({
    player,
    ...statsMap[player.id],
  }));

  applyRankingScore(rows);

  rows.sort((a, b) => {
    const scoreDiff = (b.rankScore || 0) - (a.rankScore || 0);
    if (scoreDiff !== 0) return scoreDiff;
    const winDiff = b.wins - a.wins;
    if (winDiff !== 0) return winDiff;
    const rateDiff = (b.winrate || 0) - (a.winrate || 0);
    if (rateDiff !== 0) return rateDiff;
    const avgDiff = (b.avgTurn || 0) - (a.avgTurn || 0);
    if (avgDiff !== 0) return avgDiff;
    const matchDiff = (b.matches || 0) - (a.matches || 0);
    if (matchDiff !== 0) return matchDiff;
    return (a.player.name || "").localeCompare(b.player.name || "");
  });

  return rows;
}

function getTeamRanking(range, tagFilterOverride) {
  const tagFilter = tagFilterOverride ?? ui.tagFilter;
  const matches = getMatchesFiltered(range, tagFilter);
  const teams = {};

  matches.forEach((match) => {
    const matchTeams = getMatchTeams(match);
    matchTeams.forEach((team) => {
      if (!teams[team.name]) {
        teams[team.name] = {
          team: team.name,
          matches: 0,
          wins: 0,
          turns: 0,
          totalPoints: 0,
          darts: 0,
          count180: 0,
          bestCheckout: null,
          winrate: 0,
          avgTurn: null,
          avgDart: null,
          avgThreeDart: null,
        };
      }
      teams[team.name].matches += 1;
    });

    const winnerTeamId = match.teamMode
      ? match.winnerTeamId
      : match.winnerIds?.[0] ? getMatchTeamId(match, match.winnerIds[0]) : null;

    if (winnerTeamId) {
      const winnerName = getMatchTeamName(match, winnerTeamId);
      if (winnerName && teams[winnerName]) teams[winnerName].wins += 1;
    }

    if (match.scoringMode === "live" && match.type === "x01" && Array.isArray(match.turns)) {
      match.turns.forEach((turn) => {
        const teamId = getMatchTeamId(match, turn.playerId);
        if (!teamId) return;
        const teamName = getMatchTeamName(match, teamId);
        const team = teams[teamName];
        if (!team) return;
        const applied = Number.isFinite(turn.appliedScore) ? turn.appliedScore : 0;
        const dartCount = Array.isArray(turn.darts) ? turn.darts.length : 3;
        team.turns += 1;
        team.totalPoints += applied;
        team.darts += dartCount;
        if (applied === 180) team.count180 += 1;
        if (turn.checkout) {
          team.bestCheckout = team.bestCheckout ? Math.max(team.bestCheckout, turn.checkout) : turn.checkout;
        }
      });
    }
  });

  const rows = Object.values(teams);
  rows.forEach((team) => {
    team.winrate = team.matches ? team.wins / team.matches : 0;
    team.avgTurn = team.turns ? team.totalPoints / team.turns : null;
    team.avgDart = team.darts ? team.totalPoints / team.darts : null;
    team.avgThreeDart = team.avgDart ? team.avgDart * 3 : null;
  });

  applyRankingScore(rows);

  rows.sort((a, b) => {
    const scoreDiff = (b.rankScore || 0) - (a.rankScore || 0);
    if (scoreDiff !== 0) return scoreDiff;
    const winDiff = b.wins - a.wins;
    if (winDiff !== 0) return winDiff;
    const rateDiff = (b.winrate || 0) - (a.winrate || 0);
    if (rateDiff !== 0) return rateDiff;
    const avgDiff = (b.avgTurn || 0) - (a.avgTurn || 0);
    if (avgDiff !== 0) return avgDiff;
    return a.team.localeCompare(b.team);
  });

  return rows;
}

function renderRankingTable(ranking, { compact }) {
  return `
    <table class="table">
      <thead>
        <tr>
          <th>#</th>
          <th>Joueur</th>
          <th>Matchs</th>
          <th>Victoires</th>
          <th>Winrate</th>
          <th>Moy./tour</th>
          <th>180</th>
          ${compact ? "" : "<th>Checkout</th>"}
        </tr>
      </thead>
      <tbody>
        ${ranking
          .map((row, index) => {
            return `
              <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(row.player.name)}</td>
                <td>${row.matches || 0}</td>
                <td>${row.wins || 0}</td>
                <td>${formatPercent(row.winrate)}</td>
                <td>${formatNumber(row.avgTurn, 1)}</td>
                <td>${row.count180 || 0}</td>
                ${compact ? "" : `<td>${row.bestCheckout || "—"}</td>`}
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

function renderTop3(rows, type) {
  if (!rows.length) return "";
  const top = rows.slice(0, 3);
  return `
    <div class="pill-list" style="margin-bottom:12px;">
      ${top
        .map((row, index) => {
          const label = type === "team" ? row.team : row.player.name;
          return `<div class="pill">#${index + 1} ${escapeHtml(label)}</div>`;
        })
        .join("")}
    </div>
  `;
}

function renderTeamRanking(ranking) {
  return `
    <table class="table">
      <thead>
        <tr>
          <th>#</th>
          <th>Équipe</th>
          <th>Matchs</th>
          <th>Victoires</th>
          <th>Winrate</th>
          <th>Moy./tour</th>
          <th>180</th>
          <th>Checkout</th>
        </tr>
      </thead>
      <tbody>
        ${ranking
          .map((row, index) => {
            return `
              <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(row.team)}</td>
                <td>${row.matches || 0}</td>
                <td>${row.wins || 0}</td>
                <td>${formatPercent(row.winrate)}</td>
                <td>${formatNumber(row.avgTurn, 1)}</td>
                <td>${row.count180 || 0}</td>
                <td>${row.bestCheckout || "—"}</td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

function applyRankingScore(rows) {
  if (!rows.length) return;
  const weights = getRankingWeights();
  const totalWeight = weights.wins + weights.winrate + weights.avgTurn + weights.avgDart;
  if (totalWeight === 0) {
    rows.forEach((row) => {
      row.rankScore = 0;
    });
    return;
  }

  const maxWins = Math.max(...rows.map((row) => row.wins || 0), 1);
  const maxAvgTurn = Math.max(...rows.map((row) => row.avgTurn || 0), 1);
  const maxAvgDart = Math.max(...rows.map((row) => row.avgDart || 0), 1);

  rows.forEach((row) => {
    const normWins = (row.wins || 0) / maxWins;
    const normWinrate = row.winrate || 0;
    const normAvgTurn = (row.avgTurn || 0) / maxAvgTurn;
    const normAvgDart = (row.avgDart || 0) / maxAvgDart;
    row.rankScore =
      normWins * weights.wins +
      normWinrate * weights.winrate +
      normAvgTurn * weights.avgTurn +
      normAvgDart * weights.avgDart;
  });
}

function renderRecentMatches(matches) {
  return `
    <div class="grid">
      ${matches
        .map((match) => {
          const winners = getMatchWinnerLabel(match);
          return `
            <div class="pill">
              ${escapeHtml(formatDate(match.date))} · ${match.mode.toUpperCase()} · ${escapeHtml(winners || "Sans vainqueur")}
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderModeOptions(selected) {
  return [
    { value: "501", label: "501" },
    { value: "301", label: "301" },
    { value: "cricket", label: "Cricket" },
  ]
    .map((opt) => `<option value="${opt.value}" ${opt.value === selected ? "selected" : ""}>${opt.label}</option>`)
    .join("");
}

function renderScoringOptions(selected) {
  return [
    { value: "live", label: "Tour par tour" },
    { value: "quick", label: "Saisie rapide" },
  ]
    .map((opt) => `<option value="${opt.value}" ${opt.value === selected ? "selected" : ""}>${opt.label}</option>`)
    .join("");
}

function renderRangeOptions(selected) {
  return [
    { value: "all", label: "Global" },
    { value: "7d", label: "7 derniers jours" },
    { value: "30d", label: "30 derniers jours" },
  ]
    .map((opt) => `<option value="${opt.value}" ${opt.value === selected ? "selected" : ""}>${opt.label}</option>`)
    .join("");
}

function renderTagOptions(selected) {
  const tags = getAvailableTags();
  const options = [{ value: "all", label: "Tous" }, ...tags.map((tag) => ({ value: tag, label: tag }))];
  return options
    .map((opt) => `<option value="${opt.value}" ${opt.value === selected ? "selected" : ""}>${escapeHtml(opt.label)}</option>`)
    .join("");
}

function getRangeLabel(range) {
  if (range === "7d") return "7 derniers jours";
  if (range === "30d") return "30 derniers jours";
  return "Global";
}

function getRankingWeights() {
  return {
    wins: state.settings?.rankingWeights?.wins ?? defaultSettings.rankingWeights.wins,
    winrate: state.settings?.rankingWeights?.winrate ?? defaultSettings.rankingWeights.winrate,
    avgTurn: state.settings?.rankingWeights?.avgTurn ?? defaultSettings.rankingWeights.avgTurn,
    avgDart: state.settings?.rankingWeights?.avgDart ?? defaultSettings.rankingWeights.avgDart,
  };
}

function getMatchesFiltered(range, tagFilter) {
  let matches = [...state.matches];
  if (range !== "all") {
    const days = range === "7d" ? 7 : 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    matches = matches.filter((match) => new Date(match.date).getTime() >= cutoff);
  }
  if (tagFilter && tagFilter !== "all") {
    matches = matches.filter((match) => match.tag === tagFilter);
  }
  return matches;
}

function filterMatchesByPlayers(matches, playerIds) {
  if (!playerIds || playerIds.length === 0) return matches;
  return matches.filter((match) => match.players.some((id) => playerIds.includes(id)));
}

function getAvailableTags() {
  const tags = new Set();
  state.matches.forEach((match) => {
    if (match.tag) tags.add(match.tag);
  });
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}

function formatPlayersList(playerIds) {
  return playerIds.map((id) => getPlayerName(id)).join(" · ");
}

function getMatchSettings(overrides) {
  return {
    doubleIn: overrides?.doubleIn ?? state.settings.doubleIn,
    doubleOut: overrides?.doubleOut ?? state.settings.doubleOut,
    bust: overrides?.bust ?? state.settings.bust,
    legsToWin: Math.max(1, Number(overrides?.legsToWin ?? state.settings.legsToWin ?? 1)),
    setsToWin: Math.max(1, Number(overrides?.setsToWin ?? state.settings.setsToWin ?? 1)),
  };
}

function sanitizePlayerIds(playerIds) {
  return (playerIds || []).filter((id) => getPlayer(id));
}

function getLastSetup() {
  const setup = state.lastSetup;
  if (!setup) return null;
  const players = sanitizePlayerIds(setup.players);
  if (players.length < 2) return null;
  const mode = isValidMode(setup.mode) ? setup.mode : state.settings.defaultMode;
  const teamMode = !!setup.teamMode;
  const teamAssignments = buildTeamAssignments(players, setup.teamAssignments, teamMode);
  const teamNames = normalizeTeamNames(setup.teamNames);
  const settings = getMatchSettings(setup.settings || {});
  const scoringMode = setup.scoringMode || state.settings.scoringMode;
  return {
    mode,
    players,
    teamMode,
    teamAssignments,
    teamNames,
    settings,
    scoringMode,
    tag: setup.tag || "",
  };
}

function saveLastSetup(setup) {
  if (!setup) return;
  const players = sanitizePlayerIds(setup.players);
  if (players.length < 2) return;
  state.lastSetup = {
    mode: setup.mode,
    players,
    teamMode: !!setup.teamMode,
    teamAssignments: setup.teamAssignments || {},
    teamNames: setup.teamNames || { A: "Équipe A", B: "Équipe B" },
    settings: setup.settings || {},
    scoringMode: setup.scoringMode || state.settings.scoringMode,
    tag: setup.tag || "",
  };
}

function isValidMode(mode) {
  return ["501", "301", "cricket"].includes(mode);
}

function normalizeTeamNames(teamNames) {
  if (!teamNames) return { A: "Équipe A", B: "Équipe B" };
  if (Array.isArray(teamNames)) {
    return { A: teamNames[0] || "Équipe A", B: teamNames[1] || "Équipe B" };
  }
  return {
    A: teamNames.A || "Équipe A",
    B: teamNames.B || "Équipe B",
    ...teamNames,
  };
}

function buildTeamAssignments(players, assignments, teamMode) {
  if (!teamMode) return assignments || {};
  const result = {};
  players.forEach((playerId, index) => {
    result[playerId] = assignments?.[playerId] || (index % 2 === 0 ? "A" : "B");
  });
  return result;
}

function startMatchFromSetup(setup) {
  const players = sanitizePlayerIds(setup.players);
  if (players.length < 2) {
    showToast("Ajoute au moins 2 joueurs");
    return;
  }
  const mode = isValidMode(setup.mode) ? setup.mode : state.settings.defaultMode;
  const teamMode = !!setup.teamMode;
  const teamAssignments = buildTeamAssignments(players, setup.teamAssignments, teamMode);
  const teamNames = normalizeTeamNames(setup.teamNames);
  const settings = getMatchSettings(setup.settings || {});
  const scoringMode = setup.scoringMode || state.settings.scoringMode;
  const payload = {
    mode,
    players,
    settings,
    teamMode,
    teamAssignments,
    teamNames,
    tag: setup.tag || "",
  };

  saveLastSetup({
    ...payload,
    scoringMode,
  });

  if (scoringMode === "live") {
    startLiveMatch(payload);
  } else {
    ui.quickDraft = {
      ...payload,
      scoringMode: "quick",
    };
    ui.view = "match";
    render();
  }
}

function startQuickPreset(preset) {
  const players = state.players.map((player) => player.id);
  const lastSetup = getLastSetup();
  const base = lastSetup?.players?.length ? lastSetup.players : players;
  const pick = (count) => base.slice(0, count);

  if (preset === "last") {
    if (!lastSetup) {
      showToast("Aucune partie récente");
      return;
    }
    startMatchFromSetup(lastSetup);
    return;
  }

  if (preset === "duel-501") {
    startMatchFromSetup({
      mode: "501",
      players: pick(2),
      teamMode: false,
      settings: {},
    });
    return;
  }

  if (preset === "duel-301") {
    startMatchFromSetup({
      mode: "301",
      players: pick(2),
      teamMode: false,
      settings: {},
    });
    return;
  }

  if (preset === "cricket") {
    startMatchFromSetup({
      mode: "cricket",
      players: pick(2),
      teamMode: false,
      settings: {},
    });
    return;
  }

  if (preset === "teams-2v2") {
    const selected = pick(4);
    const assignments = {};
    selected.forEach((playerId, index) => {
      assignments[playerId] = index % 2 === 0 ? "A" : "B";
    });
    startMatchFromSetup({
      mode: "501",
      players: selected,
      teamMode: true,
      teamAssignments: assignments,
      teamNames: { A: "Équipe A", B: "Équipe B" },
      settings: {},
    });
    return;
  }
}

function replayMatch(matchId) {
  const match = state.matches.find((item) => item.id === matchId);
  if (!match) return;
  startMatchFromSetup({
    mode: match.mode,
    players: match.players,
    teamMode: match.teamMode,
    teamAssignments: match.teamAssignments,
    teamNames: match.teamNames,
    settings: match.settings,
    scoringMode: match.scoringMode,
    tag: match.tag || "",
  });
}

function initMatchProgress({ players, teamMode, teamAssignments, teamNames }) {
  const sideIds = getMatchSideIds({ players, teamMode, teamAssignments, teamNames });
  const legs = {};
  const sets = {};
  sideIds.forEach((id) => {
    legs[id] = 0;
    sets[id] = 0;
  });
  return {
    currentLeg: 1,
    currentSet: 1,
    legs,
    sets,
    legResults: [],
  };
}

function ensureMatchProgress(match) {
  if (!match.progress) {
    match.progress = initMatchProgress(match);
  }
  if (!match.progress.legs || !match.progress.sets) {
    match.progress = initMatchProgress(match);
  }
  if (!Array.isArray(match.progress.legResults)) {
    match.progress.legResults = [];
  }
}

function getMatchSideIds(match) {
  if (match.teamMode) {
    const ids = [];
    match.players.forEach((playerId) => {
      const teamId = match.teamAssignments?.[playerId] || "A";
      if (!ids.includes(teamId)) ids.push(teamId);
    });
    return ids;
  }
  return [...match.players];
}

function handleLegWin(match, winnerPlayerId) {
  ensureMatchProgress(match);
  const settings = match.settings || defaultSettings;
  const legsToWin = Math.max(1, Number(settings.legsToWin) || 1);
  const setsToWin = Math.max(1, Number(settings.setsToWin) || 1);

  const winnerSideId = match.teamMode
    ? getMatchTeamId(match, winnerPlayerId) || winnerPlayerId
    : winnerPlayerId;

  match.lastLeg = {
    winnerPlayerId,
    winnerSideId,
    set: match.progress.currentSet,
    leg: match.progress.currentLeg,
    ts: new Date().toISOString(),
  };

  if (!match.progress.legs[winnerSideId]) match.progress.legs[winnerSideId] = 0;
  if (!match.progress.sets[winnerSideId]) match.progress.sets[winnerSideId] = 0;

  match.progress.legs[winnerSideId] += 1;
  match.progress.legResults.push({
    set: match.progress.currentSet,
    leg: match.progress.currentLeg,
    winnerPlayerId,
    winnerSideId,
    finishedAt: new Date().toISOString(),
  });

  let matchFinished = false;
  let newSetStarted = false;

  if (match.progress.legs[winnerSideId] >= legsToWin) {
    match.progress.sets[winnerSideId] += 1;
    Object.keys(match.progress.legs).forEach((id) => {
      match.progress.legs[id] = 0;
    });
    match.progress.currentSet += 1;
    match.progress.currentLeg = 1;
    newSetStarted = true;
  }

  if (match.progress.sets[winnerSideId] >= setsToWin) {
    matchFinished = true;
  }

  if (matchFinished) {
    const winners = match.teamMode
      ? getPlayersByTeam(match.players, match.teamAssignments, winnerSideId)
      : [winnerPlayerId];
    finalizeMatch(match, winners);
    return;
  }

  if (!newSetStarted) {
    match.progress.currentLeg += 1;
  }
  resetLeg(match, winnerPlayerId);
  saveState();
  render();
  showFlashOverlay("🏆", `${getPlayerName(winnerPlayerId)} gagne le leg !`, "Nouveau leg en cours…", 2000);
  cloudPushAuto();
}

function resetLeg(match, winnerPlayerId) {
  if (match.type === "x01") {
    const startScore = Number(match.mode);
    match.players.forEach((playerId) => {
      match.scoreboard[playerId] = {
        score: startScore,
        started: !match.settings.doubleIn,
      };
    });
  } else if (match.type === "cricket") {
    match.players.forEach((playerId) => {
      match.cricket.scores[playerId] = {
        marks: initCricketMarks(),
        points: 0,
      };
    });
  }
  const startIndex = match.players.indexOf(winnerPlayerId);
  match.currentTurnIndex = startIndex >= 0 ? startIndex : 0;
  ui.dartDraft = [];
  ui.dartMultiplier = 1;
}

function ensureMatchDraft() {
  if (!ui.matchDraft) {
    ui.matchDraft = {
      type: "solo",
      teamNames: ["Équipe A", "Équipe B"],
      teamAssignments: {},
      selectedPlayers: [],
    };
  }
  if (!Array.isArray(ui.matchDraft.teamNames) || ui.matchDraft.teamNames.length < 2) {
    ui.matchDraft.teamNames = ["Équipe A", "Équipe B"];
  }
  if (!Array.isArray(ui.matchDraft.selectedPlayers)) {
    ui.matchDraft.selectedPlayers = [];
  }
  state.players.forEach((player, index) => {
    if (!ui.matchDraft.teamAssignments[player.id]) {
      ui.matchDraft.teamAssignments[player.id] = index % 2 === 0 ? "A" : "B";
    }
  });
}

function applyTemplate(template) {
  ensureMatchDraft();
  const players = state.players.map((player) => player.id);
  const needed = {
    duel: 2,
    four: 4,
    teams2v2: 4,
  };
  const required = needed[template] || 0;
  if (required && players.length < required) {
    showToast(`Ajoute au moins ${required} joueurs`);
    return;
  }

  let selected = [];
  if (template === "duel") {
    ui.matchDraft.type = "solo";
    selected = players.slice(0, 2);
  } else if (template === "four") {
    ui.matchDraft.type = "solo";
    selected = players.slice(0, 4);
  } else if (template === "teams2v2") {
    ui.matchDraft.type = "teams";
    selected = players.slice(0, 4);
    selected.forEach((playerId, index) => {
      ui.matchDraft.teamAssignments[playerId] = index % 2 === 0 ? "A" : "B";
    });
  } else if (template === "all") {
    selected = [...players];
  }

  ui.matchDraft.selectedPlayers = selected;
  render();
  showToast("Template appliqué");
}

function buildTeamTurnOrder(players, assignments, randomize) {
  const teamIds = [];
  players.forEach((playerId) => {
    const teamId = assignments[playerId] || "A";
    if (!teamIds.includes(teamId)) teamIds.push(teamId);
  });
  const grouped = teamIds.map((teamId) => ({
    teamId,
    players: players.filter((playerId) => (assignments[playerId] || "A") === teamId),
  }));
  if (randomize) {
    grouped.forEach((team) => shuffle(team.players));
    shuffle(grouped);
  }
  const order = [];
  let index = 0;
  while (order.length < players.length) {
    grouped.forEach((team) => {
      if (team.players[index]) order.push(team.players[index]);
    });
    index += 1;
  }
  return order;
}

function getMatchTeamId(match, playerId) {
  if (match.teamMode && match.teamAssignments) {
    return match.teamAssignments[playerId] || null;
  }
  const player = getPlayer(playerId);
  const team = player?.team?.trim();
  return team || null;
}

function getMatchTeamName(match, teamId) {
  if (!teamId) return null;
  if (match.teamMode && match.teamNames) {
    return match.teamNames[teamId] || `Équipe ${teamId}`;
  }
  return teamId;
}

function getPlayersByTeam(players, assignments, teamId) {
  if (!teamId) return [];
  return players.filter((playerId) => (assignments[playerId] || "A") === teamId);
}

function formatMatchParticipants(match) {
  if (match.teamMode) {
    const teams = getMatchTeams(match);
    return teams.map((team) => `${team.name} (${team.playerIds.length})`).join(" · ");
  }
  return match.players.map((id) => playerLabel(id)).join(" · ");
}

function getMatchSideSummaries(match) {
  if (match.teamMode) {
    return getMatchTeams(match).map((team) => ({ id: team.id, name: team.name }));
  }
  return match.players.map((playerId) => ({ id: playerId, name: getPlayerName(playerId) }));
}

function getMatchWinnerLabel(match) {
  if (match.teamMode) {
    if (match.winnerTeamId) {
      return getMatchTeamName(match, match.winnerTeamId);
    }
    const winnerId = match.winnerIds?.[0];
    if (winnerId) {
      const teamId = getMatchTeamId(match, winnerId);
      return getMatchTeamName(match, teamId);
    }
    return "";
  }
  return (match.winnerIds || []).map((id) => getPlayerName(id)).join(", ");
}

function getMatchTeams(match) {
  if (match.teamMode && match.teamAssignments) {
    const teams = {};
    match.players.forEach((playerId) => {
      const teamId = match.teamAssignments[playerId] || "A";
      const name = getMatchTeamName(match, teamId);
      if (!teams[teamId]) {
        teams[teamId] = { id: teamId, name, playerIds: [] };
      }
      teams[teamId].playerIds.push(playerId);
    });
    return Object.values(teams);
  }

  const teams = {};
  match.players.forEach((playerId) => {
    const player = getPlayer(playerId);
    const name = player?.team?.trim();
    if (!name) return;
    if (!teams[name]) teams[name] = { id: name, name, playerIds: [] };
    teams[name].playerIds.push(playerId);
  });
  return Object.values(teams);
}

function getDartValues() {
  return dartValues;
}

function getCricketDartValues() {
  return [...cricketNumbers.map((num) => num.value), 0];
}

function addDart(base) {
  const match = state.activeMatch;
  if (!match) return;
  if (match.status === "paused") {
    showToast("Partie en pause");
    return;
  }

  if (ui.dartDraft.length >= 3) {
    showToast("Déjà 3 fléchettes");
    return;
  }

  const multiplier = ui.dartMultiplier;
  if (base === 25 && multiplier === 3) {
    showToast("Le triple bull n'existe pas");
    ui.dartMultiplier = 1;
    render();
    return;
  }

  const score = base * multiplier;
  ui.dartDraft.push({ base, multiplier, score });
  ui.dartMultiplier = 1;
  if (navigator.vibrate) navigator.vibrate(10);

  // Auto-submit: checkout detected (X01 only)
  if (match.type === "x01") {
    const playerId = match.players[match.currentTurnIndex];
    const playerState = match.scoreboard[playerId];
    const dartTotal = ui.dartDraft.reduce((s, d) => s + d.score, 0);
    const remaining = playerState.score - dartTotal;
    const lastDart = ui.dartDraft[ui.dartDraft.length - 1];
    const isValidFinish = !match.settings.doubleOut || lastDart.multiplier === 2;
    if (remaining === 0 && isValidFinish) {
      submitX01TurnFromDarts();
      return;
    }
  }

  // Auto-submit after 3rd dart
  if (ui.dartDraft.length === 3) {
    if (match.type === "x01") {
      submitX01TurnFromDarts();
    } else if (match.type === "cricket") {
      submitCricketTurnFromDarts();
    }
    return;
  }

  render();
}

function formatDart(dart) {
  const prefix = dart.multiplier === 2 ? "D" : dart.multiplier === 3 ? "T" : "";
  if (dart.base === 0) return "Miss";
  if (dart.base === 25) return `${prefix}Bull`;
  return `${prefix}${dart.base}`;
}

function initCricketMarks() {
  const marks = {};
  cricketNumbers.forEach((num) => {
    marks[num.key] = 0;
  });
  return marks;
}

function playerLabel(id) {
  const player = getPlayer(id);
  return player ? player.name : "Joueur supprimé";
}

function getPlayer(id) {
  return state.players.find((player) => player.id === id) || null;
}

function getPlayerName(id) {
  const player = getPlayer(id);
  return player ? player.name : "Joueur supprimé";
}

function exportData() {
  const date = new Date().toISOString().slice(0, 10);
  const groupName = store.groupList.find((group) => group.id === store.activeGroupId)?.name || "groupe";
  const safeName = slugify(groupName) || "groupe";
  downloadFile(JSON.stringify(state, null, 2), `minus-${safeName}-${date}.json`, "application/json");
}

function exportAllData() {
  const date = new Date().toISOString().slice(0, 10);
  const payloadStore = {
    ...store,
    gist: { gistId: store.gist?.gistId || "", token: "" },
  };
  downloadFile(JSON.stringify(payloadStore, null, 2), `minus-backup-complet-${date}.json`, "application/json");
}

function importData(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const isStore = data && data.groups && data.groupList;
      if (isStore) {
        if (!confirm("Importer ce fichier va remplacer tous les groupes locaux. Continuer ?")) {
          return;
        }
        store = normalizeStore(data);
        state = store.groups[store.activeGroupId];
      } else if (data && Array.isArray(data.players) && Array.isArray(data.matches)) {
        if (!confirm("Importer ce fichier va remplacer le groupe actif. Continuer ?")) {
          return;
        }
        state = normalizeGroup(data);
        store.groups[store.activeGroupId] = state;
      } else {
        throw new Error("invalid");
      }
      saveState();
      ui.quickDraft = null;
      ui.editingPlayerId = null;
      ui.profilePlayerId = null;
      ui.historySelectedId = null;
      ui.view = "home";
      render();
      showToast("Import réussi");
    } catch (err) {
      console.error(err);
      showToast("Fichier invalide");
    }
  };
  reader.readAsText(file);
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function exportPlayersCSV() {
  const ranking = getPlayerRanking("all", "all");
  const header = [
    "rank",
    "player",
    "matches",
    "wins",
    "winrate_pct",
    "avg_turn",
    "avg_dart",
    "avg_3_dart",
    "count_180",
    "best_checkout",
    "rank_score",
  ];
  const rows = ranking.map((row, index) => [
    index + 1,
    row.player?.name || "",
    row.matches || 0,
    row.wins || 0,
    formatCSVNumber((row.winrate || 0) * 100, 1),
    formatCSVNumber(row.avgTurn, 1),
    formatCSVNumber(row.avgDart, 2),
    formatCSVNumber(row.avgThreeDart, 1),
    row.count180 || 0,
    row.bestCheckout || "",
    formatCSVNumber(row.rankScore, 3),
  ]);
  const csv = toCSV([header, ...rows]);
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(csv, `minus-classement-joueurs-${date}.csv`, "text/csv");
}

function exportTeamsCSV() {
  const ranking = getTeamRanking("all", "all");
  const header = [
    "rank",
    "team",
    "matches",
    "wins",
    "winrate_pct",
    "avg_turn",
    "avg_dart",
    "avg_3_dart",
    "count_180",
    "best_checkout",
    "rank_score",
  ];
  const rows = ranking.map((row, index) => [
    index + 1,
    row.team || "",
    row.matches || 0,
    row.wins || 0,
    formatCSVNumber((row.winrate || 0) * 100, 1),
    formatCSVNumber(row.avgTurn, 1),
    formatCSVNumber(row.avgDart, 2),
    formatCSVNumber(row.avgThreeDart, 1),
    row.count180 || 0,
    row.bestCheckout || "",
    formatCSVNumber(row.rankScore, 3),
  ]);
  const csv = toCSV([header, ...rows]);
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(csv, `minus-classement-equipes-${date}.csv`, "text/csv");
}

function formatCSVNumber(value, decimals) {
  if (!Number.isFinite(value)) return "";
  return value.toFixed(decimals);
}

function toCSV(rows, delimiter = ",") {
  return rows
    .map((row) => row.map((cell) => csvEscape(cell, delimiter)).join(delimiter))
    .join("\n");
}

function csvEscape(value, delimiter) {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes("\"") || str.includes(delimiter) || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, "\"\"")}"`;
  }
  return str;
}

function parseCSV(text) {
  if (!text) return [];
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim() !== "");
  if (!lines.length) return [];
  const sample = lines[0].replace(/^\uFEFF/, "");
  const commaCount = (sample.match(/,/g) || []).length;
  const semiCount = (sample.match(/;/g) || []).length;
  const delimiter = semiCount > commaCount ? ";" : ",";
  return lines.map((line, index) => parseCSVLine(index === 0 ? line.replace(/^\uFEFF/, "") : line, delimiter));
}

function parseCSVLine(line, delimiter) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === "\"") {
      const next = line[i + 1];
      if (inQuotes && next === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function importPlayersCSV(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const rows = parseCSV(reader.result);
      if (!rows.length) {
        showToast("CSV vide");
        return;
      }
      const header = rows[0].map((cell) => cell.toLowerCase().trim());
      const nameIndex = header.findIndex((cell) => ["name", "nom", "joueur", "player"].includes(cell));
      const teamIndex = header.findIndex((cell) => ["team", "equipe", "équipe"].includes(cell));
      const hasHeader = nameIndex >= 0 || teamIndex >= 0;
      const startIndex = hasHeader ? 1 : 0;
      const idxName = nameIndex >= 0 ? nameIndex : 0;
      const idxTeam = teamIndex >= 0 ? teamIndex : 1;
      let added = 0;
      let updated = 0;
      let skipped = 0;

      rows.slice(startIndex).forEach((row) => {
        const name = row[idxName]?.trim();
        if (!name) return;
        const team = row[idxTeam]?.trim() || "";
        const existing = state.players.find((player) => player.name.toLowerCase() === name.toLowerCase());
        if (existing) {
          if (team && existing.team !== team) {
            existing.team = team;
            updated += 1;
          } else {
            skipped += 1;
          }
          return;
        }
        state.players.push({
          id: uid(),
          name,
          team,
          createdAt: new Date().toISOString(),
        });
        added += 1;
      });

      saveState();
      render();
      showToast(`Import CSV : ${added} ajoutés, ${updated} mis à jour${skipped ? `, ${skipped} ignorés` : ""}`);
    } catch (err) {
      console.error(err);
      showToast("CSV invalide");
    }
  };
  reader.readAsText(file);
}

async function pushToGist() {
  const token = store.gist?.token?.trim();
  if (!token) {
    showToast("Ajoute un token GitHub");
    return;
  }
  const payloadStore = {
    ...store,
    gist: { gistId: store.gist?.gistId || "", token: "" },
  };
  const payload = {
    description: "Minus backup",
    public: false,
    files: {
      "minus-data.json": { content: JSON.stringify(payloadStore, null, 2) },
    },
  };
  const gistId = store.gist?.gistId?.trim();
  const url = gistId ? `https://api.github.com/gists/${gistId}` : "https://api.github.com/gists";
  const method = gistId ? "PATCH" : "POST";
  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (data?.id && !gistId) {
      store.gist.gistId = data.id;
    }
    saveState();
    showToast("Sauvegarde Gist OK");
  } catch (err) {
    console.error(err);
    showToast("Erreur Gist");
  }
}

async function pullFromGist() {
  const gistId = store.gist?.gistId?.trim();
  if (!gistId) {
    showToast("Ajoute un Gist ID");
    return;
  }
  if (!confirm("Restaurer depuis le Gist va remplacer les données locales. Continuer ?")) {
    return;
  }
  const token = store.gist?.token?.trim();
  const localToken = token || "";
  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    const file = data?.files?.["minus-data.json"] || Object.values(data?.files || {})[0];
    if (!file) {
      showToast("Fichier Gist introuvable");
      return;
    }
    let content = file.content;
    if (file.truncated && file.raw_url) {
      const rawResponse = await fetch(file.raw_url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!rawResponse.ok) {
        throw new Error(`HTTP ${rawResponse.status}`);
      }
      content = await rawResponse.text();
    }
    const parsed = JSON.parse(content);
    if (parsed?.groups && parsed?.groupList) {
      store = normalizeStore(parsed);
      if (localToken) store.gist.token = localToken;
      if (!store.gist.gistId && gistId) store.gist.gistId = gistId;
      state = store.groups[store.activeGroupId];
    } else if (parsed?.players && parsed?.matches) {
      state = normalizeGroup(parsed);
      store.groups[store.activeGroupId] = state;
    } else {
      showToast("Gist invalide");
      return;
    }
    saveState();
    render();
    showToast("Gist restauré");
  } catch (err) {
    console.error(err);
    showToast("Erreur Gist");
  }
}

async function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.error("Supabase init error", err);
    return;
  }

  try {
    const { data } = await supabase.auth.getSession();
    cloud.session = data?.session || null;
  } catch (err) {
    console.error("Supabase session error", err);
    cloud.session = null;
  }

  if (cloud.session) {
    await loadCloudGroups();
  } else {
    render();
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    cloud.session = session;
    cloud.error = null;
    if (session) {
      loadCloudGroups().then(() => subscribeRealtime());
    } else {
      unsubscribeRealtime();
      cloud.groups = [];
      render();
    }
  });
}

async function cloudSignIn(email) {
  if (!supabase) return;
  cloud.loading = true;
  cloud.error = null;
  render();
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });
  cloud.loading = false;
  if (error) {
    cloud.error = error.message;
    showToast("Connexion impossible");
  } else {
    showToast("Lien envoyé");
  }
  render();
}

async function cloudSignOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
  unsubscribeRealtime();
  cloud.session = null;
  cloud.groups = [];
  cloud.error = null;
  render();
  showToast("Déconnecté");
}

function subscribeRealtime() {
  if (!supabase || !cloud.session || !state.cloudGroupId) return;
  unsubscribeRealtime();
  realtimeChannel = supabase
    .channel(`group-${state.cloudGroupId}`)
    .on("postgres_changes", {
      event: "UPDATE",
      schema: "public",
      table: "groups",
      filter: `id=eq.${state.cloudGroupId}`,
    }, (payload) => {
      if (!payload.new?.data) return;
      const incoming = payload.new.data;
      // Ne pas écraser si on est le device qui score (on a plus de tours en local)
      const incomingTurns = incoming.activeMatch?.turns?.length ?? -1;
      const localTurns = state.activeMatch?.turns?.length ?? -1;
      if (state.activeMatch && incomingTurns < localTurns) return;
      const cloudGroupId = state.cloudGroupId;
      state = normalizeGroup(incoming);
      state.cloudGroupId = cloudGroupId;
      saveState();
      render();
    })
    .subscribe();
}

function unsubscribeRealtime() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}

async function cloudPushAuto() {
  if (!supabase || !cloud.session || !state.cloudGroupId) return;
  const groupName = store.groupList.find((g) => g.id === store.activeGroupId)?.name || "Groupe";
  const payload = getCloudPayload(state);
  await supabase.from("groups").update({ name: groupName, data: payload }).eq("id", state.cloudGroupId);
}

async function loadCloudGroups() {
  if (!supabase || !cloud.session) return;
  cloud.loading = true;
  cloud.error = null;
  render();
  const { data, error } = await supabase
    .from("groups")
    .select("id,name,updated_at,invite_code")
    .order("updated_at", { ascending: false });
  if (error) {
    cloud.error = error.message;
  } else {
    cloud.groups = data || [];
  }
  cloud.loading = false;

  if (state.cloudGroupId && !cloud.groups.find((group) => group.id === state.cloudGroupId)) {
    state.cloudGroupId = null;
    saveState();
  }

  render();
}

async function cloudCreateGroup(name) {
  if (!supabase || !cloud.session) {
    showToast("Connecte-toi d'abord");
    return;
  }
  cloud.loading = true;
  cloud.error = null;
  render();

  const payload = getCloudPayload(state);
  const ownerId = cloud.session.user.id;
  let created = null;
  let lastError = null;

  for (let attempt = 0; attempt < 5 && !created; attempt += 1) {
    const inviteCode = generateInviteCode(6);
    const { data, error } = await supabase
      .from("groups")
      .insert({
        name,
        owner_id: ownerId,
        invite_code: inviteCode,
        data: payload,
      })
      .select("id,name,updated_at,invite_code")
      .single();

    if (error) {
      if (error.code === "23505") {
        lastError = error;
        continue;
      }
      lastError = error;
      break;
    }
    created = data;
  }

  if (!created) {
    cloud.loading = false;
    cloud.error = lastError?.message || "Erreur création";
    render();
    showToast("Erreur cloud");
    return;
  }

  try {
    await supabase
      .from("group_members")
      .upsert(
        { group_id: created.id, user_id: ownerId, role: "owner" },
        { onConflict: "group_id,user_id" }
      );
  } catch (err) {
    console.warn("Membership insert error", err);
  }

  state.cloudGroupId = created.id;
  saveState();
  await loadCloudGroups();
  showToast("Groupe cloud créé");
}

async function cloudJoinGroup(code) {
  if (!supabase || !cloud.session) {
    showToast("Connecte-toi d'abord");
    return;
  }
  cloud.loading = true;
  cloud.error = null;
  render();

  const normalized = code.trim().toUpperCase();
  const { data, error } = await supabase.rpc("join_group_by_code", { invite_code: normalized });
  if (error) {
    cloud.loading = false;
    cloud.error = error.message;
    render();
    showToast("Code invalide");
    return;
  }

  const groupId = typeof data === "string" ? data : data?.id || data?.group_id;
  if (groupId) {
    state.cloudGroupId = groupId;
    saveState();
  }

  await loadCloudGroups();
  showToast("Groupe rejoint");
}

async function cloudPush() {
  if (!supabase || !cloud.session) {
    showToast("Connecte-toi d'abord");
    return;
  }
  if (!state.cloudGroupId) {
    showToast("Choisis un groupe cloud");
    return;
  }

  cloud.loading = true;
  cloud.error = null;
  render();

  const groupName = store.groupList.find((group) => group.id === store.activeGroupId)?.name || "Groupe";
  const payload = getCloudPayload(state);
  const { error } = await supabase.from("groups").update({ name: groupName, data: payload }).eq("id", state.cloudGroupId);

  cloud.loading = false;
  if (error) {
    cloud.error = error.message;
    render();
    showToast("Erreur cloud");
    return;
  }

  await loadCloudGroups();
  showToast("Cloud mis à jour");
}

async function cloudPull() {
  if (!supabase || !cloud.session) {
    showToast("Connecte-toi d'abord");
    return;
  }
  if (!state.cloudGroupId) {
    showToast("Choisis un groupe cloud");
    return;
  }
  if (!confirm("Importer depuis le cloud va remplacer les données locales. Continuer ?")) {
    return;
  }

  cloud.loading = true;
  cloud.error = null;
  render();

  const { data, error } = await supabase
    .from("groups")
    .select("id,name,data")
    .eq("id", state.cloudGroupId)
    .single();

  cloud.loading = false;
  if (error || !data?.data) {
    cloud.error = error?.message || "Données introuvables";
    render();
    showToast("Erreur cloud");
    return;
  }

  const nextState = normalizeGroup(data.data);
  nextState.cloudGroupId = data.id;
  state = nextState;
  const localGroup = store.groupList.find((group) => group.id === store.activeGroupId);
  if (localGroup && data.name) {
    localGroup.name = data.name;
  }
  saveState();
  render();
  showToast("Données importées");
}

function getCloudPayload(group) {
  const payload = clone(group);
  delete payload.cloudGroupId;
  return payload;
}

function generateInviteCode(length) {
  const size = Math.max(4, Number(length) || 6);
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < size; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function copyInviteCode(code) {
  if (!code) {
    showToast("Code indisponible");
    return;
  }
  if (!navigator.clipboard?.writeText) {
    showToast("Copie non disponible");
    return;
  }
  navigator.clipboard
    .writeText(code)
    .then(() => showToast("Code copié"))
    .catch(() => showToast("Copie impossible"));
}

function updateFooter() {
  const meta = document.getElementById("footer-meta");
  if (!meta) return;
  const groupName = store.groupList.find((group) => group.id === store.activeGroupId)?.name || "Groupe";
  meta.textContent = `${groupName} · ${state.players.length} joueurs · ${state.matches.length} parties`;
}

function isFullscreen() {
  return Boolean(document.fullscreenElement);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().catch(() => {});
  } else {
    document.exitFullscreen?.().catch(() => {});
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

function runDiagnostics() {
  const issues = [];

  const nameMap = new Map();
  state.players.forEach((player) => {
    const name = (player.name || "").toLowerCase();
    if (!name) {
      issues.push("Joueur sans nom");
    } else if (nameMap.has(name)) {
      issues.push(`Doublon de joueur: ${player.name}`);
    } else {
      nameMap.set(name, true);
    }
  });

  const validateMatch = (match, label) => {
    if (!isValidMode(match.mode)) issues.push(`${label}: mode invalide`);
    if (!match.players || match.players.length < 2) issues.push(`${label}: moins de 2 joueurs`);
    const missingPlayers = (match.players || []).filter((id) => !getPlayer(id));
    if (missingPlayers.length) issues.push(`${label}: joueur(s) manquant(s)`);
    const settings = match.settings || {};
    if ((settings.legsToWin || 1) < 1 || (settings.setsToWin || 1) < 1) {
      issues.push(`${label}: legs/sets invalides`);
    }
    if (match.teamMode) {
      const teams = new Set(Object.values(match.teamAssignments || {}));
      if (teams.size < 2) issues.push(`${label}: équipes insuffisantes`);
    }
  };

  state.matches.forEach((match, index) => {
    validateMatch(match, `Match ${index + 1}`);
  });

  if (state.activeMatch) validateMatch(state.activeMatch, "Match en cours");

  if (issues.length) {
    console.warn("Diagnostics Minus", issues);
    showToast(`${issues.length} problème(s) détecté(s) (console)`);
  } else {
    showToast("Diagnostic OK");
  }
}

function loadTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light") return stored;
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function applyTheme(theme) {
  currentTheme = theme;
  document.body.classList.toggle("theme-dark", theme === "dark");
  localStorage.setItem(THEME_KEY, theme);
  updateThemeToggle();
}

function toggleTheme() {
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  render();
  showToast(nextTheme === "dark" ? "Mode sombre activé" : "Mode clair activé");
}

function updateThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.textContent = currentTheme === "dark" ? "Mode clair" : "Mode sombre";
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._timeout);
  showToast._timeout = setTimeout(() => toast.classList.remove("show"), 2200);
}

function showFlashOverlay(icon, title, subtitle = "", duration = 900) {
  const overlay = document.getElementById("flash-overlay");
  if (!overlay) return;
  document.getElementById("flash-icon").textContent = icon;
  document.getElementById("flash-title").textContent = title;
  document.getElementById("flash-subtitle").textContent = subtitle;
  overlay.classList.remove("hidden");
  clearTimeout(showFlashOverlay._timer);
  showFlashOverlay._timer = setTimeout(() => overlay.classList.add("hidden"), duration);
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

function formatNumber(value, decimals) {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(decimals);
}

function formatDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function uid() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `id-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultStore();
    const data = JSON.parse(raw);

    if (data.groups && data.groupList) {
      const groups = {};
      data.groupList.forEach((group) => {
        const groupData = data.groups[group.id] || clone(defaultGroupState);
        groups[group.id] = normalizeGroup(groupData);
      });
      const activeGroupId = groups[data.activeGroupId] ? data.activeGroupId : data.groupList[0]?.id;
      return {
        groups,
        groupList: data.groupList,
        activeGroupId,
        gist: data.gist || { token: "", gistId: "" },
      };
    }

    const groupId = uid();
    const legacyGroup = normalizeGroup(data);
    return {
      groups: { [groupId]: legacyGroup },
      groupList: [{ id: groupId, name: "Principal" }],
      activeGroupId: groupId,
      gist: { token: "", gistId: "" },
    };
  } catch (err) {
    console.error(err);
    return createDefaultStore();
  }
}

function normalizeStore(data) {
  if (!data || !data.groups || !data.groupList) return createDefaultStore();
  const groups = {};
  const groupList = Array.isArray(data.groupList) ? data.groupList : [];
  groupList.forEach((group) => {
    const groupData = data.groups[group.id] || clone(defaultGroupState);
    groups[group.id] = normalizeGroup(groupData);
  });
  const activeGroupId = groups[data.activeGroupId] ? data.activeGroupId : groupList[0]?.id;
  return {
    groups,
    groupList,
    activeGroupId,
    gist: data.gist || { token: "", gistId: "" },
  };
}

function normalizeMatch(match) {
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

function createDefaultStore() {
  const groupId = uid();
  return {
    groups: { [groupId]: clone(defaultGroupState) },
    groupList: [{ id: groupId, name: "Principal" }],
    activeGroupId: groupId,
    gist: { token: "", gistId: "" },
  };
}

function normalizeGroup(group) {
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

function normalizeActiveMatch(match) {
  if (!match) return null;
  const normalized = normalizeMatch(match);
  normalized.status = match.status || "live";
  normalized.progress = match.progress || initMatchProgress(normalized);
  if (normalized.type === "x01" && !normalized.scoreboard) return null;
  if (normalized.type === "cricket" && !normalized.cricket?.scores) return null;
  return normalized;
}

function setActiveGroup(groupId) {
  if (!store.groups[groupId]) return;
  store.activeGroupId = groupId;
  state = store.groups[groupId];
  ui.view = "home";
  ui.quickDraft = null;
  ui.editingPlayerId = null;
  ui.profilePlayerId = null;
  ui.historySelectedId = null;
  ui.historyPlayerFilter = [];
  if (ui.matchDraft) ui.matchDraft.selectedPlayers = [];
  ui.dartDraft = [];
  ui.dartMultiplier = 1;
  saveState();
}

function createGroup(name) {
  const groupId = uid();
  store.groups[groupId] = clone(defaultGroupState);
  store.groupList.push({ id: groupId, name: name || "Nouveau groupe" });
  setActiveGroup(groupId);
}

function renameGroup(groupId, name) {
  const group = store.groupList.find((item) => item.id === groupId);
  if (!group) return;
  group.name = name || group.name;
  saveState();
}

function deleteGroup(groupId) {
  if (store.groupList.length <= 1) {
    showToast("Au moins un groupe est requis");
    return;
  }
  store.groupList = store.groupList.filter((item) => item.id !== groupId);
  delete store.groups[groupId];
  if (store.activeGroupId === groupId) {
    store.activeGroupId = store.groupList[0].id;
    state = store.groups[store.activeGroupId];
  }
  saveState();
}

function saveState() {
  store.groups[store.activeGroupId] = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  updateFooter();
}
