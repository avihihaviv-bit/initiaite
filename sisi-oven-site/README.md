# התנור של סבתא סיסי

אתר תדמית סטטי למסעדה. עמוד אחד, בלי שרת, בלי מסד נתונים, בלי שלב בנייה.
כל הקבצים בתיקייה הזו הם האתר עצמו.

## מה יש כאן

```
index.html          העמוד עצמו
404.html            דף שגיאה מעוצב
assets/             סרטון, תמונות, פונטים מקומיים, CSS ו-JS
robots.txt          הנחיות למנועי חיפוש
sitemap.xml         מפת האתר
vercel.json         כותרות אבטחה, קאשינג ו-HTTPS ב-Vercel
.htaccess           אותו דבר לשרתי Apache או LiteSpeed, למשל Hostinger
```

## העלאה ל-Vercel

שלוש דרכים, בחרו אחת:

**1. גרירה (הכי מהיר)**
היכנסו ל-vercel.com, לחצו Add New ואז Project, ובחרו Deploy without Git.
גררו את התיקייה הזו כמו שהיא. Vercel מזהה אתר סטטי ומעלה אותו בלי הגדרות.

**2. דרך GitHub**
בממשק של Vercel לחצו Add New, Project, ואז Import מהריפו.
בהגדרות הפרויקט:

- Framework Preset: `Other`
- Root Directory: `sisi-oven-site`
- Build Command: השאירו ריק
- Output Directory: השאירו ריק

**3. משורת הפקודה**

```bash
npm i -g vercel
cd sisi-oven-site
vercel            # תצוגה מקדימה
vercel --prod     # לייב
```

## מה לעשות אחרי שיש כתובת קבועה

בשלושה מקומות מופיע `DEPLOY STEP` או `example.com`. יש להחליף לכתובת האמיתית:

1. `index.html` — התגיות `canonical`, `og:url` ו-`og:image` (כתובת מלאה, כולל https)
2. `robots.txt` — שורת ה-Sitemap
3. `sitemap.xml` — הכתובת ותאריך העדכון

## בדיקה מקומית

```bash
cd sisi-oven-site
python3 -m http.server 8000
```

ואז לפתוח http://localhost:8000 בדפדפן.
פתיחה של `index.html` בקליק כפול תציג תמונה סטטית במקום הסרטון, כי דפדפנים
חוסמים טעינת קבצים מקומיים בצורה הזו. זה מצב מכוון והעמוד שלם גם בו.

## דברים שצריך לאשר מול בעל העסק לפני פרסום

- תעודת כשרות בתוקף, כי המילה כשר מופיעה באתר
- מספר טלפון וקישור אתר ההזמנות
- מחירי התבשילים שמסומנים כרגע "בטלפון"
- מספר ח.פ או עוסק מורשה לפרטי העסק
- שם ופרטי רכז נגישות להצהרת הנגישות
