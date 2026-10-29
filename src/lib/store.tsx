import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, EMPTY_SETTINGS, type LikeSummary, type Post, type PostInput, type Session, type Settings } from "./api";

type Store = {
  ready: boolean;
  error: string | null;
  posts: Post[];
  settings: Settings;
  likes: LikeSummary;
  commentCounts: Record<string, number>;
  commentsVersion: number;
  session: Session;
  isAdmin: boolean;
  toggleLike: (postId: string) => Promise<void>;
  setCommentCount: (postId: string, count: number) => void;
  savePost: (p: PostInput) => Promise<Post>;
  deletePost: (id: string) => Promise<void>;
  saveSettings: (s: Settings) => Promise<void>;
  signIn: (email: string, password: string) => Promise<Session>;
  signOut: () => Promise<void>;
  reload: () => Promise<void>;
  notify: (message: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}

export function StoreProvider({ children, notify }: { children: ReactNode; notify: (m: string) => void }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [settings, setSettings] = useState<Settings>(EMPTY_SETTINGS);
  const [likes, setLikes] = useState<LikeSummary>({ counts: {}, mine: [] });
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [commentsVersion, setCommentsVersion] = useState(0);
  const [session, setSession] = useState<Session>(null);
  const pendingLikes = useRef(0);

  const loadPosts = useCallback(async () => {
    const [p, s] = await Promise.all([api.listPosts(), api.getSettings()]);
    setPosts(p);
    setSettings(s);
  }, []);

  const loadSocial = useCallback(async () => {
    const [l, c] = await Promise.all([api.getLikes(), api.getCommentCounts()]);
    if (pendingLikes.current === 0) setLikes(l);
    setCommentCounts(c);
  }, []);

  const reload = useCallback(async () => {
    try {
      const sess = await api.getSession();
      setSession(sess);
      await Promise.all([loadPosts(), loadSocial()]);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReady(true);
    }
  }, [loadPosts, loadSocial]);

  useEffect(() => {
    reload();
    let t: number | undefined;
    const unsub = api.subscribe((what) => {
      if (what === "comments") setCommentsVersion((v) => v + 1);
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        (what === "posts" ? loadPosts() : loadSocial()).catch(() => {});
      }, 350);
    });
    return () => {
      window.clearTimeout(t);
      unsub();
    };
  }, [reload, loadPosts, loadSocial]);

  const toggleLike = useCallback(
    async (postId: string) => {
      const liked = likes.mine.includes(postId);
      const apply = (s: LikeSummary, now: boolean): LikeSummary => ({
        counts: { ...s.counts, [postId]: Math.max(0, (s.counts[postId] ?? 0) + (now ? 1 : -1)) },
        mine: now ? [...s.mine.filter((x) => x !== postId), postId] : s.mine.filter((x) => x !== postId),
      });
      setLikes((s) => apply(s, !liked));
      pendingLikes.current++;
      try {
        await api.setLiked(postId, !liked);
      } catch (e) {
        setLikes((s) => apply(s, liked));
        notify(`لم يُحفظ الإعجاب: ${(e as Error).message}`);
      } finally {
        pendingLikes.current--;
      }
    },
    [likes.mine, notify],
  );

  const setCommentCount = useCallback((postId: string, count: number) => {
    setCommentCounts((c) => ({ ...c, [postId]: count }));
  }, []);

  const savePost = useCallback(async (p: PostInput) => {
    const saved = await api.savePost(p);
    setPosts((all) => {
      const rest = all.filter((x) => x.id !== saved.id);
      return [saved, ...rest].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    });
    return saved;
  }, []);

  const deletePost = useCallback(async (id: string) => {
    await api.deletePost(id);
    setPosts((all) => all.filter((x) => x.id !== id));
  }, []);

  const saveSettings = useCallback(async (s: Settings) => {
    await api.saveSettings(s);
    setSettings(s);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const s = await api.signIn(email, password);
      setSession(s);
      await Promise.all([loadPosts(), loadSocial()]); // drafts become visible
      return s;
    },
    [loadPosts, loadSocial],
  );

  const signOut = useCallback(async () => {
    await api.signOut();
    setSession(null);
    await Promise.all([loadPosts(), loadSocial()]);
  }, [loadPosts, loadSocial]);

  const value = useMemo<Store>(
    () => ({
      ready,
      error,
      posts,
      settings,
      likes,
      commentCounts,
      commentsVersion,
      session,
      isAdmin: !!session?.isAdmin,
      toggleLike,
      setCommentCount,
      savePost,
      deletePost,
      saveSettings,
      signIn,
      signOut,
      reload,
      notify,
    }),
    [ready, error, posts, settings, likes, commentCounts, commentsVersion, session, toggleLike, setCommentCount, savePost, deletePost, saveSettings, signIn, signOut, reload, notify],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Posts the public can see right now (the admin also loads drafts). */
export function isLive(p: Post) {
  return p.status === "published" && new Date(p.publishedAt).getTime() <= Date.now();
}
