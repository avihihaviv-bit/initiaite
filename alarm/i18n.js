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
            level: 'Level', timePerQuestion: 'Time per question',
            mathLevelDesc_1: 'Addition & subtraction.', mathLevelDesc_2: 'Multiplication, division & order of operations.',
            mathLevelDesc_3: 'Fractions, percentages & powers.', mathLevelDesc_4: 'Equations, parentheses & algebra.',
            mathLevelDesc_5: 'Multi-step problems combining several topics.',
            allowHints: 'Allow hints', allowHintsHint: 'A short hint button appears on each question, never the answer.',
            repeatWrongQuestion: 'Repeat the same question on a miss', repeatWrongQuestionHint: 'Off: a wrong answer swaps in a fresh question. On: you retry the same one.',
            showHint: 'Show hint',
            backupChallenge: 'Backup challenge', backupChallengeHint: "If the camera can't verify this task, switch to this instead of plain manual counting.",
            backupConfigured: 'has backup', none: 'None', useBackupChallenge: 'Switch to backup challenge',
            instructions: 'Instructions',

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

            useCameraVerify: 'Verify with camera', useCameraVerifyHint: 'Uses on-device pose detection — video never leaves your device.',
            situpModeFull: 'Full sit-up', situpModeCrunch: 'Crunch', activityPullups: 'pull-ups',
            calibrating: 'Getting ready', calibrateHint: 'Stand back so your full body is visible, in good light.',
            calibrateStruggling: "Having trouble finding you — check lighting and distance, or switch to manual.",
            checkBodyInFrame: 'Full body in frame', checkLighting: 'Good lighting', checkJoints: 'Joints detected',
            useManualCount: "I'll count manually instead", manualNotVerified: 'Manual mode — not verified by camera. Do the full movement honestly.',
            trackingLost: "Can't see you clearly — step back into frame.",
            cameraErrorGeneric: 'Camera verification unavailable — switching to manual counting.',
            cameraErrorPermissionDenied: 'Camera permission denied — switching to manual counting.',
            cameraErrorUnsupported: "This browser can't run camera verification — switching to manual counting.",
            cameraErrorLoadFailed: 'Could not load the pose model — switching to manual counting.',
            techniqueTip_squat: 'Feet shoulder-width apart. Lower your hips until thighs are roughly parallel to the floor, then stand back up fully.',
            techniqueTip_pushup: 'Keep your body in one straight line from shoulders to ankles. Lower your chest close to the floor, then press back up to full arm extension.',
            techniqueTip_situp_full: 'Lie back, knees bent. Curl all the way up toward your knees, then lower all the way back down.',
            techniqueTip_situp_crunch: 'Lie back, knees bent. Lift your shoulder blades clearly off the floor, then lower back down with control.',
            techniqueTip_pullup: 'Hang with arms fully extended. Pull up until your chin clears the bar, then lower back to a full hang.',

            dismissPhoto: 'Take a photo', dismissTypeSentence: 'Type a sentence', dismissTypeSequence: 'Typing sequence',
            photoChallengeTitle: 'Take a photo to continue', photoInstructionsHint: "Describe what you'd like to see photographed — shown to you when the alarm rings.",
            photoInstructionsPlaceholder: 'e.g. your toothbrush, the kitchen counter…',
            photoNoInstructions: 'No instructions set', photoRetry: "That didn't look like a real camera frame — try again.",
            photoLivenessOnly: "This only checks that a real camera frame was captured — it can't verify what's actually in the photo.",
            takePhoto: 'Take photo', photoNoBackupStuck: 'Camera unavailable and no backup challenge is set — use the emergency exit below if you are stuck.',
            sentenceToType: 'Sentence to type', sentenceToTypePlaceholder: 'Type the exact sentence to show at ring time…',
            typeSentenceNoText: 'No sentence set yet', typeSentencePrompt: 'Type this sentence exactly:',
            sequenceLength: 'Sequence length', characters: 'characters', charsetDigits: 'Digits', charsetAlnum: 'Letters & digits',
            typeSequencePrompt: 'Type this exactly:', typeSequenceRetry: "That didn't match — a new sequence was generated, type the new one.",

            // --- Gamification: XP, levels, ranks, quests, achievements, profile ---
            levelLabel: 'Level', dailyQuests: 'Daily quests', levelUp: 'Level up!',
            xpHintClose: 'Just {{n}} XP to the next level!', xpHintQuestsLeft: '{{n}} quests left to finish your daily goal.',
            xpHintProgressing: "You're progressing nicely.",
            profileTitle: 'Profile', you: 'You', totalXp: 'Total XP', viewXpHistory: 'View XP history', viewProfile: 'View profile', achievementUnlocked: 'Achievement unlocked',
            ranksTitle: 'Ranks', recentAchievements: 'Recent achievements', profileIcon: 'Profile icon', profileTitleLabel: 'Title',
            progressOverTime: 'Progress (last 14 days)', xpHistoryTitle: 'XP history', noXpYet: 'No XP earned yet — complete an alarm to start.',
            xpFilter_all: 'All', xpFilter_today: 'Today', xpFilter_week: 'This week',
            sectionGamification: 'Gamification', showXpOnHome: 'Show XP on home screen', showDailyQuests: 'Show daily quests',
            showStreakOnHome: 'Show streak on home screen', gamificationAnimations: 'Gamification animations',
            gamificationAnimationsHint: 'XP-gain and level-up animations. Separate from the general reduced-motion setting.',
            successSounds: 'Success sound on dismissal',

            rankBeginner: 'Beginner', rankRisingStar: 'Rising Star', rankEarlyRiser: 'Early Riser', rankDisciplined: 'Disciplined',
            rankElite: 'Elite', rankMaster: 'Master', rankLegend: 'Legend', rankMythic: 'Mythic',

            rarity_common: 'Common', rarity_rare: 'Rare', rarity_epic: 'Epic', rarity_legendary: 'Legendary',

            quest_wake_on_time: 'Wake up on time', quest_complete_challenge: 'Complete a wake-up challenge',
            quest_physical_exercise: 'Do a physical exercise', quest_solve_5_math: 'Solve 5 math questions',
            quest_two_alarms: 'Complete 2 different alarms', quest_three_good_days: 'Succeed 3 days this week',

            xpReasonAlarmCompleted: 'Completed an alarm on time', xpReasonPhysical: 'Completed a physical challenge',
            xpReasonMath: 'Solved a math challenge', xpReasonCombo: 'Completed several challenges in one morning',
            xpReasonStreak: 'Streak milestone', xpReasonQuest: 'Daily quest completed', xpReasonDailyQuests: "Completed all of today's quests",
            xpReasonWeeklyQuest: 'Weekly quest completed', xpReasonWeeklyGoal: 'Weekly goal reached', xpReasonAchievement: 'Achievement unlocked',

            titleWeekWarrior: 'Week Warrior', titleIronWill: 'Iron Will', titleMathWizard: 'Math Wizard', titleWakeBoss: 'Wake-Up Boss',
            titleRising: 'Rising', titleIronBody: 'Iron Body', titleRecordBreaker: 'Record Breaker',

            ach_first_challenge: 'First Challenge', ach_first_challenge_desc: 'Complete your first wake-up challenge.',
            ach_early_bird: 'Early Bird', ach_early_bird_desc: 'Wake up before 7:00 for 7 days.',
            ach_consistent: 'Consistent', ach_consistent_desc: 'Complete alarms for 14 days.',
            ach_no_snooze_5: 'Steady Riser', ach_no_snooze_5_desc: 'Wake up without any mishaps 5 times.',
            ach_sleep_master: 'Sleep Master', ach_sleep_master_desc: 'Complete your bedtime routine 10 times.',
            ach_streak_7: '7-Day Streak', ach_streak_7_desc: 'Keep a 7-day streak going.',
            ach_streak_30: '30-Day Streak', ach_streak_30_desc: 'Keep a 30-day streak going.',
            ach_math_master: 'Math Master', ach_math_master_desc: 'Solve 50 math challenge questions correctly.',
            ach_wake_up_boss: 'Wake-Up Boss', ach_wake_up_boss_desc: 'Complete 10 combo (multi-step) challenges.',
            ach_first_alarm: 'First Alarm', ach_first_alarm_desc: 'Successfully complete your very first alarm.',
            ach_mornings_5: 'Five Mornings', ach_mornings_5_desc: 'Successfully complete 5 mornings.',
            ach_mornings_100: 'Hundred Mornings', ach_mornings_100_desc: 'Successfully complete 100 mornings.',
            ach_first_physical: 'First Rep', ach_first_physical_desc: 'Complete your first physical challenge.',
            ach_reps_100: '100 Reps', ach_reps_100_desc: 'Accumulate 100 valid reps over time.',
            ach_math_10: 'Quick Mind', ach_math_10_desc: 'Solve 10 math questions correctly.',
            ach_math_level5: 'Level 5 Solver', ach_math_level5_desc: 'Solve a level-5 math question correctly.',
            ach_triple_combo: 'Triple Threat', ach_triple_combo_desc: 'Complete 3 different tasks in the same morning.',
            ach_levels_10: 'Double Digits', ach_levels_10_desc: 'Reach level 10.',
            ach_new_streak_record: 'New Record', ach_new_streak_record_desc: 'Set a new personal streak record.',
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
            level: 'רמה', timePerQuestion: 'זמן לכל שאלה',
            mathLevelDesc_1: 'חיבור וחיסור.', mathLevelDesc_2: 'כפל, חילוק וסדר פעולות.',
            mathLevelDesc_3: 'שברים, אחוזים וחזקות.', mathLevelDesc_4: 'משוואות, סוגריים ואלגברה.',
            mathLevelDesc_5: 'בעיות רב-שלביות המשלבות כמה נושאים.',
            allowHints: 'אפשר רמזים', allowHintsHint: 'כפתור רמז קצר יופיע בכל שאלה — לא התשובה עצמה.',
            repeatWrongQuestion: 'חזור על אותה שאלה בטעות', repeatWrongQuestionHint: 'כבוי: תשובה שגויה מחליפה לשאלה חדשה. פעיל: תנסה שוב את אותה שאלה.',
            showHint: 'הצג רמז',
            backupChallenge: 'אתגר גיבוי', backupChallengeHint: 'אם המצלמה לא מצליחה לאמת את המשימה, עבור/י לאתגר הזה במקום ספירה ידנית בלבד.',
            backupConfigured: 'עם גיבוי', none: 'ללא', useBackupChallenge: 'עבור/י לאתגר הגיבוי',
            instructions: 'הוראות',

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

            useCameraVerify: 'אמת באמצעות מצלמה', useCameraVerifyHint: 'שימוש בזיהוי תנוחה מקומי במכשיר — הווידאו לא יוצא מהמכשיר שלך.',
            situpModeFull: 'כפיפת בטן מלאה', situpModeCrunch: 'Crunch', activityPullups: 'מתח',
            calibrating: 'מתכוננים', calibrateHint: 'התרחק/י כך שכל הגוף נראה, באזור עם תאורה טובה.',
            calibrateStruggling: 'קשה לזהות אותך — בדוק/י תאורה ומרחק, או עבור/י למצב ידני.',
            checkBodyInFrame: 'כל הגוף בפריים', checkLighting: 'תאורה טובה', checkJoints: 'מפרקים מזוהים',
            useManualCount: 'אני אספור ידנית', manualNotVerified: 'מצב ידני — לא מאומת במצלמה. בצע/י את התנועה המלאה בכנות.',
            trackingLost: 'לא רואים אותך בבירור — חזור/י לתוך הפריים.',
            cameraErrorGeneric: 'אימות מצלמה אינו זמין — עובר/ים לספירה ידנית.',
            cameraErrorPermissionDenied: 'הרשאת מצלמה נדחתה — עובר/ים לספירה ידנית.',
            cameraErrorUnsupported: 'הדפדפן הזה לא תומך באימות מצלמה — עובר/ים לספירה ידנית.',
            cameraErrorLoadFailed: 'לא ניתן לטעון את מודל הזיהוי — עובר/ים לספירה ידנית.',
            techniqueTip_squat: 'רגליים ברוחב הכתפיים. רד/י עד שהירכיים מקבילות בערך לרצפה, ואז קום/י בחזרה במלואך.',
            techniqueTip_pushup: 'שמור/י על קו ישר מהכתפיים עד הקרסוליים לאורך כל התרגיל. רד/י עד שהחזה קרוב לרצפה, ואז דחוף/י בחזרה ליישור ידיים מלא.',
            techniqueTip_situp_full: 'שכב/י על הגב, ברכיים כפופות. התכופף/י כל הדרך לכיוון הברכיים, ואז רד/י בחזרה במלואך.',
            techniqueTip_situp_crunch: 'שכב/י על הגב, ברכיים כפופות. הרם/י את השכמות בבירור מהרצפה, ואז רד/י בשליטה.',
            techniqueTip_pullup: 'תלה/י בידיים ישרות לגמרי. משוך/י למעלה עד שהסנטר עובר את המוט, ואז רד/י בחזרה לתלייה מלאה.',

            dismissPhoto: 'צילום תמונה', dismissTypeSentence: 'הקלדת משפט', dismissTypeSequence: 'רצף הקלדה',
            photoChallengeTitle: 'צלם/י תמונה כדי להמשיך', photoInstructionsHint: 'תאר/י מה תרצה/י לראות מצולם — יוצג לך כשהשעון יצלצל.',
            photoInstructionsPlaceholder: 'לדוגמה: מברשת השיניים שלך, משטח המטבח…',
            photoNoInstructions: 'לא הוגדרו הוראות', photoRetry: 'זה לא נראה כמו פריים אמיתי ממצלמה — נסה/י שוב.',
            photoLivenessOnly: 'הבדיקה מוודאת רק שצולם פריים אמיתי מהמצלמה — היא אינה יכולה לאמת מה בפועל מופיע בתמונה.',
            takePhoto: 'צלם/י תמונה', photoNoBackupStuck: 'המצלמה אינה זמינה ולא הוגדר אתגר גיבוי — השתמש/י ביציאת החירום למטה אם נתקעת.',
            sentenceToType: 'משפט להקלדה', sentenceToTypePlaceholder: 'הקלד/י את המשפט המדויק שיוצג בזמן הצלצול…',
            typeSentenceNoText: 'עדיין לא הוגדר משפט', typeSentencePrompt: 'הקלד/י את המשפט הזה במדויק:',
            sequenceLength: 'אורך הרצף', characters: 'תווים', charsetDigits: 'ספרות', charsetAlnum: 'אותיות וספרות',
            typeSequencePrompt: 'הקלד/י בדיוק:', typeSequenceRetry: 'זה לא תאם — נוצר רצף חדש, הקלד/י את החדש.',

            // --- גיימיפיקציה: XP, רמות, דרגות, משימות, הישגים, פרופיל ---
            levelLabel: 'רמה', dailyQuests: 'משימות יומיות', levelUp: 'עלית רמה!',
            xpHintClose: 'עוד {{n}} XP בלבד לרמה הבאה!', xpHintQuestsLeft: 'נותרו {{n}} משימות להשלמת היעד היומי.',
            xpHintProgressing: 'אתה מתקדם יפה.',
            profileTitle: 'פרופיל', you: 'את/ה', totalXp: 'XP כולל', viewXpHistory: 'הצג היסטוריית XP', viewProfile: 'הצג פרופיל', achievementUnlocked: 'הישג נפתח',
            ranksTitle: 'דרגות', recentAchievements: 'הישגים אחרונים', profileIcon: 'סמל פרופיל', profileTitleLabel: 'כותרת',
            progressOverTime: 'התקדמות (14 הימים האחרונים)', xpHistoryTitle: 'היסטוריית XP', noXpYet: 'עדיין לא נצבר XP — השלם/י שעון כדי להתחיל.',
            xpFilter_all: 'הכול', xpFilter_today: 'היום', xpFilter_week: 'השבוע',
            sectionGamification: 'גיימיפיקציה', showXpOnHome: 'הצג XP במסך הבית', showDailyQuests: 'הצג משימות יומיות',
            showStreakOnHome: 'הצג רצף במסך הבית', gamificationAnimations: 'אנימציות גיימיפיקציה',
            gamificationAnimationsHint: 'אנימציות קבלת XP ועליית רמה. נפרד מהגדרת הפחתת התנועה הכללית.',
            successSounds: 'צליל הצלחה בכיבוי',

            rankBeginner: 'מתחיל', rankRisingStar: 'כוכב עולה', rankEarlyRiser: 'קם מוקדם', rankDisciplined: 'ממושמע',
            rankElite: 'עילית', rankMaster: 'מאסטר', rankLegend: 'לגנדה', rankMythic: 'מיתי',

            rarity_common: 'רגיל', rarity_rare: 'נדיר', rarity_epic: 'אפי', rarity_legendary: 'לגנדרי',

            quest_wake_on_time: 'התעורר/י בזמן', quest_complete_challenge: 'השלם/י אתגר כיבוי',
            quest_physical_exercise: 'בצע/י תרגיל גופני', quest_solve_5_math: 'פתור/י 5 שאלות מתמטיקה',
            quest_two_alarms: 'השלם/י 2 שעונים שונים', quest_three_good_days: 'הצלח/י 3 ימים בשבוע הזה',

            xpReasonAlarmCompleted: 'השלמת שעון בזמן', xpReasonPhysical: 'השלמת אתגר גופני',
            xpReasonMath: 'פתרון אתגר מתמטי', xpReasonCombo: 'השלמת כמה אתגרים באותו בוקר',
            xpReasonStreak: 'אבן דרך ברצף', xpReasonQuest: 'השלמת משימה יומית', xpReasonDailyQuests: 'השלמת כל משימות היום',
            xpReasonWeeklyQuest: 'השלמת משימה שבועית', xpReasonWeeklyGoal: 'השגת יעד שבועי', xpReasonAchievement: 'פתיחת הישג',

            titleWeekWarrior: 'לוחם השבוע', titleIronWill: 'רצון של פלדה', titleMathWizard: 'קוסם המתמטיקה', titleWakeBoss: 'בוס ההתעוררות',
            titleRising: 'במגמת עלייה', titleIronBody: 'גוף של פלדה', titleRecordBreaker: 'שובר שיאים',

            ach_first_challenge: 'האתגר הראשון', ach_first_challenge_desc: 'השלם/י את אתגר הבוקר הראשון שלך.',
            ach_early_bird: 'ציפור מוקדמת', ach_early_bird_desc: 'התעורר/י לפני 7:00 במשך 7 ימים.',
            ach_consistent: 'עקבי/ת', ach_consistent_desc: 'השלם/י שעונים במשך 14 ימים.',
            ach_no_snooze_5: 'קמה יציבה', ach_no_snooze_5_desc: 'התעורר/י בלי תקלות 5 פעמים.',
            ach_sleep_master: 'אמן/ית השינה', ach_sleep_master_desc: 'השלם/י את שגרת השינה שלך 10 פעמים.',
            ach_streak_7: 'רצף 7 ימים', ach_streak_7_desc: 'שמור/י על רצף של 7 ימים.',
            ach_streak_30: 'רצף 30 ימים', ach_streak_30_desc: 'שמור/י על רצף של 30 ימים.',
            ach_math_master: 'אמן/ית המתמטיקה', ach_math_master_desc: 'פתור/י 50 שאלות מתמטיקה נכון.',
            ach_wake_up_boss: 'בוס ההתעוררות', ach_wake_up_boss_desc: 'השלם/י 10 אתגרים משולבים (כמה משימות).',
            ach_first_alarm: 'השעון הראשון', ach_first_alarm_desc: 'השלם/י בהצלחה את השעון הראשון שלך.',
            ach_mornings_5: 'חמישה בקרים', ach_mornings_5_desc: 'השלם/י בהצלחה 5 בקרים.',
            ach_mornings_100: 'מאה בקרים', ach_mornings_100_desc: 'השלם/י בהצלחה 100 בקרים.',
            ach_first_physical: 'החזרה הראשונה', ach_first_physical_desc: 'השלם/י את אתגר הכושר הראשון שלך.',
            ach_reps_100: '100 חזרות', ach_reps_100_desc: 'צבור/י 100 חזרות תקינות במהלך הזמן.',
            ach_math_10: 'חשיבה מהירה', ach_math_10_desc: 'פתור/י 10 שאלות מתמטיקה נכון.',
            ach_math_level5: 'פותר/ת רמה 5', ach_math_level5_desc: 'פתור/י נכון שאלה ברמה 5.',
            ach_triple_combo: 'שילוש מנצח', ach_triple_combo_desc: 'השלם/י 3 משימות שונות באותו בוקר.',
            ach_levels_10: 'שתי ספרות', ach_levels_10_desc: 'הגיע/י לרמה 10.',
            ach_new_streak_record: 'שיא חדש', ach_new_streak_record_desc: 'שבור/י שיא רצף אישי חדש.',
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
