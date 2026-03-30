import { app, saveState, setActiveGroup, createGroup, renameGroup, deleteGroup, getPlayer, getPlayerName, getPlayersByTeam, ensureMatchDraft } from "../state.js";
import { uid, shuffle } from "../utils.js";
import { processX01Turn, undoX01Turn } from "../game/x01.js";
import { processCricketTurn, undoCricketTurn } from "../game/cricket.js";
import { startLiveMatch, processLegWin, resetLeg, finalizeMatch, replayMatch, buildTeamTurnOrder, applyTemplate } from "../game/match.js";
import { buildDart } from "../game/dart.js";
import { cloudSignIn, cloudSignOut, cloudPush, cloudPull, loadCloudGroups, cloudCreateGroup, cloudJoinGroup, cloudPushAuto, subscribeRealtime, shareInvite } from "../services/supabase.js";
import { exportData, exportAllData, importData, exportPlayersCSV } from "../services/export.js";
import { showToast } from "./components/toast.js";
import { showFlashOverlay, dismissFlash } from "./components/flash.js";
import { render } from "./render.js";
import { applyTheme, loadTheme } from "../state.js";

let currentTheme = loadTheme();

export function bindEvents() {
  document.addEventListener("click", handleClick);
  document.addEventListener("submit", handleSubmit);
  document.addEventListener("change", handleChange);
  document.addEventListener("fullscreenchange", () => { if (app.ui.view === "board") render(); });
}

// ── Click handler ────────────────────────────────────────────────────────────

async function handleClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;

  if (action === "nav") {
    app.ui.view = target.dataset.view;
    render();
    return;
  }

  if (action === "toggle-theme") {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(currentTheme);
    render();
    return;
  }

  if (action === "quick-start") {
    applyTemplate(target.dataset.preset);
    render();
    return;
  }

  if (action === "dismiss-overlay") { dismissFlash(); return; }

  if (action === "dismiss-summary") {
    app.state.lastSummaryId = null;
    saveState();
    render();
    return;
  }

  if (action === "replay-match") {
    replayMatch(target.dataset.id);
    app.ui.view = "match";
    render();
    return;
  }

  if (action === "toggle-fullscreen") {
    const el = document.documentElement;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.();
    return;
  }

  if (action === "export") { exportData(); return; }
  if (action === "export-all") { exportAllData(); return; }
  if (action === "export-players-csv") { exportPlayersCSV(); return; }

  if (action === "edit-player") {
    app.ui.editingPlayerId = target.dataset.id;
    app.ui.view = "settings";
    render();
    return;
  }

  if (action === "view-player") {
    app.ui.profilePlayerId = target.dataset.id;
    app.ui.view = "profile";
    render();
    return;
  }

  if (action === "delete-player") {
    const id = target.dataset.id;
    if (!confirm(`Supprimer ${getPlayerName(id)} ?`)) return;
    app.state.players = app.state.players.filter((p) => p.id !== id);
    if (app.ui.editingPlayerId === id) app.ui.editingPlayerId = null;
    saveState();
    render();
    return;
  }

  if (action === "clear-player-form") {
    app.ui.editingPlayerId = null;
    render();
    return;
  }

  if (action === "undo-turn") {
    const match = app.state.activeMatch;
    if (!match || !match.turns.length) { showToast("Rien à annuler"); return; }
    if (match.type === "x01") undoX01Turn(match);
    else undoCricketTurn(match);
    app.ui.dartDraft = [];
    app.ui.dartMultiplier = 1;
    saveState();
    render();
    showToast("Dernier tour annulé");
    return;
  }

  if (action === "cancel-match") {
    if (!confirm("Abandonner la partie en cours ?")) return;
    app.state.activeMatch = null;
    app.ui.dartDraft = [];
    app.ui.dartMultiplier = 1;
    saveState();
    render();
    return;
  }

  if (action === "toggle-pause") {
    const match = app.state.activeMatch;
    if (!match) return;
    match.status = match.status === "paused" ? "live" : "paused";
    saveState();
    render();
    return;
  }

  if (action === "dart-multiplier") {
    const m = Number(target.dataset.multiplier);
    app.ui.dartMultiplier = app.ui.dartMultiplier === m ? 1 : m;
    render();
    return;
  }

  if (action === "dart-add") {
    handleDartAdd(Number(target.dataset.value));
    return;
  }

  if (action === "dart-undo") {
    app.ui.dartDraft.pop();
    app.ui.dartMultiplier = 1;
    render();
    return;
  }

  if (action === "dart-clear") {
    app.ui.dartDraft = [];
    app.ui.dartMultiplier = 1;
    render();
    return;
  }

  if (action === "submit-darts") {
    handleSubmitX01();
    return;
  }

  if (action === "submit-cricket-darts") {
    handleSubmitCricket();
    return;
  }

  if (action === "select-match") {
    app.ui.historySelectedId = target.dataset.id;
    render();
    return;
  }

  if (action === "delete-match") {
    if (!confirm("Supprimer cette partie ?")) return;
    app.state.matches = app.state.matches.filter((m) => m.id !== target.dataset.id);
    app.ui.historySelectedId = null;
    saveState();
    render();
    return;
  }

  if (action === "inline-add-player") {
    const input = document.getElementById("inline-player-name");
    const name = input?.value?.trim();
    if (!name) { showToast("Saisis un nom"); return; }
    if (app.state.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      showToast("Ce joueur existe déjà");
      return;
    }
    const newPlayer = { id: uid(), name, team: "", createdAt: new Date().toISOString() };
    app.state.players.push(newPlayer);
    if (!app.ui.matchDraft) app.ui.matchDraft = { selectedPlayers: [], teamAssignments: {}, teamNames: ["Équipe A", "Équipe B"], type: "solo" };
    app.ui.matchDraft.selectedPlayers = [...(app.ui.matchDraft.selectedPlayers || []), newPlayer.id];
    saveState();
    render();
    showToast(`${name} ajouté`);
    return;
  }

  if (action === "reset-data") {
    if (!confirm("Réinitialiser toutes les données ?")) return;
    app.state.players = [];
    app.state.matches = [];
    app.state.activeMatch = null;
    app.ui.dartDraft = [];
    app.ui.dartMultiplier = 1;
    saveState();
    render();
    showToast("Données réinitialisées");
    return;
  }

  if (action === "cloud-refresh") { await loadCloudGroups(); render(); return; }
  if (action === "cloud-push") { await cloudPush(); return; }
  if (action === "cloud-pull") { await cloudPull(); return; }
  if (action === "supabase-logout") { await cloudSignOut(); render(); return; }
  if (action === "cloud-cancel-otp") {
    app.cloud.awaitingOtp = false;
    app.cloud.error = null;
    render();
    return;
  }

  if (action === "cloud-copy-code") {
    navigator.clipboard?.writeText(target.dataset.code);
    showToast("Code copié !");
    return;
  }

  if (action === "cloud-share-invite") {
    const result = await shareInvite(target.dataset.code);
    showToast(result === "shared" ? "Lien partagé !" : "Lien copié !");
    return;
  }
}

// ── Submit handler ───────────────────────────────────────────────────────────

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const formType = form.dataset.form;

  if (formType === "player") {
    const name = form.playerName.value.trim();
    const team = form.playerTeam ? form.playerTeam.value.trim() : "";
    if (!name) { showToast("Nom obligatoire"); return; }
    if (app.ui.editingPlayerId) {
      const player = getPlayer(app.ui.editingPlayerId);
      if (player) { player.name = name; player.team = team; saveState(); showToast("Joueur mis à jour"); }
      app.ui.editingPlayerId = null;
    } else {
      if (app.state.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
        showToast("Ce joueur existe déjà");
        return;
      }
      app.state.players.push({ id: uid(), name, team, createdAt: new Date().toISOString() });
      saveState();
      showToast("Joueur ajouté");
    }
    form.reset();
    render();
    return;
  }

  if (formType === "match-setup") {
    const mode = form.matchMode.value;
    const matchType = form.matchType?.value || "solo";
    const teamMode = matchType === "teams";
    const randomStart = form.randomStart?.checked || false;
    const selectedPlayers = Array.from(form.querySelectorAll("input[name='matchPlayers']:checked")).map((i) => i.value);
    if (selectedPlayers.length < 2) { showToast("Choisis au moins 2 joueurs"); return; }
    const settings = {
      doubleIn: form.doubleIn?.checked || false,
      doubleOut: form.doubleOut?.checked || false,
      bust: form.bust?.checked || false,
      legsToWin: Math.max(1, Number(form.legsToWin?.value) || 1),
      setsToWin: Math.max(1, Number(form.setsToWin?.value) || 1),
    };
    const teamNames = {
      A: (form.teamNameA?.value || "Équipe A").trim() || "Équipe A",
      B: (form.teamNameB?.value || "Équipe B").trim() || "Équipe B",
    };
    const matchTag = form.matchTag?.value?.trim() || "";
    const teamAssignments = {};
    if (teamMode) {
      selectedPlayers.forEach((pid, i) => {
        const sel = form.querySelector(`select[name='team-${pid}']`);
        teamAssignments[pid] = sel?.value || (i % 2 === 0 ? "A" : "B");
      });
      if (new Set(Object.values(teamAssignments)).size < 2) { showToast("Attribue au moins un joueur par équipe"); return; }
    }
    let players = selectedPlayers;
    if (!teamMode && randomStart) players = shuffle([...selectedPlayers]);
    if (teamMode) players = buildTeamTurnOrder(selectedPlayers, teamAssignments, randomStart);
    startLiveMatch({ mode, players, settings, teamMode, teamAssignments, teamNames, tag: matchTag });
    app.ui.view = "match";
    render();
    return;
  }

  if (formType === "match-edit") {
    const matchId = form.dataset.id;
    const match = app.state.matches.find((m) => m.id === matchId);
    if (!match) return;
    const winnerValue = form.winner?.value || "";
    if (match.teamMode) {
      match.winnerTeamId = winnerValue || null;
      match.winnerIds = winnerValue ? getPlayersByTeam(match.players, match.teamAssignments, winnerValue) : [];
    } else {
      match.winnerTeamId = null;
      match.winnerIds = winnerValue ? [winnerValue] : [];
    }
    saveState();
    render();
    showToast("Partie mise à jour");
    return;
  }

  if (formType === "supabase-login") {
    const email = form.email?.value?.trim();
    if (!email) { showToast("Saisis ton email"); return; }
    await cloudSignIn(email);
    return;
  }

  if (formType === "cloud-create") {
    const name = form.cloudName?.value?.trim();
    if (!name) { showToast("Donne un nom au groupe"); return; }
    const group = await cloudCreateGroup(name);
    if (group) showToast("Groupe créé !");
    return;
  }

  if (formType === "cloud-join") {
    const code = form.inviteCode?.value?.trim();
    if (!code) { showToast("Saisis le code d'invitation"); return; }
    const ok = await cloudJoinGroup(code);
    showToast(ok ? "Groupe rejoint !" : "Code invalide");
    return;
  }
}

// ── Change handler ───────────────────────────────────────────────────────────

function handleChange(event) {
  const target = event.target;

  if (target.dataset.setting) {
    const key = target.dataset.setting;
    let value = target.type === "checkbox" ? target.checked : target.type === "number" ? Number(target.value) : target.value;
    if (key === "legsToWin" || key === "setsToWin") value = Math.max(1, Number(value) || 1);
    app.state.settings = { ...app.state.settings, [key]: value };
    saveState();
    render();
    return;
  }

  if (target.dataset.change === "ranking-range") { app.ui.rankingRange = target.value; render(); return; }
  if (target.dataset.change === "ranking-mode") { app.ui.rankingMode = target.value; render(); return; }
  if (target.dataset.change === "tag-filter") { app.ui.tagFilter = target.value; render(); return; }
  if (target.dataset.change === "history-tag") { app.ui.historyTagFilter = target.value; render(); return; }
  if (target.dataset.change === "history-range") { app.ui.historyRange = target.value; render(); return; }

  if (target.dataset.change === "match-type") {
    ensureMatchDraft();
    app.ui.matchDraft.type = target.value;
    render();
    return;
  }

  if (target.dataset.change === "team-name") {
    const idx = Number(target.dataset.index);
    if (Number.isFinite(idx)) app.ui.matchDraft.teamNames[idx] = target.value;
    return;
  }

  if (target.dataset.change === "team-assign") {
    const pid = target.dataset.playerId;
    if (pid) app.ui.matchDraft.teamAssignments[pid] = target.value;
    return;
  }

  if (target.name === "historyPlayers") {
    const selected = new Set(app.ui.historyPlayerFilter || []);
    target.checked ? selected.add(target.value) : selected.delete(target.value);
    app.ui.historyPlayerFilter = Array.from(selected);
    render();
    return;
  }

  if (target.name === "matchPlayers") {
    ensureMatchDraft();
    const selected = new Set(app.ui.matchDraft.selectedPlayers || []);
    target.checked ? selected.add(target.value) : selected.delete(target.value);
    app.ui.matchDraft.selectedPlayers = Array.from(selected);
    return;
  }

  if (target.dataset.change === "cloud-group-select") {
    app.state.cloudGroupId = target.value || null;
    saveState();
    subscribeRealtime();
    render();
    return;
  }

  if (target.dataset.action === "import-file" && target.files?.length) {
    importData(target.files[0], {
      onSuccess: () => { app.ui.view = "match"; render(); showToast("Import réussi"); },
      onError: () => showToast("Fichier invalide"),
    });
    target.value = "";
    return;
  }
}

// ── Dart input ───────────────────────────────────────────────────────────────

function handleDartAdd(base) {
  const match = app.state.activeMatch;
  if (!match) return;
  if (match.status === "paused") { showToast("Partie en pause"); return; }
  if (app.ui.dartDraft.length >= 3) { showToast("Déjà 3 fléchettes"); return; }
  const multiplier = app.ui.dartMultiplier;
  if (base === 25 && multiplier === 3) { showToast("Le triple bull n'existe pas"); app.ui.dartMultiplier = 1; render(); return; }
  app.ui.dartDraft.push(buildDart(base, multiplier));
  app.ui.dartMultiplier = 1;
  if (navigator.vibrate) navigator.vibrate(10);

  // Auto-checkout (X01 only)
  if (match.type === "x01") {
    const pid = match.players[match.currentTurnIndex];
    const remaining = match.scoreboard[pid].score - app.ui.dartDraft.reduce((s, d) => s + d.score, 0);
    const lastDart = app.ui.dartDraft[app.ui.dartDraft.length - 1];
    const isValidFinish = !match.settings.doubleOut || lastDart.multiplier === 2;
    if (remaining === 0 && isValidFinish) { handleSubmitX01(); return; }
  }

  if (app.ui.dartDraft.length === 3) {
    if (match.type === "x01") handleSubmitX01();
    else handleSubmitCricket();
    return;
  }
  render();
}

function handleSubmitX01() {
  const match = app.state.activeMatch;
  if (!match || match.type !== "x01") return;
  if (match.status === "paused") { showToast("Partie en pause"); return; }
  if (!app.ui.dartDraft.length) { showToast("Ajoute au moins une fléchette"); return; }

  const result = processX01Turn(match, app.ui.dartDraft);
  app.ui.dartDraft = [];
  app.ui.dartMultiplier = 1;
  if (navigator.vibrate) navigator.vibrate(result.finished ? [30, 20, 30] : 15);

  if (result.finished) {
    const legResult = processLegWin(match, result.playerId);
    if (legResult.matchFinished) {
      finalizeMatch(match, legResult.winnerIds);
      saveState();
      render();
      showToast("Partie terminée 🏆");
      cloudPushAuto();
    } else {
      resetLeg(match, result.playerId);
      saveState();
      render();
      showFlashOverlay("🏆", `${getPlayerName(result.playerId)} gagne le leg !`, "Nouveau leg…", 2000);
      cloudPushAuto();
    }
    return;
  }

  saveState();
  render();
  const hint = result.checkoutHint ? ` · 💡 ${result.checkoutHint}` : "";
  const subtitle = result.nextPlayerScore != null ? `Reste : ${result.nextPlayerScore}${hint}` : "";
  showFlashOverlay("🎯", getPlayerName(result.nextPlayerId), subtitle);
  cloudPushAuto();
}

function handleSubmitCricket() {
  const match = app.state.activeMatch;
  if (!match || match.type !== "cricket") return;
  if (match.status === "paused") { showToast("Partie en pause"); return; }
  if (!app.ui.dartDraft.length) { showToast("Ajoute au moins une fléchette"); return; }

  const result = processCricketTurn(match, app.ui.dartDraft);
  app.ui.dartDraft = [];
  app.ui.dartMultiplier = 1;
  if (navigator.vibrate) navigator.vibrate(result.isWinner ? [30, 20, 30] : 15);

  if (result.isWinner) {
    let winnerIds = [result.playerId];
    if (match.teamMode) {
      const teamId = match.teamAssignments?.[result.playerId];
      if (teamId) winnerIds = getPlayersByTeam(match.players, match.teamAssignments, teamId);
    }
    const legResult = processLegWin(match, result.playerId);
    if (legResult.matchFinished) {
      finalizeMatch(match, legResult.winnerIds);
      saveState();
      render();
      showToast("Partie terminée 🏆");
      cloudPushAuto();
    } else {
      resetLeg(match, result.playerId);
      saveState();
      render();
      showFlashOverlay("🏆", `${getPlayerName(result.playerId)} gagne le leg !`, "Nouveau leg…", 2000);
      cloudPushAuto();
    }
    return;
  }

  saveState();
  render();
  showFlashOverlay("🎯", getPlayerName(result.nextPlayerId), `Points : ${result.nextPoints}`);
  cloudPushAuto();
}
