// Sample content shown ONLY in demo mode (no Supabase keys), so the site can
// be previewed before real content exists. The live site starts empty and is
// filled from the admin dashboard.
import type { Post, PostType, Settings } from "./api";

const day = 86400000;
const ago = (d: number) => new Date(Date.now() - d * day).toISOString();

let n = 0;
function mk(type: PostType, d: number, p: Partial<Post>): Post {
  n++;
  return {
    id: `sample-${type}-${n}`,
    type,
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
    status: "published",
    publishedAt: ago(d),
    featured: false,
    downloads: 0,
    createdAt: ago(d),
    updatedAt: ago(d),
    ...p,
  };
}

/** Abstract artwork as an SVG data URL, used for sample photos and covers. */
function art(a: string, b: string, c: string, seed: number) {
  // sepia "linen" plate with a drawn rosette, in the site's palette
  const cx = 260 + ((seed * 71) % 300);
  const cy = 200 + ((seed * 29) % 200);
  const petals = Array.from({ length: 12 }, (_, i) => `<path d='M0 -60 C22 -110 10 -170 0 -200 C-10 -170 -22 -110 0 -60Z' transform='rotate(${i * 30})'/>`).join("");
  const inner = Array.from({ length: 16 }, (_, i) => `<path d='M0 -30 C10 -45 8 -62 0 -72 C-8 -62 -10 -45 0 -30Z' transform='rotate(${i * 22.5})'/>`).join("");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .18 0'/></filter></defs><rect width='800' height='600' fill='url(%23g)'/><rect width='800' height='600' filter='url(%23n)'/><g transform='translate(${cx} ${cy})' fill='none' stroke='${c}' stroke-opacity='.4' stroke-width='1.6'>${petals}<circle r='56'/><circle r='212'/><circle r='222' stroke-dasharray='2 8'/>${inner}<circle r='24'/></g></svg>`;
  return `data:image/svg+xml;utf8,${svg.replace(/#/g, "%23")}`;
}

// A one-page PDF, so the download button can be tried in demo mode.
const SAMPLE_PDF =
  "data:application/pdf;base64," +
  btoa(
    "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 420 595]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 58>>stream\nBT /F1 18 Tf 60 400 Td (Sample book - demo download) Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF",
  );

export const SAMPLE_SETTINGS: Settings = {
  tagline: "كاتبة وباحثة في الأدب والفكر",
  intro:
    "هنا أجمع ما أكتب وما أقرأ: مقالات وخواطر وشعرًا، وقراءات في كتب أحببتها، واقتباسات رافقتني. أهلًا بك، واقرأ على مهل.",
  about:
    "## من أنا\n\nأكتب لأفهم، وأقرأ لأتعلّم كيف يرى الآخرون العالم. أهتم بالأدب العربي والفكر والفلسفة، وبالأسئلة التي تجمع بينها.\n\n## ماذا ستجد هنا\n\n- مقالات أدبية وفكرية\n- نثر وشعر\n- قراءات في أعمال أدباء عرب وأجانب\n- كتبي للتحميل، وكتب أوصي بها\n\n> الكتابة عندي محاولة دائمة لأن أقول الشيء كما أراه، لا كما يُقال.\n\n*هذا نص تجريبي — عدّليه من لوحة التحكم ← الإعدادات.*",
  photoUrl: null,
  email: "hello@example.com",
  links: [
    { label: "X", url: "https://x.com" },
    { label: "Instagram", url: "https://instagram.com" },
  ],
};

export const SAMPLE_POSTS: Post[] = [
  // ── مقالات
  mk("article", 3, {
    title: "القراءة بوصفها حوارًا",
    category: "فكر",
    tags: ["القراءة", "الكتابة"],
    featured: true,
    coverUrl: art("#3b2c22", "#6e5039", "#e2c79a", 3),
    excerpt: "لا نقرأ الكتاب لنأخذ منه فقط، بل لنجادله ونسائله، ونخرج منه وقد تغيّر فينا شيء.",
    body:
      "حين نفتح كتابًا، نظن أننا نستمع إلى صوت واحد. لكن القراءة الحقيقية حوار: صوت الكاتب، وصوتنا نحن، وأصوات كل الكتب التي قرأناها من قبل.\n\n## القارئ ليس وعاءً\n\nالقارئ الجيد لا يكتفي بأن يتلقى. إنه **يسأل** ويعترض ويضع علامات في الهامش، ويعود إلى الصفحة بعد سنوات فيجدها قد تغيّرت، مع أنها لم تتغير؛ هو الذي تغيّر.\n\n> كل كتاب نقرؤه يكمل جملة بدأها كتاب قبله.\n\n## ثلاث عادات تجعل القراءة حوارًا\n\n- أن نكتب سؤالًا واحدًا بعد كل فصل\n- أن نقرأ رأيًا مخالفًا لما أعجبنا\n- أن نعيد قراءة ما أحببناه بعد زمن\n\nبهذا تصبح المكتبة مجلسًا عامرًا لا رفوفًا صامتة.",
  }),
  mk("article", 12, {
    title: "اللغة بيتٌ نسكنه",
    category: "لغة وأدب",
    tags: ["اللغة العربية"],
    coverUrl: art("#3f3b29", "#6f6a46", "#e8dcb0", 7),
    excerpt: "عن العربية التي نكتب بها ونحلم بها، وعن مسؤولية الكاتب تجاه الكلمة.",
    body:
      "ليست اللغة أداة نستعملها ثم نضعها جانبًا، بل هي البيت الذي نسكنه. فيها نفكر، وبها نحب، ومنها نطل على العالم.\n\n## الكلمة مسؤولية\n\nحين يختار الكاتب كلمة دون أخرى فهو يختار طريقة في رؤية الأشياء. ولهذا كانت الكتابة عملًا أخلاقيًا قبل أن تكون فنًا.\n\nوالعربية، بسعتها وجذورها، تمنحنا هذا الاختيار في كل جملة.",
  }),
  mk("article", 26, {
    title: "عن الكتابة في زمن السرعة",
    category: "مقالات أدبية",
    tags: ["الكتابة"],
    excerpt: "هل ما زال للنص الطويل مكان في عالم يقرأ بإبهامه؟",
    body:
      "نعيش زمنًا يقيس كل شيء بالثواني. ومع ذلك، ما زال القارئ يبحث عن النص الذي يمنحه وقتًا أبطأ، ومساحة للتأمل.\n\nأظن أن الكتابة الجيدة لا تنافس السرعة، بل تقدم بديلًا عنها.",
  }),

  // ── نثر
  mk("prose", 6, {
    title: "رسالة إلى المساء",
    category: "خواطر",
    body:
      "أيها المساء، يا آخر ما يبقى من النهار،\nكم مرة جئتَ محمّلًا بالأسئلة، ورحلتَ دون أن تترك جوابًا.\n\nأجلس إلى نافذتي، والضوء ينسحب عن الجدران كما ينسحب المدّ عن الشاطئ، وأفكر: ما الذي يبقى منا حين ينتهي اليوم؟\n\nربما يبقى ما كتبناه، وما قلناه لمن نحب.",
  }),
  mk("prose", 18, {
    title: "نافذة",
    category: "خواطر",
    body:
      "للبيت نوافذ كثيرة، لكن نافذةً واحدة تعرفني.\nمنها رأيتُ المطر الأول، ومنها ودّعتُ صيفًا طويلًا.\n\nالنوافذ لا تُطلّ على الخارج فقط؛ إنها تُطلّ علينا أيضًا.",
  }),

  // ── شعر  (بيت عمودي: الصدر | العجز)
  mk("poem", 9, {
    title: "حبر",
    category: "شعر عمودي",
    body:
      "كتبتُ اسمكِ في الأوراقِ حتى | تعلّمتِ الحروفُ بهِ الضياءَ\nوكانَ الحبرُ يسبقني إليهِ | كأنّ الحبرَ يعرفُ ما أشاءَ\n\nإذا ضاقتْ بيَ الدنيا اتّسعتْ | قصيدتُها فكانتْ لي سماءَ",
    excerpt: "قصيدة تجريبية",
  }),
  mk("poem", 21, {
    title: "أسئلة صغيرة",
    category: "شعر حر",
    body:
      "أسألُ الغيمةَ:\nإلى أين؟\nفتمضي.\n\nأسألُ الطريقَ:\nإلى متى؟\nفيطول.\n\nوأسألُ قلبي\nفيكتبُ قصيدة.",
  }),

  // ── قراءات
  mk("review", 4, {
    title: "الهجرة بوصفها سؤالًا عن الذات",
    refAuthor: "الطيب صالح",
    refSource: "موسم الهجرة إلى الشمال",
    category: "رواية",
    coverUrl: art("#4a2420", "#86463a", "#f0d9a0", 11),
    excerpt: "قراءة في رواية لا تزال تطرح أسئلتها على كل جيل جديد من القراء.",
    body:
      "تبدو «موسم الهجرة إلى الشمال» في ظاهرها حكاية رجلٍ عاد إلى قريته، لكنها في عمقها سؤال عن الهوية حين تتنازعها ثقافتان.\n\n## الراوي ومصطفى سعيد\n\nأجمل ما في الرواية أن الراوي يكتشف نفسه وهو يحاول فهم غيره. وكأن الكاتب يقول: لا نعرف ذواتنا إلا عبر الآخرين.\n\n> رواية قصيرة، لكنها تتسع كلما عدت إليها.",
  }),
  mk("review", 15, {
    title: "«الأيام»: حين تصير السيرة أدبًا",
    refAuthor: "طه حسين",
    refSource: "الأيام",
    category: "سيرة",
    excerpt: "كيف حوّل طه حسين طفولته إلى نصٍّ يقرؤه الجميع كأنه سيرتهم.",
    body:
      "يكتب طه حسين عن نفسه بضمير الغائب، فيمنح القارئ مسافة يرى منها الطفل كما يراه الكاتب الكبير: بحنوّ وسخرية خفيفة معًا.\n\nهذه المسافة هي سرّ جمال الكتاب.",
  }),

  // ── اقتباسات
  mk("quote", 1, {
    body: "نكتب لأن بعض الأفكار لا تكتمل إلا حين نراها على الورق.",
    category: "الكتابة",
    featured: true,
  }),
  mk("quote", 5, {
    body: "القارئ الحقيقي لا يُنهي الكتاب، بل يبدأ به.",
    category: "القراءة",
  }),
  mk("quote", 8, {
    body: "اللغة ليست ما نقوله فقط، بل الطريقة التي نرى بها ما نقول.",
    category: "اللغة",
  }),
  mk("quote", 10, {
    body: "على قدرِ أهلِ العزمِ تأتي العزائمُ | وتأتي على قدرِ الكرامِ المكارمُ",
    refAuthor: "المتنبي",
    refSource: "ديوان المتنبي",
    category: "شعر",
    featured: true,
  }),
  mk("quote", 14, {
    body: "إذا غامرتَ في شرفٍ مرومِ | فلا تقنعْ بما دونَ النجومِ",
    refAuthor: "المتنبي",
    refSource: "ديوان المتنبي",
    category: "شعر",
  }),
  mk("quote", 17, {
    body: "وإني وإن كنتُ الأخيرَ زمانُهُ | لآتٍ بما لم تستطعْهُ الأوائلُ",
    refAuthor: "أبو العلاء المعري",
    refSource: "سقط الزند",
    category: "شعر",
  }),
  mk("quote", 20, {
    body: "أنا أفكر، إذن أنا موجود.",
    refAuthor: "رينيه ديكارت",
    refSource: "مقال عن المنهج",
    category: "فلسفة",
  }),
  mk("quote", 24, {
    body: "الحياة التي لا تُفحص لا تستحق أن تُعاش.",
    refAuthor: "سقراط",
    refSource: "محاورة الدفاع لأفلاطون",
    category: "فلسفة",
  }),

  // ── كتب
  mk("book", 30, {
    title: "ظلال على الورق",
    bookKind: "mine",
    category: "نصوص",
    excerpt: "مجموعة نصوص نثرية وتأملات كُتبت على مدى سنوات.",
    body: "يجمع هذا الكتاب نصوصًا نثرية وتأملات قصيرة كتبتُها على مدى سنوات، عن القراءة والمدن والناس.\n\n*كتاب تجريبي للعرض.*",
    fileUrl: SAMPLE_PDF,
    fileName: "ظلال-على-الورق.pdf",
    fileSize: 1200,
    downloads: 12,
    featured: true,
  }),
  mk("book", 60, {
    title: "في معنى الكتابة",
    bookKind: "mine",
    category: "مقالات",
    excerpt: "مقالات في الكتابة والقراءة واللغة.",
    body: "مختارات من مقالاتي عن الكتابة وأسئلتها.\n\n*كتاب تجريبي للعرض.*",
    fileUrl: SAMPLE_PDF,
    fileName: "في-معنى-الكتابة.pdf",
    fileSize: 1200,
    downloads: 7,
  }),
  mk("book", 33, {
    title: "طوق الحمامة",
    bookKind: "recommended",
    refAuthor: "ابن حزم الأندلسي",
    category: "أدب أندلسي",
    excerpt: "رسالة في الألفة والمحبة، من أجمل نثر الأندلس.",
    body: "أوصي به لأنه يجمع بين دقة الملاحظة وجمال النثر، ويقرأ كأنه كُتب اليوم.",
  }),
  mk("book", 40, {
    title: "موسم الهجرة إلى الشمال",
    bookKind: "recommended",
    refAuthor: "الطيب صالح",
    category: "رواية",
    excerpt: "رواية عن الهوية والرحلة بين عالمين.",
    body: "من أهم الروايات العربية في القرن العشرين. كتبتُ عنها قراءة في قسم القراءات.",
  }),
  mk("book", 45, {
    title: "الأيام",
    bookKind: "recommended",
    refAuthor: "طه حسين",
    category: "سيرة",
    excerpt: "سيرة ذاتية صارت من كلاسيكيات الأدب العربي.",
    body: "سيرة كتبت بأسلوب يجمع الحنو والسخرية، وتعلّم كيف تتحول التجربة الشخصية إلى أدب.",
  }),

  // ── صور
  mk("photo", 2, { title: "ضوء المساء", body: "صورة تجريبية", coverUrl: art("#2b221c", "#7d5a3c", "#f2d48a", 1) }),
  mk("photo", 7, { title: "مكتبة البيت", body: "صورة تجريبية", coverUrl: art("#3a3a2a", "#8a8460", "#efe4c0", 2) }),
  mk("photo", 11, { title: "ورق وحبر", body: "صورة تجريبية", coverUrl: art("#3a2a1f", "#9a6a3a", "#f5e2b8", 4) }),
  mk("photo", 16, { title: "نافذة", body: "صورة تجريبية", coverUrl: art("#5c4533", "#a38e79", "#f6efe4", 5) }),
  mk("photo", 22, { title: "طريق", body: "صورة تجريبية", coverUrl: art("#5a2b24", "#a5644c", "#ffe0c4", 6) }),
  mk("photo", 28, { title: "صباح", body: "صورة تجريبية", coverUrl: art("#6e5a43", "#c2a77f", "#fff3d8", 8) }),
];
