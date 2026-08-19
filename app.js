const API_BASE = '';
const TOKEN_KEY = 'initiate_token';
const USERNAME_KEY = 'initiate_username';
const CONTEXT_KEY = 'initiate_context';
const authToken = sessionStorage.getItem(TOKEN_KEY);

/* i18n dictionary, LOCATIONS, currentLang and toggleLanguage()/updateTexts()
   live in the shared i18n.js, loaded before this file. */

/* hydrateIcons() lives in the shared icons.js. */

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
        showToast(I18N[currentLang].sessionExpired, 'error');
        setTimeout(() => location.replace('login.html'), 900);
        throw new Error('UNAUTHORIZED');
    }
    return res;
}

async function logout() {
    try { await authFetch('/api/auth/logout', { method: 'POST' }); } catch (e) { /* ignore */ }
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USERNAME_KEY);
    sessionStorage.removeItem(CONTEXT_KEY);
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

/* Language toggle/updateTexts live in i18n.js; this page just re-renders
   its live data (event list, shift context labels) whenever the language changes. */
onLanguageChange = function () { loadReactionEvents(); renderShiftContext(); };

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
    const t = I18N[currentLang];
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
    const t = I18N[currentLang];
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
    btnElement.innerHTML = `${svgIcon('fileText')}<span>${I18N[currentLang].finishBtn}</span>`;
    btnElement.classList.add('btn-primary');
    btnElement.onclick = function () { openReportModal(eventId, btnElement.closest('.card')); };
    document.body.classList.remove('police-flash-active');
}

function openReportModal(eventId, cardElement) {
    currentEventForReport = { id: eventId, card: cardElement };
    const t = I18N[currentLang];
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
    showToast(I18N[currentLang].reportSent, 'success');
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
        fileList.innerHTML += `<div class="file-chip">${svgIcon('paperclip', 'icon-sm')}<span>${I18N[currentLang].attached} ${fileInput.files[i].name}</span></div>`;
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
    const t = I18N[currentLang];
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
            list.innerHTML = `<div class="empty-state">${svgIcon('alertTriangle')}<div class="empty-state-title">${I18N[currentLang].errorEvents}</div></div>`;
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
    const t = I18N[currentLang];

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
    const t = I18N[currentLang];
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
function renderShiftContext() {
    let ctx = null;
    try { ctx = JSON.parse(sessionStorage.getItem(CONTEXT_KEY)); } catch (e) { /* ignore */ }
    if (!ctx) return;
    const districtLabel = locationLabel(LOCATIONS.districts, ctx.district, currentLang);
    const sectorLabel = locationLabel(LOCATIONS.sectors[ctx.district] || [], ctx.sector, currentLang);
    const stationLabel = locationLabel(LOCATIONS.stations[ctx.sector] || [], ctx.station, currentLang);
    document.getElementById('ctx-district').innerText = districtLabel;
    document.getElementById('ctx-region').innerText = sectorLabel;
    document.getElementById('ctx-station').innerText = stationLabel;
    document.getElementById('ctx-callsign').innerText = ctx.callSign || '—';
    document.getElementById('ctx-callsign-role').innerText = ctx.callSign || '—';
    document.getElementById('ctx-crew').innerText = (ctx.crew && ctx.crew.length) ? ctx.crew.join(', ') : '—';
}

/* ---------------------------------------------------------------------- */
/* Flash broadcast banner (polled from the Commander Dashboard)            */
/* ---------------------------------------------------------------------- */
let lastSeenBroadcastId = null;
let broadcastDismissed = false;

async function pollBroadcast() {
    try {
        const res = await authFetch('/api/command/broadcasts/latest');
        const data = await res.json();
        const banner = document.getElementById('broadcast-banner');
        if (data.success && data.broadcast) {
            if (data.broadcast.id !== lastSeenBroadcastId) {
                lastSeenBroadcastId = data.broadcast.id;
                broadcastDismissed = false;
            }
            if (!broadcastDismissed) {
                document.getElementById('broadcast-banner-text').innerText = data.broadcast.message;
                banner.style.display = 'flex';
            }
        } else {
            banner.style.display = 'none';
        }
    } catch (e) { /* silent - non-critical background poll */ }
}
function dismissBroadcast() {
    broadcastDismissed = true;
    document.getElementById('broadcast-banner').style.display = 'none';
}
setInterval(pollBroadcast, 10000);

function initApp() {
    hydrateIcons();
    initLangToggleButton();
    updateTexts();
    renderShiftContext();
    const username = sessionStorage.getItem(USERNAME_KEY);
    if (username) document.getElementById('sidebar-username').innerText = username;

    const t = I18N[currentLang];
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
    pollBroadcast();
}

document.addEventListener('DOMContentLoaded', initApp);
