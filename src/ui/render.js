import { app } from "../state.js";
import { renderMatch } from "./views/match.js";
import { renderStats } from "./views/stats.js";
import { renderHistory } from "./views/history.js";
import { renderProfile } from "./views/profile.js";
import { renderSettings } from "./views/settings.js";
import { renderBoard } from "./views/board.js";

export function render() {
  renderMatch();
  renderBoard();
  renderStats();
  renderHistory();
  renderProfile();
  renderSettings();
  showView(app.ui.view);
  document.body.classList.toggle("board-view", app.ui.view === "board");
  updateFooter();
}

function showView(view) {
  document.querySelectorAll(".view").forEach((el) => {
    el.classList.toggle("active", el.id === `view-${view}`);
  });
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
}

function updateFooter() {
  const el = document.getElementById("footer-meta");
  if (!el) return;
  const playerCount = app.state?.players?.length || 0;
  const matchCount = app.state?.matches?.length || 0;
  el.textContent = `${playerCount} joueur(s) · ${matchCount} partie(s)`;
}
