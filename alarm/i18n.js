/*
 * EN/HE localization. Hebrew flips the whole app to RTL (dir="rtl" on
 * <html>/<body>) — layout uses logical CSS properties so it mirrors
 * correctly rather than just having translated text glued onto an LTR frame.
 */
(function (root) {
    'use strict';

    const STR = {
        en: {
            appName: 'Wake',
            navHome: 'Home', navAlarms: 'Alarms', navSleep: 'Sleep', navStats: 'Statistics',
            navRoutines: 'Routines', navSettings: 'Settings', navCalendar: 'Calendar',

            greetingMorning: 'Good morning', greetingAfternoon: 'Good afternoon',
            greetingEvening: 'Good evening', greetingNight: 'Still up',
            nextAlarm: 'Next alarm', noAlarmSet: 'No alarm set', createAlarm: 'Create alarm',
            quickAdd: '+ Create alarm', quickSleepMode: 'Sleep mode',
            fromNow: 'from now', today: 'Today', tomorrow: 'Tomorrow',
            streakDays: '{{n}}-day streak', morningProgress: "Morning progress",
            smartRecommendation: 'Suggestion',

            timeLabel: 'Time', repeat: 'Repeat', labelAlarm: 'Label', sound: 'Sound',
            volume: 'Volume', vibration: 'Vibration', gradualVolume: 'Gradual volume',
            snooze: 'Snooze', challenge: 'Challenge', save: 'Save', cancel: 'Cancel',
            delete: 'Delete', edit: 'Edit', done: 'Done', add: 'Add', close: 'Close',
            everyday: 'Every day', weekdays: 'Weekdays', weekends: 'Weekends',
            once: 'Once', custom: 'Custom',
            sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat',
            plus5: '+5m', plus10: '+10m', plus15: '+15m',
            noAlarms: 'No alarms yet', createFirstAlarm: 'Create your first alarm to get started.',
            enabled: 'On', disabled: 'Off', alarm: 'Alarm',

            howDismiss: 'How should we wake you?', dismissNormal: 'Simple tap',
            dismissMath: 'Math', dismissSport: 'Sport', dismissSitups: 'Sit-ups',
            dismissMusic: 'Music pick', dismissMemory: 'Memory', dismissQr: 'Scan QR',
            dismissSwipe: 'Swipe', noChallenge: 'No challenge', addStep: 'Add step',
            challengeBuilder: 'Build your challenge', difficulty: 'Difficulty',
            easy: 'Easy', medium: 'Medium', hard: 'Hard', extreme: 'Extreme',
            questionsCount: 'Questions', reps: 'Reps', maxMistakes: 'Mistakes allowed',
            presets: 'Presets', presetGentle: 'Gentle Wake', presetFitness: 'Fitness Wake',
            presetBrain: 'Brain Wake', presetHardcore: 'Hardcore', presetUltimate: 'Ultimate',

            smartAlarm: 'Smart alarm window', smartAlarmDesc:
                'Rings gently starting a few minutes before your target time, at rising volume — this is not based on measured sleep stages, just a time-based ramp.',
            sleepModeTitle: 'Sleep mode', wakeUpAt: 'I want to wake up at',
            recommendedBedtime: 'Recommended bedtime', sleepTarget: 'Target sleep',
            sleepDisclaimer: 'Sleep needs vary by age and individual — these are general guidelines (90-minute sleep cycles), not a personal measurement.',
            startSleepMode: 'Start sleep mode', timeUntilBed: 'until bedtime',

            bedtimeRoutine: 'Bedtime routine', morningRoutine: 'Morning routine',
            addRoutineStep: 'Add step', stepName: 'Step name', stepDuration: 'Duration (min)',
            startRoutine: 'Start', skip: 'Skip', complete: 'Complete', routineComplete: 'Routine complete',

            soundsCalm: 'Calm', soundsNature: 'Nature', soundsElectronic: 'Electronic',
            soundsClassic: 'Classic', soundsLoud: 'Loud', soundsMinimal: 'Minimal',
            soundsMotivational: 'Motivational', soundsCustom: 'Your uploads',
            preview: 'Preview', favorites: 'Favorites', recentlyUsed: 'Recently used',
            uploadSound: 'Upload a song', uploadSoundHint: 'MP3, M4A or WAV, up to 15MB — stays only on this device.',
            fileTooLarge: 'That file is too large (max 15MB).', chooseAudioFile: 'Please choose an audio file.',
            couldNotSaveFile: 'Could not save that song on this device.',
            startPoint: 'Start point', setStartPoint: 'Set start point', setStartPointHint: 'Play the song, pause where you want the alarm to start (skip a slow intro), then set it.',
            useCurrentPosition: 'Use current position',

            statsTitle: 'Statistics', avgWakeTime: 'Average wake time', avgBedtime: 'Average bedtime',
            avgSleepDuration: 'Average sleep', successRate: 'Alarm success rate',
            snoozeCount: 'Total snoozes', missedAlarms: 'Missed alarms',
            weeklyTrend: 'This week', streak: 'Streak', bestStreak: 'Best streak',
            noStatsYet: 'No data yet — your stats will appear here after your first alarm.',

            achievements: 'Achievements', challengeHistory: 'Challenge history',

            aiCoach: 'Sleep coach', aiCoachDesc: 'Insights based only on the data stored on this device — not medical advice.',

            calendarTitle: 'Calendar',

            settingsTitle: 'Settings', sectionAlarm: 'Alarm', sectionSleep: 'Sleep',
            sectionAppearance: 'Appearance', sectionNotifications: 'Notifications',
            sectionPrivacy: 'Privacy', sectionGeneral: 'General',
            defaultSnooze: 'Default snooze', defaultSoundLabel: 'Default sound',
            defaultVibrationLabel: 'Default vibration', theme: 'Theme', system: 'System',
            light: 'Light', dark: 'Dark', accentColor: 'Accent color', reducedMotion: 'Reduced motion',
            language: 'Language', timeFormat: 'Time format', weekStartsOn: 'Week starts on',
            haptics: 'Haptics', exportData: 'Export my data', deleteData: 'Delete my data',
            alarmReminders: 'Alarm reminders', morningSummary: 'Morning summary',
            deleteDataConfirm: 'This permanently deletes every alarm, routine and stat stored on this device. This cannot be undone.',
            privacyExplainer: 'Everything you see lives only in this browser (localStorage) — nothing is sent to a server. Notifications and the camera (for QR challenges) are only used if you grant permission, and only for the feature you enabled.',
            yourName: 'Your name',

            ringWakeUp: 'WAKE UP', snoozeFor: 'Snooze {{n}} min', dismiss: 'Dismiss',
            emergencyStop: 'Emergency stop', holdToStop: 'Hold for 3 seconds',
            completeChallenge: 'Complete the challenge to dismiss',
            youreAwake: "You're awake!", alarmDismissed: 'Alarm dismissed',

            reliabilityTitle: 'About alarm reliability',
            reliabilityBody: 'This is a web app: alarms ring reliably only while this tab stays open on this device. Browsers restrict background timers and cannot guarantee a locked or closed tab will wake your device the way a native OS alarm can. Keep this tab open and your device charging overnight, and consider a native backup alarm for anything critical.',
            permissionNeeded: 'Permission needed', fixPermissions: 'Fix permissions',
            notifPermissionDenied: 'Notifications are blocked — you’ll only see alarms while this tab is open.',

            scanQr: 'Scan QR', qrNotSupported: 'Your browser can’t scan QR codes automatically here — enter the code shown on your tag instead.',
            createQrChallenge: 'Create QR tag', testQrChallenge: 'Test scan', qrName: 'Tag name',
            qrManualCode: 'Code',

            safetyNotice: 'Only choose a physical challenge if you have safe, clear space around you. Never do this while driving or somewhere unsafe.',

            mathQuestionOf: 'Question {{cur}} of {{total}}', correct: 'Correct!', tryAgain: 'Try again',
            situpsProgress: '{{cur}} / {{total}}', tapEachRep: 'Tap after each rep',
            memoryWatch: 'Watch the sequence…', memoryRepeat: 'Repeat it',
            songWhichPlayed: 'Which sound just played?',

            morningReport: 'Morning report', wakeTime: 'Wake time', target: 'Target',
            snoozes: 'Snoozes', routineProgress: 'Routine',

            confirmDeleteAlarm: 'Delete this alarm?', unsaved: 'Unsaved changes',
            noRoutinesYet: 'No routines yet.', createRoutine: 'Create routine',
            travelMode: 'Travel mode', deviceTimezone: 'Alarm uses local device time.',
        },
        he: {
            appName: 'וייק',
            navHome: 'בית', navAlarms: 'שעונים', navSleep: 'שינה', navStats: 'סטטיסטיקה',
            navRoutines: 'שגרות', navSettings: 'הגדרות', navCalendar: 'לוח שנה',

            greetingMorning: 'בוקר טוב', greetingAfternoon: 'צהריים טובים',
            greetingEvening: 'ערב טוב', greetingNight: 'ערים בשעה מאוחרת',
            nextAlarm: 'השעון הבא', noAlarmSet: 'לא הוגדר שעון', createAlarm: 'צור שעון',
            quickAdd: '+ צור שעון', quickSleepMode: 'מצב שינה',
            fromNow: 'מעכשיו', today: 'היום', tomorrow: 'מחר',
            streakDays: 'רצף של {{n}} ימים', morningProgress: 'התקדמות הבוקר',
            smartRecommendation: 'המלצה',

            timeLabel: 'שעה', repeat: 'חזרה', labelAlarm: 'תווית', sound: 'צליל',
            volume: 'עוצמה', vibration: 'רטט', gradualVolume: 'עלייה הדרגתית',
            snooze: 'נודניק', challenge: 'אתגר', save: 'שמור', cancel: 'ביטול',
            delete: 'מחק', edit: 'ערוך', done: 'סיום', add: 'הוסף', close: 'סגור',
            everyday: 'כל יום', weekdays: 'ימי חול', weekends: 'סופ"ש',
            once: 'פעם אחת', custom: 'מותאם אישית',
            sun: 'א׳', mon: 'ב׳', tue: 'ג׳', wed: 'ד׳', thu: 'ה׳', fri: 'ו׳', sat: 'ש׳',
            plus5: '+5 ד׳', plus10: '+10 ד׳', plus15: '+15 ד׳',
            noAlarms: 'עדיין אין שעונים', createFirstAlarm: 'צור/י את השעון הראשון כדי להתחיל.',
            enabled: 'פעיל', disabled: 'כבוי', alarm: 'שעון',

            howDismiss: 'איך תרצה לכבות את השעון?', dismissNormal: 'הקשה פשוטה',
            dismissMath: 'חשבון', dismissSport: 'ספורט', dismissSitups: 'כפיפות בטן',
            dismissMusic: 'בחירת שיר', dismissMemory: 'זיכרון', dismissQr: 'סריקת QR',
            dismissSwipe: 'החלקה', noChallenge: 'ללא אתגר', addStep: 'הוסף שלב',
            challengeBuilder: 'בנה את האתגר שלך', difficulty: 'רמת קושי',
            easy: 'קל', medium: 'בינוני', hard: 'קשה', extreme: 'קיצוני',
            questionsCount: 'מספר שאלות', reps: 'חזרות', maxMistakes: 'טעויות מותרות',
            presets: 'תבניות מוכנות', presetGentle: 'התעוררות עדינה', presetFitness: 'התעוררות כושר',
            presetBrain: 'התעוררות מוח', presetHardcore: 'קשוח', presetUltimate: 'אולטימטיבי',

            smartAlarm: 'חלון שעון חכם', smartAlarmDesc:
                'מצלצל בעדינות כמה דקות לפני היעד, בעוצמה עולה — לא מבוסס על מדידת שלבי שינה אמיתית, רק על עלייה מדורגת לפי זמן.',
            sleepModeTitle: 'מצב שינה', wakeUpAt: 'אני רוצה להתעורר בשעה',
            recommendedBedtime: 'שעת שינה מומלצת', sleepTarget: 'יעד שינה',
            sleepDisclaimer: 'הצורך בשינה משתנה לפי גיל ואדם — אלו הנחיות כלליות (מחזורי שינה של 90 דקות), לא מדידה אישית.',
            startSleepMode: 'התחל מצב שינה', timeUntilBed: 'עד השינה',

            bedtimeRoutine: 'שגרת ערב', morningRoutine: 'שגרת בוקר',
            addRoutineStep: 'הוסף שלב', stepName: 'שם השלב', stepDuration: 'משך (דקות)',
            startRoutine: 'התחל', skip: 'דלג', complete: 'סיים', routineComplete: 'השגרה הושלמה',

            soundsCalm: 'רגוע', soundsNature: 'טבע', soundsElectronic: 'אלקטרוני',
            soundsClassic: 'קלאסי', soundsLoud: 'חזק', soundsMinimal: 'מינימלי',
            soundsMotivational: 'מוטיבציה', soundsCustom: 'העלאות שלך',
            preview: 'תצוגה מקדימה', favorites: 'מועדפים', recentlyUsed: 'שימוש אחרון',
            uploadSound: 'העלה שיר', uploadSoundHint: 'MP3, M4A או WAV, עד 15MB — נשאר רק במכשיר הזה.',
            fileTooLarge: 'הקובץ גדול מדי (מקסימום 15MB).', chooseAudioFile: 'נא לבחור קובץ אודיו.',
            couldNotSaveFile: 'לא ניתן היה לשמור את השיר במכשיר הזה.',
            startPoint: 'נקודת התחלה', setStartPoint: 'קבע נקודת התחלה', setStartPointHint: 'נגן את השיר, עצור במקום שבו תרצה שהשעון יתחיל (כדי לדלג על פתיחה איטית), ואז קבע אותו.',
            useCurrentPosition: 'השתמש במיקום הנוכחי',

            statsTitle: 'סטטיסטיקה', avgWakeTime: 'שעת השכמה ממוצעת', avgBedtime: 'שעת שינה ממוצעת',
            avgSleepDuration: 'ממוצע שינה', successRate: 'אחוז הצלחת שעונים',
            snoozeCount: 'סה"כ נודניקים', missedAlarms: 'שעונים שהוחמצו',
            weeklyTrend: 'השבוע', streak: 'רצף', bestStreak: 'השיא',
            noStatsYet: 'עדיין אין נתונים — הסטטיסטיקה תופיע כאן אחרי השעון הראשון.',

            achievements: 'הישגים', challengeHistory: 'היסטוריית אתגרים',

            aiCoach: 'מאמן שינה', aiCoachDesc: 'תובנות המבוססות רק על הנתונים השמורים במכשיר הזה — לא ייעוץ רפואי.',

            calendarTitle: 'לוח שנה',

            settingsTitle: 'הגדרות', sectionAlarm: 'שעון מעורר', sectionSleep: 'שינה',
            sectionAppearance: 'מראה', sectionNotifications: 'התראות',
            sectionPrivacy: 'פרטיות', sectionGeneral: 'כללי',
            defaultSnooze: 'נודניק ברירת מחדל', defaultSoundLabel: 'צליל ברירת מחדל',
            defaultVibrationLabel: 'רטט ברירת מחדל', theme: 'ערכת נושא', system: 'מערכת',
            light: 'בהיר', dark: 'כהה', accentColor: 'צבע הדגשה', reducedMotion: 'הפחתת אנימציות',
            language: 'שפה', timeFormat: 'פורמט שעה', weekStartsOn: 'תחילת השבוע',
            haptics: 'רטט משוב', exportData: 'ייצוא הנתונים שלי', deleteData: 'מחיקת הנתונים שלי',
            alarmReminders: 'תזכורות לשעון', morningSummary: 'סיכום בוקר',
            deleteDataConfirm: 'פעולה זו מוחקת לצמיתות את כל השעונים, השגרות והסטטיסטיקה במכשיר זה. לא ניתן לבטל.',
            privacyExplainer: 'כל מה שאתה רואה נשמר רק בדפדפן הזה (localStorage) — שום דבר לא נשלח לשרת. התראות והמצלמה (לאתגרי QR) נעשה בהן שימוש רק אם תאשר הרשאה, ורק עבור התכונה שהפעלת.',
            yourName: 'השם שלך',

            ringWakeUp: 'זמן להתעורר', snoozeFor: 'נודניק {{n}} ד׳', dismiss: 'כיבוי',
            emergencyStop: 'עצירת חירום', holdToStop: 'החזק 3 שניות',
            completeChallenge: 'השלם/י את האתגר כדי לכבות',
            youreAwake: 'את/ה ער/ה!', alarmDismissed: 'השעון כובה',

            reliabilityTitle: 'לגבי אמינות השעון',
            reliabilityBody: 'זוהי אפליקציית ווב: השעון מצלצל באופן אמין רק כשהלשונית פתוחה במכשיר זה. דפדפנים מגבילים טיימרים ברקע ואינם יכולים להבטיח שמכשיר נעול או לשונית סגורה יעוררו אתכם כפי שמעורר מובנה של המערכת יכול. השאירו את הלשונית פתוחה והמכשיר בטעינה בלילה, ושקלו שעון מעורר מובנה כגיבוי לדברים קריטיים.',
            permissionNeeded: 'נדרשת הרשאה', fixPermissions: 'תיקון הרשאות',
            notifPermissionDenied: 'התראות חסומות — תראו שעונים רק כשהלשונית פתוחה.',

            scanQr: 'סרוק QR', qrNotSupported: 'הדפדפן שלך לא תומך בסריקת QR אוטומטית כאן — הזן/י את הקוד המופיע על התג במקום.',
            createQrChallenge: 'צור תג QR', testQrChallenge: 'בדוק סריקה', qrName: 'שם התג',
            qrManualCode: 'קוד',

            safetyNotice: 'בחר/י אתגר פיזי רק אם יש מקום פנוי ובטוח סביבך. לעולם אל תבצע/י זאת תוך כדי נהיגה או במקום לא בטוח.',

            mathQuestionOf: 'שאלה {{cur}} מתוך {{total}}', correct: 'נכון!', tryAgain: 'נסה שוב',
            situpsProgress: '{{cur}} / {{total}}', tapEachRep: 'הקש/י אחרי כל חזרה',
            memoryWatch: 'צפה/י ברצף…', memoryRepeat: 'חזור/י עליו',
            songWhichPlayed: 'איזה צליל התנגן?',

            morningReport: 'דוח בוקר', wakeTime: 'שעת השכמה', target: 'יעד',
            snoozes: 'נודניקים', routineProgress: 'שגרה',

            confirmDeleteAlarm: 'למחוק את השעון הזה?', unsaved: 'שינויים שלא נשמרו',
            noRoutinesYet: 'עדיין אין שגרות.', createRoutine: 'צור שגרה',
            travelMode: 'מצב טיסה', deviceTimezone: 'השעון פועל לפי שעון המכשיר המקומי.',
        }
    };

    let currentLang = 'en';
    const listeners = [];

    function detectInitialLang() {
        try {
            const stored = window.AlarmStorage && window.AlarmStorage.getSettings().language;
            if (stored) return stored;
        } catch (e) { /* ignore */ }
        return (navigator.language || 'en').toLowerCase().startsWith('he') ? 'he' : 'en';
    }

    function t(key, vars) {
        let str = (STR[currentLang] && STR[currentLang][key]) || STR.en[key] || key;
        if (vars) Object.keys(vars).forEach(k => { str = str.replace(new RegExp(`{{${k}}}`, 'g'), vars[k]); });
        return str;
    }

    function isRTL(lang) { return (lang || currentLang) === 'he'; }

    function applyDirection() {
        const dir = isRTL() ? 'rtl' : 'ltr';
        document.documentElement.setAttribute('dir', dir);
        document.documentElement.setAttribute('lang', currentLang);
    }

    function setLanguage(lang) {
        if (!STR[lang]) return;
        currentLang = lang;
        applyDirection();
        listeners.forEach(fn => fn(lang));
    }

    function onChange(fn) { listeners.push(fn); }
    function getLang() { return currentLang; }

    root.I18N = { t, setLanguage, getLang, onChange, isRTL, detectInitialLang, STR };
})(typeof window !== 'undefined' ? window : this);
