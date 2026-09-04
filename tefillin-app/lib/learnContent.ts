export interface StepDef {
  id: string;
  icon: string;
  titleHe: string;
  titleEn: string;
  descHe: string;
  descEn: string;
  customNote?: boolean;
}

export const TEFILLIN_STEPS: StepDef[] = [
  {
    id: "prepare",
    icon: "🎁",
    titleHe: "הכנת התפילין",
    titleEn: "Preparing the tefillin",
    descHe:
      "הוציאו את התפילין מהנרתיק בעדינות. ודאו שהבתים (הקופסאות השחורות) והרצועות תקינים ונקיים, ושאתם עומדים (או לפחות רגועים ומרוכזים) לפני הברכה.",
    descEn:
      "Gently take the tefillin out of their bag. Check that the boxes and straps are in good condition, and take a moment to focus before the blessing.",
  },
  {
    id: "hand",
    icon: "💪",
    titleHe: "הנחת תפילין של יד",
    titleEn: "Putting on the hand tefillin",
    descHe:
      "מניחים את תפילין של יד על שריר הזרוע השמאלית (איטר יד — על הימנית), פונה כלפי הלב. מברכים 'להניח תפילין', ואז מהדקים את הרצועה סביב הזרוע וכורכים שבע כריכות סביבה.",
    descEn:
      "Place the hand tefillin on the upper left arm (right arm for a lefty), facing the heart. Recite the blessing 'l'haniach tefillin', then tighten the strap around the arm and wind it seven times around the forearm.",
  },
  {
    id: "head",
    icon: "👤",
    titleHe: "הנחת תפילין של ראש",
    titleEn: "Putting on the head tefillin",
    descHe:
      "מניחים את תפילין של ראש במרכז הראש, מעל קו השיער, כך שהקשר (בצורת דל״ת) יושב בעורף. לפי מנהג האשכנזים מברכים ברכה שנייה אם הפסיקו בדיבור; לפי מנהג הספרדים אין ברכה שנייה.",
    descEn:
      "Place the head tefillin at the center of the head, above the hairline, with the knot resting at the back of the neck. Ashkenazi custom adds a second blessing if speech interrupted; Sephardic custom does not.",
    customNote: true,
  },
  {
    id: "wrap",
    icon: "🤲",
    titleHe: "כריכת האצבע והרצועה",
    titleEn: "Winding the hand strap",
    descHe:
      "לאחר הנחת תפילין של ראש, ממשיכים לכרוך את רצועת היד — שלוש כריכות סביב האמה ואז סביב כף היד והאצבעות — תוך אמירת הפסוקים 'וְאֵרַשְׂתִּיךְ לִי לְעוֹלָם'.",
    descEn:
      "After the head tefillin, continue winding the hand strap — three wraps around the palm and fingers — while reciting the verses beginning 'V'eirastich li l'olam' (Hosea 2:21-22).",
  },
  {
    id: "remove",
    icon: "🕊️",
    titleHe: "הסרת התפילין",
    titleEn: "Removing the tefillin",
    descHe:
      "בסיום התפילה, מסירים תחילה את תפילין של ראש ולאחר מכן את תפילין של יד, ומחזירים אותן בעדינות לנרתיק כשהן מסודרות ומוגנות לשימוש הבא.",
    descEn:
      "At the end of prayer, remove the head tefillin first, then the hand tefillin, and gently return them to their case, arranged and protected for next time.",
  },
];

export interface CardDef {
  id: string;
  icon: string;
  questionHe: string;
  questionEn: string;
  answerHe: string;
  answerEn: string;
}

export const LEARNING_CARDS: CardDef[] = [
  {
    id: "what-is",
    icon: "🕍",
    questionHe: "מהי מצוות תפילין?",
    questionEn: "What is the mitzvah of tefillin?",
    answerHe:
      "מצוות עשה מן התורה להניח בכל יום חול שני בתים המכילים קלפים עם פרשיות מן התורה — אחד על היד כנגד הלב, ואחד על הראש — כאות וזיכרון לקשר בין עם ישראל לקב״ה.",
    answerEn:
      "A biblical commandment to wear two boxes containing scriptural parchments each weekday — one on the arm facing the heart, one on the head — as a sign and reminder of the bond between the Jewish people and God.",
  },
  {
    id: "whats-inside",
    icon: "📜",
    questionHe: "מה יש בתוך התפילין?",
    questionEn: "What is inside the tefillin?",
    answerHe:
      "בתוך הבתים יש קלפי קלף כתובים ביד סופר סת״ם, ובהם ארבע פרשיות מן התורה: קדש, והיה כי יביאך, שמע והיה אם שמוע — כולן עוסקות ביציאת מצרים וביחוד ה׳.",
    answerEn:
      "Inside the boxes are parchments handwritten by a scribe, containing four Torah passages — Kadesh, V'haya Ki Y'vi'acha, Shema, and V'haya Im Shamoa — all relating to the Exodus and the unity of God.",
  },
  {
    id: "why-hand",
    icon: "💪",
    questionHe: "למה מניחים תפילין על היד?",
    questionEn: "Why do we place tefillin on the arm?",
    answerHe:
      "התורה מצווה 'וקשרתם לאות על ידך' — היד מסמלת את הכוח והמעש, ומיקומה כנגד הלב מבטא הכפפת הרגש והרצון לעבודת ה׳.",
    answerEn:
      "The Torah commands 'bind them as a sign on your arm' — the arm represents strength and action, and its placement facing the heart expresses subordinating emotion and will to the service of God.",
  },
  {
    id: "why-head",
    icon: "🧠",
    questionHe: "למה מניחים תפילין על הראש?",
    questionEn: "Why do we place tefillin on the head?",
    answerHe:
      "התורה מצווה 'ולטוטפת בין עיניך' — הראש מסמל את המחשבה והשכל, וכך מכפיפים גם את התודעה למחויבות ליהדות ולערכיה.",
    answerEn:
      "The Torah commands 'as a symbol between your eyes' — the head represents thought and intellect, so the mind, too, is subordinated to the commitment to Jewish values.",
  },
  {
    id: "which-arm",
    icon: "🫱",
    questionHe: "על איזו יד מניחים תפילין?",
    questionEn: "On which arm are tefillin worn?",
    answerHe:
      "בדרך כלל על הזרוע השמאלית — 'ידכה' נדרש כ'יד כהה', היד החלשה יותר. איטר יד (שמאלי בכתיבה) מניח על הימנית. במקרה של ספק, יש לשאול רב.",
    answerEn:
      "Generally on the left arm — read as the weaker hand. A person who is left-handed for writing wears tefillin on the right arm. When in doubt, ask a rabbi.",
  },
  {
    id: "when-worn",
    icon: "☀️",
    questionHe: "מתי מניחים תפילין?",
    questionEn: "When are tefillin worn?",
    answerHe:
      "מניחים תפילין בכל יום חול בבוקר, בדרך כלל בזמן תפילת שחרית, ולא בשבתות ובימים טובים — שהם עצמם 'אות' ואינם זקוקים לאות נוסף.",
    answerEn:
      "Tefillin are worn every weekday morning, typically during the Shacharit prayer, but not on Shabbat and festivals — which are themselves a 'sign' and don't require an additional one.",
  },
];

export interface PrayerDef {
  id: string;
  titleHe: string;
  titleEn: string;
  textHe: string;
  noteHe?: string;
  noteEn?: string;
}

export const PRAYER_TEXTS: PrayerDef[] = [
  {
    id: "bracha-yad",
    titleHe: "ברכת תפילין של יד",
    titleEn: "Blessing on the hand tefillin",
    textHe:
      "בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ לְהָנִיחַ תְּפִלִּין.",
  },
  {
    id: "bracha-rosh",
    titleHe: "ברכת תפילין של ראש",
    titleEn: "Blessing on the head tefillin",
    textHe:
      "בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ עַל מִצְוַת תְּפִלִּין.",
    noteHe: "לפי חלק מהמנהגים מברכים ברכה זו רק אם הפסיקו בדיבור בין הנחת תפילין של יד לתפילין של ראש.",
    noteEn: "In some customs this second blessing is said only if speech interrupted between the hand and head tefillin.",
  },
  {
    id: "verses-wrap",
    titleHe: "פסוקי הכריכה על האצבע",
    titleEn: "Verses recited while winding the finger",
    textHe:
      "וְאֵרַשְׂתִּיךְ לִי לְעוֹלָם, וְאֵרַשְׂתִּיךְ לִי בְּצֶדֶק וּבְמִשְׁפָּט וּבְחֶסֶד וּבְרַחֲמִים, וְאֵרַשְׂתִּיךְ לִי בֶּאֱמוּנָה וְיָדַעַתְּ אֶת ה׳.",
  },
  {
    id: "shema",
    titleHe: "שמע ישראל",
    titleEn: "Shema Yisrael",
    textHe:
      "שְׁמַע יִשְׂרָאֵל ה' אֱלֹהֵינוּ ה' אֶחָד.\nבָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד.",
  },
];
