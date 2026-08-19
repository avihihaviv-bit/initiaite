/* Shared language state + dictionary for every page (login, setup, patrol app,
   commander dashboard). Language choice persists in localStorage so it carries
   across the multi-page flow instead of resetting on every navigation. */
const LANG_KEY = 'initiate_lang';
let currentLang = localStorage.getItem(LANG_KEY) || 'HE';
let onLanguageChange = null; // page-specific hook, set by each page's own script

const I18N = {
    HE: {
        appTitle: "INITIATE // ניידת סיור",
        loginSubtitle: "כניסה מאובטחת למערכת",
        usernamePlaceholder: "שם משתמש",
        passwordPlaceholder: "סיסמה",
        signIn: "כניסה למערכת",
        signingIn: "מתחבר...",
        invalidCreds: "שם משתמש או סיסמה שגויים",
        connError: "שגיאת תקשורת עם השרת. נסה שוב.",
        fillFields: "נא למלא שם משתמש וסיסמה",
        demoHint: 'גרסת הדגמה &mdash; משתמש: <code>patrol12</code> &nbsp;סיסמה: <code>patrol2026</code>',

        mapTip: "מפה טקטית",
        personTip: "בדיקת אדם",
        vehicleTip: "בדיקת רכב",
        addressTip: "בדיקת כתובת",
        weaponTip: "בדיקת נשק",
        runQuery: "בצע סריקה במאגר",
        reportTitle: "דו\"ח פעולה מבצעי",
        summaryLabel: "תקציר האירוע",
        reportPlaceholder: "תאר את מהלך האירוע...",
        attachPersons: "שיוך ישויות שנבדקו:",
        noHistory: "אין בדיקות מסוף אחרונות",
        attachEvidence: "צירוף ראיות (מדיה):",
        uploadText: "הקש לפתיחת מצלמה / גלריה<br><small>או גרור קבצים לכאן</small>",
        closeDispatch: "סגור אירוע ושדר למוקד",
        mapTitle: "מפת גזרה וניווט",
        mapSearchPlaceholder: "לדוגמה: סוקולוב 45, חולון",
        searchBtn: "חפש",
        locating: "מאתר GPS...",
        navWaze: "נווט ב-Waze",
        sidebarTitle: "לוגיסטיקה ויחידה",
        onDutyLabel: "בתפקיד",
        teamHeader: "פרטי צוות ויחידה",
        distText: "מחוז:", regionText: "מרחב:", stationText: "תחנה:", unitText: "יחידה:",
        callsignText: "אות קריאה:", carNumText: "מס' ניידת:", commanderText: "מפקד:", officerText: "סייר:",
        crewText: "אנשי צוות:",
        districtValue: "תל אביב", regionValue: "איילון", stationValue: "חולון", unitValue: "ניידת 3",
        callsignValue: "ניידת 12", commanderValue: "רס\"ב י. ישראלי", officerValue: "רב\"ט ד. לוי",
        equipHeader: "ציוד ניידת",
        equip1: "✔️ רובה סער M16", equip2: "✔️ 2 אפודי מגן", equip3: "✔️ ערכת פס שיניים", equip4: "✔️ ינשוף (מד אלכוהול)",
        carHeader: "כשירות רכב",
        mileageText: "קילומטראז':", fuelText: "דלק:", damageText: "נזקים:",
        mileageValue: "145,230 ק\"מ", fuelValue: "80%", damageValue: "שריטה בפגוש קדמי.",
        tasksHeader: "משימות שגרתיות",
        taskItem1: "1. מבחן ירי בטווח.", taskItem2: "2. הגשת יומן פעילות משמרת.",
        cmdNotesHeader: "דגשי מפקד",
        cmdNoteText: "הגברת נוכחות גלויה באזור התעשייה בין השעות 02:00-04:00.",
        briefingHeader: "תדריך משמרת",
        boloLabel: "איתור:",
        boloText: "מאזדה 3 לבנה, מס' רישוי 12-345-67. מעורבת בשוד מזוין. יש לנקוט משנה זהירות.",
        logoutBtn: "התנתקות",
        tabReaction: "תגובה",
        tabInitiative: "יוזמה",
        activeIncidents: "אירועים מבצעיים פתוחים",
        simEvent: "דמה אירוע חירום",
        scanBtn: "סורק סביבה מבצעית",
        acceptBtn: "קבל אירוע וצא לדרך",
        finishBtn: "סיום - כתיבת דו\"ח",
        loadingEvents: "טוען אירועים...",
        errorEvents: "שגיאה בטעינת אירועים",
        allClearTitle: "אין אירועים פתוחים",
        allClearSub: "כל האירועים בגזרה טופלו. המשך סיור שגרתי.",
        scanPromptTitle: "מוכן לסריקה",
        scanPromptSub: "לחץ על הכפתור כדי לסרוק משימות יזומות בסביבתך.",
        scanningTitle: "מאתר GPS... 🛰️",
        scanningRadius: "סורק רדיוס...",
        noTasksTitle: "לא נמצאו משימות",
        noTasksSub: "אין משימות יזומות ברדיוס הסריקה כרגע.",
        tasksFound: "משימות נמצאו",
        priorityCritical: "עדיפות עליונה",
        priorityUrgent: "דחוף",
        priorityRoutine: "שגרתי",
        querying: "מתחבר למסוף...",
        clearResult: "ללא חריגים",
        enterData: "נא להזין נתונים",
        reportSent: "הדו\"ח שודר למוקד וליומן החקירות בהצלחה",
        sessionExpired: "פג תוקף החיבור. יש להתחבר מחדש.",
        attached: "צורף:",
        idPlaceholder: "ת.ז. (9 ספרות)",
        detailsLabel: "פרטים",
        firstNamePlaceholder: "שם פרטי",
        lastNamePlaceholder: "שם משפחה",

        // Setup / context screen
        setupTitle: "הגדרת הקשר משמרת",
        setupSubtitle: "יש להשלים את הפרטים לפני הכניסה למערכת",
        districtLabel: "מחוז",
        sectorLabel: "מרחב",
        stationLabel: "תחנה",
        callSignLabel: "אות קריאה",
        callSignPlaceholder: "לדוגמה: איילון 22",
        callSignHint: "אות קריאה המכיל \"401\" מזהה מפקד ומנתב למרכז השליטה",
        crewLabel: "אנשי צוות",
        crewPlaceholder: "הקלד שם ולחץ Enter",
        selectPlaceholder: "בחר...",
        continueBtn: "המשך למערכת",
        setupIncomplete: "נא למלא את כל שדות החובה",

        // Commander dashboard
        commanderTitle: "מרכז שליטה ובקרה",
        commanderSubtitle: "תצוגת פיקוד",
        unitsTab: "ניידות",
        incidentsTab: "אירועים",
        logTab: "יומן מבצעים",
        statusAvailable: "פנוי",
        statusBreak: "בהפסקה",
        statusBusy: "עסוק",
        statusDistress: "מצוקה",
        statusOffline: "אין קליטה",
        phoneLabel: "טלפון:",
        statusLabel: "סטטוס:",
        elapsedLabel: "זמן בסטטוס:",
        assignedEventLabel: "אירוע משויך:",
        noAssignedEvent: "אין",
        overrideStatusLabel: "עדכון סטטוס ידני",
        closeBtn: "סגור",
        instantBackupBtn: "הזנק תגבור קרוב",
        backupDispatched: "תוגברו 2 ניידות קרובות לאירוע",
        noAvailableUnits: "אין ניידות פנויות לתגבור כרגע",
        flashBroadcastTitle: "הודעת הבזק",
        flashBroadcastPlaceholder: "נסח הודעה לשידור לכלל הניידות...",
        sendBroadcastBtn: "שדר",
        broadcastSent: "ההודעה שודרה לכלל הניידות",
        broadcastEmpty: "נא להקליד הודעה",
        filterStationLabel: "סינון לפי תחנה",
        allStations: "כל התחנות",
        layersLabel: "שכבות מפה",
        layerBoundaries: "גבולות גזרה",
        layerClosures: "חסימות צירים",
        layerHotspots: "מוקדי אירועים",
        slaBreachTag: "חריגת SLA",
        justNow: "הרגע",
        minutesAgoSuffix: "דק'",
        noOpenIncidents: "אין אירועים פתוחים",
        noUnitsInFilter: "אין ניידות בתחנה שנבחרה",
        auditLogEmpty: "אין רשומות ביומן",
        exportLogBtn: "ייצוא יומן",
        exportedToast: "היומן יוצא בהצלחה",
        cmdPriorityCritical: "קריטי",
        cmdPriorityHigh: "גבוה",
        cmdPriorityRoutine: "שגרתי",
        crewCountSuffix: "אנשי צוות",
        auditDispatchBackup: "הוזנק תגבור לאירוע",
        auditStatusChange: "שינוי סטטוס ידני ל",
        auditBroadcast: "שידור הודעת הבזק",
        commanderBadge: "מפקד",
        unitBadge: "ניידת"
    },
    EN: {
        appTitle: "INITIATE // PATROL C2",
        loginSubtitle: "Secure Terminal Access",
        usernamePlaceholder: "Username",
        passwordPlaceholder: "Password",
        signIn: "Sign In",
        signingIn: "Signing in...",
        invalidCreds: "Invalid username or password",
        connError: "Could not reach the server. Try again.",
        fillFields: "Please enter a username and password",
        demoHint: 'Demo build &mdash; user: <code>patrol12</code> &nbsp;password: <code>patrol2026</code>',

        mapTip: "Tactical Map",
        personTip: "Person Check",
        vehicleTip: "Vehicle Check",
        addressTip: "Address Check",
        weaponTip: "Weapon Check",
        runQuery: "Execute Database Scan",
        reportTitle: "Operational Report",
        summaryLabel: "Incident Summary",
        reportPlaceholder: "Enter action summary...",
        attachPersons: "Linked Entities:",
        noHistory: "No recent queries",
        attachEvidence: "Evidence (Media):",
        uploadText: "Tap to open camera / gallery<br><small>or drag & drop files here</small>",
        closeDispatch: "Close Incident & Dispatch",
        mapTitle: "Sector Map & Nav",
        mapSearchPlaceholder: "e.g., Sokolov 45, Holon",
        searchBtn: "Search",
        locating: "Acquiring GPS...",
        navWaze: "Navigate via Waze",
        sidebarTitle: "Unit Logistics",
        onDutyLabel: "On duty",
        teamHeader: "Crew & Unit Details",
        distText: "District:", regionText: "Region:", stationText: "Station:", unitText: "Unit:",
        callsignText: "Call Sign:", carNumText: "Vehicle ID:", commanderText: "Cmdr:", officerText: "Officer:",
        crewText: "Crew:",
        districtValue: "Tel Aviv", regionValue: "Ayalon", stationValue: "Holon", unitValue: "Patrol 3",
        callsignValue: "Patrol 12", commanderValue: "SGT Y. Yisraeli", officerValue: "CPL D. Levi",
        equipHeader: "Equipment",
        equip1: "✔️ M16 Patrol Rifle", equip2: "✔️ 2 Ballistic Vests", equip3: "✔️ Spike Strip Kit", equip4: "✔️ Breathalyzer (Yanshuf)",
        carHeader: "Vehicle Status",
        mileageText: "Odometer:", fuelText: "Fuel:", damageText: "Damage:",
        mileageValue: "145,230 km", fuelValue: "80%", damageValue: "Front bumper scratch.",
        tasksHeader: "Mandatory Tasks",
        taskItem1: "1. Firing range qualification.", taskItem2: "2. Submit shift operational log.",
        cmdNotesHeader: "Directives",
        cmdNoteText: "Increase high-visibility patrols in industrial zone between 02:00 - 04:00.",
        briefingHeader: "Briefing",
        boloLabel: "BOLO:",
        boloText: "White Mazda 3, Lic: 12-345-67. Linked to armed robberies. Exercise extreme caution.",
        logoutBtn: "Log Out",
        tabReaction: "Reaction",
        tabInitiative: "Initiative",
        activeIncidents: "Active Sector Incidents",
        simEvent: "Sim Emergency",
        scanBtn: "Scan Sector Surroundings",
        acceptBtn: "Dispatch & En Route",
        finishBtn: "Finish - Write Report",
        loadingEvents: "Loading incidents...",
        errorEvents: "Error loading incidents",
        allClearTitle: "No Active Incidents",
        allClearSub: "All sector incidents are handled. Continue routine patrol.",
        scanPromptTitle: "Ready to Scan",
        scanPromptSub: "Tap the button to scan for proactive tasks near you.",
        scanningTitle: "Acquiring GPS... 🛰️",
        scanningRadius: "Scanning radius...",
        noTasksTitle: "No Tasks Found",
        noTasksSub: "No proactive tasks within the scan radius right now.",
        tasksFound: "tasks found",
        priorityCritical: "Critical",
        priorityUrgent: "Urgent",
        priorityRoutine: "Routine",
        querying: "Querying terminal...",
        clearResult: "Clear",
        enterData: "Enter data",
        reportSent: "Report transmitted to dispatch successfully",
        sessionExpired: "Session expired. Please sign in again.",
        attached: "Attached:",
        idPlaceholder: "ID (9 digits)",
        detailsLabel: "Details",
        firstNamePlaceholder: "First Name",
        lastNamePlaceholder: "Last Name",

        // Setup / context screen
        setupTitle: "Shift Context Setup",
        setupSubtitle: "Complete the details below before entering the system",
        districtLabel: "District",
        sectorLabel: "Sector",
        stationLabel: "Station",
        callSignLabel: "Call Sign",
        callSignPlaceholder: "e.g., Ayalon 22",
        callSignHint: "A call sign containing \"401\" identifies a commander and routes to the Command Center",
        crewLabel: "Crew Members",
        crewPlaceholder: "Type a name and press Enter",
        selectPlaceholder: "Select...",
        continueBtn: "Continue to System",
        setupIncomplete: "Please fill in all required fields",

        // Commander dashboard
        commanderTitle: "Command & Control Center",
        commanderSubtitle: "Commander View",
        unitsTab: "Units",
        incidentsTab: "Incidents",
        logTab: "Shift Log",
        statusAvailable: "Available",
        statusBreak: "On Break",
        statusBusy: "Busy",
        statusDistress: "Distress",
        statusOffline: "No Signal",
        phoneLabel: "Phone:",
        statusLabel: "Status:",
        elapsedLabel: "Time in Status:",
        assignedEventLabel: "Assigned Event:",
        noAssignedEvent: "None",
        overrideStatusLabel: "Manual Status Override",
        closeBtn: "Close",
        instantBackupBtn: "Dispatch Backup",
        backupDispatched: "2 nearest units dispatched to the incident",
        noAvailableUnits: "No available units for backup right now",
        flashBroadcastTitle: "Flash Alert",
        flashBroadcastPlaceholder: "Compose a broadcast to all units...",
        sendBroadcastBtn: "Broadcast",
        broadcastSent: "Broadcast sent to all units",
        broadcastEmpty: "Please enter a message",
        filterStationLabel: "Filter by Station",
        allStations: "All Stations",
        layersLabel: "Map Layers",
        layerBoundaries: "Sector Boundaries",
        layerClosures: "Traffic Closures",
        layerHotspots: "Hotspots",
        slaBreachTag: "SLA Breach",
        justNow: "just now",
        minutesAgoSuffix: "min ago",
        noOpenIncidents: "No open incidents",
        noUnitsInFilter: "No units in the selected station",
        auditLogEmpty: "No log entries yet",
        exportLogBtn: "Export Log",
        exportedToast: "Log exported successfully",
        cmdPriorityCritical: "CRITICAL",
        cmdPriorityHigh: "HIGH",
        cmdPriorityRoutine: "ROUTINE",
        crewCountSuffix: "crew",
        auditDispatchBackup: "Dispatched backup to incident",
        auditStatusChange: "Manual status change to",
        auditBroadcast: "Flash broadcast sent",
        commanderBadge: "Commander",
        unitBadge: "Unit"
    }
};

/* District -> Sector -> Station cascade for the setup screen, and a shared
   lookup so any page can render a stored context code as a localized label. */
const LOCATIONS = {
    districts: [
        { value: 'telaviv', HE: 'תל אביב', EN: 'Tel Aviv' },
        { value: 'jerusalem', HE: 'ירושלים', EN: 'Jerusalem' }
    ],
    sectors: {
        telaviv: [
            { value: 'ayalon', HE: 'איילון', EN: 'Ayalon' },
            { value: 'yarkon', HE: 'ירקון', EN: 'Yarkon' }
        ],
        jerusalem: [
            { value: 'zion', HE: 'ציון', EN: 'Zion' },
            { value: 'david', HE: 'דוד', EN: 'David' }
        ]
    },
    stations: {
        ayalon: [
            { value: 'holon', HE: 'חולון', EN: 'Holon' },
            { value: 'batyam', HE: 'בת ים', EN: 'Bat Yam' }
        ],
        yarkon: [
            { value: 'herzliya', HE: 'הרצליה', EN: 'Herzliya' },
            { value: 'raanana', HE: 'רעננה', EN: "Ra'anana" }
        ],
        zion: [
            { value: 'jlmcenter', HE: 'ירושלים מרכז', EN: 'Jerusalem Center' },
            { value: 'gilo', HE: 'גילה', EN: 'Gilo' }
        ],
        david: [
            { value: 'maaleadumim', HE: 'מעלה אדומים', EN: "Ma'ale Adumim" },
            { value: 'mevaseret', HE: 'מבשרת ציון', EN: 'Mevaseret Zion' }
        ]
    }
};

function locationLabel(list, code, lang) {
    const item = (list || []).find(x => x.value === code);
    return item ? item[lang] : (code || '');
}

function toggleLanguage() {
    currentLang = currentLang === 'HE' ? 'EN' : 'HE';
    localStorage.setItem(LANG_KEY, currentLang);
    const btn = document.getElementById('lang-toggle-btn');
    if (btn) btn.innerText = currentLang === 'HE' ? 'EN' : 'עב';
    updateTexts();
    if (typeof onLanguageChange === 'function') onLanguageChange();
}

function updateTexts() {
    const t = I18N[currentLang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.innerHTML = t[key];
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (t[key]) el.title = t[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) el.placeholder = t[key];
    });
}

function initLangToggleButton() {
    const btn = document.getElementById('lang-toggle-btn');
    if (btn) btn.innerText = currentLang === 'HE' ? 'EN' : 'עב';
}
