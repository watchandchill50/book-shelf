import type { Backend, BookComment } from "./backend";

/**
 * Demo mode: used when no Supabase keys are set. Everything is kept in this
 * browser's localStorage, so you can try the site before connecting a
 * database. Nobody else sees these likes or comments.
 */
const KEY = "book-shelf-demo-v1";

type Store = {
  me: string;
  likes: { bookId: string; userId: string }[];
  comments: (Omit<BookComment, "mine"> & { userId: string })[];
};

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {
    /* storage blocked or corrupt — start fresh */
  }
  return { me: crypto.randomUUID(), likes: [], comments: [] };
}

function save(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* storage blocked — the demo still works until reload */
  }
}

const pause = () => new Promise((r) => setTimeout(r, 120));

export function createDemoBackend(): Backend {
  const store = load();

  return {
    mode: "demo",

    async getLikes() {
      const counts: Record<string, number> = {};
      const mine: string[] = [];
      for (const l of store.likes) {
        counts[l.bookId] = (counts[l.bookId] ?? 0) + 1;
        if (l.userId === store.me) mine.push(l.bookId);
      }
      return { counts, mine };
    },

    async setLiked(bookId, liked) {
      await pause();
      store.likes = store.likes.filter((l) => !(l.bookId === bookId && l.userId === store.me));
      if (liked) store.likes.push({ bookId, userId: store.me });
      save(store);
    },

    async listComments(bookId) {
      await pause();
      return store.comments
        .filter((c) => c.bookId === bookId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(({ userId, ...c }) => ({ ...c, mine: userId === store.me }));
    },

    async addComment(bookId, name, body) {
      await pause();
      const c = {
        id: crypto.randomUUID(),
        bookId,
        name,
        body,
        createdAt: new Date().toISOString(),
        userId: store.me,
      };
      store.comments.push(c);
      save(store);
      const { userId: _u, ...rest } = c;
      return { ...rest, mine: true };
    },

    async deleteComment(id) {
      await pause();
      store.comments = store.comments.filter((c) => !(c.id === id && c.userId === store.me));
      save(store);
    },
  };
}
