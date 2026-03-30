import { app, loadStore, applyTheme, loadTheme } from "./state.js";
import { bindEvents } from "./ui/events.js";
import { render } from "./ui/render.js";
import { initSupabase, initSupabaseCallbacks } from "./services/supabase.js";
import { showOnboarding } from "./ui/components/onboarding.js";

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(console.error);
  }
}

async function init() {
  // Load persisted state
  app.store = loadStore();

  // Apply theme
  applyTheme(loadTheme());

  // Wire Supabase callbacks before init
  initSupabaseCallbacks({ onRender: render });

  // Bind DOM events
  bindEvents();

  // Register SW
  registerServiceWorker();

  // First render
  render();

  // Init Supabase (async — renders again when session loads)
  await initSupabase();

  // Show onboarding if needed
  showOnboarding();
}

init();
