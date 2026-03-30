import { app, saveState } from "../../state.js";

const STEPS = [
  {
    icon: "👤",
    title: "Bienvenue dans Minus !",
    text: "L'appli de scoring pour tes parties de fléchettes. Commence par créer tes joueurs dans l'onglet <strong>Réglages</strong>.",
  },
  {
    icon: "🎯",
    title: "Lance une partie",
    text: "Sélectionne les joueurs, choisis le mode (501, 301, Cricket), et c'est parti depuis l'onglet <strong>Jouer</strong>.",
  },
  {
    icon: "🏹",
    title: "Saisie fléchette par fléchette",
    text: "Tape sur un numéro pour enregistrer chaque fléchette. La saisie est validée automatiquement après la 3e fléchette.",
  },
  {
    icon: "☁️",
    title: "Synchronisation multi-appareils",
    text: "Connecte-toi via e-mail dans <strong>Réglages → Synchronisation</strong> pour voir le score en temps réel sur un grand écran.",
  },
  {
    icon: "📊",
    title: "Classement & statistiques",
    text: "Retrouve ton classement, tes moyennes et tes 180 dans l'onglet <strong>Classement</strong>. Bonne chance !",
  },
];

let currentStep = 0;

export function showOnboarding() {
  if (app.store.onboardingDone) return;
  currentStep = 0;
  render();
  document.getElementById("onboarding-overlay")?.classList.remove("hidden");
}

export function dismissOnboarding() {
  document.getElementById("onboarding-overlay")?.classList.add("hidden");
  app.store.onboardingDone = true;
  saveState();
}

function render() {
  const step = STEPS[currentStep];
  const el = document.getElementById("onboarding-overlay");
  if (!el) return;
  el.innerHTML = `
    <div class="onboarding-card">
      <div class="onboarding-icon">${step.icon}</div>
      <h2 class="onboarding-title">${step.title}</h2>
      <p class="onboarding-text">${step.text}</p>
      <div class="onboarding-dots">
        ${STEPS.map((_, i) => `<span class="dot ${i === currentStep ? "active" : ""}"></span>`).join("")}
      </div>
      <div class="onboarding-actions">
        <button class="btn ghost" id="onboarding-skip">Passer</button>
        ${currentStep < STEPS.length - 1
          ? `<button class="btn" id="onboarding-next">Suivant →</button>`
          : `<button class="btn" id="onboarding-done">Commencer 🎯</button>`}
      </div>
    </div>
  `;
  el.querySelector("#onboarding-skip")?.addEventListener("click", dismissOnboarding);
  el.querySelector("#onboarding-next")?.addEventListener("click", () => {
    currentStep++;
    render();
  });
  el.querySelector("#onboarding-done")?.addEventListener("click", dismissOnboarding);
}
