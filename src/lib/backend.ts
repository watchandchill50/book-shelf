import { createSupabaseBackend } from "./supabaseBackend";
import { createDemoBackend } from "./demoBackend";

export type LikeSummary = {
  /** bookId -> number of likes */
  counts: Record<string, number>;
  /** bookIds this visitor has liked */
  mine: string[];
};

export type BookComment = {
  id: string;
  bookId: string;
  name: string;
  body: string;
  createdAt: string;
  /** true when the current visitor wrote it (they can delete it) */
  mine: boolean;
};

export interface Backend {
  mode: "supabase" | "demo";
  getLikes(): Promise<LikeSummary>;
  setLiked(bookId: string, liked: boolean): Promise<void>;
  listComments(bookId: string): Promise<BookComment[]>;
  addComment(bookId: string, name: string, body: string): Promise<BookComment>;
  deleteComment(id: string): Promise<void>;
}

export const LIMITS = { name: 40, body: 1000 };

export function createBackend(): Backend {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (url && key) return createSupabaseBackend(url, key);
  return createDemoBackend();
}
