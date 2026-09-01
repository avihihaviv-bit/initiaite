// ui.js — all DOM wiring: sidebar, toolbar, property panel, modals, shortcuts.

window.RD = window.RD || {};

RD.UI = (function () {
    const S = RD.State;
    const F = RD.Furniture;
    const T = RD.Templates;
    const ST = RD.Storage;
    const A = RD.Advisor;

    let els = {};
    let customPhotoDataUrl = null;

    const CATEGORY_ICON = { 'ישיבה': '🛋️', 'שולחנות': '🪑', 'אחסון': '🗄️', 'תאורה': '💡', 'עיצוב': '🖼️', 'חדר שינה': '🛏️' };
    const SEVERITY_ICON = { issue: '⚠️', notice: 'ℹ️', good: '✅' };
    const SEVERITY_RANK = { issue: 0, notice: 1, good: 2 };

    function $(id) { return document.getElementById(id); }

    function cacheEls() {
        els = {
            projectName: $('project-name-display'),

            btnNew: $('btn-new'),
            btnSave: $('btn-save'),
            btnSaveAs: $('btn-save-as'),
            btnLoad: $('btn-load'),
            btnUndo: $('btn-undo'),
            btnRedo: $('btn-redo'),
            btnAdvisor: $('btn-advisor'),
            btnWalk: $('btn-walk'),
            btnExportJson: $('btn-export-json'),
            btnImportJson: $('btn-import-json'),
            fileImport: $('file-import'),
            btnExportPng: $('btn-export-png'),

            templatesRow: $('templates-row'),
            roomWidth: $('room-width'), roomWidthNum: $('room-width-num'),
            roomDepth: $('room-depth'), roomDepthNum: $('room-depth-num'),
            roomHeight: $('room-height'), roomHeightNum: $('room-height-num'),
            wallColor: $('wall-color'),
            floorColor: $('floor-color'),
            floorMaterial: $('floor-material'),
            showCeiling: $('show-ceiling'),
            lightingToggle: $('lighting-toggle'),
            gridVisible: $('grid-visible'),
            snapEnabled: $('snap-enabled'),
            showLabels: $('show-labels'),
            catalogList: $('catalog-list'),
            btnAddCustom: $('btn-add-custom'),

            propsPanel: $('props-panel'),
            propsTitle: $('props-title'),
            propColor: $('prop-color'),
            propScale: $('prop-scale'), propScaleOut: $('prop-scale-out'),
            propWidthCm: $('prop-width-cm'), propDepthCm: $('prop-depth-cm'), propHeightCm: $('prop-height-cm'),
            propRotateLeft: $('prop-rotate-left'),
            propRotateRight: $('prop-rotate-right'),
            propFindSpot: $('prop-find-spot'),
            propCheck: $('prop-check'),
            propDuplicate: $('prop-duplicate'),
            propLock: $('prop-lock'),
            propDelete: $('prop-delete'),

            statusDims: $('status-room-dims'),
            statusCount: $('status-item-count'),
            statusSnap: $('status-snap'),

            modalSaveAs: $('modal-save-as'),
            saveAsName: $('save-as-name'),
            saveAsCancel: $('save-as-cancel'),
            saveAsConfirm: $('save-as-confirm'),

            modalLoad: $('modal-load'),
            loadList: $('load-list'),
            loadCancel: $('load-cancel'),

            modalCustom: $('modal-custom-item'),
            ciName: $('ci-name'), ciCategory: $('ci-category'), ciColor: $('ci-color'),
            ciKnowSize: $('ci-know-size'), ciSizeFields: $('ci-size-fields'), ciSizeNote: $('ci-size-note'),
            ciWidth: $('ci-width'), ciDepth: $('ci-depth'), ciHeight: $('ci-height'),
            ciPhoto: $('ci-photo'), ciPreview: $('ci-preview'), ciPreviewImg: $('ci-preview-img'), ciPreviewRemove: $('ci-preview-remove'),
            ciCancel: $('ci-cancel'), ciAddPlain: $('ci-add-plain'), ciAddSmart: $('ci-add-smart'),

            modalAdvisor: $('modal-advisor'),
            advisorList: $('advisor-list'),
            advisorClose: $('advisor-close'),

            adviceCard: $('advice-card'), adviceIcon: $('advice-icon'), adviceTitle: $('advice-title'),
            adviceList: $('advice-list'), adviceClose: $('advice-close'),

            toast: $('toast')
        };
    }

    function showToast(msg) {
        els.toast.textContent = msg;
        els.toast.hidden = false;
        els.toast.classList.add('show');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(function () {
            els.toast.classList.remove('show');
            setTimeout(function () { els.toast.hidden = true; }, 200);
        }, 2200);
    }

    function worstSeverity(findings) {
        let worst = 'good';
        findings.forEach(function (f) { if (SEVERITY_RANK[f.severity] < SEVERITY_RANK[worst]) worst = f.severity; });
        return worst;
    }

    function showAdviceCard(title, findings) {
        els.adviceTitle.textContent = title;
        els.adviceIcon.textContent = SEVERITY_ICON[worstSeverity(findings)];
        els.adviceList.innerHTML = findings.map(function (f) {
            return '<li data-severity="' + f.severity + '">' + escapeHtml(f.text) + '</li>';
        }).join('');
        els.adviceCard.hidden = false;
        clearTimeout(showAdviceCard._t);
        showAdviceCard._t = setTimeout(function () { els.adviceCard.hidden = true; }, 9000);
    }

    function reportQuickCheck(itemId) {
        const item = S.getItem(itemId);
        if (!item) return;
        const findings = A.quickCheck(itemId);
        showAdviceCard('בדיקת מיקום: ' + F.getLabel(item), findings);
    }

    function openModal(el) { el.classList.add('open'); }
    function closeModal(el) { el.classList.remove('open'); }

    function refocusCamera() {
        const room = S.get().room;
        RD.Scene.focusRoom(room.width, room.depth, room.height);
    }

    // ---- Catalog + templates (static render) ----
    function renderCatalog() {
        const byCategory = {};
        RD.Catalog.ITEMS.forEach(function (it) {
            (byCategory[it.category] = byCategory[it.category] || []).push(it);
        });
        let html = '';
        Object.keys(byCategory).forEach(function (cat) {
            html += '<div class="rd-cat-group"><h4>' + (CATEGORY_ICON[cat] || '') + ' ' + cat + '</h4><div class="rd-cat-items">';
            byCategory[cat].forEach(function (it) {
                html += '<button class="rd-catalog-item" data-type="' + it.type + '" style="--swatch:' + it.defaultColor + '">' +
                    '<span class="rd-swatch"></span><span>' + it.label + '</span></button>';
            });
            html += '</div></div>';
        });
        els.catalogList.innerHTML = html;
        els.catalogList.querySelectorAll('.rd-catalog-item').forEach(function (btn) {
            btn.addEventListener('click', function () {
                F.addFromCatalog(btn.getAttribute('data-type'));
                showToast('נוסף לחדר: ' + btn.textContent.trim());
            });
        });
    }

    function renderTemplates() {
        let html = '';
        T.list().forEach(function (t) {
            html += '<button class="rd-btn rd-template-btn" data-key="' + t.key + '">' + t.label + '</button>';
        });
        els.templatesRow.innerHTML = html;
        els.templatesRow.querySelectorAll('.rd-template-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (confirm('טעינת תבנית תחליף את הפרויקט הנוכחי. להמשיך?')) {
                    T.apply(btn.getAttribute('data-key'));
                    refocusCamera();
                    showToast('תבנית נטענה');
                }
            });
        });
    }

    // ---- Sync UI from state ----
    function refreshRoomFields() {
        const room = S.get().room;
        els.roomWidth.value = room.width; els.roomWidthNum.value = room.width.toFixed(1);
        els.roomDepth.value = room.depth; els.roomDepthNum.value = room.depth.toFixed(1);
        els.roomHeight.value = room.height; els.roomHeightNum.value = room.height.toFixed(1);
        els.wallColor.value = room.wallColor;
        els.floorColor.value = room.floorColor;
        els.floorMaterial.value = room.floorMaterial || 'solid';
        els.showCeiling.checked = !!room.showCeiling;

        const settings = S.get().settings;
        els.gridVisible.checked = !!settings.gridVisible;
        els.snapEnabled.checked = !!settings.snapEnabled;
        els.showLabels.checked = settings.showLabels !== false;

        const lighting = S.get().lighting;
        els.lightingToggle.querySelectorAll('button').forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-preset') === lighting.preset);
        });

        els.projectName.textContent = S.get().meta.name;
    }

    function refreshPropsPanel() {
        const id = S.get().selectedId;
        if (!id) { els.propsPanel.hidden = true; return; }
        const item = S.getItem(id);
        if (!item) { els.propsPanel.hidden = true; return; }
        els.propsPanel.hidden = false;
        els.propsTitle.textContent = (item.locked ? '🔒 ' : '') + F.getLabel(item);
        els.propLock.textContent = item.locked ? '🔒' : '🔓';
        els.propLock.title = item.locked ? 'שחרור מיקום' : 'נעילת מיקום — מונע הזזה בטעות';
        els.propLock.setAttribute('aria-pressed', item.locked ? 'true' : 'false');
        els.propColor.value = item.color;
        els.propScale.value = item.scale;
        els.propScaleOut.textContent = Math.round(item.scale * 100) + '%';

        const fp = F.getFootprint(item);
        const s = item.scale || 1;
        els.propWidthCm.value = Math.round(fp.w * s * 100);
        els.propDepthCm.value = Math.round(fp.d * s * 100);
        els.propHeightCm.value = Math.round(fp.h * s * 100);
    }

    function refreshStatus() {
        const room = S.get().room;
        const items = S.get().items;
        const settings = S.get().settings;
        els.statusDims.textContent = 'חדר: ' + room.width.toFixed(1) + '×' + room.depth.toFixed(1) + '×' + room.height.toFixed(1) + ' מ\'';
        els.statusCount.textContent = 'פריטים: ' + items.length;
        els.statusSnap.textContent = settings.snapEnabled ? ('הצמדה: ' + settings.snapSize + ' מ\'') : 'הצמדה: כבויה';
    }

    function refreshUndoRedo() {
        els.btnUndo.disabled = !S.canUndo();
        els.btnRedo.disabled = !S.canRedo();
    }

    function refreshAll() {
        refreshRoomFields();
        refreshPropsPanel();
        refreshStatus();
        refreshUndoRedo();
        RD.Room.setGridVisible(S.get().settings.gridVisible);
    }

    // ---- Wiring ----
    function wireRoomControls() {
        function applyDims() {
            S.setRoomDims(parseFloat(els.roomWidth.value), parseFloat(els.roomDepth.value), parseFloat(els.roomHeight.value));
        }
        // Slider drag <-> typed number, kept in sync both ways so either one
        // can drive an exact room size (e.g. typing "3.4" for 3.40 מ').
        [[els.roomWidth, els.roomWidthNum], [els.roomDepth, els.roomDepthNum], [els.roomHeight, els.roomHeightNum]].forEach(function (pair) {
            const slider = pair[0], num = pair[1];
            slider.addEventListener('input', function () { num.value = parseFloat(slider.value).toFixed(1); });
            slider.addEventListener('change', applyDims);
            num.addEventListener('change', function () {
                const min = parseFloat(num.min), max = parseFloat(num.max);
                let v = parseFloat(num.value);
                if (isNaN(v)) v = parseFloat(slider.value);
                v = Math.min(max, Math.max(min, v));
                num.value = v.toFixed(1);
                slider.value = v;
                applyDims();
            });
        });

        els.wallColor.addEventListener('input', function () { S.setRoomField('wallColor', els.wallColor.value); });
        els.floorColor.addEventListener('input', function () { S.setRoomField('floorColor', els.floorColor.value); });
        els.floorMaterial.addEventListener('change', function () { S.setRoomField('floorMaterial', els.floorMaterial.value); });
        els.showCeiling.addEventListener('change', function () { S.setRoomField('showCeiling', els.showCeiling.checked); });

        els.lightingToggle.querySelectorAll('button').forEach(function (btn) {
            btn.addEventListener('click', function () { S.setLightingPreset(btn.getAttribute('data-preset')); });
        });

        els.gridVisible.addEventListener('change', function () {
            S.setSetting('gridVisible', els.gridVisible.checked);
            RD.Room.setGridVisible(els.gridVisible.checked);
        });
        els.snapEnabled.addEventListener('change', function () {
            S.setSetting('snapEnabled', els.snapEnabled.checked);
            refreshStatus();
        });
        els.showLabels.addEventListener('change', function () {
            S.setSetting('showLabels', els.showLabels.checked);
            RD.Labels.sync();
        });
    }

    function wirePropsPanel() {
        els.propColor.addEventListener('input', function () { F.recolorSelected(els.propColor.value); });
        els.propScale.addEventListener('input', function () {
            els.propScaleOut.textContent = Math.round(parseFloat(els.propScale.value) * 100) + '%';
            F.rescaleSelected(parseFloat(els.propScale.value));
        });
        els.propRotateLeft.addEventListener('click', function () { F.rotateSelected(-15); });
        els.propRotateRight.addEventListener('click', function () { F.rotateSelected(15); });
        els.propDuplicate.addEventListener('click', function () { F.duplicateSelected(); });
        els.propLock.addEventListener('click', function () { F.toggleLockSelected(); });
        els.propDelete.addEventListener('click', function () { F.deleteSelected(); });

        function wireDim(el, axis) {
            el.addEventListener('change', function () {
                const id = S.get().selectedId;
                if (!id) return;
                F.setRealDimensionCm(id, axis, parseFloat(el.value));
            });
        }
        wireDim(els.propWidthCm, 'w');
        wireDim(els.propDepthCm, 'd');
        wireDim(els.propHeightCm, 'h');

        els.propFindSpot.addEventListener('click', function () {
            const id = S.get().selectedId;
            if (!id) return;
            const result = F.placeAtBestSpot(id);
            if (!result) return;
            showAdviceCard('מיקום מומלץ: ' + F.getLabel(S.getItem(id)), result.reasons.map(function (t) {
                return { severity: result.fits ? 'good' : 'issue', text: t };
            }));
        });
        els.propCheck.addEventListener('click', function () {
            const id = S.get().selectedId;
            if (!id) return;
            reportQuickCheck(id);
        });
    }

    function renderLoadList() {
        const projects = ST.list();
        if (!projects.length) {
            els.loadList.innerHTML = '<p class="rd-hint">אין פרויקטים שמורים עדיין.</p>';
            return;
        }
        els.loadList.innerHTML = projects.map(function (p) {
            const date = new Date(p.updatedAt).toLocaleString('he-IL');
            return '<div class="rd-load-row" data-id="' + p.id + '">' +
                '<div class="rd-load-info"><strong>' + escapeHtml(p.name) + '</strong><small>' + date + ' · ' + p.itemCount + ' פריטים</small></div>' +
                '<div class="rd-load-actions">' +
                '<button class="rd-btn rd-btn-sm" data-action="load">טען</button>' +
                '<button class="rd-btn rd-btn-sm rd-btn-danger" data-action="delete">מחק</button>' +
                '</div></div>';
        }).join('');
        els.loadList.querySelectorAll('.rd-load-row').forEach(function (row) {
            const id = row.getAttribute('data-id');
            row.querySelector('[data-action="load"]').addEventListener('click', function () {
                ST.load(id);
                refocusCamera();
                closeModal(els.modalLoad);
                showToast('הפרויקט נטען');
            });
            row.querySelector('[data-action="delete"]').addEventListener('click', function () {
                if (confirm('למחוק את הפרויקט?')) { ST.remove(id); renderLoadList(); }
            });
        });
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    // ---- Custom item modal ----
    function resetCustomForm() {
        els.ciName.value = '';
        els.ciCategory.value = 'ישיבה';
        els.ciColor.value = '#8a6b52';
        els.ciKnowSize.checked = true;
        // Cleared so updateCustomSizeFields' "!value" check refills them
        // with the reset category's defaults instead of leaving whatever
        // dimensions the previous custom item was created with.
        els.ciWidth.value = '';
        els.ciDepth.value = '';
        els.ciHeight.value = '';
        customPhotoDataUrl = null;
        els.ciPhoto.value = '';
        els.ciPreview.hidden = true;
        updateCustomSizeFields();
    }

    function updateCustomSizeFields() {
        const known = els.ciKnowSize.checked;
        els.ciSizeFields.hidden = !known;
        els.ciSizeNote.hidden = known;
        if (known && !els.ciWidth.value) {
            const d = RD.Custom.defaultFootprint(els.ciCategory.value);
            els.ciWidth.value = Math.round(d.w * 100);
            els.ciDepth.value = Math.round(d.d * 100);
            els.ciHeight.value = Math.round(d.h * 100);
        }
    }

    function readCustomFootprint() {
        if (els.ciKnowSize.checked) {
            const w = parseFloat(els.ciWidth.value), d = parseFloat(els.ciDepth.value), h = parseFloat(els.ciHeight.value);
            if (w > 0 && d > 0 && h > 0) return { w: w / 100, d: d / 100, h: h / 100 };
        }
        return RD.Custom.defaultFootprint(els.ciCategory.value);
    }

    function buildCustomSpec() {
        return {
            name: els.ciName.value.trim() || 'פריט מותאם',
            category: els.ciCategory.value,
            color: els.ciColor.value,
            footprint: readCustomFootprint(),
            photo: customPhotoDataUrl
        };
    }

    function wireCustomItemModal() {
        els.btnAddCustom.addEventListener('click', function () {
            resetCustomForm();
            openModal(els.modalCustom);
            els.ciName.focus();
        });
        els.ciCancel.addEventListener('click', function () { closeModal(els.modalCustom); });
        els.ciKnowSize.addEventListener('change', updateCustomSizeFields);
        els.ciCategory.addEventListener('change', function () {
            if (!els.ciKnowSize.checked) return;
            const d = RD.Custom.defaultFootprint(els.ciCategory.value);
            els.ciWidth.value = Math.round(d.w * 100);
            els.ciDepth.value = Math.round(d.d * 100);
            els.ciHeight.value = Math.round(d.h * 100);
        });

        els.ciPhoto.addEventListener('change', function () {
            const file = els.ciPhoto.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function () {
                customPhotoDataUrl = reader.result;
                els.ciPreviewImg.src = customPhotoDataUrl;
                els.ciPreview.hidden = false;
            };
            reader.readAsDataURL(file);
        });
        els.ciPreviewRemove.addEventListener('click', function () {
            customPhotoDataUrl = null;
            els.ciPhoto.value = '';
            els.ciPreview.hidden = true;
        });

        els.ciAddPlain.addEventListener('click', function () {
            const spec = buildCustomSpec();
            F.addCustomItem(spec);
            closeModal(els.modalCustom);
            showToast('"' + spec.name + '" נוסף לחדר');
        });
        els.ciAddSmart.addEventListener('click', function () {
            const spec = buildCustomSpec();
            const item = F.addCustomItem(spec);
            closeModal(els.modalCustom);
            const result = F.placeAtBestSpot(item.id);
            if (result) {
                showAdviceCard('"' + spec.name + '" — ' + (result.fits ? 'מוקם אוטומטית' : 'לא נמצא מקום'), result.reasons.map(function (t) {
                    return { severity: result.fits ? 'good' : 'issue', text: t };
                }));
            }
        });
    }

    // ---- Advisor modal ----
    function wireAdvisorModal() {
        els.btnAdvisor.addEventListener('click', function () {
            const findings = A.analyzeRoom();
            findings.sort(function (a, b) { return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]; });
            els.advisorList.innerHTML = findings.map(function (f, i) {
                return '<li data-severity="' + f.severity + '" data-index="' + i + '"><span class="rd-advisor-icon">' + SEVERITY_ICON[f.severity] + '</span><span>' + escapeHtml(f.text) + '</span></li>';
            }).join('');
            els.advisorList.querySelectorAll('li').forEach(function (li, i) {
                li.addEventListener('click', function () {
                    const f = findings[i];
                    if (f.itemId) {
                        S.select(f.itemId);
                        closeModal(els.modalAdvisor);
                    }
                });
            });
            openModal(els.modalAdvisor);
        });
        els.advisorClose.addEventListener('click', function () { closeModal(els.modalAdvisor); });
    }

    function wireToolbar() {
        els.btnNew.addEventListener('click', function () {
            if (confirm('פרויקט חדש יאפס את החדר הנוכחי (ניתן עדיין לבטל עם Ctrl+Z רק עד השמירה הבאה). להמשיך?')) {
                S.reset();
                refocusCamera();
                showToast('פרויקט חדש נוצר');
            }
        });

        els.btnSave.addEventListener('click', function () {
            if (S.get().meta.id) {
                ST.saveCurrent();
                showToast('נשמר');
            } else {
                els.saveAsName.value = S.get().meta.name;
                openModal(els.modalSaveAs);
            }
        });

        els.btnSaveAs.addEventListener('click', function () {
            els.saveAsName.value = S.get().meta.name;
            openModal(els.modalSaveAs);
            els.saveAsName.focus();
        });
        els.saveAsCancel.addEventListener('click', function () { closeModal(els.modalSaveAs); });
        els.saveAsConfirm.addEventListener('click', function () {
            const name = els.saveAsName.value.trim() || 'חדר ללא שם';
            ST.saveAs(name);
            refreshRoomFields();
            closeModal(els.modalSaveAs);
            showToast('הפרויקט נשמר בשם "' + name + '"');
        });

        els.btnLoad.addEventListener('click', function () { renderLoadList(); openModal(els.modalLoad); });
        els.loadCancel.addEventListener('click', function () { closeModal(els.modalLoad); });

        els.btnUndo.addEventListener('click', function () { S.undo(); });
        els.btnRedo.addEventListener('click', function () { S.redo(); });

        els.btnExportJson.addEventListener('click', function () { ST.exportJSON(); showToast('הקובץ יוצא'); });
        els.btnImportJson.addEventListener('click', function () { els.fileImport.click(); });
        els.fileImport.addEventListener('change', function () {
            const file = els.fileImport.files[0];
            if (!file) return;
            ST.importJSON(file, function (ok) {
                if (ok) refocusCamera();
                showToast(ok ? 'הפרויקט יובא בהצלחה' : 'ייבוא נכשל - קובץ לא תקין');
                els.fileImport.value = '';
            });
        });

        els.btnExportPng.addEventListener('click', function () {
            ST.exportPNG(RD.Scene.get().renderer);
            showToast('צילום מסך נשמר');
        });

        els.adviceClose.addEventListener('click', function () { els.adviceCard.hidden = true; });

        els.btnWalk.addEventListener('click', function () { RD.FirstPerson.toggle(); });
    }

    function wireKeyboard() {
        window.addEventListener('keydown', function (evt) {
            if (RD.FirstPerson && RD.FirstPerson.isActive()) return;
            const tag = (evt.target && evt.target.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

            const ctrl = evt.ctrlKey || evt.metaKey;
            if (ctrl && evt.key.toLowerCase() === 'z' && !evt.shiftKey) { evt.preventDefault(); S.undo(); return; }
            if (ctrl && (evt.key.toLowerCase() === 'y' || (evt.key.toLowerCase() === 'z' && evt.shiftKey))) { evt.preventDefault(); S.redo(); return; }
            if (ctrl && evt.key.toLowerCase() === 'd') { evt.preventDefault(); F.duplicateSelected(); return; }
            if (evt.key === 'Delete' || evt.key === 'Backspace') {
                if (S.get().selectedId) { evt.preventDefault(); F.deleteSelected(); }
                return;
            }
            if (evt.key.toLowerCase() === 'q') { F.rotateSelected(-15); return; }
            if (evt.key.toLowerCase() === 'e') { F.rotateSelected(15); return; }
            if (evt.key === 'Escape') { S.select(null); return; }
            const step = 0.1;
            if (evt.key === 'ArrowUp') { evt.preventDefault(); F.nudgeSelected(0, -step); return; }
            if (evt.key === 'ArrowDown') { evt.preventDefault(); F.nudgeSelected(0, step); return; }
            if (evt.key === 'ArrowLeft') { evt.preventDefault(); F.nudgeSelected(-step, 0); return; }
            if (evt.key === 'ArrowRight') { evt.preventDefault(); F.nudgeSelected(step, 0); return; }
        });
    }

    function subscribeState() {
        S.on('state:replaced', function () { refreshAll(); });
        S.on('room:resized', refreshAll);
        S.on('room:styled', refreshAll);
        S.on('lighting:changed', refreshAll);
        S.on('item:added', refreshAll);
        S.on('item:updated', refreshAll);
        S.on('item:deleted', refreshAll);
        S.on('selection:changed', function () { refreshPropsPanel(); });
    }

    function init() {
        cacheEls();
        renderCatalog();
        renderTemplates();
        wireRoomControls();
        wirePropsPanel();
        wireCustomItemModal();
        wireAdvisorModal();
        wireToolbar();
        wireKeyboard();
        subscribeState();
        refreshAll();
    }

    return { init: init, showToast: showToast, reportQuickCheck: reportQuickCheck };
})();
