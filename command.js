/* Command tab logic. Loaded after app.js on index.html and reuses its
   globals (TOKEN_KEY, authToken, context, authFetch, logout, showToast,
   hydrateIcons) rather than redeclaring them — this is one page now, not
   a separate app. Everything here stays inert (no map, no polling) until
   ensureCommandTabInit() runs, which only happens if the Command tab is
   actually opened, which only happens for a commander call sign. */

const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000;
const STATION_COORDS = { holon: [32.0114, 34.7734], batyam: [32.0171, 34.7492], herzliya: [32.1624, 34.8447], raanana: [32.1848, 34.8713] };

let units = [];
let events = [];
let auditEntries = [];
let stationFilter = '';
let commandInitialized = false;

function emptyState(icon, title) { return `<div class="empty-state">${svgIcon(icon)}<div class="empty-state-title">${title}</div></div>`; }
function isOffline(unit) { return (Date.now() - new Date(unit.lastUpdate).getTime()) > OFFLINE_THRESHOLD_MS; }
function elapsedLabel(iso) {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return I18N[currentLang].justNow;
    return `${mins} ${I18N[currentLang].minutesAgoSuffix}`;
}
const STATUS_LABEL_KEY = { available: 'statusAvailable', break: 'statusBreak', busy: 'statusBusy', distress: 'statusDistress', offline: 'statusOffline' };

/* ---------------------------------------------------------------------- */
/* Client-side distance + overlap clustering (no map-library plugin, no    */
/* server round-trip needed just to lay out markers that share a spot)     */
/* ---------------------------------------------------------------------- */
function distMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000, toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}
function computeClusteredPositions(items, getLatLng, thresholdMeters) {
    thresholdMeters = thresholdMeters || 180;
    const pts = items.map(it => { const p = getLatLng(it); return { item: it, lat: p.lat, lng: p.lng }; });
    const used = new Array(pts.length).fill(false);
    const groups = [];
    for (let i = 0; i < pts.length; i++) {
        if (used[i]) continue;
        const group = [pts[i]]; used[i] = true;
        for (let j = i + 1; j < pts.length; j++) {
            if (used[j]) continue;
            if (distMeters(pts[i].lat, pts[i].lng, pts[j].lat, pts[j].lng) < thresholdMeters) { group.push(pts[j]); used[j] = true; }
        }
        groups.push(group);
    }
    const result = [];
    groups.forEach(group => {
        if (group.length === 1) { result.push({ item: group[0].item, lat: group[0].lat, lng: group[0].lng }); return; }
        const centerLat = group.reduce((s, p) => s + p.lat, 0) / group.length;
        const centerLng = group.reduce((s, p) => s + p.lng, 0) / group.length;
        const radiusDeg = 0.0009;
        group.forEach((p, idx) => {
            const angle = (2 * Math.PI * idx) / group.length;
            result.push({ item: p.item, lat: centerLat + radiusDeg * Math.cos(angle), lng: centerLng + radiusDeg * Math.sin(angle) });
        });
    });
    return result;
}

/* ---------------------------------------------------------------------- */
/* Map                                                                      */
/* ---------------------------------------------------------------------- */
let cmdMap, unitsLayer, incidentsLayer, boundariesLayer, closuresLayer, hotspotsLayer;

function buildBoundariesLayer() {
    const group = L.layerGroup();
    Object.values(STATION_COORDS).forEach(coords => {
        L.circle(coords, { radius: 2200, color: '#38bdf8', weight: 1.5, dashArray: '6,6', fillOpacity: 0.03 }).addTo(group);
    });
    return group;
}
function buildClosuresLayer() {
    const group = L.layerGroup();
    L.polyline([[32.0700, 34.7900], [32.0650, 34.7950]], { color: '#ef4444', weight: 4, dashArray: '4,6' }).bindPopup('Road closed - construction').addTo(group);
    L.polyline([[32.0150, 34.7550], [32.0100, 34.7600]], { color: '#ef4444', weight: 4, dashArray: '4,6' }).bindPopup('Road closed - accident').addTo(group);
    return group;
}
function buildHotspotsLayer() {
    const group = L.layerGroup();
    [[32.0163, 34.7732, 12], [32.0853, 34.7818, 8], [32.1608, 34.8410, 5]].forEach(([lat, lng, count]) => {
        L.circleMarker([lat, lng], { radius: 14, color: '#f97316', weight: 1, fillColor: '#f97316', fillOpacity: 0.25 })
            .bindPopup(`Hotspot: ${count} incidents (last 30 days)`).addTo(group);
    });
    return group;
}

function initCmdMap() {
    const home = STATION_COORDS[context.station];
    cmdMap = L.map('cmd-map-container').setView(home || [32.05, 34.85], home ? 13 : 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(cmdMap);
    unitsLayer = L.layerGroup().addTo(cmdMap);
    incidentsLayer = L.layerGroup().addTo(cmdMap);
    boundariesLayer = buildBoundariesLayer().addTo(cmdMap);
    closuresLayer = buildClosuresLayer().addTo(cmdMap);
    hotspotsLayer = buildHotspotsLayer();
    setTimeout(() => cmdMap.invalidateSize(), 200);
}
function toggleLayerBoundaries(e) { if (e.target.checked) boundariesLayer.addTo(cmdMap); else cmdMap.removeLayer(boundariesLayer); }
function toggleLayerClosures(e) { if (e.target.checked) closuresLayer.addTo(cmdMap); else cmdMap.removeLayer(closuresLayer); }
function toggleLayerHotspots(e) { if (e.target.checked) hotspotsLayer.addTo(cmdMap); else cmdMap.removeLayer(hotspotsLayer); }

function renderUnitsOnMap() {
    unitsLayer.clearLayers();
    const filtered = units.filter(u => !stationFilter || u.station === stationFilter);
    const positioned = computeClusteredPositions(filtered, u => ({ lat: u.lat, lng: u.lng }));
    positioned.forEach(({ item: unit, lat, lng }) => {
        const statusKey = isOffline(unit) ? 'offline' : unit.status;
        const marker = L.marker([lat, lng], {
            icon: L.divIcon({
                html: `<div class="unit-marker-wrap"><div class="unit-marker-dot status-${statusKey}"></div><div class="unit-marker-label">${unit.callSign[currentLang]}</div></div>`,
                className: 'unit-div-icon', iconSize: [80, 40], iconAnchor: [40, 8]
            })
        });
        marker.on('click', () => openUnitModal(unit.id));
        marker.addTo(unitsLayer);
    });
}
function renderIncidentsOnMap() {
    incidentsLayer.clearLayers();
    events.forEach(ev => {
        const marker = L.marker([ev.location.lat, ev.location.lng], {
            icon: L.divIcon({
                html: `<div class="incident-marker priority-${ev.priority}">${svgIcon('alertTriangle', 'icon-sm')}</div>`,
                className: 'unit-div-icon', iconSize: [28, 28], iconAnchor: [14, 14]
            })
        });
        marker.bindPopup(`<b>${ev.type}</b><br>${ev.location.address}<br><button onclick="dispatchBackup('${ev.eventId}')" style="margin-top:8px;padding:7px 12px;border-radius:6px;border:none;background:#0ea5e9;color:#fff;cursor:pointer;font-weight:600;">${I18N[currentLang].instantBackupBtn}</button>`);
        marker.addTo(incidentsLayer);
    });
}

/* ---------------------------------------------------------------------- */
/* Panels                                                                   */
/* ---------------------------------------------------------------------- */
function switchPanelTab(tabId, evt) {
    document.querySelectorAll('.cmd-panel .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.cmd-panel-content').forEach(c => c.classList.remove('active'));
    const target = evt ? evt.currentTarget : document.querySelector(`.cmd-panel .tab[onclick*="'${tabId}'"]`);
    if (target) target.classList.add('active');
    document.getElementById('panel-' + tabId).classList.add('active');
}

function renderIncidentsPanel() {
    const container = document.getElementById('panel-incidents');
    const t = I18N[currentLang];
    const countBadge = document.getElementById('cmd-incidents-count');
    countBadge.innerText = events.length;
    countBadge.style.display = events.length ? 'inline-block' : 'none';
    if (!events.length) { container.innerHTML = emptyState('checkCircle', t.noOpenIncidents); return; }
    container.innerHTML = events.map(ev => {
        const mins = Math.floor((Date.now() - new Date(ev.timestamp).getTime()) / 60000);
        const breach = mins > 10;
        const prLabel = ev.priority === 1 ? t.cmdPriorityCritical : ev.priority === 2 ? t.cmdPriorityHigh : t.cmdPriorityRoutine;
        return `
            <div class="card priority-${ev.priority}" style="margin-bottom:10px;">
                <div class="card-top">
                    <div class="card-title">${ev.type}</div>
                    <span class="badge">${ev.eventId}</span>
                </div>
                <span class="priority-pill priority-${ev.priority}">${prLabel}</span>${breach ? `<span class="sla-tag">${svgIcon('alertTriangle', 'icon-sm')}${t.slaBreachTag}</span>` : ''}
                <div class="card-meta">${svgIcon('pin', 'icon-sm')}<span>${ev.location.address}</span></div>
                <div class="card-meta">${svgIcon('activity', 'icon-sm')}<span>${elapsedLabel(ev.timestamp)}</span></div>
                <button class="btn btn-primary" style="margin-top:10px;" onclick="dispatchBackup('${ev.eventId}')">${svgIcon('navigation')}<span>${t.instantBackupBtn}</span></button>
            </div>`;
    }).join('');
}

function renderUnitsPanel() {
    const container = document.getElementById('panel-units');
    const t = I18N[currentLang];
    const filtered = units.filter(u => !stationFilter || u.station === stationFilter);
    if (!filtered.length) { container.innerHTML = emptyState('car', t.noUnitsInFilter); return; }
    container.innerHTML = filtered.map(u => {
        const statusKey = isOffline(u) ? 'offline' : u.status;
        return `
            <div class="unit-row" onclick="openUnitModal('${u.id}')">
                <span class="unit-status-dot status-${statusKey}"></span>
                <div class="unit-row-main">
                    <div class="unit-row-callsign">${u.callSign[currentLang]}</div>
                    <div class="unit-row-meta">${u.crew.length} ${t.crewCountSuffix} &middot; ${elapsedLabel(u.lastUpdate)}</div>
                </div>
                <span class="unit-status-pill status-${statusKey}">${t[STATUS_LABEL_KEY[statusKey]]}</span>
            </div>`;
    }).join('');
}

function populateStationFilter() {
    const select = document.getElementById('station-filter');
    const t = I18N[currentLang];
    const stationCodes = [...new Set(units.map(u => u.station))];
    function labelFor(code) {
        for (const sector in LOCATIONS.stations) {
            const found = LOCATIONS.stations[sector].find(s => s.value === code);
            if (found) return found[currentLang];
        }
        return code;
    }
    const prevValue = select.value;
    select.innerHTML = `<option value="">${t.allStations}</option>` + stationCodes.map(c => `<option value="${c}">${labelFor(c)}</option>`).join('');
    select.value = stationCodes.includes(prevValue) ? prevValue : '';
    stationFilter = select.value;
}

/* ---------------------------------------------------------------------- */
/* Unit modal / status override                                            */
/* ---------------------------------------------------------------------- */
function openUnitModal(unitId) {
    const u = units.find(x => x.id === unitId);
    if (!u) return;
    const t = I18N[currentLang];
    const statusKey = isOffline(u) ? 'offline' : u.status;
    const assignedEvent = u.assignedEventId ? events.find(e => e.eventId === u.assignedEventId) : null;
    document.getElementById('unit-modal-callsign').innerText = u.callSign[currentLang];
    document.getElementById('unit-modal-body').innerHTML = `
        <div style="margin-bottom:14px;"><span class="unit-status-pill status-${statusKey}" style="font-size:12.5px; padding:6px 12px;">${t[STATUS_LABEL_KEY[statusKey]]}</span></div>
        <div class="card-meta">${svgIcon('users', 'icon-sm')}<span>${u.crew.join(', ')}</span></div>
        <div class="card-meta">${svgIcon('phone', 'icon-sm')}<span>${t.phoneLabel} ${u.phone}</span></div>
        <div class="card-meta">${svgIcon('activity', 'icon-sm')}<span>${t.elapsedLabel} ${elapsedLabel(u.lastUpdate)}</span></div>
        <div class="card-meta">${svgIcon('alertTriangle', 'icon-sm')}<span>${t.assignedEventLabel} ${assignedEvent ? assignedEvent.type : t.noAssignedEvent}</span></div>
        <label class="field-label">${t.overrideStatusLabel}</label>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:6px;">
            ${['available', 'break', 'busy', 'distress'].map(s => `<button class="btn btn-sm btn-auto" style="${s === u.status ? 'border-color:var(--accent);color:var(--accent);' : ''}" onclick="overrideUnitStatus('${u.id}','${s}')">${t[STATUS_LABEL_KEY[s]]}</button>`).join('')}
        </div>
    `;
    document.getElementById('unit-modal').style.display = 'block';
}
function closeUnitModal() { document.getElementById('unit-modal').style.display = 'none'; }

async function overrideUnitStatus(unitId, status) {
    try {
        const res = await authFetch(`/api/command/units/${unitId}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
        const data = await res.json();
        if (data.success) {
            const idx = units.findIndex(u => u.id === unitId);
            if (idx > -1) units[idx] = data.unit;
            renderAll();
            openUnitModal(unitId);
            refreshAuditLog();
            showToast(`${data.unit.callSign[currentLang]} → ${I18N[currentLang][STATUS_LABEL_KEY[status]]}`, 'success');
        }
    } catch (e) { /* authFetch already handled 401 */ }
}

/* ---------------------------------------------------------------------- */
/* Instant backup / broadcast                                              */
/* ---------------------------------------------------------------------- */
async function dispatchBackup(eventId) {
    try {
        const res = await authFetch('/api/command/dispatch-backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId }) });
        const data = await res.json();
        if (data.success) {
            if (!data.dispatched.length) { showToast(I18N[currentLang].noAvailableUnits, 'error'); return; }
            await refreshUnits();
            renderAll();
            refreshAuditLog();
            showToast(I18N[currentLang].backupDispatched, 'success');
            cmdMap.closePopup();
        }
    } catch (e) { /* authFetch already handled 401 */ }
}

function toggleBroadcastComposer() {
    const el = document.getElementById('broadcast-composer');
    const showing = el.style.display === 'flex';
    el.style.display = showing ? 'none' : 'flex';
    if (!showing) document.getElementById('broadcast-input').focus();
}
async function sendBroadcast() {
    const input = document.getElementById('broadcast-input');
    const message = input.value.trim();
    if (!message) { showToast(I18N[currentLang].broadcastEmpty, 'error'); return; }
    try {
        const res = await authFetch('/api/command/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
        const data = await res.json();
        if (data.success) {
            input.value = '';
            showToast(I18N[currentLang].broadcastSent, 'success');
            toggleBroadcastComposer();
            refreshAuditLog();
        }
    } catch (e) { /* authFetch already handled 401 */ }
}

/* ---------------------------------------------------------------------- */
/* Audit log                                                                */
/* ---------------------------------------------------------------------- */
function renderAuditLog() {
    const container = document.getElementById('audit-log-list');
    const t = I18N[currentLang];
    if (!auditEntries.length) { container.innerHTML = emptyState('clipboard', t.auditLogEmpty); return; }
    container.innerHTML = auditEntries.map(e => `
        <div class="audit-entry">
            <span class="audit-time">${new Date(e.timestamp).toLocaleTimeString(currentLang === 'HE' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            <span class="audit-text"><strong>${e.actor}</strong> — ${t[e.actionKey] || ''} ${e.detail}</span>
        </div>`).join('');
}
async function refreshAuditLog() {
    try {
        const res = await authFetch('/api/command/audit-log');
        const data = await res.json();
        auditEntries = data.entries;
        renderAuditLog();
    } catch (e) { /* authFetch already handled 401 */ }
}
function exportAuditLog() {
    const t = I18N[currentLang];
    const lines = auditEntries.map(e => `[${e.timestamp}] ${e.actor} - ${t[e.actionKey] || ''} ${e.detail}`).join('\n');
    const blob = new Blob([lines || 'No entries'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `shift-log-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.txt`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    showToast(t.exportedToast, 'success');
}

/* ---------------------------------------------------------------------- */
/* Data refresh + lazy init                                                */
/* ---------------------------------------------------------------------- */
async function refreshUnits() { const res = await authFetch('/api/command/units'); const data = await res.json(); units = data.units; }
async function refreshEvents() { const res = await authFetch('/api/reaction/events'); const data = await res.json(); events = data.events; }

function renderAll() {
    populateStationFilter();
    renderUnitsPanel();
    renderIncidentsPanel();
    renderUnitsOnMap();
    renderIncidentsOnMap();
}
async function pollCommandAll() {
    try { await Promise.all([refreshUnits(), refreshEvents()]); renderAll(); } catch (e) { /* authFetch already handled 401 */ }
}

function renderContextChip() {
    const districtLabel = locationLabel(LOCATIONS.districts, context.district, currentLang);
    const sectorLabel = locationLabel(LOCATIONS.sectors[context.district] || [], context.sector, currentLang);
    const stationLabel = locationLabel(LOCATIONS.stations[context.sector] || [], context.station, currentLang);
    document.getElementById('cmd-context-chip').innerText = `${I18N[currentLang].commanderTitle} — ${districtLabel} · ${sectorLabel} · ${stationLabel} · ${context.callSign || ''}`;
}

/* Called from app.js's switchTab() the first time the Command tab opens.
   Every call after the first just fixes the map's size (it was rendering
   into a display:none container) — nothing gets re-fetched or torn down. */
function ensureCommandTabInit() {
    if (commandInitialized) { if (cmdMap) cmdMap.invalidateSize(); return; }
    commandInitialized = true;

    renderContextChip();
    initCmdMap();

    document.getElementById('station-filter').addEventListener('change', (e) => { stationFilter = e.target.value; renderAll(); });
    document.getElementById('layer-boundaries').addEventListener('change', toggleLayerBoundaries);
    document.getElementById('layer-closures').addEventListener('change', toggleLayerClosures);
    document.getElementById('layer-hotspots').addEventListener('change', toggleLayerHotspots);
    document.getElementById('broadcast-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); sendBroadcast(); } });

    pollCommandAll();
    refreshAuditLog();
    setInterval(pollCommandAll, 8000);
    setInterval(refreshAuditLog, 8000);
}

/* Chain onto app.js's language-change hook rather than replacing it —
   both patrol tabs and the Command tab (once opened) need to re-render. */
const _patrolOnLanguageChange = onLanguageChange;
onLanguageChange = function () {
    if (typeof _patrolOnLanguageChange === 'function') _patrolOnLanguageChange();
    if (!commandInitialized) return;
    renderContextChip();
    renderAll();
    renderAuditLog();
};
