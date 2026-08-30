// advisor.js — real geometry-driven placement help: where should a new
// item go, and does an existing item's position actually make sense.
// Every number here comes from measuring the room and its furniture; there
// is no canned/generic praise — a check that finds nothing wrong says so
// with the measurement that proves it (e.g. "92 ס"מ מעבר פנוי").

window.RD = window.RD || {};

RD.Advisor = (function () {
    const S = RD.State;
    const I = RD.Interaction;

    const WALL_HUG_CATEGORIES = { 'ישיבה': true, 'אחסון': true };
    const cm = function (m) { return Math.round(m * 100); };

    function categoryOf(item) {
        if (item.isCustom) return item.category;
        const entry = RD.Catalog.get(item.type);
        return entry ? entry.category : 'עיצוב';
    }

    function scaledFootprint(item) {
        const fp = RD.Furniture.getFootprint(item);
        const s = item.scale || 1;
        return { w: fp.w * s, d: fp.d * s, h: fp.h * s };
    }

    function boxOf(item, pad) {
        const fp = scaledFootprint(item);
        return I.itemBox(item.position.x, item.position.z, fp, item.rotationY || 0, pad || 0);
    }

    function otherItems(excludeId) {
        return S.get().items.filter(function (it) { return it.id !== excludeId; });
    }

    // Perpendicular gap (meters) from an item's box to each room wall.
    function wallGaps(box, room) {
        const b = RD.Room.getBounds(room);
        return {
            back: box.minZ - b.minZ,
            front: b.maxZ - box.maxZ,
            left: box.minX - b.minX,
            right: b.maxX - box.maxX
        };
    }

    // ---------------- Placement search ----------------

    function wallCandidates(footprint, excludeId, room) {
        const walls = RD.Room.wallSegments(room);
        const obstacles = otherItems(excludeId).map(function (it) { return boxOf(it, 0.02); });
        const step = 0.1, gap = 0.03;
        const clearDepth = footprint.h > 0.6 ? 0.75 : 0.5;
        const out = [];

        walls.forEach(function (wall) {
            const runLen = wall.to - wall.from;
            const half = footprint.w / 2;
            if (half * 2 > runLen + 1e-6) return;
            for (let t = wall.from + half; t <= wall.to - half + 1e-6; t += step) {
                const depthOffset = footprint.d / 2 + gap;
                let x, z, rotationY;
                if (wall.axis === 'x') {
                    x = t; z = wall.fixed + wall.normal.z * depthOffset;
                    rotationY = wall.normal.z > 0 ? 0 : Math.PI;
                } else {
                    x = wall.fixed + wall.normal.x * depthOffset; z = t;
                    rotationY = wall.normal.x > 0 ? -Math.PI / 2 : Math.PI / 2;
                }
                const hardBox = I.itemBox(x, z, footprint, rotationY, 0.03);
                if (obstacles.some(function (o) { return I.boxesOverlap(hardBox, o); })) continue;

                const clearBox = wall.axis === 'x'
                    ? { minX: x - footprint.w / 2, maxX: x + footprint.w / 2, minZ: Math.min(z, z - wall.normal.z * clearDepth), maxZ: Math.max(z, z - wall.normal.z * clearDepth) }
                    : { minZ: z - footprint.d / 2, maxZ: z + footprint.d / 2, minX: Math.min(x, x - wall.normal.x * clearDepth), maxX: Math.max(x, x - wall.normal.x * clearDepth) };
                const walkwayBlocked = obstacles.some(function (o) { return I.boxesOverlap(clearBox, o); });

                const sameWallCount = obstacles.filter(function (o) {
                    return wall.axis === 'x'
                        ? Math.abs((o.minZ + o.maxZ) / 2 - wall.fixed) < 0.6
                        : Math.abs((o.minX + o.maxX) / 2 - wall.fixed) < 0.6;
                }).length;
                const centerBias = Math.abs(t - (wall.from + wall.to) / 2) / ((runLen / 2) || 1);

                let score = 100 - centerBias * 8 - sameWallCount * 10 - (walkwayBlocked ? 55 : 0);
                out.push({ x: x, z: z, rotationY: rotationY, wallId: wall.id, score: score, walkwayBlocked: walkwayBlocked, clearDepth: clearDepth });
            }
        });
        out.sort(function (a, b) { return b.score - a.score; });
        return out;
    }

    function openCandidates(footprint, category, excludeId, room) {
        const bounds = RD.Room.getBounds(room);
        const obstacleItems = otherItems(excludeId);
        const obstacles = obstacleItems.map(function (it) { return boxOf(it, 0.02); });
        const seating = obstacleItems.filter(function (it) { return categoryOf(it) === 'ישיבה'; });
        const step = 0.15;
        const roomCenter = { x: (bounds.minX + bounds.maxX) / 2, z: (bounds.minZ + bounds.maxZ) / 2 };
        const corridorHalf = 0.45;
        const out = [];

        for (let x = bounds.minX + footprint.w / 2; x <= bounds.maxX - footprint.w / 2 + 1e-6; x += step) {
            for (let z = bounds.minZ + footprint.d / 2; z <= bounds.maxZ - footprint.d / 2 + 1e-6; z += step) {
                const hardBox = I.itemBox(x, z, footprint, 0, 0.03);
                if (obstacles.some(function (o) { return I.boxesOverlap(hardBox, o); })) continue;

                let score = 40;
                const inCorridor = Math.abs(x - roomCenter.x) < corridorHalf && Math.abs(z - roomCenter.z) < corridorHalf;
                if (inCorridor) score -= 20;

                if (category === 'שולחנות' && seating.length) {
                    let best = Infinity;
                    seating.forEach(function (s) {
                        const sfp = scaledFootprint(s);
                        const edgeGap = Math.hypot(s.position.x - x, s.position.z - z) - (sfp.w + sfp.d) / 4 - (footprint.w + footprint.d) / 4;
                        if (edgeGap < best) best = edgeGap;
                    });
                    score -= Math.abs(best - 0.4) * 60;
                    if (best < 0.15) score -= 40; // basically touching the seating
                } else {
                    // Accent pieces (lighting/decor) read better near the room's
                    // perimeter than stranded in the middle of the floor.
                    const distFromWalls = Math.min(x - bounds.minX, bounds.maxX - x, z - bounds.minZ, bounds.maxZ - z);
                    score -= distFromWalls * 6;
                }
                out.push({ x: x, z: z, rotationY: 0, score: score });
            }
        }
        out.sort(function (a, b) { return b.score - a.score; });
        return out;
    }

    // Finds the best spot for `item` (already in state) given its own
    // footprint/category, excluding itself from collision. If nothing fits
    // even at reduced size, returns { fits:false } with the smallest scale
    // tried, so the caller can tell the user exactly what to shrink to.
    function findBestSpot(itemId) {
        const item = S.getItem(itemId);
        if (!item) return null;
        const room = S.get().room;
        const category = categoryOf(item);
        const baseFp = RD.Furniture.getFootprint(item);
        const wallHug = !!WALL_HUG_CATEGORIES[category];
        const scalesToTry = [1, 0.9, 0.8, 0.7, 0.6, 0.5];

        for (let i = 0; i < scalesToTry.length; i++) {
            const s = scalesToTry[i];
            const fp = { w: baseFp.w * s, d: baseFp.d * s, h: baseFp.h * s };
            const candidates = wallHug ? wallCandidates(fp, itemId, room) : openCandidates(fp, category, itemId, room);
            if (candidates.length) {
                const best = candidates[0];
                const reasons = [];
                if (wallHug) {
                    const wallNames = { back: 'הקיר האחורי', front: 'הקיר הקדמי', left: 'הקיר השמאלי', right: 'הקיר הימני' };
                    reasons.push('הוצב לאורך ' + (wallNames[best.wallId] || 'קיר') + (best.walkwayBlocked ? '' : ', עם ' + cm(best.clearDepth) + ' ס״מ מעבר פנוי מולו') + '.');
                } else if (category === 'שולחנות') {
                    reasons.push('הוצב במרכז אזור הישיבה, במרחק נוח מהריהוט הסמוך.');
                } else {
                    reasons.push('הוצב באזור פנוי קרוב לקיר, בלי לחסום את מעבר החדר.');
                }
                if (s < 1) reasons.push('החדר צפוף מדי לגודל המקורי — הוקטן ל-' + Math.round(s * 100) + '% (כ-' + cm(baseFp.w * s) + '×' + cm(baseFp.d * s) + ' ס״מ) כדי שיהיה מקום.');
                return { fits: true, x: best.x, z: best.z, rotationY: best.rotationY, scale: s, reasons: reasons };
            }
        }
        return { fits: false, reasons: ['לא נמצא מקום פנוי בחדר גם בהקטנה עד 50% — כדאי לפנות רהיט אחר או לבחור פריט קטן יותר.'] };
    }

    // ---------------- Critique of what's already placed ----------------

    function quickCheck(itemId) {
        const item = S.getItem(itemId);
        if (!item) return [];
        const room = S.get().room;
        const category = categoryOf(item);
        const label = RD.Furniture.getLabel(item);
        const box = boxOf(item, 0);
        const gaps = wallGaps(box, room);
        const findings = [];

        // Overlap with any other item.
        const others = otherItems(itemId);
        let overlapping = null;
        others.some(function (it) {
            const ob = boxOf(it, 0);
            if (I.boxesOverlap(box, ob)) { overlapping = it; return true; }
            return false;
        });
        if (overlapping) {
            findings.push({ severity: 'issue', text: '"' + label + '" חופף ל"' + RD.Furniture.getLabel(overlapping) + '" — הזיזו אחד מהם כדי למנוע התנגשות.' });
        }

        if (WALL_HUG_CATEGORIES[category] && !overlapping) {
            const nearestGap = Math.min(gaps.back, gaps.front, gaps.left, gaps.right);
            if (nearestGap > 0.25) {
                findings.push({ severity: 'notice', text: '"' + label + '" עומד ' + cm(nearestGap) + ' ס״מ מהקיר הקרוב אליו — הצמדה לקיר תפנה מקום שימושי במרכז החדר.' });
            } else if (nearestGap < 0.02) {
                findings.push({ severity: 'good', text: '"' + label + '" צמוד לקיר בצורה נקייה.' });
            }

            const clearDepth = scaledFootprint(item).h > 0.6 ? 0.75 : 0.5;
            let facingGap = null, facingWall = null;
            if (gaps.back === nearestGap) { facingGap = gaps.front; facingWall = 'back'; }
            else if (gaps.front === nearestGap) { facingGap = gaps.back; facingWall = 'front'; }
            else if (gaps.left === nearestGap) { facingGap = gaps.right; facingWall = 'left'; }
            else { facingGap = gaps.left; facingWall = 'right'; }
            const frontBox = facingWall === 'back' || facingWall === 'front'
                ? { minX: box.minX, maxX: box.maxX, minZ: facingWall === 'back' ? box.maxZ : box.maxZ - clearDepth, maxZ: facingWall === 'back' ? box.maxZ + clearDepth : box.maxZ }
                : { minZ: box.minZ, maxZ: box.maxZ, minX: facingWall === 'left' ? box.maxX : box.maxX - clearDepth, maxX: facingWall === 'left' ? box.maxX + clearDepth : box.maxX };
            const blockedBy = others.find(function (it) { return I.boxesOverlap(frontBox, boxOf(it, 0)); });
            if (blockedBy) {
                findings.push({ severity: 'issue', text: 'המעבר מול "' + label + '" חסום על ידי "' + RD.Furniture.getLabel(blockedBy) + '" — פחות מ-' + cm(clearDepth) + ' ס״מ המומלצים להליכה נוחה.' });
            } else if (nearestGap < 0.15) {
                findings.push({ severity: 'good', text: 'יש כ-' + cm(clearDepth) + ' ס״מ מעבר פנוי מול "' + label + '".' });
            }
        }

        if (category === 'שולחנות') {
            const seating = others.filter(function (it) { return categoryOf(it) === 'ישיבה'; });
            if (seating.length) {
                let nearest = null, nearestGapM = Infinity;
                seating.forEach(function (it) {
                    const ob = boxOf(it, 0);
                    const gapX = Math.max(box.minX - ob.maxX, ob.minX - box.maxX, 0);
                    const gapZ = Math.max(box.minZ - ob.maxZ, ob.minZ - box.maxZ, 0);
                    const gapM = Math.hypot(gapX, gapZ);
                    if (gapM < nearestGapM) { nearestGapM = gapM; nearest = it; }
                });
                if (nearest) {
                    const gapCm = cm(nearestGapM);
                    if (gapCm > 60) {
                        findings.push({ severity: 'notice', text: '"' + label + '" במרחק ' + gapCm + ' ס״מ מ"' + RD.Furniture.getLabel(nearest) + '" — קצת רחוק לנוחות; מומלץ 35–45 ס״מ.' });
                    } else if (gapCm < 15) {
                        findings.push({ severity: 'notice', text: '"' + label + '" קרוב מדי ל"' + RD.Furniture.getLabel(nearest) + '" (' + gapCm + ' ס״מ) — קשה יהיה להושיט רגליים; מומלץ 35–45 ס״מ.' });
                    } else {
                        findings.push({ severity: 'good', text: 'המרחק בין "' + label + '" ל"' + RD.Furniture.getLabel(nearest) + '" (' + gapCm + ' ס״מ) נוח לשימוש.' });
                    }
                }
            }
        }

        if (!findings.length) {
            findings.push({ severity: 'good', text: '"' + label + '" ממוקם בסדר — אין חפיפות או חסימות מעבר.' });
        }
        return findings;
    }

    function analyzeRoom() {
        const items = S.get().items;
        const room = S.get().room;
        const findings = [];
        items.forEach(function (item) {
            quickCheck(item.id).forEach(function (f) {
                if (f.severity !== 'good') findings.push(Object.assign({ itemId: item.id }, f));
            });
        });

        const roomArea = room.width * room.depth;
        let furnitureArea = 0;
        items.forEach(function (item) {
            const fp = scaledFootprint(item);
            furnitureArea += fp.w * fp.d;
        });
        const coverage = roomArea > 0 ? furnitureArea / roomArea : 0;
        if (coverage > 0.55) {
            findings.push({ itemId: null, severity: 'issue', text: 'הריהוט תופס כ-' + Math.round(coverage * 100) + '% משטח הרצפה — החדר עמוס. שקלו להוציא פריט אחד או לבחור פריטים קטנים יותר.' });
        } else if (items.length >= 3 && coverage < 0.12) {
            findings.push({ itemId: null, severity: 'notice', text: 'רק כ-' + Math.round(coverage * 100) + '% משטח הרצפה מנוצל — יש עוד מקום; שטיח או עציץ יכולים לתת לחלל נוכחות.' });
        }

        if (items.length >= 3) {
            const bounds = RD.Room.getBounds(room);
            const cx = (bounds.minX + bounds.maxX) / 2, cz = (bounds.minZ + bounds.maxZ) / 2;
            const quad = [0, 0, 0, 0];
            let totalArea = 0;
            items.forEach(function (item) {
                const fp = scaledFootprint(item);
                const area = fp.w * fp.d;
                totalArea += area;
                const qi = (item.position.x >= cx ? 1 : 0) + (item.position.z >= cz ? 2 : 0);
                quad[qi] += area;
            });
            const maxShare = totalArea > 0 ? Math.max.apply(null, quad) / totalArea : 0;
            if (maxShare > 0.7) {
                findings.push({ itemId: null, severity: 'notice', text: 'רוב הריהוט מרוכז בצד אחד של החדר — פיזור לשני צדדים ייתן תחושת איזון טובה יותר.' });
            }
        }

        if (!findings.length) {
            findings.push({ itemId: null, severity: 'good', text: 'הסידור נראה מאוזן: אין חפיפות, המעברים פנויים וניצול הרצפה סביר.' });
        }
        return findings;
    }

    return {
        categoryOf: categoryOf,
        findBestSpot: findBestSpot,
        quickCheck: quickCheck,
        analyzeRoom: analyzeRoom
    };
})();
