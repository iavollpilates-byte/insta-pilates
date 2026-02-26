import { supabase, isSupabaseConfigured } from "./supabase";

export { isSupabaseConfigured };

function rowToPost(row, metrics = null) {
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

export async function fetchPosts() {
  if (!supabase) return null;
  const { data: rows, error } = await supabase.from("posts").select("*").order("updated_at", { ascending: false });
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

export async function savePost(post) {
  if (!supabase) return { data: null, error: null };
  const payload = {
    app_id: post.id,
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
  const { data: existing } = await supabase.from("posts").select("id").eq("app_id", post.id).maybeSingle();
  if (existing) {
    const { data: updated, error } = await supabase
      .from("posts")
      .update(payload)
      .eq("app_id", post.id)
      .select("id")
      .single();
    if (error) return { data: null, error };
    postIdUuid = updated?.id;
  } else {
    const { data: inserted, error } = await supabase
      .from("posts")
      .insert({
        ...payload,
        created_at: post.createdAt ?? new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) return { data: null, error };
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

export async function deletePost(id) {
  if (!supabase) return { error: null };
  const byAppId = await supabase.from("posts").select("id").eq("app_id", id).maybeSingle();
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
