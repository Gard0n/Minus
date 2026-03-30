import { escapeHtml } from "../../utils.js";
import { app } from "../../state.js";
import { computePlayerStats } from "../../game/stats.js";
import { cloudSignIn, cloudSignOut, shareInvite } from "../../services/supabase.js";
import { renderModeOptions, renderScoringOptions } from "../helpers.js";
import { showToast } from "../components/toast.js";

function renderCloudSection() {
  const loggedIn = Boolean(app.cloud.session?.user);
  const linkedId = app.state.cloudGroupId || "";
  const linkedGroup = linkedId ? app.cloud.groups.find((g) => g.id === linkedId) : null;
  const loadingBadge = app.cloud.loading ? `<span class="badge">Sync...</span>` : "";
  const errorBlock = app.cloud.error
    ? `<p class="small-muted" style="color:var(--danger);">Erreur : ${escapeHtml(app.cloud.error)}</p>`
    : "";

  if (!loggedIn) {
    const awaitingOtp = app.cloud.awaitingOtp;
    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Synchronisation cloud</h3>
          ${app.cloud.loading ? `<span class="badge">Connexion...</span>` : ""}
        </div>
        ${awaitingOtp ? `
          <div class="notice">
            📧 Lien envoyé ! Vérifie ta boîte mail et clique sur le lien pour te connecter.
          </div>
          <button class="btn ghost" style="margin-top:10px;" data-action="cloud-cancel-otp">Recommencer</button>
        ` : `
          <p class="subtle">Connecte-toi pour synchroniser tes données entre appareils.</p>
          <form data-form="supabase-login" style="margin-top:12px;">
            <div class="form-row">
              <input type="email" name="email" placeholder="ton@email.com" required style="flex:1;" />
              <button class="btn">Recevoir un lien</button>
            </div>
          </form>
        `}
        ${errorBlock}
      </div>
    `;
  }

  const inviteCode = linkedGroup?.invite_code || "";
  const options = app.cloud.groups
    .map((g) => `<option value="${g.id}" ${g.id === linkedId ? "selected" : ""}>${escapeHtml(g.name || "Sans nom")}</option>`)
    .join("");

  return `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Synchronisation cloud</h3>
        <div class="inline-actions">
          <span class="badge">✓ Connecté</span>
          ${loadingBadge}
          <button class="btn small ghost" data-action="supabase-logout">Déconnexion</button>
        </div>
      </div>
      ${errorBlock}
      <div style="margin-top:8px;" class="small-muted">Connecté : ${escapeHtml(app.cloud.session.user.email || "anonyme")}</div>

      <div class="form-row" style="margin-top:12px;">
        <div>
          <label>Groupe cloud lié</label>
          <select data-change="cloud-group-select">
            <option value="">Aucun</option>
            ${options}
          </select>
        </div>
      </div>

      <div class="inline-actions" style="margin-top:10px;">
        <button class="btn" data-action="cloud-push" ${linkedId ? "" : "disabled"}>↑ Envoyer</button>
        <button class="btn ghost" data-action="cloud-pull" ${linkedId ? "" : "disabled"}>↓ Importer</button>
        <button class="btn ghost" data-action="cloud-refresh">Rafraîchir</button>
      </div>

      ${inviteCode ? `
        <div class="notice" style="margin-top:12px;">
          <strong>Invitation : ${escapeHtml(inviteCode)}</strong>
        </div>
        <div class="inline-actions" style="margin-top:8px;">
          <button class="btn ghost" data-action="cloud-share-invite" data-code="${escapeHtml(inviteCode)}">Partager le lien</button>
          <button class="btn ghost" data-action="cloud-copy-code" data-code="${escapeHtml(inviteCode)}">Copier le code</button>
        </div>
      ` : ""}

      <div class="grid two" style="margin-top:16px;">
        <form data-form="cloud-create">
          <label>Créer un groupe</label>
          <div class="form-row">
            <input type="text" name="cloudName" placeholder="Mon groupe" />
            <button class="btn ghost">Créer</button>
          </div>
        </form>
        <form data-form="cloud-join">
          <label>Rejoindre avec un code</label>
          <div class="form-row">
            <input type="text" name="inviteCode" placeholder="ABC123" />
            <button class="btn ghost">Rejoindre</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function renderSettings() {
  const view = document.getElementById("view-settings");
  if (!view) return;
  const editingPlayer = app.ui.editingPlayerId ? app.state.players.find((p) => p.id === app.ui.editingPlayerId) : null;
  const statsMap = computePlayerStats(app.state.players, app.state.matches);

  const playerRows = app.state.players.map((player) => {
    const stats = statsMap[player.id] || {};
    return `
      <tr>
        <td><strong>${escapeHtml(player.name)}</strong></td>
        <td>${stats.matches || 0}</td>
        <td>${stats.wins || 0}</td>
        <td>
          <div class="inline-actions">
            <button class="btn small ghost" data-action="view-player" data-id="${player.id}">Profil</button>
            <button class="btn small ghost" data-action="edit-player" data-id="${player.id}">Modifier</button>
            <button class="btn small danger" data-action="delete-player" data-id="${player.id}">✕</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  view.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">${editingPlayer ? "Modifier le joueur" : "Joueurs"}</h3>
        ${!editingPlayer ? `<span class="subtle">${app.state.players.length} joueur(s)</span>` : ""}
      </div>
      <form data-form="player">
        <div class="form-row">
          <div>
            <label>Nom</label>
            <input type="text" name="playerName" value="${editingPlayer ? escapeHtml(editingPlayer.name) : ""}" placeholder="Prénom ou pseudo" required />
          </div>
        </div>
        <div class="inline-actions" style="margin-top:10px;">
          <button class="btn">${editingPlayer ? "Enregistrer" : "Ajouter"}</button>
          ${editingPlayer ? `<button type="button" class="btn ghost" data-action="clear-player-form">Annuler</button>` : ""}
        </div>
      </form>
      ${app.state.players.length ? `
        <table class="table" style="margin-top:14px;">
          <thead><tr><th>Joueur</th><th>Matchs</th><th>Victoires</th><th></th></tr></thead>
          <tbody>${playerRows}</tbody>
        </table>
      ` : `<p class="subtle" style="margin-top:12px;">Aucun joueur. Ajoute-en un pour commencer.</p>`}
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Réglages par défaut</h3></div>
      <div class="form-row">
        <div>
          <label>Mode par défaut</label>
          <select data-setting="defaultMode">${renderModeOptions(app.state.settings.defaultMode)}</select>
        </div>
      </div>
      <div class="form-row" style="margin-top:12px;">
        <div>
          <label>Legs pour gagner</label>
          <input type="number" min="1" data-setting="legsToWin" value="${app.state.settings.legsToWin || 1}" />
        </div>
        <div>
          <label>Sets pour gagner</label>
          <input type="number" min="1" data-setting="setsToWin" value="${app.state.settings.setsToWin || 1}" />
        </div>
      </div>
      <div style="margin-top:12px;">
        <label>Règles 301/501</label>
        <div class="pill-list">
          <label class="player-pill">
            <input type="checkbox" data-setting="doubleIn" ${app.state.settings.doubleIn ? "checked" : ""} />
            <span>Double-in</span>
          </label>
          <label class="player-pill">
            <input type="checkbox" data-setting="doubleOut" ${app.state.settings.doubleOut ? "checked" : ""} />
            <span>Double-out</span>
          </label>
          <label class="player-pill">
            <input type="checkbox" data-setting="bust" ${app.state.settings.bust ? "checked" : ""} />
            <span>Bust</span>
          </label>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Apparence</h3></div>
      <div class="inline-actions">
        <button class="btn ghost" data-action="toggle-theme">
          ${document.body.classList.contains("theme-dark") ? "Mode clair" : "Mode sombre"}
        </button>
      </div>
    </div>

    ${renderCloudSection()}

    <div class="card">
      <div class="card-header"><h3 class="card-title">Sauvegarde</h3></div>
      <div class="inline-actions">
        <button class="btn ghost" data-action="export">Exporter JSON</button>
        <label class="btn ghost" style="cursor:pointer;">
          Importer JSON
          <input type="file" accept="application/json" data-action="import-file" style="display:none;" />
        </label>
      </div>
      <p class="subtle" style="margin-top:8px;">Données stockées sur cet appareil.</p>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Zone dangereuse</h3></div>
      <button class="btn danger" data-action="reset-data">Réinitialiser les données</button>
    </div>
  `;
}
