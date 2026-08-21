/**
 * Pizza Italiana — content data.
 * Real business data (name, address, phone, hours, reviews, Wolt link) is
 * confirmed from the restaurant's Google Business listing and Wolt page.
 *
 * MENU ITEMS BELOW ARE PLACEHOLDERS (see isPlaceholder: true).
 * The real category names are confirmed from the restaurant's live Wolt
 * menu, but wolt.com could not be fetched from this environment to read
 * exact dish names/prices. Replace MENU_ITEMS with the real menu before
 * launch — see https://wolt.com/he/isr/rishon-lezion-hashfela-area/restaurant/italianaholon
 */

export const RESTAURANT = {
  name: "פיצה איטליאנה",
  nameEn: "Pizza Italiana",
  tagline: "פיצה על אבן, מהלב של חולון",
  phone: "03-622-5040",
  phoneIntl: "+97236225040",
  telHref: "tel:+97236225040",
  // Landline number reused for WhatsApp per owner's request — may not be
  // WhatsApp-registered. Swap for a mobile WhatsApp Business number if one
  // becomes available.
  whatsappHref: "https://wa.me/97236225040?text=" +
    encodeURIComponent("היי! רציתי לשאול לגבי הזמנה מפיצה איטליאנה 🍕"),
  address: "אריה שנקר 61, חולון",
  addressFull: "אריה שנקר 61, חולון, 5833323",
  plusCode: "2QCG+4F חולון",
  woltUrl: "https://wolt.com/he/isr/rishon-lezion-hashfela-area/restaurant/italianaholon",
  mapsQuery: "פיצה איטליאנה, אריה שנקר 61, חולון",
  rating: 4.8,
  reviewCount: 83,
  priceRange: "50–100 ₪ לאדם",
};

// day: JS Date.getDay() convention — 0 Sunday … 6 Saturday
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
    a: "ההזמנות מתבצעות דרך וולט — לוחצים על כפתור \"הזמנה בוולט\" בכל מקום באתר ומגיעים ישר לעמוד המסעדה שלנו באפליקציה/אתר של וולט.",
  },
  {
    q: "האם אפשר להזמין טלפונית או להגיע לאסוף עצמאית?",
    a: "כן, אפשר להתקשר אלינו ישירות למספר 03-622-5040, וגם לבצע איסוף עצמי מהמקום.",
  },
  {
    q: "מה שעות הפעילות?",
    a: "אנחנו פתוחים ראשון עד חמישי ובשבת בשעות משתנות, וסגורים בימי שישי. לוח השעות המדויק מופיע בסעיף המיקום למטה, כולל סטטוס פתוח/סגור בזמן אמת.",
  },
  {
    q: "האם יש אפשרויות צמחוניות בתפריט?",
    a: "בתפריט קיימות מנות עם סימון צמחוני. לפרטים המדויקים והעדכניים ביותר על כל מנה ורכיביה מומלץ לבדוק בעמוד התפריט בוולט לפני ההזמנה.",
  },
];

export const MENU_CATEGORIES = [
  { id: "deals", name: "מבצעים", icon: "deal" },
  { id: "build-pizza", name: "פיצות בהרכבה", icon: "pizza" },
  { id: "pasta", name: "פסטות", icon: "pasta" },
  { id: "focaccia", name: "פוקאצ׳ות", icon: "bread" },
  { id: "garlic-bread", name: "לחמי שום", icon: "garlic" },
  { id: "drinks", name: "שתיה קלה", icon: "drink" },
];

/**
 * PLACEHOLDER MENU DATA.
 * Generic, universal Italian-pizzeria dish names are used only as
 * structural placeholders (isPlaceholder: true) so the interactive menu
 * (search/filter/modal/badges) is fully functional. None of this should be
 * read as confirmed information about this specific restaurant's dishes,
 * recipes, or current prices — replace with the real Wolt menu before
 * launch.
 */
export const MENU_ITEMS = [
  {
    id: "margherita",
    category: "build-pizza",
    name: "מרגריטה",
    desc: "רוטב עגבניות, מוצרלה ובזיליקום טרי על בצק דק שנאפה על אבן.",
    price: "—",
    tags: ["veg"],
    bestseller: true,
    isPlaceholder: true,
  },
  {
    id: "pepperoni",
    category: "build-pizza",
    name: "פפרוני",
    desc: "מוצרלה נדיבה ופרוסות פפרוני פיקנטיות.",
    price: "—",
    tags: ["spicy"],
    bestseller: true,
    isPlaceholder: true,
  },
  {
    id: "quattro-formaggi",
    category: "build-pizza",
    name: "קוואטרו פורמאג׳י",
    desc: "מיזוג של ארבע גבינות איטלקיות על בצק פריך.",
    price: "—",
    tags: ["veg"],
    recommended: true,
    isPlaceholder: true,
  },
  {
    id: "funghi",
    category: "build-pizza",
    name: "פטריות ושמנת",
    desc: "פטריות טריות מוקפצות ברוטב שמנת עדין.",
    price: "—",
    tags: ["veg"],
    isPlaceholder: true,
  },
  {
    id: "bolognese",
    category: "pasta",
    name: "פסטה בולונז",
    desc: "פסטה טרייה ברוטב בולונז עשיר בבישול איטי.",
    price: "—",
    tags: [],
    recommended: true,
    isPlaceholder: true,
  },
  {
    id: "alfredo",
    category: "pasta",
    name: "פסטה אלפרדו",
    desc: "רוטב שמנת וגבינת פרמזן קלאסי.",
    price: "—",
    tags: ["veg"],
    isPlaceholder: true,
  },
  {
    id: "focaccia-classic",
    category: "focaccia",
    name: "פוקאצ׳ה קלאסית",
    desc: "שמן זית, רוזמרין ומלח ים גס.",
    price: "—",
    tags: ["veg"],
    isPlaceholder: true,
  },
  {
    id: "focaccia-cheese",
    category: "focaccia",
    name: "פוקאצ׳ה בגבינות",
    desc: "פוקאצ׳ה ביתית עמוסה בגבינות נמסות.",
    price: "—",
    tags: ["veg"],
    new: true,
    isPlaceholder: true,
  },
  {
    id: "garlic-bread-classic",
    category: "garlic-bread",
    name: "לחם שום קלאסי",
    desc: "לחם אפוי טרי עם חמאת שום ופטרוזיליה.",
    price: "—",
    tags: ["veg"],
    isPlaceholder: true,
  },
  {
    id: "garlic-bread-cheese",
    category: "garlic-bread",
    name: "לחם שום בגבינה",
    desc: "לחם שום עם שכבת מוצרלה נמסה.",
    price: "—",
    tags: ["veg"],
    bestseller: true,
    isPlaceholder: true,
  },
  {
    id: "cola",
    category: "drinks",
    name: "קוקה קולה",
    desc: "בקבוק/פחית קרה.",
    price: "—",
    tags: ["veg"],
    isPlaceholder: true,
  },
  {
    id: "sprite",
    category: "drinks",
    name: "ספרייט",
    desc: "בקבוק/פחית קרה.",
    price: "—",
    tags: ["veg"],
    isPlaceholder: true,
  },
];
