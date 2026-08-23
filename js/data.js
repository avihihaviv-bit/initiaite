/**
 * Pizza Italiana — content data.
 *
 * All business data (name, address, phone, hours, reviews) is confirmed from
 * the restaurant's Google Business listing. The full menu below — categories,
 * dish names, descriptions and prices — is transcribed from the restaurant's
 * live Wolt menu as supplied by the owner. Nothing here is invented.
 *
 * To update the menu later, edit MENU_CATEGORIES / MENU_ITEMS only; the UI
 * reads everything from here.
 */

export const RESTAURANT = {
  name: "פיצה איטליאנה",
  nameEn: "Pizza Italiana",
  tagline: "פיצה שעושה חשק לעוד",
  phone: "03-622-5040",
  phoneIntl: "+97236225040",
  telHref: "tel:+97236225040",
  // Landline reused for WhatsApp per the owner's instruction.
  whatsappHref:
    "https://wa.me/97236225040?text=" +
    encodeURIComponent("היי! רציתי לשאול לגבי הזמנה 🍕"),
  address: "אריה שנקר 61, חולון",
  addressFull: "אריה שנקר 61, חולון, 5833323",
  plusCode: "2QCG+4F חולון",
  woltUrl:
    "https://wolt.com/he/isr/rishon-lezion-hashfela-area/restaurant/italianaholon",
  mapsQuery: "פיצה איטליאנה, אריה שנקר 61, חולון",
  rating: 4.8,
  reviewCount: 83,
  priceRange: "50–100 ₪ לאדם",
};

// day: JS Date.getDay() — 0 Sunday … 6 Saturday
export const HOURS = [
  { day: 0, label: "יום ראשון", open: "15:00", close: "23:00", closed: false },
  { day: 1, label: "יום שני", open: "14:00", close: "23:00", closed: false },
  { day: 2, label: "יום שלישי", open: "14:00", close: "23:00", closed: false },
  { day: 3, label: "יום רביעי", open: "14:00", close: "23:00", closed: false },
  { day: 4, label: "יום חמישי", open: "14:00", close: "23:00", closed: false },
  { day: 5, label: "יום שישי", open: null, close: null, closed: true },
  { day: 6, label: "יום שבת", open: "20:00", close: "00:00", closed: false },
];

// Verbatim from the restaurant's real Google reviews — never invented.
export const REVIEWS = [
  {
    name: "Adi Ben Amram",
    meta: "3 ביקורות",
    timeAgo: "לפני 3 חודשים",
    rating: 5,
    text:
      "הזמנתי פיצה וכבר בטלפון קיבלתי יחס נעים וסובלני, הפיצה הגיעה חמה עם רטבים בשפע. הרבה זמן לא אכלתי פיצה כזו טעימה, ממש! מאז שהכרתי את פיצה איטליאנה, רק משם אני מזמינה. ממליצה בחום!",
  },
  {
    name: "דיאנה כהן",
    meta: "9 ביקורות · 4 תמונות",
    timeAgo: "לפני חודש",
    rating: 5,
    text:
      "שמעו שזו הפיצה הכי טעימה שאכלתי בחיים שלי! ביום של מונדיאל. הגיע מהר, חם, טעים. שאפו.",
    orderType: "משלוחים",
    reply: {
      timeAgo: "לפני חודש",
      text:
        "תודה רבה רבה ובאהבה גדולה. מעריכים ממש שימחת אותנו וחיממת את הלב. נשמח להמשיך להטעים לכם בפעמים הבאות ❤️",
    },
  },
  {
    name: "Siyan Tahori",
    meta: "9 ביקורות",
    timeAgo: "לפני 4 חודשים",
    rating: 5,
    text:
      "הגעתי 10 דק' לפני שסגרו ונתנו לי את השירות הכי טוב עליי אדמות באדיבות ממש. אנשים זהב, אחלה פיצה ממש טעימה! ממליצה, ממש שווה להזמין מהם פיצה.",
    orderType: "אכילה במקום",
  },
];

export const FAQS = [
  {
    q: "איך מזמינים מפיצה איטליאנה?",
    a: 'ההזמנות מתבצעות דרך וולט — לוחצים על "הזמנה בוולט" בכל מקום באתר ומגיעים ישר לעמוד המסעדה שלנו. אפשר גם להתקשר אלינו ישירות ל-03-622-5040.',
  },
  {
    q: "האם יש משלוחים ואיסוף עצמי?",
    a: "כן. אנחנו מציעים משלוחים, משלוח ללא מגע, איסוף עצמי מהסניף באריה שנקר 61 בחולון, וכמובן ישיבה ואכילה במקום.",
  },
  {
    q: "מה שעות הפעילות?",
    a: "ראשון 15:00–23:00, שני עד חמישי 14:00–23:00, שבת 20:00–00:00. בימי שישי אנחנו סגורים. הסטטוס פתוח/סגור באתר מתעדכן בזמן אמת.",
  },
];

export const MENU_CATEGORIES = [
  { id: "build-pizza", name: "פיצות בהרכבה", icon: "pizza" },
  { id: "house-pizza", name: "פיצות הבית", icon: "pizza" },
  { id: "pasta", name: "הפסטיליאנה", icon: "pasta" },
  { id: "yemenite", name: "תימניאלה", icon: "bread" },
  { id: "toast", name: "טוסטים", icon: "bread" },
  { id: "dessert", name: "קינוחים", icon: "deal" },
  { id: "drinks", name: "שתיה קלה", icon: "drink" },
];

/**
 * Real menu, transcribed from the restaurant's Wolt page.
 * `img` is set only where real photography is available; items without it
 * fall back to the illustrated category placeholder.
 */
export const MENU_ITEMS = [
  // ---- פיצות בהרכבה ----
  {
    id: "pizza-ishit",
    category: "build-pizza",
    name: "פיצה אישית",
    desc: "רוטב עגבניות וגבינה. ניתן להוסיף תוספות.",
    price: "₪27",
    tags: [],
    bestseller: true,
    img: "assets/images/menu/pizza-ishit.png",
  },
  {
    id: "pizza-mishpahtit",
    category: "build-pizza",
    name: "פיצה משפחתית",
    desc: "רוטב עגבניות וגבינה. ניתן להוסיף תוספות.",
    price: "₪70",
    tags: [],
    bestseller: true,
    img: "assets/images/menu/pizza-mishpahtit.png",
  },
  // ---- פיצות הבית ----
  {
    id: "pizza-levana-ishit",
    category: "house-pizza",
    name: "פיצה לבנה | אישית",
    desc: "על בסיס אלפרדו, מוצרלה, בולגרית, פרמזן ופטריות.",
    price: "₪40",
    tags: [],
    recommended: true,
    img: "assets/images/menu/pizza-levana.png",
  },
  {
    id: "pizza-levana-mishpahtit",
    category: "house-pizza",
    name: "פיצה לבנה | משפחתית",
    desc: "על בסיס אלפרדו, מוצרלה, בולגרית, פרמזן ופטריות.",
    price: "₪80",
    tags: [],
    img: "assets/images/menu/pizza-levana.png",
  },
  {
    id: "pizza-yevanit-ishit",
    category: "house-pizza",
    name: "פיצה יוונית | אישית",
    desc: "על בסיס רוטב עגבניות, בצל, זיתי קלמטה, בולגרית ועגבניות שרי.",
    price: "₪40",
    tags: [],
    recommended: true,
    img: "assets/images/menu/pizza-yevanit.png",
  },
  {
    id: "pizza-yevanit-mishpahtit",
    category: "house-pizza",
    name: "פיצה יוונית | משפחתית",
    desc: "על בסיס רוטב עגבניות, בצל, זיתי קלמטה, בולגרית ועגבניות שרי.",
    price: "₪80",
    tags: [],
    img: "assets/images/menu/pizza-yevanit.png",
  },
  // ---- הפסטיליאנה ----
  {
    id: "pasta-penne",
    category: "pasta",
    name: "פסטה פנה",
    desc: "בחרו רוטב.",
    price: "₪45",
    tags: [],
    bestseller: true,
    img: "assets/images/menu/pasta-penne.png",
  },
  {
    id: "spaghetti",
    category: "pasta",
    name: "ספגטי",
    desc: "בחרו רוטב.",
    price: "₪45",
    tags: [],
    img: "assets/images/menu/spaghetti.png",
  },
  {
    id: "potato-mukram",
    category: "pasta",
    name: 'תפו"א מוקרם',
    desc: "בחרו תוספות.",
    price: "₪40",
    tags: [],
    img: "assets/images/menu/potato-mukram.png",
  },
  {
    id: "ravioli-gvina",
    category: "pasta",
    name: "רביולי גבינה",
    desc: "בחרו רוטב.",
    price: "₪50",
    tags: [],
    img: "assets/images/menu/ravioli-gvina.png",
  },
  {
    id: "ravioli-batata",
    category: "pasta",
    name: "רביולי בטטה",
    desc: "בחרו רוטב.",
    price: "₪50",
    tags: [],
    img: "assets/images/menu/ravioli-batata.png",
  },
  // ---- תימניאלה ----
  {
    id: "ziva-harkava",
    category: "yemenite",
    name: "זיווה בהרכבה",
    desc: "מוגש עם 2 תוספות לבחירה, רסק, ביצה וטחינה.",
    price: "₪38",
    tags: [],
    bestseller: true,
    img: "assets/images/menu/ziva-harkava.png",
  },
  {
    id: "malawach-patuach",
    category: "yemenite",
    name: "מלווח פתוח",
    desc: "מוגש עם רסק, ביצה וטחינה.",
    price: "₪30",
    tags: [],
    img: "assets/images/menu/malawach-patuach.png",
  },
  {
    id: "malawach-megulgal",
    category: "yemenite",
    name: "מלווח מגולגל",
    desc: "מוגש עם רסק, ביצה וטחינה.",
    price: "₪27",
    tags: [],
    img: "assets/images/menu/malawach-megulgal.png",
  },
  {
    id: "ziva-zeitim",
    category: "yemenite",
    name: "זיווה זיתים",
    desc: "מוגש עם רסק, ביצה וטחינה.",
    price: "₪38",
    tags: [],
    img: "assets/images/menu/ziva-zeitim.png",
  },
  {
    id: "ziva-pitriot",
    category: "yemenite",
    name: "זיווה פטריות",
    desc: "מוגש עם רסק, ביצה וטחינה.",
    price: "₪38",
    tags: [],
    img: "assets/images/menu/ziva-pitriot.png",
  },
  {
    id: "malawach-pizza",
    category: "yemenite",
    name: "מלווח פיצה",
    desc: "מוגש עם שתי תוספות.",
    price: "₪33",
    tags: [],
    img: "assets/images/menu/malawach-pizza.png",
  },
  // ---- טוסטים ----
  {
    id: "toast",
    category: "toast",
    name: "טוסט",
    desc: "מוגש עם 3 תוספות לבחירה ו-2 רטבים בצד.",
    price: "₪35",
    tags: [],
    bestseller: true,
    img: "assets/images/menu/toast.png",
  },
  {
    id: "toast-habait",
    category: "toast",
    name: "טוסט הבית",
    desc: "רוטב פיצה, זיתים ובולגרית. מוגש עם 2 רטבים לבחירה בצד.",
    price: "₪35",
    tags: [],
    img: "assets/images/menu/toast-habait.png",
  },
  {
    id: "toast-alfredo",
    category: "toast",
    name: "טוסט על בסיס אלפרדו",
    desc: "מוגש עם 3 תוספות ו-2 רטבים לבחירה בצד.",
    price: "₪38",
    tags: [],
    img: "assets/images/menu/toast-alfredo.png",
  },
  // ---- קינוחים ----
  {
    id: "ziva-chocolate",
    category: "dessert",
    name: "זיווה שוקולד קטן",
    desc: "זיווה חמה במילוי שוקולד.",
    price: "₪30",
    tags: [],
    img: "assets/images/menu/ziva-chocolate.png",
  },
  {
    id: "sambusak-chocolate",
    category: "dessert",
    name: "סמבוסק שוקולד",
    desc: "סמבוסק חם במילוי שוקולד.",
    price: "₪24",
    tags: [],
    img: "assets/images/menu/sambusak-chocolate.png",
  },
  // ---- שתיה קלה ----
  {
    id: "coke-can",
    category: "drinks",
    name: "פחית קוקה קולה",
    desc: "0.33 ליטר.",
    price: "₪10",
    tags: [],
    img: "assets/images/menu/coke-can.png",
  },
  {
    id: "coke-zero-can",
    category: "drinks",
    name: "פחית קולה זירו",
    desc: "0.33 ליטר.",
    price: "₪10",
    tags: [],
    img: "assets/images/menu/coke-zero-can.png",
  },
  {
    id: "sprite-can",
    category: "drinks",
    name: "פחית ספרייט",
    desc: "0.33 ליטר.",
    price: "₪10",
    tags: [],
    img: "assets/images/menu/sprite-can.png",
  },
  {
    id: "fanta-can",
    category: "drinks",
    name: "פחית פאנטה",
    desc: "0.33 ליטר.",
    price: "₪10",
    tags: [],
    img: "assets/images/menu/fanta-can.png",
  },
  {
    id: "coke-big",
    category: "drinks",
    name: "קוקה קולה - גדול",
    desc: "1.5 ליטר.",
    price: "₪15",
    tags: [],
    img: "assets/images/menu/coke-big.png",
  },
  {
    id: "coke-zero-big",
    category: "drinks",
    name: "קולה זירו - גדול",
    desc: "1.5 ליטר.",
    price: "₪15",
    tags: [],
    img: "assets/images/menu/coke-zero-big.png",
  },
  {
    id: "sprite-big",
    category: "drinks",
    name: "ספרייט - גדול",
    desc: "1.5 ליטר.",
    price: "₪15",
    tags: [],
    img: "assets/images/menu/sprite-big.png",
  },
  {
    id: "sprite-zero-big",
    category: "drinks",
    name: "ספרייט זירו - גדול",
    desc: "1.5 ליטר.",
    price: "₪15",
    tags: [],
    img: "assets/images/menu/sprite-zero-big.png",
  },
  {
    id: "fanta-big",
    category: "drinks",
    name: "פאנטה תפוזים - גדול",
    desc: "1.5 ליטר.",
    price: "₪15",
    tags: [],
    img: "assets/images/menu/fanta-big.png",
  },
  {
    id: "fuzetea-big",
    category: "drinks",
    name: "פיוזטי אפרסק - גדול",
    desc: "1.5 ליטר.",
    price: "₪15",
    tags: [],
    img: "assets/images/menu/fuzetea-big.png",
  },
];
