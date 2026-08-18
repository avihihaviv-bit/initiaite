const API_BASE = '';
const TOKEN_KEY = 'initiate_token';
const USERNAME_KEY = 'initiate_username';
const authToken = sessionStorage.getItem(TOKEN_KEY);
let currentLang = 'HE';

/* ---------------------------------------------------------------------- */
/* i18n                                                                    */
/* ---------------------------------------------------------------------- */
const i18n = {
    HE: {
        appTitle: "INITIATE // ניידת סיור",
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
        onDutyLabel: "בתפקיד · ניידת 12",
        teamHeader: "פרטי צוות ויחידה",
        distText: "מחוז:", regionText: "מרחב:", stationText: "תחנה:", unitText: "יחידה:",
        callsignText: "אות קריאה:", carNumText: "מס' ניידת:", commanderText: "מפקד:", officerText: "סייר:",
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
        lastNamePlaceholder: "שם משפחה"
    },
    EN: {
        appTitle: "INITIATE // PATROL C2",
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
        onDutyLabel: "On duty · Patrol 12",
        teamHeader: "Crew & Unit Details",
        distText: "District:", regionText: "Region:", stationText: "Station:", unitText: "Unit:",
        callsignText: "Call Sign:", carNumText: "Vehicle ID:", commanderText: "Cmdr:", officerText: "Officer:",
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
        lastNamePlaceholder: "Last Name"
    }
};

/* ---------------------------------------------------------------------- */
/* Icon hydration                                                          */
/* ---------------------------------------------------------------------- */
function hydrateIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(el => {
        const name = el.getAttribute('data-icon');
        const extra = el.classList.contains('icon-sm') ? 'icon-sm' : (el.classList.contains('icon-lg') ? 'icon-lg' : '');
        el.innerHTML = svgIcon(name, extra);
    });
}

/* ---------------------------------------------------------------------- */
/* Auth                                                                     */
/* ---------------------------------------------------------------------- */
async function authFetch(url, options) {
    options = options || {};
    const headers = Object.assign({}, options.headers, { Authorization: 'Bearer ' + authToken });
    const res = await fetch(url, Object.assign({}, options, { headers }));
    if (res.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USERNAME_KEY);
        showToast(i18n[currentLang].sessionExpired, 'error');
        setTimeout(() => location.replace('login.html'), 900);
        throw new Error('UNAUTHORIZED');
    }
    return res;
}

async function logout() {
    try { await authFetch('/api/auth/logout', { method: 'POST' }); } catch (e) { /* ignore */ }
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USERNAME_KEY);
    location.replace('login.html');
}

/* ---------------------------------------------------------------------- */
/* Toasts                                                                   */
/* ---------------------------------------------------------------------- */
function showToast(message, type, iconName) {
    type = type || 'info';
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const icon = iconName || (type === 'success' ? 'checkCircle' : type === 'error' ? 'alertTriangle' : 'bell');
    el.innerHTML = `${svgIcon(icon)}<span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => {
        el.style.transition = '0.25s';
        el.style.opacity = '0';
        el.style.transform = 'translateY(6px)';
        setTimeout(() => el.remove(), 250);
    }, 3200);
}

/* ---------------------------------------------------------------------- */
/* Language toggle                                                         */
/* ---------------------------------------------------------------------- */
function toggleLanguage() {
    currentLang = currentLang === 'HE' ? 'EN' : 'HE';
    document.getElementById('lang-toggle-btn').innerText = currentLang === 'HE' ? 'EN' : 'עב';
    updateTexts();
    loadReactionEvents();
}

function updateTexts() {
    const t = i18n[currentLang];
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

/* ---------------------------------------------------------------------- */
/* Terminal check modal                                                    */
/* ---------------------------------------------------------------------- */
let terminalHistory = [];
let currentEventForReport = null;
let currentCheckType = '';

const checkTypes = {
    person: { icon: 'user', title: { HE: 'בדיקת אדם', EN: 'Person Query' } },
    vehicle: { icon: 'car', title: { HE: 'בדיקת רכב', EN: 'Vehicle Query' }, placeholder: { HE: 'מספר רישוי', EN: 'License Plate' } },
    address: { icon: 'pin', title: { HE: 'בדיקת כתובת', EN: 'Address Query' }, placeholder: { HE: 'רחוב ומספר', EN: 'Street & Number' } },
    weapon: { icon: 'gun', title: { HE: 'בדיקת נשק', EN: 'Weapon Query' }, placeholder: { HE: 'מספר סידורי / רישיון', EN: 'Serial Number' } }
};

function openCheckModal(type) {
    currentCheckType = type;
    const t = i18n[currentLang];
    document.getElementById('modal-title').innerHTML = `${svgIcon(checkTypes[type].icon)}<span>${checkTypes[type].title[currentLang]}</span>`;
    const container = document.getElementById('modal-input-container');
    if (type === 'person') {
        container.innerHTML = `
            <div class="radio-group">
                <label><input type="radio" name="person-type" value="id" checked onchange="togglePersonMode()"> ID</label>
                <label><input type="radio" name="person-type" value="details" onchange="togglePersonMode()">${t.detailsLabel}</label>
            </div>
            <input type="number" id="input-single" class="modal-input" placeholder="${t.idPlaceholder}">
            <div id="input-verbal" class="verbal-inputs">
                <input type="text" id="input-fname" class="modal-input" placeholder="${t.firstNamePlaceholder}">
                <input type="text" id="input-lname" class="modal-input" placeholder="${t.lastNamePlaceholder}">
            </div>`;
    } else {
        container.innerHTML = `<input type="text" id="input-single" class="modal-input" placeholder="${checkTypes[type].placeholder[currentLang]}">`;
    }
    document.getElementById('modal-result').innerHTML = '';
    document.getElementById('check-modal').style.display = 'block';
    setTimeout(() => { const f = document.getElementById('input-single'); if (f) f.focus(); }, 50);
}

function togglePersonMode() {
    const isId = document.querySelector('input[name="person-type"]:checked').value === 'id';
    document.getElementById('input-single').style.display = isId ? 'block' : 'none';
    document.getElementById('input-verbal').style.display = isId ? 'none' : 'flex';
}
function closeCheckModal() { document.getElementById('check-modal').style.display = 'none'; }

function performCheck() {
    const t = i18n[currentLang];
    const resDiv = document.getElementById('modal-result');
    let searchValue = "";

    if (currentCheckType === 'person' && document.getElementById('input-verbal') && document.getElementById('input-verbal').style.display === 'flex') {
        searchValue = `${document.getElementById('input-fname').value} ${document.getElementById('input-lname').value}`.trim();
    } else {
        searchValue = document.getElementById('input-single').value;
    }

    if (!searchValue.trim()) {
        resDiv.innerHTML = `<div class="result-box error">${svgIcon('alertTriangle')}<span>${t.enterData}</span></div>`;
        return;
    }

    resDiv.innerHTML = `<div class="pending-row"><span class="spinner"></span><span>${t.querying}</span></div>`;
    setTimeout(() => {
        resDiv.innerHTML = `<div class="result-box ok">${svgIcon('checkCircle')}<span><strong>${t.clearResult}:</strong> ${searchValue}</span></div>`;
        terminalHistory.push({ type: currentCheckType, icon: checkTypes[currentCheckType].icon, value: searchValue });
    }, 900);
}

/* ---------------------------------------------------------------------- */
/* Report modal                                                            */
/* ---------------------------------------------------------------------- */
function acceptEvent(eventId, btnElement) {
    btnElement.closest('.card').classList.remove('new-event');
    btnElement.innerHTML = `${svgIcon('fileText')}<span>${i18n[currentLang].finishBtn}</span>`;
    btnElement.classList.add('btn-primary');
    btnElement.onclick = function () { openReportModal(eventId, btnElement.closest('.card')); };
    document.body.classList.remove('police-flash-active');
}

function openReportModal(eventId, cardElement) {
    currentEventForReport = { id: eventId, card: cardElement };
    const t = i18n[currentLang];
    document.getElementById('report-event-id').innerText = `${currentLang === 'HE' ? 'אירוע מס׳' : 'Incident ID'}: ${eventId}`;
    document.getElementById('report-text').value = '';
    document.getElementById('file-list').innerHTML = '';

    const historyContainer = document.getElementById('history-container');
    if (terminalHistory.length === 0) {
        historyContainer.innerHTML = `<div style="color: var(--text-mute); text-align: center; font-size: 12px; padding: 10px 0;">${t.noHistory}</div>`;
    } else {
        historyContainer.innerHTML = '';
        [...terminalHistory].reverse().forEach((item, index) => {
            historyContainer.innerHTML += `
                <div class="history-item">
                    <input type="checkbox" id="chk-${index}" value="${item.value}">
                    <label for="chk-${index}">${svgIcon(item.icon)}${item.value}</label>
                </div>`;
        });
    }
    document.getElementById('report-modal').style.display = 'block';
}

function closeReportModal() { document.getElementById('report-modal').style.display = 'none'; }

function submitReport() {
    showToast(i18n[currentLang].reportSent, 'success');
    closeReportModal();
    if (currentEventForReport && currentEventForReport.card) {
        currentEventForReport.card.style.display = 'none';
        updateReactionCount();
    }
    terminalHistory = [];
}

/* ---------------------------------------------------------------------- */
/* Evidence upload                                                         */
/* ---------------------------------------------------------------------- */
function handleFiles() {
    const fileInput = document.getElementById('media-upload');
    const fileList = document.getElementById('file-list');
    fileList.innerHTML = '';
    for (let i = 0; i < fileInput.files.length; i++) {
        fileList.innerHTML += `<div class="file-chip">${svgIcon('paperclip', 'icon-sm')}<span>${i18n[currentLang].attached} ${fileInput.files[i].name}</span></div>`;
    }
}

/* ---------------------------------------------------------------------- */
/* Alerts / siren                                                          */
/* ---------------------------------------------------------------------- */
function playSiren() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext(); const osc = ctx.createOscillator(); const gainNode = ctx.createGain();
        osc.connect(gainNode); gainNode.connect(ctx.destination); osc.type = 'square';
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(800, now); osc.frequency.setValueAtTime(1200, now + 0.3);
        osc.frequency.setValueAtTime(800, now + 0.6); osc.frequency.setValueAtTime(1200, now + 0.9);
        osc.frequency.setValueAtTime(800, now + 1.2);
        gainNode.gain.value = 0.08; osc.start(now); osc.stop(now + 1.5);
    } catch (e) { /* audio unavailable */ }
}

function triggerAlarm() {
    playSiren();
    document.body.classList.add('police-flash-active');
    setTimeout(() => { document.body.classList.remove('police-flash-active'); }, 3000);
}

/* ---------------------------------------------------------------------- */
/* Reaction tab                                                            */
/* ---------------------------------------------------------------------- */
let knownEvents = new Set();
let isFirstLoad = true;
let allEventsData = [];

function priorityInfo(priority) {
    const t = i18n[currentLang];
    if (priority === 1) return { label: t.priorityCritical };
    if (priority === 2) return { label: t.priorityUrgent };
    return { label: t.priorityRoutine };
}

function renderSkeleton(container, count) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `<div class="skeleton-card"><div class="skeleton-line w-40"></div><div class="skeleton-line w-90"></div><div class="skeleton-line w-60"></div></div>`;
    }
    container.innerHTML = html;
}

async function loadReactionEvents() {
    const list = document.getElementById('reaction-list');
    if (isFirstLoad) renderSkeleton(list, 2);
    try {
        const res = await authFetch(`${API_BASE}/api/reaction/events`);
        const data = await res.json();
        allEventsData = data.events;
        renderEvents();
    } catch (err) {
        if (err.message !== 'UNAUTHORIZED') {
            list.innerHTML = `<div class="empty-state">${svgIcon('alertTriangle')}<div class="empty-state-title">${i18n[currentLang].errorEvents}</div></div>`;
        }
    }
}

function updateReactionCount() {
    const visible = allEventsData.filter(ev => {
        const card = document.querySelector(`[data-event-id="${ev.eventId}"]`);
        return !card || card.style.display !== 'none';
    }).length;
    const badge = document.getElementById('reaction-count');
    badge.innerText = visible;
    badge.style.display = visible > 0 ? 'inline-block' : 'none';
}

function renderEvents() {
    const list = document.getElementById('reaction-list');
    const t = i18n[currentLang];

    if (allEventsData.length === 0) {
        list.innerHTML = `<div class="empty-state">${svgIcon('checkCircle')}<div class="empty-state-title">${t.allClearTitle}</div><div class="empty-state-sub">${t.allClearSub}</div></div>`;
        updateReactionCount();
        isFirstLoad = false;
        return;
    }

    list.innerHTML = '';
    let hasNewEvent = false;

    allEventsData.forEach(ev => {
        const isNew = !knownEvents.has(ev.eventId);
        if (isNew) { knownEvents.add(ev.eventId); if (!isFirstLoad) hasNewEvent = true; }
        const newEventClass = (isNew && !isFirstLoad) ? 'new-event' : '';
        const pr = priorityInfo(ev.priority);

        list.innerHTML += `
            <div class="card priority-${ev.priority} ${newEventClass}" data-event-id="${ev.eventId}">
                <div class="card-top">
                    <div class="card-title">${ev.type}</div>
                    <span class="badge">${ev.eventId}</span>
                </div>
                <span class="priority-pill priority-${ev.priority}">${pr.label}</span>
                <div class="card-meta">${svgIcon('pin', 'icon-sm')}<span>${ev.location.address}</span></div>
                <p class="card-desc">${ev.description}</p>
                <div class="card-actions">
                    <button class="btn" style="margin-top:0; flex-grow: 1;" onclick="acceptEvent('${ev.eventId}', this)">${svgIcon('radio')}<span>${t.acceptBtn}</span></button>
                    <button class="btn btn-primary btn-icon-only" style="margin-top:0;" onclick="navigateWazeDirect(${ev.location.lat}, ${ev.location.lng})" title="Waze">${svgIcon('navigation')}</button>
                </div>
            </div>`;
    });

    updateReactionCount();
    if (hasNewEvent) { triggerAlarm(); switchTab('reaction'); }
    isFirstLoad = false;
}

function triggerDummyEvent() {
    allEventsData.unshift({
        eventId: "100-2026-" + Math.floor(Math.random() * 10000),
        type: currentLang === 'HE' ? "שוד מזוין בעסק" : "Armed Robbery in Business",
        priority: 1,
        location: { address: currentLang === 'HE' ? "המרכבה 38, חולון" : "Hamerkav 38, Holon", lat: 32.008, lng: 34.802 },
        description: currentLang === 'HE' ? "לחצן מצוקה אילם. החשודים עדיין בפנים. סעו בזהירות." : "Silent panic alarm triggered. Suspects inside. Proceed with caution."
    });
    renderEvents();
}

setInterval(loadReactionEvents, 10000);

/* ---------------------------------------------------------------------- */
/* Tactical map                                                            */
/* ---------------------------------------------------------------------- */
let map; let currentMarker; let targetMarker; let currentDestLat = null; let currentDestLng = null;

function openMapModal() {
    document.getElementById('map-modal').style.display = 'block';
    if (!map) {
        map = L.map('map-container').setView([32.0160, 34.7700], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    }
    setTimeout(() => { map.invalidateSize(); }, 200);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            const lat = pos.coords.latitude; const lng = pos.coords.longitude;
            document.getElementById('map-status').innerHTML = `${svgIcon('checkCircle', 'icon-sm')}<span>${currentLang === 'HE' ? 'מיקום אותר במפה' : 'GPS Position Acquired'}</span>`;
            if (currentMarker) map.removeLayer(currentMarker);
            currentMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                    html: `<div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(145deg,#0ea5e9,#0369a1);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px rgba(56,189,248,0.25),0 2px 8px rgba(0,0,0,0.5);color:#eafaff;">${svgIcon('car', 'icon-sm')}</div>`,
                    className: 'unit-div-icon', iconSize: [30, 30], iconAnchor: [15, 15]
                })
            }).addTo(map).bindPopup(`<b>${currentLang === 'HE' ? 'מיקום הניידת' : 'Unit Position'}</b>`);
            map.setView([lat, lng], 15);
        }, () => {
            document.getElementById('map-status').innerHTML = `${svgIcon('alertTriangle', 'icon-sm')}<span>${currentLang === 'HE' ? 'לא ניתן לאתר מיקום' : 'Could not get location'}</span>`;
        });
    }
}
function closeMapModal() { document.getElementById('map-modal').style.display = 'none'; }

async function searchAddress() {
    const address = document.getElementById('map-search-input').value;
    if (!address) return;
    document.getElementById('map-status').innerHTML = `<span class="spinner"></span><span>${currentLang === 'HE' ? 'מחפש...' : 'Searching...'}</span>`;
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=IL`);
        const data = await res.json();
        if (data && data.length > 0) {
            const lat = data[0].lat; const lng = data[0].lon;
            document.getElementById('map-status').innerHTML = `${svgIcon('pin', 'icon-sm')}<span>${data[0].display_name}</span>`;
            if (targetMarker) map.removeLayer(targetMarker);
            targetMarker = L.marker([lat, lng]).addTo(map).bindPopup(`<b>${currentLang === 'HE' ? 'יעד' : 'Target'}</b>`).openPopup();
            map.setView([lat, lng], 16);
            currentDestLat = lat; currentDestLng = lng; document.getElementById('waze-btn').style.display = 'flex';
        } else {
            document.getElementById('map-status').innerHTML = `${svgIcon('alertTriangle', 'icon-sm')}<span>${currentLang === 'HE' ? 'לא נמצאה כתובת' : 'Address not found'}</span>`;
        }
    } catch (err) {
        document.getElementById('map-status').innerHTML = `${svgIcon('alertTriangle', 'icon-sm')}<span>${currentLang === 'HE' ? 'שגיאת חיפוש' : 'Search error'}</span>`;
    }
}
function navigateWaze() { if (currentDestLat && currentDestLng) window.open(`https://waze.com/ul?ll=${currentDestLat},${currentDestLng}&navigate=yes`, '_blank'); }
function navigateWazeDirect(lat, lng) { window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank'); }

/* ---------------------------------------------------------------------- */
/* Sidebar / tabs                                                          */
/* ---------------------------------------------------------------------- */
function openSidebar() { document.getElementById('sidebar').classList.add('open'); document.getElementById('overlay').style.display = 'block'; }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('overlay').style.display = 'none'; }

function toggleSection(itemEl, id) {
    const s = document.getElementById(id);
    const isOpen = s.style.display === 'block';
    s.style.display = isOpen ? 'none' : 'block';
    itemEl.classList.toggle('expanded', !isOpen);
}

function switchTab(tabId, evt) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
    const targetTab = evt ? evt.currentTarget : document.querySelector(`.tab[onclick*="'${tabId}'"]`);
    if (targetTab) targetTab.classList.add('active');
    document.getElementById(tabId).classList.add('active');
    if (tabId === 'reaction') loadReactionEvents();
}

/* ---------------------------------------------------------------------- */
/* Initiative tab                                                          */
/* ---------------------------------------------------------------------- */
function scanArea() {
    const t = i18n[currentLang];
    const statusDiv = document.getElementById('location-status');
    const listDiv = document.getElementById('initiative-list');
    statusDiv.innerHTML = `<span class="spinner"></span><span>${t.scanningTitle}</span>`;
    renderSkeleton(listDiv, 2);
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
        statusDiv.innerHTML = `<span class="spinner"></span><span>${t.scanningRadius}</span>`;
        try {
            const res = await authFetch(`${API_BASE}/api/initiative/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude, radiusInMeters: 8000 })
            });
            const data = await res.json();
            statusDiv.innerHTML = `${svgIcon('checkCircle', 'icon-sm')}<span>${data.count} ${t.tasksFound}</span>`;

            if (data.tasks.length === 0) {
                listDiv.innerHTML = `<div class="empty-state">${svgIcon('target')}<div class="empty-state-title">${t.noTasksTitle}</div><div class="empty-state-sub">${t.noTasksSub}</div></div>`;
                return;
            }
            listDiv.innerHTML = '';
            data.tasks.forEach(task => {
                listDiv.innerHTML += `
                    <div class="card">
                        <div class="card-top">
                            <div class="card-title">${svgIcon('target', 'icon-sm')}<span>${task.category}</span></div>
                            <span class="badge">${Math.round(task.distance)}m</span>
                        </div>
                        <h3 style="margin: 8px 0 4px; font-size:15px; color: var(--text);">${task.target.name || task.target.businessId}</h3>
                        <div class="card-meta">${svgIcon('pin', 'icon-sm')}<span>${task.location.address}</span></div>
                        <p class="card-instructions">${task.instructions}</p>
                        <button class="btn btn-primary" onclick="navigateWazeDirect(${task.location.lat}, ${task.location.lng})">${svgIcon('navigation')}<span>${t.navWaze}</span></button>
                    </div>`;
            });
        } catch (err) {
            if (err.message !== 'UNAUTHORIZED') {
                statusDiv.innerHTML = `${svgIcon('alertTriangle', 'icon-sm')}<span>${t.errorEvents}</span>`;
                listDiv.innerHTML = '';
            }
        }
    }, () => {
        statusDiv.innerHTML = `${svgIcon('alertTriangle', 'icon-sm')}<span>${currentLang === 'HE' ? 'לא ניתן לאתר מיקום' : 'Could not get location'}</span>`;
    });
}

/* ---------------------------------------------------------------------- */
/* Init                                                                     */
/* ---------------------------------------------------------------------- */
function initApp() {
    hydrateIcons();
    updateTexts();
    const username = sessionStorage.getItem(USERNAME_KEY);
    if (username) document.getElementById('sidebar-username').innerText = username;

    const t = i18n[currentLang];
    document.getElementById('initiative-list').innerHTML = `<div class="empty-state">${svgIcon('crosshair')}<div class="empty-state-title">${t.scanPromptTitle}</div><div class="empty-state-sub">${t.scanPromptSub}</div></div>`;

    const fileInput = document.getElementById('media-upload');
    const uploadZone = document.getElementById('upload-zone');
    fileInput.addEventListener('change', handleFiles);
    uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) { fileInput.files = e.dataTransfer.files; handleFiles(); }
    });

    loadReactionEvents();
}

document.addEventListener('DOMContentLoaded', initApp);
