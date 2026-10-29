// ─────────────────────────────────────────────────────────────
// كتبك — YOUR BOOKS
// Add, remove or edit entries here. Each `id` must be unique, use
// English letters/numbers/dashes, and should never change once people
// have liked or commented (likes and comments are stored against it).
//
// cover  – optional image path, e.g. "covers/my-book.jpg" (put the
//          file in /public/covers). Without it a cover is drawn for you.
// color  – optional spine colour: one of the keys in SPINES below.
// pages  – optional; makes the spine thicker or thinner.
// year   – optional, Gregorian (shown with م).
// ─────────────────────────────────────────────────────────────

export type SpineColor = keyof typeof SPINES;

export type Book = {
  id: string;
  title: string;
  author: string;
  year?: number;
  pages?: number;
  color?: SpineColor;
  cover?: string;
  /** نبذة عن الكتاب في جملتين */
  blurb: string;
  /** كلماتك أنت: لماذا هذا الكتاب على رفّك */
  note?: string;
  /** رابط اختياري */
  link?: string;
};

export const SPINES = {
  oxblood: { bg: "#7A2E35", fg: "#F6E9E4" },
  turquoise: { bg: "#2E7D7A", fg: "#E6F4F2" },
  saffron: { bg: "#C9962E", fg: "#2A1F0A" },
  olive: { bg: "#5E6B34", fg: "#F0F2E2" },
  plum: { bg: "#5A3E6B", fg: "#F0E8F4" },
  emerald: { bg: "#2F5E4A", fg: "#E5F1EA" },
  rose: { bg: "#9E4A55", fg: "#FBECEE" },
  bone: { bg: "#E4DBC6", fg: "#2E2617" },
} as const;

// أمثلة — استبدلها بكتبك.
export const books: Book[] = [
  {
    id: "season-of-migration",
    title: "موسم الهجرة إلى الشمال",
    author: "الطيب صالح",
    year: 1966,
    pages: 170,
    color: "oxblood",
    blurb:
      "شابٌّ سوداني يعود من أوروبا إلى قريته على النيل، فيشغله غريبٌ يقيم بينهم يُخفي ماضيًا في لندن أعقد مما يظنه أحد.",
    note: "رواية قصيرة تُقرأ في عطلة نهاية أسبوع، وما زلت أفكر في نهايتها.",
  },
  {
    id: "granada-trilogy",
    title: "ثلاثية غرناطة",
    author: "رضوى عاشور",
    year: 1994,
    pages: 500,
    color: "turquoise",
    blurb:
      "حكاية أسرة غرناطية عبر أجيال بعد سقوط آخر ممالك الأندلس، وكيف حاولت أن تحفظ لغتها وذاكرتها.",
    note: "أطول ما قرأت من الروايات العربية، وأكثرها أثرًا فيّ.",
  },
  {
    id: "the-sealed-nectar",
    title: "الرحيق المختوم",
    author: "صفي الرحمن المباركفوري",
    pages: 480,
    color: "emerald",
    blurb:
      "سيرة النبي ﷺ مرتّبة على الأحداث من المولد إلى الوفاة، بأسلوب واضح يناسب القارئ غير المتخصص.",
  },
  {
    id: "the-days",
    title: "الأيام",
    author: "طه حسين",
    year: 1929,
    pages: 300,
    color: "bone",
    blurb:
      "سيرة طه حسين الذاتية: طفولته في صعيد مصر بعد أن فقد بصره، ثم رحلته إلى الأزهر والجامعة.",
  },
  {
    id: "ring-of-the-dove",
    title: "طوق الحمامة",
    author: "ابن حزم الأندلسي",
    pages: 220,
    color: "rose",
    blurb:
      "رسالة أندلسية في الألفة والمحبة: علاماتها وأحوالها وآدابها، مع قصص ومشاهد من قرطبة.",
    note: "نثرٌ عمره ألف سنة ويقرأ كأنه كُتب اليوم.",
  },
  {
    id: "muqaddimah",
    title: "المقدمة",
    author: "ابن خلدون",
    pages: 600,
    color: "olive",
    blurb:
      "كيف تقوم الدول وتسقط، وما الذي يجمع الناس ويفرّقهم. يعدّه كثيرون أول كتاب في علم الاجتماع.",
  },
  {
    id: "men-in-the-sun",
    title: "رجال في الشمس",
    author: "غسان كنفاني",
    year: 1963,
    pages: 110,
    color: "saffron",
    blurb:
      "ثلاثة رجال من أجيال مختلفة يحاولون عبور الصحراء إلى الكويت مختبئين في خزان شاحنة ماء.",
  },
  {
    id: "dont-be-sad",
    title: "لا تحزن",
    author: "عائض القرني",
    pages: 460,
    color: "plum",
    blurb:
      "تأملات قصيرة في الصبر والرضا وتجاوز الهمّ، تجمع بين الآيات والأحاديث والشعر وأقوال الحكماء.",
  },
];
