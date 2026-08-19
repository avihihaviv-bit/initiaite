/* Field documentation tools for the Initiative tab: suspect/vehicle notes,
   checkpoint searches, citations, and intel/business-check reports. Loaded
   after app.js — reuses its globals (I18N, currentLang, svgIcon, showToast,
   terminalHistory) rather than redeclaring them. All client-side/local,
   same demo-persistence level as the rest of the app (no backend writes). */

function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------------------------------------------------------------------- */
/* Module A: Suspect & vehicle documentation                               */
/* ---------------------------------------------------------------------- */
let suspects = [];
let suspectVehicles = [];
let linkedQueryValue = '';

function suspectBlockHtml(s, i) {
    const t = I18N[currentLang];
    return `
        <div class="sub-block">
            <div class="sub-block-header">
                <span class="sub-block-title">${t.suspectBlockTitle} ${i + 1}</span>
                ${suspects.length > 1 ? `<button type="button" class="sub-block-remove" onclick="removeSuspect(${i})">${svgIcon('close', 'icon-sm')}</button>` : ''}
            </div>
            <label class="field-label">${t.behaviorLabel}</label>
            <textarea class="modal-textarea" rows="2" placeholder="${t.behaviorPlaceholder}" oninput="updateSuspectField(${i}, 'behavior', this.value)">${escapeHtml(s.behavior)}</textarea>
            <label class="field-label">${t.clothingLabel}</label>
            <input type="text" class="modal-input" placeholder="${t.clothingPlaceholder}" value="${escapeHtml(s.clothing)}" oninput="updateSuspectField(${i}, 'clothing', this.value)">
            <label class="field-label">${t.locationNearLabel}</label>
            <div class="search-row">
                <input type="text" class="modal-input" placeholder="${t.locationNearPlaceholder}" value="${escapeHtml(s.location)}" oninput="updateSuspectField(${i}, 'location', this.value)">
                <button type="button" class="btn btn-auto btn-sm" onclick="autoFillSuspectLocation(${i})" title="GPS">${svgIcon('pin', 'icon-sm')}</button>
            </div>
        </div>`;
}
function renderSuspects() { document.getElementById('suspects-container').innerHTML = suspects.map(suspectBlockHtml).join(''); }
function addSuspect() { suspects.push({ behavior: '', clothing: '', location: '' }); renderSuspects(); }
function removeSuspect(i) { suspects.splice(i, 1); renderSuspects(); }
function updateSuspectField(i, field, value) { suspects[i][field] = value; }

function autoFillSuspectLocation(i) {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
            const data = await res.json();
            suspects[i].location = data.display_name || `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
            renderSuspects();
        } catch (e) { showToast(I18N[currentLang].gpsError, 'error'); }
    }, () => { showToast(I18N[currentLang].gpsError, 'error'); });
}

function vehicleBlockHtml(v, i) {
    const t = I18N[currentLang];
    return `
        <div class="sub-block">
            <div class="sub-block-header">
                <span class="sub-block-title">${t.vehicleBlockTitle} ${i + 1}</span>
                <button type="button" class="sub-block-remove" onclick="removeSuspectVehicle(${i})">${svgIcon('close', 'icon-sm')}</button>
            </div>
            <input type="text" class="modal-input" placeholder="${t.vehicleMakePlaceholder}" value="${escapeHtml(v.make)}" oninput="updateVehicleField(${i}, 'make', this.value)">
            <input type="text" class="modal-input" placeholder="${t.vehiclePlatePlaceholder}" value="${escapeHtml(v.plate)}" oninput="updateVehicleField(${i}, 'plate', this.value)">
            <input type="text" class="modal-input" placeholder="${t.vehicleColorPlaceholder}" value="${escapeHtml(v.color)}" oninput="updateVehicleField(${i}, 'color', this.value)">
        </div>`;
}
function renderSuspectVehicles() {
    const container = document.getElementById('suspect-vehicles-container');
    container.innerHTML = suspectVehicles.length
        ? suspectVehicles.map(vehicleBlockHtml).join('')
        : `<div style="color: var(--text-mute); font-size: 12.5px; padding: 4px 2px 10px;">${I18N[currentLang].noVehiclesAttached}</div>`;
}
function addSuspectVehicle() { suspectVehicles.push({ make: '', plate: '', color: '' }); renderSuspectVehicles(); }
function removeSuspectVehicle(i) { suspectVehicles.splice(i, 1); renderSuspectVehicles(); }
function updateVehicleField(i, field, value) { suspectVehicles[i][field] = value; }

function populateRecentQueries() {
    const select = document.getElementById('suspect-recent-query');
    const t = I18N[currentLang];
    if (!terminalHistory.length) {
        select.innerHTML = `<option value="">${t.recentQueryNone}</option>`;
        select.disabled = true;
        return;
    }
    select.disabled = false;
    select.innerHTML = `<option value="">${t.recentQueryNone}</option>` +
        terminalHistory.map((h, i) => `<option value="${i}">${escapeHtml(h.value)}</option>`).join('');
    select.value = '';
    document.getElementById('recent-query-note').style.display = 'none';
}
function onRecentQuerySelected(value) {
    const note = document.getElementById('recent-query-note');
    if (value === '' || !terminalHistory[value]) { note.style.display = 'none'; linkedQueryValue = ''; return; }
    linkedQueryValue = terminalHistory[value].value;
    note.style.display = 'block';
    note.innerText = `${I18N[currentLang].recentQueryLinkedPrefix} ${linkedQueryValue}`;
}

function saveSuspectModule() {
    showToast(I18N[currentLang].docSaved, 'success');
    suspects = [{ behavior: '', clothing: '', location: '' }];
    suspectVehicles = [];
    linkedQueryValue = '';
    renderSuspects();
    renderSuspectVehicles();
    populateRecentQueries();
}

/* ---------------------------------------------------------------------- */
/* Module B: Checkpoint & vehicle checks (incl. mock LPR scan)             */
/* ---------------------------------------------------------------------- */
const MOCK_LPR_RESULTS = [
    { plate: '12-345-67', he: 'טויוטה קורולה לבנה', en: 'White Toyota Corolla' },
    { plate: '78-901-23', he: 'יונדאי אלנטרה אפורה', en: 'Grey Hyundai Elantra' },
    { plate: '45-678-90', he: "קיה ספורטאז' כחולה", en: 'Blue Kia Sportage' },
    { plate: '23-456-78', he: 'מאזדה 3 שחורה', en: 'Black Mazda 3' }
];
function scanLPR() {
    const btn = document.getElementById('lpr-scan-btn');
    const resultBox = document.getElementById('lpr-result');
    const t = I18N[currentLang];
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span><span>${t.lprScanning}</span>`;
    setTimeout(() => {
        const pick = MOCK_LPR_RESULTS[Math.floor(Math.random() * MOCK_LPR_RESULTS.length)];
        resultBox.style.display = 'block';
        resultBox.innerHTML = `<strong>${pick.plate}</strong><br>${currentLang === 'HE' ? pick.he : pick.en}`;
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }, 900);
}
function saveCheckpointModule() {
    showToast(I18N[currentLang].docSaved, 'success');
    document.getElementById('cp-driver-id').value = '';
    document.getElementById('cp-driver-name').value = '';
    document.getElementById('cp-license-status').value = 'valid';
    document.getElementById('lpr-result').style.display = 'none';
    ['finding-clear', 'finding-contraband', 'finding-weapons'].forEach(id => { document.getElementById(id).checked = false; });
}

/* ---------------------------------------------------------------------- */
/* Module C: Citations & tickets                                           */
/* ---------------------------------------------------------------------- */
function saveTrafficTicket() {
    showToast(I18N[currentLang].docSaved, 'success');
    document.getElementById('ticket-driver-id').value = '';
    document.getElementById('ticket-driver-name').value = '';
    document.getElementById('ticket-fine-amount').value = '';
}
function saveEnvTicket() {
    showToast(I18N[currentLang].docSaved, 'success');
    document.getElementById('env-location').value = '';
    document.getElementById('env-citizen-id').value = '';
    document.getElementById('env-citizen-name').value = '';
}

/* ---------------------------------------------------------------------- */
/* Module D: Intelligence & field reports                                  */
/* ---------------------------------------------------------------------- */
function saveIntelReport() {
    showToast(I18N[currentLang].docSaved, 'success');
    document.getElementById('intel-text').value = '';
}
function saveBusinessCheck() {
    showToast(I18N[currentLang].docSaved, 'success');
    document.getElementById('biz-name').value = '';
    document.getElementById('biz-owner-id').value = '';
    ['biz-license', 'biz-alcohol', 'biz-hours'].forEach(id => { document.getElementById(id).checked = false; });
}

/* ---------------------------------------------------------------------- */
/* Init                                                                     */
/* ---------------------------------------------------------------------- */
function initFieldTools() {
    suspects = [{ behavior: '', clothing: '', location: '' }];
    suspectVehicles = [];
    renderSuspects();
    renderSuspectVehicles();
    populateRecentQueries();
}
document.addEventListener('DOMContentLoaded', initFieldTools);

const _prevOnLanguageChangeFieldTools = onLanguageChange;
onLanguageChange = function () {
    if (typeof _prevOnLanguageChangeFieldTools === 'function') _prevOnLanguageChangeFieldTools();
    renderSuspects();
    renderSuspectVehicles();
    populateRecentQueries();
};
