// Arabic number formatting and plurals.

const digits = new Intl.NumberFormat("ar-EG");
export const n = (x: number) => digits.format(x);

const yearDigits = new Intl.NumberFormat("ar-EG", { useGrouping: false });
/** 1966 -> ١٩٦٦م */
export const year = (y: number) => `${yearDigits.format(y)}م`;

const rules = new Intl.PluralRules("ar");

type Forms = { zero: string; one: string; two: string; few: string; many: string; other: string };

/** Picks the right Arabic plural form; `#` is replaced by the number. */
export function plural(count: number, forms: Forms) {
  const form = forms[rules.select(count) as keyof Forms] ?? forms.other;
  return form.replace("#", n(count));
}

export const likesText = (c: number) =>
  plural(c, {
    zero: "لا إعجابات",
    one: "إعجاب واحد",
    two: "إعجابان",
    few: "# إعجابات",
    many: "# إعجابًا",
    other: "# إعجاب",
  });

export const commentsText = (c: number) =>
  plural(c, {
    zero: "لا تعليقات بعد",
    one: "تعليق واحد",
    two: "تعليقان",
    few: "# تعليقات",
    many: "# تعليقًا",
    other: "# تعليق",
  });

export const booksText = (c: number) =>
  plural(c, {
    zero: "لا كتب على الرف",
    one: "كتاب واحد على الرف",
    two: "كتابان على الرف",
    few: "# كتب على الرف",
    many: "# كتابًا على الرف",
    other: "# كتاب على الرف",
  });

const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });

export function timeAgo(iso: string) {
  const secs = (new Date(iso).getTime() - Date.now()) / 1000;
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(secs) >= size) return rtf.format(Math.round(secs / size), unit);
  }
  return "الآن";
}
