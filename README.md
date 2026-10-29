# رفّ بلال — Book shelf

An Arabic (RTL) site that shows your books on a shelf inside an arched niche.
Visitors pick a book, like it, and leave comments — no sign-up needed.

Built with **React + TypeScript + Vite**, with **Supabase** for likes and comments.

---

## 1. Run it locally

```bash
npm install
npm run dev
```

Without Supabase keys it runs in **demo mode**: likes and comments are saved
in your browser only, so you can try everything straight away.

## 2. Put your own books on the shelf

Edit **`src/data/books.ts`**. Each book:

| field   | required | notes |
|---------|----------|-------|
| `id`    | yes | English letters, numbers, dashes. Never change it after people comment — likes and comments are stored against it. |
| `title`, `author`, `blurb` | yes | Arabic text |
| `note`  | no | Your own words, shown as "لماذا هو على رفّي" |
| `cover` | no | e.g. `"covers/granada.jpg"` → put the file in `public/covers/`. Without it a cover is drawn from the spine colour. |
| `color` | no | Spine colour: `oxblood`, `turquoise`, `saffron`, `olive`, `plum`, `emerald`, `rose`, `bone` |
| `pages`, `year`, `link` | no | Pages make the spine thicker/thinner |

Site title and intro text: **`src/config.ts`**.
Colours and fonts: the tokens at the top of **`src/styles.css`**.

## 3. Turn on real likes & comments (Supabase, free tier is enough)

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query** → paste `supabase/schema.sql` → **Run**.
3. **Authentication → Sign In / Providers** → enable **Allow anonymous sign-ins**.
   (Each visitor gets an invisible anonymous account the first time they like or
   comment, so they can only delete their *own* likes/comments.)
4. **Project Settings → API** → copy the Project URL and the `anon` public key.
5. `cp .env.example .env` and paste them in:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
6. Restart `npm run dev`. The demo-mode notice disappears.

The `anon` key is meant to be public; the Row Level Security rules in
`schema.sql` are what protect the data.

**Moderating:** delete any comment from **Table Editor → comments** in the
Supabase dashboard.

**Spam:** for a personal site this is usually fine. If it becomes a problem,
turn on CAPTCHA under Authentication → Attack Protection.

## 4. Deploy

**Vercel / Netlify:** import the repo, build command `npm run build`,
output folder `dist`, and add the two `VITE_SUPABASE_*` environment variables.

**GitHub Pages:** the included workflow (`.github/workflows/deploy.yml`) builds
and publishes on every push to `main`.
- Repo **Settings → Pages → Source: GitHub Actions**
- Repo **Settings → Secrets and variables → Actions**: add `VITE_SUPABASE_URL`
  and `VITE_SUPABASE_ANON_KEY`

## Notes

- Each book has its own link: `yoursite.com/#book-id` — handy for sharing one book.
- On the shelf, ← and → move between books (RTL order).
- Light and dark mode follow the visitor's system setting.

## Project layout

```
src/
  App.tsx                 page layout, likes state
  config.ts               site title + intro
  data/books.ts           your books
  components/
    Shelf.tsx             arched niche + spines
    BookDetail.tsx        cover, text, like button
    Comments.tsx          comment form + list
    Ornament.tsx          eight-point star
  lib/
    backend.ts            picks Supabase or demo mode
    supabaseBackend.ts    likes/comments in Supabase
    demoBackend.ts        likes/comments in localStorage
    ar.ts                 Arabic numbers, plurals, "x minutes ago"
supabase/schema.sql       tables + security rules
```
