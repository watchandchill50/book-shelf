import { createSupabaseApi } from "./supabaseApi";
import { createDemoApi } from "./demoApi";

export type PostType = "article" | "prose" | "poem" | "review" | "quote" | "book" | "photo";

export type Post = {
  id: string;
  type: PostType;
  title: string;
  /** Markdown-light text (see lib/markdown.tsx). For poems: one verse per line. */
  body: string;
  excerpt: string;
  coverUrl: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  linkUrl: string | null;
  /** quote: who said it · review: the writer discussed · book: its author */
  refAuthor: string | null;
  /** quote: source · review: the work discussed */
  refSource: string | null;
  bookKind: "mine" | "recommended" | null;
  category: string | null;
  tags: string[];
  status: "draft" | "published";
  publishedAt: string;
  featured: boolean;
  downloads: number;
  createdAt: string;
  updatedAt: string;
};

export type PostInput = Partial<Post> & { type: PostType };

export type Settings = {
  tagline: string;
  intro: string;
  about: string;
  photoUrl: string | null;
  email: string;
  links: { label: string; url: string }[];
};

export type LikeSummary = { counts: Record<string, number>; mine: string[] };

export type PostComment = {
  id: string;
  postId: string;
  parentId: string | null;
  name: string;
  body: string;
  createdAt: string;
  isAuthor: boolean;
  mine: boolean;
};

export type Uploaded = { url: string; name: string; size: number };

export type Session = { email: string; isAdmin: boolean } | null;

export interface Api {
  mode: "supabase" | "demo";

  // content
  listPosts(): Promise<Post[]>; // everything the viewer may see (drafts too for the admin)
  savePost(input: PostInput): Promise<Post>;
  deletePost(id: string): Promise<void>;
  upload(file: File, folder: "images" | "files", onProgress?: (pct: number) => void): Promise<Uploaded>;
  getSettings(): Promise<Settings>;
  saveSettings(s: Settings): Promise<void>;
  recordDownload(postId: string): Promise<void>;

  // likes & comments
  getLikes(): Promise<LikeSummary>;
  setLiked(postId: string, liked: boolean): Promise<void>;
  getCommentCounts(): Promise<Record<string, number>>;
  listComments(postId: string): Promise<PostComment[]>;
  listRecentComments(limit: number): Promise<PostComment[]>;
  addComment(c: { postId: string; name: string; body: string; parentId?: string | null; asAuthor?: boolean }): Promise<PostComment>;
  deleteComment(id: string): Promise<void>;

  // admin session
  getSession(): Promise<Session>;
  signIn(email: string, password: string): Promise<Session>;
  signOut(): Promise<void>;

  subscribe(onChange: (what: "likes" | "comments" | "posts") => void): () => void;
}

export const LIMITS = { name: 40, comment: 1000 };

export const EMPTY_SETTINGS: Settings = {
  tagline: "",
  intro: "",
  about: "",
  photoUrl: null,
  email: "",
  links: [],
};

export function normalizeSupabaseUrl(raw: string): string {
  const value = raw.trim().replace(/^["']|["']$/g, "");
  const dashboard = value.match(/supabase\.com\/dashboard\/project\/([a-z0-9]+)/i);
  if (dashboard) return `https://${dashboard[1]}.supabase.co`;
  try {
    const u = new URL(value.startsWith("http") ? value : `https://${value}`);
    return `${u.protocol}//${u.host}`;
  } catch {
    return value.replace(/\/+$/, "");
  }
}

export function createApi(): Api {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
    ?.trim()
    .replace(/^["']|["']$/g, "");
  if (url && key) return createSupabaseApi(normalizeSupabaseUrl(url), key);
  return createDemoApi();
}

/** The site-wide API instance. */
export const api = createApi();
