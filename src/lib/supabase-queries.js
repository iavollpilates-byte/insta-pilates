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
  // #region agent log
  fetch('http://127.0.0.1:7294/ingest/5b75fc16-6a12-4d36-ad74-8d75554109c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'448216'},body:JSON.stringify({sessionId:'448216',location:'supabase-queries.js:savePost',message:'savePost() entry',data:{postId:post?.id,column_id:post?.column},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
  // #endregion
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
  const { data: existing, error: existingError } = await supabase.from("posts").select("id").eq("app_id", post.id).maybeSingle();
  // #region agent log
  if(existingError)fetch('http://127.0.0.1:7294/ingest/5b75fc16-6a12-4d36-ad74-8d75554109c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'448216'},body:JSON.stringify({sessionId:'448216',location:'supabase-queries.js:savePost:selectExisting',message:'select error',data:{postId:post?.id,errorMessage:existingError?.message,errorCode:existingError?.code},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
  // #endregion
  const schemaHint = "No Supabase SQL Editor, execute o arquivo supabase/migrations.sql (seção final: posts + app_cms).";
  if (existingError && (existingError.code === "42703" || existingError.code === "23514")) {
    throw new Error("Banco desatualizado: " + schemaHint + " (" + (existingError.message || existingError.code) + ")");
  }
  if (existing) {
    const { data: updated, error } = await supabase
      .from("posts")
      .update(payload)
      .eq("app_id", post.id)
      .select("id")
      .single();
    // #region agent log
    if(error)fetch('http://127.0.0.1:7294/ingest/5b75fc16-6a12-4d36-ad74-8d75554109c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'448216'},body:JSON.stringify({sessionId:'448216',location:'supabase-queries.js:savePost:update',message:'update error',data:{postId:post?.id,errorMessage:error?.message,errorCode:error?.code},timestamp:Date.now(),hypothesisId:'H3_H4'})}).catch(()=>{});
    // #endregion
    if (error) {
      if (error.code === "42703" || error.code === "23514") throw new Error("Banco desatualizado: " + schemaHint + " (" + (error.message || error.code) + ")");
      throw new Error(error.message || "Erro ao salvar");
    }
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
    // #region agent log
    if(error)fetch('http://127.0.0.1:7294/ingest/5b75fc16-6a12-4d36-ad74-8d75554109c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'448216'},body:JSON.stringify({sessionId:'448216',location:'supabase-queries.js:savePost:insert',message:'insert error',data:{postId:post?.id,column_id:payload.column_id,errorMessage:error?.message,errorCode:error?.code},timestamp:Date.now(),hypothesisId:'H3_H4'})}).catch(()=>{});
    // #endregion
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
  // #region agent log
  fetch('http://127.0.0.1:7294/ingest/5b75fc16-6a12-4d36-ad74-8d75554109c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'448216'},body:JSON.stringify({sessionId:'448216',location:'supabase-queries.js:savePost',message:'savePost() success',data:{postId:post?.id},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
  // #endregion
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

/**
 * Subscribe to posts table for realtime (Trello-like: everyone sees updates).
 * onStatusChange(connected: boolean) is called when subscription becomes SUBSCRIBED (true) or disconnects (false).
 * Returns unsubscribe function.
 */
export function subscribeToPosts(setPosts, onStatusChange) {
  if (!supabase) return () => {};
  const channel = supabase
    .channel("posts-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "posts" },
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
