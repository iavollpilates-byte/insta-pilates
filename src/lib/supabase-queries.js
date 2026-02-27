import { supabase, isSupabaseConfigured } from "./supabase";

export { isSupabaseConfigured };

export function rowToPost(row, metrics = null) {
  const engagement = metrics
    ? {
        likes: metrics.likes ?? 0,
        comments: metrics.comments ?? 0,
        saves: metrics.saves ?? 0,
        shares: metrics.shares ?? 0,
        reach: metrics.reach ?? 0,
      }
    : null;
  return {
    id: row.app_id || row.id,
    column: row.column_id,
    type: row.type || "reel",
    title: row.title ?? "",
    caption: row.caption ?? "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    assignee: row.assignee ?? null,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
    scheduledDate: row.scheduled_date ?? null,
    scheduledTime: row.scheduled_time ?? null,
    engagement,
    notes: row.notes ?? "",
    links: Array.isArray(row.links) ? row.links : [],
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    aiScore: row.ai_score ?? null,
    aiSuggestion: row.ai_suggestion ?? null,
  };
}

export async function fetchPosts(accountId) {
  if (!supabase) return null;
  if (accountId == null) return [];
  const { data: rows, error } = await supabase.from("posts").select("*").eq("account_id", accountId).order("updated_at", { ascending: false });
  if (error) return null;
  const ids = (rows || []).map((r) => r.id);
  let metricsByPost = {};
  if (ids.length > 0) {
    const { data: metrics } = await supabase
      .from("post_metrics")
      .select("post_id, likes, comments, saves, shares, reach")
      .in("post_id", ids);
    (metrics || []).forEach((m) => {
      metricsByPost[m.post_id] = m;
    });
  }
  return (rows || []).map((r) => rowToPost(r, metricsByPost[r.id]));
}

export async function fetchAccounts() {
  if (!supabase) return [];
  const { data: rows, error } = await supabase
    .from("instagram_accounts")
    .select("id, name, slug")
    .order("slug", { ascending: true });
  if (error) return [];
  return rows || [];
}

export async function savePost(post, accountId) {
  if (!supabase) return { data: null, error: null };
  const payload = {
    app_id: post.id,
    account_id: accountId ?? undefined,
    column_id: post.column,
    type: post.type || "reel",
    title: post.title ?? "",
    caption: post.caption ?? "",
    tags: post.tags ?? [],
    assignee: post.assignee ?? null,
    created_by: post.createdBy ?? null,
    scheduled_date: post.scheduledDate ?? null,
    scheduled_time: post.scheduledTime ?? null,
    notes: post.notes ?? "",
    links: post.links ?? [],
    attachments: post.attachments ?? [],
    ai_score: post.aiScore ?? null,
    ai_suggestion: post.aiSuggestion ?? null,
    updated_at: new Date().toISOString(),
  };
  let postIdUuid = null;
  let existingQuery = supabase.from("posts").select("id").eq("app_id", post.id);
  if (accountId != null) existingQuery = existingQuery.eq("account_id", accountId);
  const { data: existing, error: existingError } = await existingQuery.maybeSingle();
  const schemaHint = "No Supabase SQL Editor, execute o arquivo supabase/migrations.sql (seção final: posts + app_cms).";
  if (existingError && (existingError.code === "42703" || existingError.code === "23514")) {
    throw new Error("Banco desatualizado: " + schemaHint + " (" + (existingError.message || existingError.code) + ")");
  }
  if (existing) {
    let updateQuery = supabase.from("posts").update(payload).eq("app_id", post.id);
    if (accountId != null) updateQuery = updateQuery.eq("account_id", accountId);
    const { data: updated, error } = await updateQuery.select("id").single();
    if (error) {
      if (error.code === "42703" || error.code === "23514") throw new Error("Banco desatualizado: " + schemaHint + " (" + (error.message || error.code) + ")");
      throw new Error(error.message || "Erro ao salvar");
    }
    postIdUuid = updated?.id;
  } else {
    const insertPayload = { ...payload, created_at: post.createdAt ?? new Date().toISOString() };
    if (accountId != null) insertPayload.account_id = accountId;
    const { data: inserted, error } = await supabase
      .from("posts")
      .insert(insertPayload)
      .select("id")
      .single();
    if (error) {
      if (error.code === "42703" || error.code === "23514") throw new Error("Banco desatualizado: " + schemaHint + " (" + (error.message || error.code) + ")");
      throw new Error(error.message || "Erro ao salvar");
    }
    postIdUuid = inserted?.id;
  }
  if (postIdUuid && post.engagement && typeof post.engagement === "object") {
    const eng = post.engagement;
    const { data: existingMetric } = await supabase
      .from("post_metrics")
      .select("id")
      .eq("post_id", postIdUuid)
      .maybeSingle();
    const metricRow = {
      post_id: postIdUuid,
      likes: eng.likes ?? 0,
      comments: eng.comments ?? 0,
      saves: eng.saves ?? 0,
      shares: eng.shares ?? 0,
      reach: eng.reach ?? 0,
      fetched_at: new Date().toISOString(),
    };
    if (existingMetric) {
      await supabase.from("post_metrics").update(metricRow).eq("post_id", postIdUuid);
    } else {
      await supabase.from("post_metrics").insert(metricRow);
    }
  }
  return { data: { ...post }, error: null };
}

export async function deletePost(id, accountId) {
  if (!supabase) return { error: null };
  let byQuery = supabase.from("posts").select("id").eq("app_id", id);
  if (accountId != null) byQuery = byQuery.eq("account_id", accountId);
  const byAppId = await byQuery.maybeSingle();
  if (byAppId?.data?.id) {
    const { error } = await supabase.from("posts").delete().eq("id", byAppId.data.id);
    return { error };
  }
  const { error } = await supabase.from("posts").delete().eq("id", id);
  return { error };
}

export async function fetchUsers() {
  return [];
}

export async function fetchBoardStages() {
  return null;
}

export async function saveBoardStage() {
  return { error: null };
}

export async function deleteBoardStage() {
  return { error: null };
}

export async function fetchBoardFields() {
  return null;
}

export async function saveBoardField() {
  return { data: null, error: null };
}

export async function deleteBoardField() {
  return { error: null };
}

export async function saveUser() {
  return { error: null };
}

export async function deleteUser() {
  return { error: null };
}

const CMS_KEY = "default";

export async function fetchCms() {
  if (!supabase) return null;
  const { data, error } = await supabase.from("app_cms").select("payload").eq("key", CMS_KEY).maybeSingle();
  if (error || !data?.payload) return null;
  return data.payload;
}

export async function saveCms(payload) {
  if (!supabase) return { error: new Error("Supabase not configured") };
  const { error } = await supabase
    .from("app_cms")
    .upsert({ key: CMS_KEY, payload, updated_at: new Date().toISOString() }, { onConflict: "key" });
  return { error };
}

/**
 * Subscribe to posts table for realtime (Trello-like: everyone sees updates).
 * Only receives events for the given accountId when provided.
 * onStatusChange(connected: boolean) is called when subscription becomes SUBSCRIBED (true) or disconnects (false).
 * Returns unsubscribe function.
 */
export function subscribeToPosts(setPosts, onStatusChange, accountId) {
  if (!supabase) return () => {};
  const channelName = accountId ? `posts-realtime-${accountId}` : "posts-realtime";
  const opts = { event: "*", schema: "public", table: "posts" };
  if (accountId) opts.filter = `account_id=eq.${accountId}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      opts,
      (payload) => {
        if (payload.eventType === "INSERT" && payload.new) {
          const newPost = rowToPost(payload.new);
          const id = newPost.id;
          setPosts((prev) => {
            const exists = prev.some((p) => p.id === id);
            if (exists) return prev.map((p) => (p.id === id ? newPost : p));
            return [...prev, newPost];
          });
        } else if (payload.eventType === "UPDATE" && payload.new) {
          const id = payload.new.app_id || payload.new.id;
          setPosts((prev) =>
            prev.map((p) => (p.id === id ? rowToPost(payload.new) : p))
          );
        } else if (payload.eventType === "DELETE" && payload.old) {
          const id = payload.old.app_id || payload.old.id;
          setPosts((prev) => prev.filter((p) => p.id !== id));
        }
      }
    )
    .subscribe((status) => {
      if (onStatusChange) onStatusChange(status === "SUBSCRIBED");
    });
  return () => {
    if (onStatusChange) onStatusChange(false);
    supabase.removeChannel(channel);
  };
}
