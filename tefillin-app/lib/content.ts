export const MOTIVATION_QUOTES: { he: string; en: string }[] = [
  { he: "כל יום מתחיל בצעד קטן.", en: "Every day begins with one small step." },
  { he: "עוד יום למצווה.", en: "One more day, one more mitzvah." },
  { he: "הרצף שלך ממשיך 🔥", en: "Your streak continues 🔥" },
  { he: "כל הכבוד על ההתמדה.", en: "Well done on your consistency." },
  { he: "יום אחרי יום. מצווה אחרי מצווה.", en: "Day after day. Mitzvah after mitzvah." },
  { he: "ההרגל בונה את הזהות.", en: "The habit builds the identity." },
  { he: "היום הוא הזדמנות חדשה.", en: "Today is a new opportunity." },
];

export function getQuoteOfDay(date: Date): { he: string; en: string } {
  const idx =
    Math.abs(
      date.getFullYear() * 372 + date.getMonth() * 31 + date.getDate()
    ) % MOTIVATION_QUOTES.length;
  return MOTIVATION_QUOTES[idx];
}

export const DAILY_FACTS: { he: string; en: string }[] = [
  {
    he: "בתפילין של ראש יש ארבעה בתים, ובכל בית קלף נפרד עם אחת מארבע הפרשיות.",
    en: "The head tefillin has four compartments, each holding a separate parchment with one of the four scriptural passages.",
  },
  {
    he: "תפילין של יד מכילות בית אחד עם כל ארבע הפרשיות על קלף אחד.",
    en: "The hand tefillin has a single compartment containing all four passages on one parchment.",
  },
  {
    he: "מניחים את תפילין של יד על הזרוע השמאלית (לאיטר — על הימנית), כנגד הלב.",
    en: "The hand tefillin is placed on the left arm (right for a lefty), facing the heart.",
  },
  {
    he: "הרצועות השחורות של התפילין נצבעות בצבע שחור במיוחד, המסמל רצינות והידור המצווה.",
    en: "The black straps of the tefillin are specially dyed black, symbolizing the seriousness and beauty of the mitzvah.",
  },
  {
    he: "מצוות תפילין מוזכרת בתורה ארבע פעמים, ומכאן המקור לארבע הפרשיות שבתוכן.",
    en: "The mitzvah of tefillin is mentioned four times in the Torah — the source for the four passages inside them.",
  },
  {
    he: "נהוג להניח תפילין החל מגיל בר מצווה (13 שנה).",
    en: "It is customary to begin wearing tefillin from bar mitzvah age (13).",
  },
  {
    he: "הקשר של תפילין של ראש מעוצב כאות דל\"ת, והקשר של תפילין של יד כאות יו\"ד — יחד עם השי\"ן על הבית מאייתים את שמו של הקב\"ה.",
    en: "The knot of the head tefillin is shaped like the letter Dalet, and the hand tefillin's knot like a Yud — together with the Shin on the box, they spell one of God's names.",
  },
];

export function getFactOfDay(date: Date): { he: string; en: string } {
  const idx =
    Math.abs(
      date.getFullYear() * 372 + date.getMonth() * 31 + date.getDate() + 3
    ) % DAILY_FACTS.length;
  return DAILY_FACTS[idx];
}
