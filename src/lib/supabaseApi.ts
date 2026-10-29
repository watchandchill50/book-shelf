import { createClient } from "@supabase/supabase-js";
import type { Api, Post, PostComment, PostInput, Session, Settings } from "./api";
import { EMPTY_SETTINGS } from "./api";

const BUCKET = "media";

/* eslint-disable @typescript-eslint/no-explicit-any */
function toPost(r: any): Post {
  return {
    id: r.id,
    type: r.type,
    title: r.title ?? "",
    body: r.body ?? "",
    excerpt: r.excerpt ?? "",
    coverUrl: r.cover_url,
    fileUrl: r.file_url,
    fileName: r.file_name,
    fileSize: r.file_size,
    linkUrl: r.link_url,
    refAuthor: r.ref_author,
    refSource: r.ref_source,
    bookKind: r.book_kind,
    category: r.category,
    tags: r.tags ?? [],
    status: r.status,
    publishedAt: r.published_at,
    featured: !!r.featured,
    downloads: r.downloads ?? 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function fromPost(p: PostInput) {
  const row: Record<string, unknown> = {};
  const map: [keyof PostInput, string][] = [
    ["type", "type"],
    ["title", "title"],
    ["body", "body"],
    ["excerpt", "excerpt"],
    ["coverUrl", "cover_url"],
    ["fileUrl", "file_url"],
    ["fileName", "file_name"],
    ["fileSize", "file_size"],
    ["linkUrl", "link_url"],
    ["refAuthor", "ref_author"],
    ["refSource", "ref_source"],
    ["bookKind", "book_kind"],
    ["category", "category"],
    ["tags", "tags"],
    ["status", "status"],
    ["publishedAt", "published_at"],
    ["featured", "featured"],
  ];
  for (const [k, col] of map) if (p[k] !== undefined) row[col] = p[k];
  return row;
}

function safeFileName(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
}

export function createSupabaseApi(url: string, anonKey: string): Api {
  const supabase = createClient(url, anonKey);

  async function currentUser() {
    const { data } = await supabase.auth.getSession();
    return data.session?.user ?? null;
  }

  let signingIn: Promise<string> | null = null;
  async function ensureUserId(): Promise<string> {
    const u = await currentUser();
    if (u) return u.id;
    if (!signingIn) {
      signingIn = supabase.auth.signInAnonymously().then(({ data, error }) => {
        signingIn = null;
        if (error || !data.user) {
          console.error("Supabase anonymous sign-in failed:", error);
          throw new Error("تعذّر بدء جلسة الزائر. حاول مرة أخرى بعد قليل.");
        }
        return data.user.id;
      });
    }
    return signingIn;
  }

  function toComment(r: any, me: string | null): PostComment {
    return {
      id: r.id,
      postId: r.book_id,
      parentId: r.parent_id ?? null,
      name: r.name,
      body: r.body,
      createdAt: r.created_at,
      isAuthor: !!r.is_author,
      mine: me !== null && r.user_id === me,
    };
  }

  const COMMENT_COLS = "id, book_id, parent_id, user_id, name, body, created_at, is_author";

  async function session(): Promise<Session> {
    const u = await currentUser();
    if (!u || u.is_anonymous) return null;
    const { data } = await supabase.rpc("is_admin");
    return { email: u.email ?? "", isAdmin: data === true };
  }

  return {
    mode: "supabase",

    async listPosts() {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(2000);
      if (error) throw new Error(error.message);
      return (data ?? []).map(toPost);
    },

    async savePost(input) {
      const row = fromPost(input);
      const q = input.id
        ? supabase.from("posts").update(row).eq("id", input.id).select("*").single()
        : supabase.from("posts").insert(row).select("*").single();
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return toPost(data);
    },

    async deletePost(id) {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },

    // Uploads with XMLHttpRequest so the editor can show a progress bar.
    async upload(file, folder, onProgress) {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("سجّلي الدخول أولًا.");
      const path = `${folder}/${safeFileName(file.name)}`;
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${url}/storage/v1/object/${BUCKET}/${path}`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("apikey", anonKey);
        xhr.setRequestHeader("x-upsert", "false");
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.setRequestHeader("cache-control", "max-age=31536000");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else {
            let msg = xhr.responseText;
            try {
              msg = JSON.parse(xhr.responseText).message ?? msg;
            } catch {
              /* keep raw text */
            }
            reject(new Error(`فشل الرفع: ${msg}`));
          }
        };
        xhr.onerror = () => reject(new Error("فشل الرفع: تحققي من الاتصال بالإنترنت."));
        xhr.send(file);
      });
      const pub = supabase.storage.from(BUCKET).getPublicUrl(path);
      return { url: pub.data.publicUrl, name: file.name, size: file.size };
    },

    async getSettings() {
      const { data, error } = await supabase.from("settings").select("data").eq("id", "site").maybeSingle();
      if (error) throw new Error(error.message);
      return { ...EMPTY_SETTINGS, ...((data?.data as Partial<Settings>) ?? {}) };
    },

    async saveSettings(s) {
      const { error } = await supabase.from("settings").update({ data: s }).eq("id", "site");
      if (error) throw new Error(error.message);
    },

    async recordDownload(postId) {
      await supabase.rpc("record_download", { post: postId });
    },

    async getLikes() {
      const [u, res] = await Promise.all([currentUser(), supabase.from("likes").select("book_id, user_id")]);
      if (res.error) throw new Error(res.error.message);
      const counts: Record<string, number> = {};
      const mine: string[] = [];
      for (const row of res.data ?? []) {
        counts[row.book_id] = (counts[row.book_id] ?? 0) + 1;
        if (u && row.user_id === u.id) mine.push(row.book_id);
      }
      return { counts, mine };
    },

    async setLiked(postId, liked) {
      const me = await ensureUserId();
      const { error } = liked
        ? await supabase.from("likes").upsert({ book_id: postId, user_id: me }, { ignoreDuplicates: true })
        : await supabase.from("likes").delete().eq("book_id", postId).eq("user_id", me);
      if (error) throw new Error(error.message);
    },

    async getCommentCounts() {
      const res = await supabase.from("comments").select("book_id").is("parent_id", null);
      if (res.error) throw new Error(res.error.message);
      const counts: Record<string, number> = {};
      for (const r of res.data ?? []) counts[r.book_id] = (counts[r.book_id] ?? 0) + 1;
      return counts;
    },

    async listComments(postId) {
      const [u, res] = await Promise.all([
        currentUser(),
        supabase.from("comments").select(COMMENT_COLS).eq("book_id", postId).order("created_at", { ascending: true }).limit(500),
      ]);
      if (res.error) throw new Error(res.error.message);
      return (res.data ?? []).map((r) => toComment(r, u?.id ?? null));
    },

    async listRecentComments(limit) {
      const [u, res] = await Promise.all([
        currentUser(),
        supabase.from("comments").select(COMMENT_COLS).order("created_at", { ascending: false }).limit(limit),
      ]);
      if (res.error) throw new Error(res.error.message);
      return (res.data ?? []).map((r) => toComment(r, u?.id ?? null));
    },

    async addComment({ postId, name, body, parentId = null, asAuthor = false }) {
      const me = await ensureUserId();
      const { data, error } = await supabase
        .from("comments")
        .insert({ book_id: postId, user_id: me, name, body, parent_id: parentId, is_author: asAuthor })
        .select(COMMENT_COLS)
        .single();
      if (error) throw new Error(error.message);
      return toComment(data, me);
    },

    async deleteComment(id) {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },

    getSession: session,

    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw new Error(
          error.message.includes("Invalid login") ? "البريد أو كلمة المرور غير صحيحة." : error.message,
        );
      }
      return session();
    },

    async signOut() {
      await supabase.auth.signOut();
    },

    subscribe(onChange) {
      const channel = supabase
        .channel("site-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, () => onChange("likes"))
        .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => onChange("comments"))
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    },
  };
}
