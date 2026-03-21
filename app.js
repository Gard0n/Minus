const STORAGE_KEY = "minus_darts_v1";
const THEME_KEY = "minus_theme";

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
};

let store = loadStore();
let state = store.groups[store.activeGroupId];
let currentTheme = loadTheme();

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
  },
  dartDraft: [],
  dartMultiplier: 1,
  historyRange: "all",
  historySelectedId: null,
  tagFilter: "all",
  historyTagFilter: "all",
  profilePlayerId: null,
};

applyTheme(currentTheme);
init();

function init() {
  bindEvents();
  render();
}

function bindEvents() {
  document.addEventListener("click", handleClick);
  document.addEventListener("submit", handleSubmit);
  document.addEventListener("change", handleChange);
}

function handleClick(event) {
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
    if (confirm("Annuler la partie en cours ?")) {
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
    if (confirm("Réinitialiser les données du groupe actif ?")) {
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

function handleSubmit(event) {
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

  if (target.dataset.change === "group-select") {
    setActiveGroup(target.value);
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
  renderStats();
  renderHistory();
  renderProfile();
  renderSettings();
  showView(ui.view);
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
  const defaultLegs = state.settings.legsToWin || 1;
  const defaultSets = state.settings.setsToWin || 1;

  view.innerHTML = `
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
          <label>Joueurs</label>
          <div class="pill-list">
            ${state.players
              .map((player) => {
                const assigned = ui.matchDraft.teamAssignments[player.id] || "A";
                return `
                  <div class="player-row">
                    <label class="player-pill">
                      <input type="checkbox" name="matchPlayers" value="${player.id}" />
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

function renderActiveMatch() {
  const match = state.activeMatch;
  const playerNames = formatMatchParticipants(match);
  const isPaused = match.status === "paused";
  const pauseLabel = isPaused ? "Reprendre" : "Mettre en pause";
  const pauseBadge = isPaused ? `<span class="badge">Pause</span>` : "";
  const disabledAttr = isPaused ? "disabled" : "";
  const progressCard = renderMatchProgress(match);

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
    const dartLabels = ui.dartDraft.length
      ? ui.dartDraft.map((dart) => `<div class="pill">${escapeHtml(formatDart(dart))}</div>`).join("")
      : `<div class="subtle">Aucune fléchette pour ce tour.</div>`;

    return `
      ${progressCard}
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Partie ${match.mode}</h3>
            <div class="subtle">${playerNames}</div>
          </div>
          <div class="inline-actions">
            <button class="btn ghost" data-action="toggle-pause">${pauseLabel}</button>
            <button class="btn ghost" data-action="undo-turn">Annuler le dernier tour</button>
            <button class="btn danger" data-action="cancel-match">Annuler la partie</button>
          </div>
        </div>
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

      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Tour de ${escapeHtml(getPlayerName(currentPlayerId))}</h3>
            <div class="subtle">Reste à faire : ${currentState.score}</div>
          </div>
          ${pauseBadge}
          ${match.settings.doubleIn && !currentState.started ? `<span class="badge">Double-in requis</span>` : ""}
        </div>
        <div class="dartpad">
          <div class="inline-actions">
            <button class="btn small ghost ${ui.dartMultiplier === 2 ? "active" : ""}" data-action="dart-multiplier" data-multiplier="2" ${disabledAttr}>Double</button>
            <button class="btn small ghost ${ui.dartMultiplier === 3 ? "active" : ""}" data-action="dart-multiplier" data-multiplier="3" ${disabledAttr}>Triple</button>
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
        <div class="dart-summary">
          <div class="pill-list">${dartLabels}</div>
          <div class="split" style="margin-top:10px;">
            <div>
              <div class="stats-number">${dartTotal}</div>
              <div class="stats-label">Total du tour</div>
            </div>
          </div>
          <div class="inline-actions" style="margin-top:12px;">
            <button class="btn ghost" data-action="dart-undo" ${disabledAttr}>Annuler fléchette</button>
            <button class="btn ghost" data-action="dart-clear" ${disabledAttr}>Vider le tour</button>
            <button class="btn" data-action="submit-darts" ${disabledAttr}>Valider le tour</button>
          </div>
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
            .map((num) => `<td>${data.marks[num.key]}</td>`)
            .join("")}
          <td><strong>${data.points}</strong></td>
        </tr>
      `;
    })
    .join("");

  const lastTurns = match.turns.slice(-5).reverse();
  const dartTotal = ui.dartDraft.reduce((sum, dart) => sum + dart.score, 0);
  const dartLabels = ui.dartDraft.length
    ? ui.dartDraft.map((dart) => `<div class="pill">${escapeHtml(formatDart(dart))}</div>`).join("")
    : `<div class="subtle">Aucune fléchette pour ce tour.</div>`;

  return `
    ${progressCard}
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Cricket</h3>
          <div class="subtle">${playerNames}</div>
        </div>
        <div class="inline-actions">
          <button class="btn ghost" data-action="toggle-pause">${pauseLabel}</button>
          <button class="btn ghost" data-action="undo-turn">Annuler le dernier tour</button>
          <button class="btn danger" data-action="cancel-match">Annuler la partie</button>
        </div>
      </div>
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

    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Tour de ${escapeHtml(getPlayerName(currentPlayerId))}</h3>
          <div class="subtle">Ajoute les fléchettes du tour (simple, double, triple).</div>
        </div>
        ${pauseBadge}
      </div>
      <div class="dartpad">
        <div class="inline-actions">
          <button class="btn small ghost ${ui.dartMultiplier === 2 ? "active" : ""}" data-action="dart-multiplier" data-multiplier="2" ${disabledAttr}>Double</button>
          <button class="btn small ghost ${ui.dartMultiplier === 3 ? "active" : ""}" data-action="dart-multiplier" data-multiplier="3" ${disabledAttr}>Triple</button>
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
      <div class="dart-summary">
        <div class="pill-list">${dartLabels}</div>
        <div class="split" style="margin-top:10px;">
          <div>
            <div class="stats-number">${dartTotal}</div>
            <div class="stats-label">Total du tour</div>
          </div>
        </div>
        <div class="inline-actions" style="margin-top:12px;">
          <button class="btn ghost" data-action="dart-undo" ${disabledAttr}>Annuler fléchette</button>
          <button class="btn ghost" data-action="dart-clear" ${disabledAttr}>Vider le tour</button>
          <button class="btn" data-action="submit-cricket-darts" ${disabledAttr}>Valider le tour</button>
        </div>
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

  if (ui.rankingMode === "players") {
    const ranking = getPlayerRanking(ui.rankingRange);
    rankingContent = ranking.length
      ? renderRankingTable(ranking, { compact: false })
      : `<p class="subtle">Aucune donnée.</p>`;
  } else {
    const teamRanking = getTeamRanking(ui.rankingRange);
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
        ${rankingContent}
      </div>
    </div>
  `;
}

function renderHistory() {
  const view = document.getElementById("view-history");
  const matches = getMatchesFiltered(ui.historyRange, ui.historyTagFilter)
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
        <button type="button" class="btn danger" data-action="delete-match" data-id="${match.id}">Supprimer</button>
      </div>
    </form>
  `;
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

  if (finished) {
    handleLegWin(match, playerId);
    return;
  }

  match.currentTurnIndex = (match.currentTurnIndex + 1) % match.players.length;
  saveState();
  render();
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

  if (isCricketWinner(match, playerId)) {
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
  state.activeMatch = null;
  ui.dartDraft = [];
  ui.dartMultiplier = 1;
  saveState();
  render();
  showToast("Partie terminée");
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

function getAvailableTags() {
  const tags = new Set();
  state.matches.forEach((match) => {
    if (match.tag) tags.add(match.tag);
  });
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
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
  showToast("Nouveau leg");
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
    };
  }
  if (!Array.isArray(ui.matchDraft.teamNames) || ui.matchDraft.teamNames.length < 2) {
    ui.matchDraft.teamNames = ["Équipe A", "Équipe B"];
  }
  state.players.forEach((player, index) => {
    if (!ui.matchDraft.teamAssignments[player.id]) {
      ui.matchDraft.teamAssignments[player.id] = index % 2 === 0 ? "A" : "B";
    }
  });
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

function updateFooter() {
  const meta = document.getElementById("footer-meta");
  if (!meta) return;
  const groupName = store.groupList.find((group) => group.id === store.activeGroupId)?.name || "Groupe";
  meta.textContent = `${groupName} · ${state.players.length} joueurs · ${state.matches.length} parties`;
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
