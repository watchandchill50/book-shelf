import type { PostType } from "./lib/api";

// The site name, shown in the header, the browser tab and shared links.
// Tagline, introduction, about page and links are edited from the dashboard.
export const SITE_NAME = "خديجه فاروق المطري";

export type Section = {
  /** URL path */
  path: string;
  /** which posts it lists */
  type: PostType;
  /** menu / page title */
  title: string;
  /** singular, used as a label on cards ("مقالة") */
  label: string;
  /** one line under the page title */
  description: string;
};

export const SECTIONS: Section[] = [
  {
    path: "/articles",
    type: "article",
    title: "المقالات",
    label: "مقالة",
    description: "مقالات أدبية وفكرية في الكتابة واللغة والثقافة.",
  },
  {
    path: "/prose",
    type: "prose",
    title: "النثر",
    label: "نثر",
    description: "نصوص وخواطر كُتبت على مهل.",
  },
  {
    path: "/poetry",
    type: "poem",
    title: "الشعر",
    label: "قصيدة",
    description: "قصائد عمودية وحرّة.",
  },
  {
    path: "/readings",
    type: "review",
    title: "قراءات",
    label: "قراءة",
    description: "تعليقات وقراءات في كتابات الأدباء والمفكرين، عربًا وأجانب.",
  },
  {
    path: "/quotes",
    type: "quote",
    title: "الاقتباسات",
    label: "اقتباس",
    description: "اقتباساتي، ومختارات من أدباء ومفكرين. حمّل أيًّا منها صورةً وشاركه.",
  },
  {
    path: "/books",
    type: "book",
    title: "الكتب",
    label: "كتاب",
    description: "كتبي للتحميل، وكتب أوصي بقراءتها.",
  },
  {
    path: "/gallery",
    type: "photo",
    title: "الصور",
    label: "صورة",
    description: "لحظات وأمكنة.",
  },
];

export const sectionOf = (type: PostType) => SECTIONS.find((s) => s.type === type)!;
