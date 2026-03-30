import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../constants.js";
import { app, saveState, normalizeGroup } from "../state.js";
import { uid } from "../utils.js";

let supabase = null;
let realtimeChannel = null;
let onRenderCallback = null;

export function initSupabaseCallbacks({ onRender }) {
  onRenderCallback = onRender;
}

export function getSupabase() { return supabase; }

export async function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.error("Supabase init error", err);
    return;
  }

  // Check for invite code in URL (join by link feature)
  const params = new URLSearchParams(window.location.search);
  const joinCode = params.get("join");
  if (joinCode) sessionStorage.setItem("minus_pending_join", joinCode);

  try {
    const { data } = await supabase.auth.getSession();
    app.cloud.session = data?.session || null;
  } catch (err) {
    console.error("Supabase session error", err);
  }

  if (app.cloud.session) {
    await loadCloudGroups();
    subscribeRealtime();
    await handlePendingJoin();
  } else {
    onRenderCallback?.();
  }

  supabase.auth.onAuthStateChange(async (_event, session) => {
    app.cloud.session = session;
    app.cloud.error = null;
    app.cloud.awaitingOtp = false;
    if (session) {
      await loadCloudGroups();
      subscribeRealtime();
      await handlePendingJoin();
    } else {
      unsubscribeRealtime();
      app.cloud.groups = [];
    }
    onRenderCallback?.();
  });
}

async function handlePendingJoin() {
  const code = sessionStorage.getItem("minus_pending_join");
  if (!code) return;
  sessionStorage.removeItem("minus_pending_join");
  // Remove ?join= from URL without reload
  const url = new URL(window.location.href);
  url.searchParams.delete("join");
  window.history.replaceState({}, "", url.toString());
  await cloudJoinGroup(code);
}

export async function cloudSignIn(email) {
  if (!supabase) return;
  app.cloud.loading = true;
  app.cloud.error = null;
  app.cloud.awaitingOtp = false;
  onRenderCallback?.();
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
  app.cloud.loading = false;
  if (error) {
    app.cloud.error = error.message;
  } else {
    app.cloud.awaitingOtp = true;
  }
  onRenderCallback?.();
}

export async function cloudSignOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
  unsubscribeRealtime();
  app.cloud.session = null;
  app.cloud.groups = [];
  app.cloud.error = null;
  app.cloud.awaitingOtp = false;
  onRenderCallback?.();
}

export function subscribeRealtime() {
  if (!supabase || !app.cloud.session || !app.state?.cloudGroupId) return;
  unsubscribeRealtime();
  realtimeChannel = supabase
    .channel(`group-${app.state.cloudGroupId}`)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "groups", filter: `id=eq.${app.state.cloudGroupId}` }, (payload) => {
      if (!payload.new?.data) return;
      const incoming = payload.new.data;
      const incomingTurns = incoming.activeMatch?.turns?.length ?? -1;
      const localTurns = app.state.activeMatch?.turns?.length ?? -1;
      if (app.state.activeMatch && incomingTurns < localTurns) return;
      const cloudGroupId = app.state.cloudGroupId;
      app.state = normalizeGroup(incoming);
      app.state.cloudGroupId = cloudGroupId;
      saveState();
      onRenderCallback?.();
    })
    .subscribe();
}

export function unsubscribeRealtime() {
  if (realtimeChannel) { supabase?.removeChannel(realtimeChannel); realtimeChannel = null; }
}

export async function cloudPushAuto() {
  if (!supabase || !app.cloud.session || !app.state?.cloudGroupId) return;
  const groupName = app.store.groupList.find((g) => g.id === app.store.activeGroupId)?.name || "Groupe";
  const payload = getCloudPayload(app.state);
  await supabase.from("groups").update({ name: groupName, data: payload }).eq("id", app.state.cloudGroupId);
}

export async function loadCloudGroups() {
  if (!supabase || !app.cloud.session) return;
  app.cloud.loading = true;
  try {
    const userId = app.cloud.session.user.id;
    const { data: memberRows } = await supabase.from("group_members").select("group_id").eq("user_id", userId);
    if (!memberRows?.length) { app.cloud.groups = []; app.cloud.loading = false; onRenderCallback?.(); return; }
    const ids = memberRows.map((r) => r.group_id);
    const { data: groups } = await supabase.from("groups").select("id, name, invite_code").in("id", ids);
    app.cloud.groups = groups || [];
  } catch (err) {
    console.error("loadCloudGroups error", err);
    app.cloud.groups = [];
  }
  app.cloud.loading = false;
  onRenderCallback?.();
}

export async function cloudCreateGroup(name) {
  if (!supabase || !app.cloud.session) return null;
  app.cloud.loading = true;
  app.cloud.error = null;
  onRenderCallback?.();
  try {
    const userId = app.cloud.session.user.id;
    const inviteCode = generateInviteCode(6);
    const payload = getCloudPayload(app.state);
    const { data: group, error } = await supabase
      .from("groups")
      .insert({ name, owner_id: userId, invite_code: inviteCode, data: payload })
      .select()
      .single();
    if (error) { app.cloud.error = error.message; app.cloud.loading = false; onRenderCallback?.(); return null; }
    await supabase.from("group_members").insert({ group_id: group.id, user_id: userId, role: "owner" });
    app.state.cloudGroupId = group.id;
    saveState();
    await loadCloudGroups();
    subscribeRealtime();
    return group;
  } catch (err) {
    app.cloud.error = err.message;
    app.cloud.loading = false;
    onRenderCallback?.();
    return null;
  }
}

export async function cloudJoinGroup(code) {
  if (!supabase || !app.cloud.session || !code) return false;
  app.cloud.loading = true;
  app.cloud.error = null;
  onRenderCallback?.();
  try {
    const { data: groupId, error } = await supabase.rpc("join_group_by_code", { invite_code: code.trim().toUpperCase() });
    if (error) { app.cloud.error = "Code invalide ou expiré"; app.cloud.loading = false; onRenderCallback?.(); return false; }
    app.state.cloudGroupId = groupId;
    saveState();
    await cloudPull();
    await loadCloudGroups();
    subscribeRealtime();
    return true;
  } catch (err) {
    app.cloud.error = err.message;
    app.cloud.loading = false;
    onRenderCallback?.();
    return false;
  }
}

export async function cloudPush() {
  if (!supabase || !app.cloud.session || !app.state?.cloudGroupId) return;
  app.cloud.loading = true;
  onRenderCallback?.();
  const groupName = app.store.groupList.find((g) => g.id === app.store.activeGroupId)?.name || "Groupe";
  const payload = getCloudPayload(app.state);
  const { error } = await supabase.from("groups").update({ name: groupName, data: payload }).eq("id", app.state.cloudGroupId);
  app.cloud.error = error?.message || null;
  app.cloud.loading = false;
  onRenderCallback?.();
}

export async function cloudPull() {
  if (!supabase || !app.cloud.session || !app.state?.cloudGroupId) return;
  app.cloud.loading = true;
  onRenderCallback?.();
  const { data, error } = await supabase.from("groups").select("data").eq("id", app.state.cloudGroupId).single();
  if (!error && data?.data) {
    const cloudGroupId = app.state.cloudGroupId;
    app.state = normalizeGroup(data.data);
    app.state.cloudGroupId = cloudGroupId;
    saveState();
  }
  app.cloud.error = error?.message || null;
  app.cloud.loading = false;
  onRenderCallback?.();
}

export function generateInviteCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function getInviteLink(code) {
  return `${window.location.origin}${window.location.pathname}?join=${code}`;
}

export async function shareInvite(code) {
  const link = getInviteLink(code);
  if (navigator.share) {
    try {
      await navigator.share({ title: "Rejoins mon groupe Minus", text: `Code : ${code}`, url: link });
      return "shared";
    } catch {}
  }
  await navigator.clipboard.writeText(link);
  return "copied";
}

function getCloudPayload(group) {
  const { cloudGroupId: _, ...rest } = group;
  return rest;
}
