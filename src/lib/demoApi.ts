import type { Api, Post, PostComment, PostInput, Settings } from "./api";
import { SAMPLE_POSTS, SAMPLE_SETTINGS } from "./sampleContent";

/**
 * Demo mode — used when no Supabase keys are set (e.g. `npm run dev` with no .env).
 * Everything lives in this browser's localStorage and starts with sample content,
 * so the whole site and the admin dashboard can be tried before connecting
 * a database. In demo mode any email + password opens the dashboard.
 */
const KEY = "khadija-site-demo-v1";
const ME = "khadija-site-demo-me";

type Store = {
  posts: Post[];
  settings: Settings;
  likes: { postId: string; userId: string }[];
  comments: (Omit<PostComment, "mine"> & { userId: string })[];
  admin: string | null;
};

function fresh(): Store {
  return {
    posts: SAMPLE_POSTS,
    settings: SAMPLE_SETTINGS,
    likes: [],
    comments: SAMPLE_COMMENTS(),
    admin: null,
  };
}

function SAMPLE_COMMENTS(): Store["comments"] {
  const first = SAMPLE_POSTS.find((p) => p.type === "article");
  if (!first) return [];
  const c1 = {
    id: "demo-c1",
    postId: first.id,
    parentId: null,
    name: "سلمى",
    body: "مقالة جميلة، أعجبتني فكرة أن القراءة حوار لا ينتهي.",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    isAuthor: false,
    userId: "someone",
  };
  const r1 = {
    id: "demo-r1",
    postId: first.id,
    parentId: "demo-c1",
    name: "خديجه فاروق المطري",
    body: "شكرًا يا سلمى، سعيدة أن الفكرة وصلتك.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isAuthor: true,
    userId: "admin",
  };
  return [c1, r1];
}

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
  } catch {
    /* fall through */
  }
  return fresh();
}

function write(s: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage full or blocked */
  }
}

function me() {
  try {
    let id = localStorage.getItem(ME);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ME, id);
    }
    return id;
  } catch {
    return "me";
  }
}

const pause = (ms = 120) => new Promise((r) => setTimeout(r, ms));

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function createDemoApi(): Api {
  const uid = me();
  const userOf = (s: Store) => (s.admin ? "admin" : uid);
  const visible = (s: Store) =>
    s.posts
      .filter((p) => s.admin || (p.status === "published" && new Date(p.publishedAt) <= new Date()))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return {
    mode: "demo",

    async listPosts() {
      return visible(read());
    },

    async savePost(input: PostInput) {
      await pause();
      const s = read();
      if (!s.admin) throw new Error("سجّلي الدخول أولًا.");
      const now = new Date().toISOString();
      const existing = input.id ? s.posts.find((p) => p.id === input.id) : undefined;
      const post: Post = {
        id: crypto.randomUUID(),
        title: "",
        body: "",
        excerpt: "",
        coverUrl: null,
        fileUrl: null,
        fileName: null,
        fileSize: null,
        linkUrl: null,
        refAuthor: null,
        refSource: null,
        bookKind: null,
        category: null,
        tags: [],
        status: "draft",
        publishedAt: now,
        featured: false,
        downloads: 0,
        createdAt: now,
        ...existing,
        ...input,
        updatedAt: now,
      } as Post;
      s.posts = existing ? s.posts.map((p) => (p.id === post.id ? post : p)) : [post, ...s.posts];
      write(s);
      return post;
    },

    async deletePost(id) {
      await pause();
      const s = read();
      s.posts = s.posts.filter((p) => p.id !== id);
      write(s);
    },

    // Images are kept as data URLs (they survive a reload if small enough);
    // other files only last until the page is reloaded.
    async upload(file, _folder, onProgress) {
      for (const pct of [20, 55, 85, 100]) {
        await pause(90);
        onProgress?.(pct);
      }
      const url =
        file.type.startsWith("image/") && file.size < 1_500_000
          ? await fileToDataUrl(file)
          : URL.createObjectURL(file);
      return { url, name: file.name, size: file.size };
    },

    async getSettings() {
      return read().settings;
    },

    async saveSettings(settings) {
      await pause();
      const s = read();
      s.settings = settings;
      write(s);
    },

    async recordDownload(postId) {
      const s = read();
      s.posts = s.posts.map((p) => (p.id === postId ? { ...p, downloads: p.downloads + 1 } : p));
      write(s);
    },

    async getLikes() {
      const s = read();
      const who = userOf(s);
      const counts: Record<string, number> = {};
      const mine: string[] = [];
      for (const l of s.likes) {
        counts[l.postId] = (counts[l.postId] ?? 0) + 1;
        if (l.userId === who) mine.push(l.postId);
      }
      return { counts, mine };
    },

    async setLiked(postId, liked) {
      await pause();
      const s = read();
      const who = userOf(s);
      s.likes = s.likes.filter((l) => !(l.postId === postId && l.userId === who));
      if (liked) s.likes.push({ postId, userId: who });
      write(s);
    },

    async getCommentCounts() {
      const counts: Record<string, number> = {};
      for (const c of read().comments) if (!c.parentId) counts[c.postId] = (counts[c.postId] ?? 0) + 1;
      return counts;
    },

    async listComments(postId) {
      await pause();
      const s = read();
      const who = userOf(s);
      return s.comments
        .filter((c) => c.postId === postId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map(({ userId, ...c }) => ({ ...c, mine: userId === who }));
    },

    async listRecentComments(limit) {
      const s = read();
      const who = userOf(s);
      return [...s.comments]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit)
        .map(({ userId, ...c }) => ({ ...c, mine: userId === who }));
    },

    async addComment({ postId, name, body, parentId = null, asAuthor = false }) {
      await pause();
      const s = read();
      if ((asAuthor || parentId) && !s.admin) throw new Error("الرد باسم الكاتبة للمديرة فقط.");
      const c = {
        id: crypto.randomUUID(),
        postId,
        parentId,
        name,
        body,
        createdAt: new Date().toISOString(),
        isAuthor: asAuthor,
        userId: userOf(s),
      };
      s.comments.push(c);
      write(s);
      const { userId: _u, ...rest } = c;
      return { ...rest, mine: true };
    },

    async deleteComment(id) {
      await pause();
      const s = read();
      const who = userOf(s);
      s.comments = s.comments.filter(
        (c) => !(c.id === id && (s.admin || c.userId === who)) && !(c.parentId === id && s.admin),
      );
      write(s);
    },

    async getSession() {
      const s = read();
      return s.admin ? { email: s.admin, isAdmin: true } : null;
    },

    async signIn(email, password) {
      await pause(300);
      if (!email.trim() || !password) throw new Error("اكتبي البريد وكلمة المرور.");
      const s = read();
      s.admin = email.trim();
      write(s);
      return { email: s.admin, isAdmin: true };
    },

    async signOut() {
      const s = read();
      s.admin = null;
      write(s);
    },

    subscribe(onChange) {
      const handler = (e: StorageEvent) => {
        if (e.key === KEY) {
          onChange("likes");
          onChange("comments");
          onChange("posts");
        }
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    },
  };
}
