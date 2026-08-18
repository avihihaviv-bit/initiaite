const express = require('express');
const geolib = require('geolib');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors());

// ---------------------------------------------------------------------------
// Demo authentication (POC only — replace with a real user store + hashed
// passwords + JWT/refresh tokens before this ever handles real data, per the
// "Secure Authentication Layer" roadmap item).
// ---------------------------------------------------------------------------
const DEMO_USERNAME = process.env.DEMO_USERNAME || 'patrol12';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'patrol2026';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // one patrol shift

const sessions = new Map(); // token -> { username, expires }

function createSession(username) {
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, { username, expires: Date.now() + SESSION_TTL_MS });
    return token;
}

function getSession(token) {
    const session = sessions.get(token);
    if (!session) return null;
    if (session.expires < Date.now()) { sessions.delete(token); return null; }
    return session;
}

function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const session = token ? getSession(token) : null;
    if (!session) return res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
    req.user = { username: session.username };
    next();
}

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
        const token = createSession(username);
        return res.json({ success: true, token, username, expiresInMs: SESSION_TTL_MS });
    }
    res.status(401).json({ success: false, error: 'INVALID_CREDENTIALS' });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
    const token = req.headers.authorization.slice(7);
    sessions.delete(token);
    res.json({ success: true });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({ success: true, username: req.user.username });
});

app.use(express.static(__dirname)); // מגיש את ה-index.html, login.html, css, js

const reactionEvents = [
    { eventId: "100-2026-8943", timestamp: "2026-08-18T23:15:00Z", type: "חשד להתפרצות לעסק", priority: 1, location: { address: "סוקולוב 45, חולון", lat: 32.0163, lng: 34.7732 }, reporter: { name: "משה כהן", phone: "050-1234567" }, description: "אזרח מדווח על שני חשודים רעולי פנים מנסים לפרוץ את דלת הגלריה.", status: "NEW", linkedData: {} },
    { eventId: "100-2026-8944", timestamp: "2026-08-18T23:30:00Z", type: "סכסוך שכנים / הקמת רעש", priority: 3, location: { address: "שנקר 12, חולון", lat: 32.0185, lng: 34.7691 }, reporter: { name: "אנונימי", phone: "חסוי" }, description: "מוזיקה חזקה וצעקות מהקומה השלישית.", status: "NEW", linkedData: {} }
];

// Beta demo dataset: seeded broadly across central Israel (Gush Dan and
// surrounding cities) so a live GPS scan turns up results wherever the
// device actually is, not just around the original Holon test coordinates.
const initiativeTasks = [
    { taskId: "INIT-101", category: "מעצר בית", target: { name: "אביב ישראלי", idNumber: "023456789" }, location: { address: "ההסתדרות 60, חולון", lat: 32.0121, lng: 34.7754 }, instructions: "דרושה ביקורת נוכחות. מעצר בית מלא.", sourceSystem: "חקירות" },
    { taskId: "INIT-102", category: "כתובת מאוימת (אלמ\"ב)", target: { name: "יעל אברהמי", idNumber: "034567890", status: "רמת איום גבוהה" }, location: { address: "שדרות קוגל 20, חולון", lat: 32.0224, lng: 34.7712 }, instructions: "הפגנת נוכחות בולטת באזור הכתובת. בן הזוג לשעבר שוחרר ממעצר.", sourceSystem: "מודיעין" },
    { taskId: "INIT-103", category: "נקודה חמה - ביקורת עסק", target: { name: "פיצוציית חצות", businessId: "512345678" }, location: { address: "ויצמן 40, חולון", lat: 32.0145, lng: 34.7781 }, instructions: "עסק מועד לפורענות - מכירת אלכוהול לקטינים. דרושה שהייה של 10 דקות.", sourceSystem: "רישוי עסקים" },
    { taskId: "INIT-104", category: "רכב גנוב - איתור אחרון", target: { name: "יונדאי אלנטרה לבנה", idNumber: "12-345-67" }, location: { address: "אבן גבירול 90, תל אביב", lat: 32.0839, lng: 34.7803 }, instructions: "רכב גנוב אותר לאחרונה באזור. יש לבדוק חניונים סמוכים.", sourceSystem: "תנועה" },
    { taskId: "INIT-105", category: "חשוד מבוקש - כתובת מגורים", target: { name: "רועי מזרחי", idNumber: "045678901", status: "צו מעצר פעיל" }, location: { address: "ביאליק 15, רמת גן", lat: 32.0701, lng: 34.8231 }, instructions: "חשוד מבוקש בעבירת סמים. יש לתאם עם יחידה נוספת לפני גישה.", sourceSystem: "חקירות" },
    { taskId: "INIT-106", category: "שוטטות חשודה", target: { name: "לא מזוהה", status: "דיווח אזרחי" }, location: { address: "כצנלסון 22, גבעתיים", lat: 32.0715, lng: 34.8114 }, instructions: "דיווחים חוזרים על נוכחות חשודה בחצרות בשעות הלילה.", sourceSystem: "מוקד 100" },
    { taskId: "INIT-107", category: "ביקורת רישוי עסק", target: { name: "פאב הפינה החמה", businessId: "515678234" }, location: { address: "רבי עקיבא 55, בני ברק", lat: 32.0819, lng: 34.8354 }, instructions: "בדיקת עמידה בתנאי רישיון ושעות פעילות.", sourceSystem: "רישוי עסקים" },
    { taskId: "INIT-108", category: "פיקוח על משוחרר בערבות", target: { name: "דוד כהן", idNumber: "056789012" }, location: { address: "העצמאות 33, בת ים", lat: 32.0155, lng: 34.7505 }, instructions: "ביקורת עמידה בתנאי שחרור - איסור יציאה מהעיר.", sourceSystem: "חקירות" },
    { taskId: "INIT-109", category: "תלונת שכנים חוזרת", target: { name: "בניין מגורים", status: "תלונה שלישית החודש" }, location: { address: "רוטשילד 8, ראשון לציון", lat: 31.9715, lng: 34.7889 }, instructions: "רעש חוזר ומטרדים. שוחח עם דיירי הבית.", sourceSystem: "מוקד 100" },
    { taskId: "INIT-110", category: "כתובת מאוימת (אלמ\"ב)", target: { name: "מירב בן דוד", idNumber: "067890123", status: "רמת איום בינונית" }, location: { address: "המכבים 12, פתח תקווה", lat: 32.0864, lng: 34.8861 }, instructions: "סבב ביקורת יזום מומלץ פעם במשמרת.", sourceSystem: "מודיעין" },
    { taskId: "INIT-111", category: "נקודה חמה - ביקורת עסק", target: { name: "מיני מרקט לילה טוב", businessId: "518901345" }, location: { address: "סוקולוב 70, הרצליה", lat: 32.1608, lng: 34.8410 }, instructions: "חשד למכירת אלכוהול ללא רישיון בשעות הלילה.", sourceSystem: "רישוי עסקים" },
    { taskId: "INIT-112", category: "מעצר בית", target: { name: "אורי שמעוני", idNumber: "078901234" }, location: { address: "אחוזה 25, רעננה", lat: 32.1839, lng: 34.8698 }, instructions: "ביקורת נוכחות - מעצר בית חלקי, שעות אסורות 22:00-06:00.", sourceSystem: "חקירות" },
    { taskId: "INIT-113", category: "חשוד מבוקש - כתובת מגורים", target: { name: "עידן לוינסון", idNumber: "089012345", status: "צו הבאה" }, location: { address: "ויצמן 44, כפר סבא", lat: 32.1743, lng: 34.9077 }, instructions: "אי התייצבות לחקירה. יש לבצע הבאה בהתאם לצו.", sourceSystem: "חקירות" },
    { taskId: "INIT-114", category: "שוטטות חשודה", target: { name: "לא מזוהה", status: "אזור תעשייה" }, location: { address: "האורגים 5, רחובות", lat: 31.8933, lng: 34.8107 }, instructions: "דיווח על פריצות בעבר לאזור. מומלץ מעבר בשעות הלילה.", sourceSystem: "מוקד 100" },
    { taskId: "INIT-115", category: "רכב גנוב - איתור אחרון", target: { name: "קיה ספורטאז' אפורה", idNumber: "78-901-23" }, location: { address: "ויצמן 10, נס ציונה", lat: 31.9302, lng: 34.7981 }, instructions: "אות GPS אחרון התקבל מהאזור לפני כשעה.", sourceSystem: "תנועה" },
    { taskId: "INIT-116", category: "ביקורת רישוי עסק", target: { name: "מועדון הסטארט אפ", businessId: "521234567" }, location: { address: "עזריאלי 1, מודיעין", lat: 31.8935, lng: 35.0110 }, instructions: "בדיקת תפוסה מול היתר והפרעות רעש.", sourceSystem: "רישוי עסקים" },
    { taskId: "INIT-117", category: "הטרדה מאיימת - ביקורת", target: { name: "שירה גולן", idNumber: "090123456", status: "צו הרחקה בתוקף" }, location: { address: "המייסדים 3, קריית אונו", lat: 32.0561, lng: 34.8563 }, instructions: "ודא כי החשוד אינו נמצא בקרבת הכתובת. צו הרחקה בתוקף.", sourceSystem: "מודיעין" },
    { taskId: "INIT-118", category: "תלונת שכנים חוזרת", target: { name: "מתחם מגורים", status: "תלונה חוזרת" }, location: { address: "ז'בוטינסקי 18, אור יהודה", lat: 32.0328, lng: 34.8511 }, instructions: "מסיבות רעשניות בסופי שבוע. שוחח עם השוכרים.", sourceSystem: "מוקד 100" },
    { taskId: "INIT-119", category: "נקודה חמה - ביקורת עסק", target: { name: "בר הרציף", businessId: "524567890" }, location: { address: "העצמאות 9, יהוד", lat: 32.0341, lng: 34.8893 }, instructions: "עסק מועד לתגרות בסופי שבוע. נוכחות מונעת מומלצת.", sourceSystem: "רישוי עסקים" },
    { taskId: "INIT-120", category: "פיקוח על משוחרר בערבות", target: { name: "משה אלבז", idNumber: "001234567" }, location: { address: "העלייה 14, אזור", lat: 32.0231, lng: 34.8011 }, instructions: "ביקורת עמידה בתנאי ערבות - איסור מגע עם המתלוננת.", sourceSystem: "חקירות" },
    { taskId: "INIT-121", category: "חשוד מבוקש - כתובת מגורים", target: { name: "טל ברקוביץ'", idNumber: "112345678", status: "צו מעצר פעיל" }, location: { address: "שבטי ישראל 6, ראש העין", lat: 32.0961, lng: 34.9563 }, instructions: "חשוד בפריצות לרכב. יש לתאם גיבוי לפני גישה לכתובת.", sourceSystem: "חקירות" },
    { taskId: "INIT-122", category: "כתובת מאוימת (אלמ\"ב)", target: { name: "נועה שפירא", idNumber: "123456780", status: "רמת איום גבוהה" }, location: { address: "הרצל 40, גבעת שמואל", lat: 32.0774, lng: 34.8489 }, instructions: "עדיפות גבוהה - עבר אלימות מתועד. סבב ביקורת בכל משמרת.", sourceSystem: "מודיעין" },
    { taskId: "INIT-123", category: "שוטטות חשודה", target: { name: "לא מזוהה", status: "סמוך לבית ספר" }, location: { address: "בן גוריון 2, בת ים", lat: 32.0201, lng: 34.7443 }, instructions: "דיווח הורים על נוכחות חשודה סמוך לשעת סיום לימודים.", sourceSystem: "מוקד 100" }
];

app.get('/api/reaction/events', requireAuth, (req, res) => res.json({ success: true, events: reactionEvents }));
app.post('/api/initiative/scan', requireAuth, (req, res) => {
    const { lat, lng, radiusInMeters } = req.body;
    const relevantTasks = initiativeTasks.filter(task => geolib.isPointWithinRadius({ latitude: task.location.lat, longitude: task.location.lng }, { latitude: lat, longitude: lng }, radiusInMeters || 1000));
    const sortedTasks = relevantTasks.map(task => ({ ...task, distance: geolib.getDistance({ latitude: lat, longitude: lng }, { latitude: task.location.lat, longitude: task.location.lng }) })).sort((a, b) => a.distance - b.distance);
    res.json({ success: true, count: sortedTasks.length, tasks: sortedTasks });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Yozma API Server is running on port ${PORT}`));
