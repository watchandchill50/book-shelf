import { createClient } from "@supabase/supabase-js";
import type { Backend, BookComment } from "./backend";

/**
 * Every visitor gets a Supabase *anonymous* user the first time they like
 * or comment (no sign-up form). Row Level Security in supabase/schema.sql
 * makes sure people can only add or remove their own likes and comments.
 */
export function createSupabaseBackend(url: string, anonKey: string): Backend {
  const supabase = createClient(url, anonKey);

  // Existing session (if this browser has liked/commented before), without signing in.
  async function currentUserId(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  }

  // Signs in anonymously on the first write only, so readers don't create accounts.
  let signingIn: Promise<string> | null = null;
  async function ensureUserId(): Promise<string> {
    const existing = await currentUserId();
    if (existing) return existing;
    if (!signingIn) {
      signingIn = supabase.auth.signInAnonymously().then(({ data, error }) => {
        signingIn = null;
        if (error || !data.user) {
          throw new Error(
            // Shown to visitors; the setup hint for you is in the README.
            "تعذّر بدء جلسة الزائر. حاول مرة أخرى بعد قليل.",
          );
        }
        return data.user.id;
      });
    }
    return signingIn;
  }

  function toComment(row: any, me: string | null): BookComment {
    return {
      id: row.id,
      bookId: row.book_id,
      name: row.name,
      body: row.body,
      createdAt: row.created_at,
      mine: me !== null && row.user_id === me,
    };
  }

  return {
    mode: "supabase",

    async getLikes() {
      const [me, res] = await Promise.all([
        currentUserId(),
        supabase.from("likes").select("book_id, user_id"),
      ]);
      if (res.error) throw new Error(res.error.message);
      const counts: Record<string, number> = {};
      const mine: string[] = [];
      for (const row of res.data ?? []) {
        counts[row.book_id] = (counts[row.book_id] ?? 0) + 1;
        if (me && row.user_id === me) mine.push(row.book_id);
      }
      return { counts, mine };
    },

    async setLiked(bookId, liked) {
      const me = await ensureUserId();
      if (liked) {
        const { error } = await supabase
          .from("likes")
          .upsert({ book_id: bookId, user_id: me }, { ignoreDuplicates: true });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("book_id", bookId)
          .eq("user_id", me);
        if (error) throw new Error(error.message);
      }
    },

    async listComments(bookId) {
      const [me, res] = await Promise.all([
        currentUserId(),
        supabase
          .from("comments")
          .select("id, book_id, user_id, name, body, created_at")
          .eq("book_id", bookId)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      if (res.error) throw new Error(res.error.message);
      return (res.data ?? []).map((r) => toComment(r, me));
    },

    async addComment(bookId, name, body) {
      const me = await ensureUserId();
      const { data, error } = await supabase
        .from("comments")
        .insert({ book_id: bookId, user_id: me, name, body })
        .select("id, book_id, user_id, name, body, created_at")
        .single();
      if (error) throw new Error(error.message);
      return toComment(data, me);
    },

    async deleteComment(id) {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
  };
}
