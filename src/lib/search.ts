// Arabic-friendly search: ignores harakat and treats أ إ آ ا as the same
// letter, ة as ه and ى as ي — so "الايام" finds "الأيام".
export function normalizeArabic(s: string) {
  return s
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, "") // tashkeel + tatweel
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}
