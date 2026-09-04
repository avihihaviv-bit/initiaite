import { create } from 'zustand'
import type {
  AppNotification, AppSettings, AppState, BadgeId, ChatMessage, Chore, ChoreComment,
  ChorePhoto, CompletionRecord, NotificationSettings, Reward, RewardRedemption, Subtask, User,
} from '../types'
import { uid } from '../lib/id'
import { loadState, saveState } from '../lib/storage'
import { buildDemoState, buildRewards, DEFAULT_CATEGORIES, ONBOARDING_CHORE_TEMPLATES } from '../lib/seed'
import { todayISO } from '../lib/date'
import { levelFromXP, BADGES, suggestedPoints, suggestedXP } from '../lib/gamification'
import { suggestRebalance } from '../lib/balance'
import { answerAssistant } from '../lib/ai'
import { parseActionIntent } from '../lib/aiIntents'
import { effectiveDueDate } from '../lib/occurrence'
import { friendlyDate, WEEKDAY_LABELS_FULL } from '../lib/date'

export type CelebrationEvent =
  | { type: 'complete'; choreTitle: string; emoji: string; xp: number; points: number; streak: number }
  | { type: 'levelup'; userName: string; level: number }
  | { type: 'badge'; userName: string; badgeId: BadgeId }

interface Store extends AppState {
  celebrations: CelebrationEvent[]
  hydrated: boolean
  hydrate: () => void
  persist: () => void

  // chores
  addChore: (chore: Omit<Chore, 'id' | 'createdAt' | 'history' | 'archived' | 'comments' | 'photos'>) => string
  updateChore: (id: string, patch: Partial<Chore>) => void
  archiveChore: (id: string) => void
  restoreChore: (id: string) => void
  duplicateChore: (id: string) => void
  deleteChoreForever: (id: string) => void
  completeChore: (choreId: string, occurrenceDate?: string, durationMinutes?: number, completedByUserId?: string) => void
  undoCompletion: (choreId: string, occurrenceDate: string) => void
  skipOccurrence: (choreId: string, occurrenceDate: string) => void
  snoozeChore: (choreId: string, days: number) => void
  toggleSubtask: (choreId: string, subtaskId: string) => void
  addSubtask: (choreId: string, title: string) => void
  removeSubtask: (choreId: string, subtaskId: string) => void
  addComment: (choreId: string, text: string, authorId: string) => void
  addPhoto: (choreId: string, kind: ChorePhoto['kind'], emoji: string, note?: string) => void
  bulkComplete: (ids: string[]) => void
  bulkAssign: (ids: string[], userId: string | null) => void
  moveChoreDate: (choreId: string, newDate: string) => void

  // family
  addMember: (name: string, avatarEmoji: string, color: string, role: User['role']) => void
  updateMember: (id: string, patch: Partial<User>) => void
  removeMember: (id: string) => void
  acceptBalanceSuggestion: () => void
  activateStreakFreeze: (userId: string) => void

  // rewards
  addReward: (reward: Omit<Reward, 'id'>) => void
  updateReward: (id: string, patch: Partial<Reward>) => void
  deleteReward: (id: string) => void
  redeemReward: (rewardId: string, userId: string) => { ok: boolean; message: string }
  resolveRedemption: (redemptionId: string, approve: boolean) => void

  // categories
  addCategory: (name: string, emoji: string, color: string) => void

  // notifications
  pushNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void

  // settings
  updateSettings: (patch: Partial<AppSettings>) => void
  updateNotificationSettings: (patch: Partial<NotificationSettings>) => void
  setCurrentUser: (id: string) => void
  completeOnboarding: () => void
  resetDemoData: () => void
  finishOnboardingSetup: (payload: {
    familyName: string
    self: { name: string; avatarEmoji: string; color: string }
    members: { name: string; avatarEmoji: string; color: string }[]
    choreTemplateIds: string[]
    requireApprovalDefault: boolean
    notificationPrefs: Partial<NotificationSettings>
  }) => void

  // ai chat
  sendChatMessage: (text: string) => void
  confirmPendingAction: (messageId: string) => void
  dismissPendingAction: (messageId: string) => void

  // celebrations queue
  dismissCelebration: () => void
}

function computeStreak(chores: Chore[], userId: string): { current: number; longest: number } {
  let current = 0
  for (let d = 0; d < 400; d++) {
    const dateISO = d === 0 ? todayISO() : addDaysLocal(todayISO(), -d)
    const didAnything = chores.some((c) =>
      c.history.some((h) => h.occurrenceDate === dateISO && h.completedBy === userId)
    )
    if (didAnything) current++
    else if (d === 0) continue
    else break
  }
  return { current, longest: current }
}
function addDaysLocal(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

function checkAndAwardBadges(
  get: () => Store,
  set: (fn: (s: Store) => Partial<Store>) => void,
  userId: string
) {
  const s = get()
  const user = s.users.find((u) => u.id === userId)
  if (!user) return
  const already = new Set(s.earnedBadges.filter((b) => b.userId === userId).map((b) => b.badgeId))
  const streak = s.streaks.find((st) => st.userId === userId)
  const completions = s.chores.flatMap((c) => c.history.filter((h) => h.completedBy === userId))
  const toAward: BadgeId[] = []

  if (!already.has('fresh-start') && completions.length >= 1) toAward.push('fresh-start')
  if (!already.has('streak-7') && (streak?.current ?? 0) >= 7) toAward.push('streak-7')
  if (!already.has('streak-30') && (streak?.current ?? 0) >= 30) toAward.push('streak-30')
  if (!already.has('century') && completions.length >= 100) toAward.push('century')
  if (!already.has('home-hero') && completions.length >= 100) toAward.push('home-hero')
  const cleaningDone = s.chores
    .filter((c) => c.categoryId === 'cat-cleaning')
    .flatMap((c) => c.history.filter((h) => h.completedBy === userId)).length
  if (!already.has('cleaning-machine') && cleaningDone >= 25) toAward.push('cleaning-machine')
  const hardDone = s.chores
    .filter((c) => c.difficulty === 'hard')
    .flatMap((c) => c.history.filter((h) => h.completedBy === userId)).length
  if (!already.has('hard-worker') && hardDone >= 10) toAward.push('hard-worker')

  if (toAward.length === 0) return
  set((state) => ({
    earnedBadges: [
      ...state.earnedBadges,
      ...toAward.map((badgeId) => ({ badgeId, userId, earnedAt: new Date().toISOString() })),
    ],
    celebrations: [
      ...state.celebrations,
      ...toAward.map((badgeId) => ({ type: 'badge' as const, userName: user.name, badgeId })),
    ],
  }))
}

export const useStore = create<Store>((set, get) => ({
  ...buildDemoState(),
  celebrations: [],
  hydrated: false,

  hydrate: () => {
    const persisted = loadState<AppState>()
    if (persisted) {
      set({ ...persisted, hydrated: true })
    } else {
      set({ hydrated: true })
    }
  },
  persist: () => {
    const s = get()
    const { celebrations, hydrated, ...domain } = s
    void celebrations
    void hydrated
    saveState(domain)
  },

  addChore: (chore) => {
    const id = uid('chore')
    const newChore: Chore = {
      ...chore,
      id,
      comments: [],
      photos: [],
      history: [],
      archived: false,
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ chores: [...s.chores, newChore] }))
    get().persist()
    return id
  },

  updateChore: (id, patch) => {
    set((s) => ({ chores: s.chores.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
    get().persist()
  },

  archiveChore: (id) => {
    set((s) => ({ chores: s.chores.map((c) => (c.id === id ? { ...c, archived: true } : c)) }))
    get().persist()
  },
  restoreChore: (id) => {
    set((s) => ({ chores: s.chores.map((c) => (c.id === id ? { ...c, archived: false } : c)) }))
    get().persist()
  },
  duplicateChore: (id) => {
    const src = get().chores.find((c) => c.id === id)
    if (!src) return
    const copy: Chore = {
      ...src,
      id: uid('chore'),
      title: `${src.title} (copy)`,
      history: [],
      comments: [],
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ chores: [...s.chores, copy] }))
    get().persist()
  },
  deleteChoreForever: (id) => {
    set((s) => ({ chores: s.chores.filter((c) => c.id !== id) }))
    get().persist()
  },

  completeChore: (choreId, occurrenceDate, durationMinutes, completedByUserId) => {
    const s = get()
    const chore = s.chores.find((c) => c.id === choreId)
    if (!chore) return
    const dateISO = occurrenceDate ?? effectiveDueDate(chore)
    if (chore.history.some((h) => h.occurrenceDate === dateISO)) return

    // Who gets credit: an explicit override, else the current user if they're
    // one of the assignees (handles shared chores), else the first assignee,
    // else whoever is logged in.
    const currentUserId = s.settings.currentUserId
    const userId =
      completedByUserId ??
      (currentUserId && chore.assigneeIds.includes(currentUserId) ? currentUserId : chore.assigneeIds[0]) ??
      currentUserId ??
      s.users[0]?.id
    if (!userId) return
    const user = s.users.find((u) => u.id === userId)
    if (!user) return

    const record: CompletionRecord = {
      id: uid('rec'),
      occurrenceDate: dateISO,
      completedBy: userId,
      completedAt: new Date().toISOString(),
      xpEarned: chore.xp,
      pointsEarned: chore.points,
      durationMinutes,
      onTime: dateISO >= todayISO(),
    }

    const beforeLevel = levelFromXP(user.xp).level
    const newXP = user.xp + chore.xp
    const afterLevel = levelFromXP(newXP).level

    set((state) => ({
      chores: state.chores.map((c) => (c.id === choreId ? { ...c, history: [...c.history, record] } : c)),
      users: state.users.map((u) => (u.id === userId ? { ...u, xp: newXP, points: u.points + chore.points } : u)),
    }))

    // streak update
    const { current, longest } = computeStreak(get().chores, userId)
    set((state) => ({
      streaks: state.streaks.map((st) =>
        st.userId === userId
          ? { ...st, current, longest: Math.max(st.longest, longest), lastCompletedDate: todayISO() }
          : st
      ),
    }))

    set((state) => ({
      celebrations: [
        ...state.celebrations,
        { type: 'complete', choreTitle: chore.title, emoji: chore.emoji, xp: chore.xp, points: chore.points, streak: current },
      ],
    }))

    if (afterLevel > beforeLevel) {
      set((state) => ({
        celebrations: [...state.celebrations, { type: 'levelup', userName: user.name, level: afterLevel }],
      }))
      get().pushNotification({
        title: `🏆 Level ${afterLevel}!`,
        body: `${user.name} just leveled up to Level ${afterLevel}.`,
        kind: 'level',
      })
    }

    checkAndAwardBadges(get, set, userId)
    get().persist()
  },

  undoCompletion: (choreId, occurrenceDate) => {
    const s = get()
    const chore = s.chores.find((c) => c.id === choreId)
    if (!chore) return
    const record = chore.history.find((h) => h.occurrenceDate === occurrenceDate)
    if (!record) return
    set((state) => ({
      chores: state.chores.map((c) =>
        c.id === choreId ? { ...c, history: c.history.filter((h) => h.id !== record.id) } : c
      ),
      users: state.users.map((u) =>
        u.id === record.completedBy
          ? { ...u, xp: Math.max(0, u.xp - record.xpEarned), points: Math.max(0, u.points - record.pointsEarned) }
          : u
      ),
    }))
    get().persist()
  },

  skipOccurrence: (choreId, occurrenceDate) => {
    set((s) => ({
      chores: s.chores.map((c) =>
        c.id === choreId
          ? {
              ...c,
              recurrence: {
                ...c.recurrence,
                skippedDates: [...(c.recurrence.skippedDates ?? []), occurrenceDate],
              },
            }
          : c
      ),
    }))
    get().persist()
  },

  snoozeChore: (choreId, days) => {
    const chore = get().chores.find((c) => c.id === choreId)
    if (!chore) return
    get().moveChoreDate(choreId, addDaysLocal(chore.dueDate, days))
  },

  toggleSubtask: (choreId, subtaskId) => {
    set((s) => ({
      chores: s.chores.map((c) =>
        c.id === choreId
          ? { ...c, subtasks: c.subtasks.map((st) => (st.id === subtaskId ? { ...st, done: !st.done } : st)) }
          : c
      ),
    }))
    get().persist()
  },
  addSubtask: (choreId, title) => {
    const st: Subtask = { id: uid('st'), title, done: false }
    set((s) => ({ chores: s.chores.map((c) => (c.id === choreId ? { ...c, subtasks: [...c.subtasks, st] } : c)) }))
    get().persist()
  },
  removeSubtask: (choreId, subtaskId) => {
    set((s) => ({
      chores: s.chores.map((c) =>
        c.id === choreId ? { ...c, subtasks: c.subtasks.filter((st) => st.id !== subtaskId) } : c
      ),
    }))
    get().persist()
  },
  addComment: (choreId, text, authorId) => {
    const comment: ChoreComment = { id: uid('cmt'), authorId, text, createdAt: new Date().toISOString() }
    set((s) => ({ chores: s.chores.map((c) => (c.id === choreId ? { ...c, comments: [...c.comments, comment] } : c)) }))
    get().persist()
  },
  addPhoto: (choreId, kind, emoji, note) => {
    const photo: ChorePhoto = { id: uid('pic'), kind, emoji, note }
    set((s) => ({ chores: s.chores.map((c) => (c.id === choreId ? { ...c, photos: [...c.photos, photo] } : c)) }))
    get().persist()
  },
  bulkComplete: (ids) => {
    ids.forEach((id) => get().completeChore(id))
  },
  bulkAssign: (ids, userId) => {
    set((s) => ({
      chores: s.chores.map((c) => (ids.includes(c.id) ? { ...c, assigneeIds: userId ? [userId] : [] } : c)),
    }))
    get().persist()
  },
  moveChoreDate: (choreId, newDate) => {
    set((s) => ({ chores: s.chores.map((c) => (c.id === choreId ? { ...c, dueDate: newDate } : c)) }))
    get().persist()
  },

  addMember: (name, avatarEmoji, color, role) => {
    const user: User = { id: uid('u'), name, avatarEmoji, color, role, xp: 0, points: 0, createdAt: new Date().toISOString() }
    set((s) => ({ users: [...s.users, user], family: { ...s.family, memberIds: [...s.family.memberIds, user.id] }, streaks: [...s.streaks, { userId: user.id, current: 0, longest: 0, lastCompletedDate: null, freezeAvailable: true, freezeUsedThisMonth: false }] }))
    get().persist()
  },
  updateMember: (id, patch) => {
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }))
    get().persist()
  },
  removeMember: (id) => {
    set((s) => ({
      users: s.users.filter((u) => u.id !== id),
      family: { ...s.family, memberIds: s.family.memberIds.filter((m) => m !== id) },
      chores: s.chores.map((c) =>
        c.assigneeIds.includes(id) ? { ...c, assigneeIds: c.assigneeIds.filter((a) => a !== id) } : c
      ),
    }))
    get().persist()
  },
  acceptBalanceSuggestion: () => {
    const s = get()
    const suggestion = suggestRebalance(s.chores, s.users)
    if (!suggestion) return
    get().updateChore(suggestion.choreId, { assigneeIds: [suggestion.toUserId] })
    get().pushNotification({
      title: '⚖️ Chore rebalanced',
      body: suggestion.reasoning,
      kind: 'balance',
    })
  },

  activateStreakFreeze: (userId) => {
    set((s) => ({
      streaks: s.streaks.map((st) => (st.userId === userId ? { ...st, freezeAvailable: false, freezeUsedThisMonth: true } : st)),
    }))
    get().persist()
  },

  addReward: (reward) => {
    set((s) => ({ rewards: [...s.rewards, { ...reward, id: uid('rwd') }] }))
    get().persist()
  },
  updateReward: (id, patch) => {
    set((s) => ({ rewards: s.rewards.map((r) => (r.id === id ? { ...r, ...patch } : r)) }))
    get().persist()
  },
  deleteReward: (id) => {
    set((s) => ({ rewards: s.rewards.filter((r) => r.id !== id) }))
    get().persist()
  },
  redeemReward: (rewardId, userId) => {
    const s = get()
    const reward = s.rewards.find((r) => r.id === rewardId)
    const user = s.users.find((u) => u.id === userId)
    if (!reward || !user) return { ok: false, message: 'Not found' }
    if (user.points < reward.cost) return { ok: false, message: `Not enough points — need ${reward.cost - user.points} more.` }
    if (reward.availability === 'limited' && (reward.stock ?? 0) <= 0) return { ok: false, message: 'This reward is out of stock.' }

    const redemption: RewardRedemption = {
      id: uid('rdm'),
      rewardId,
      userId,
      status: reward.requiresApproval ? 'pending' : 'fulfilled',
      requestedAt: new Date().toISOString(),
      resolvedAt: reward.requiresApproval ? undefined : new Date().toISOString(),
    }
    set((state) => ({
      users: state.users.map((u) => (u.id === userId ? { ...u, points: u.points - reward.cost } : u)),
      redemptions: [...state.redemptions, redemption],
      rewards: state.rewards.map((r) => (r.id === rewardId && r.availability === 'limited' ? { ...r, stock: Math.max(0, (r.stock ?? 1) - 1) } : r)),
    }))
    get().pushNotification({
      title: reward.requiresApproval ? '🎁 Redemption requested' : '🎁 Reward redeemed!',
      body: `${user.name} redeemed "${reward.name}"${reward.requiresApproval ? ' — awaiting approval.' : '.'}`,
      kind: 'reward',
    })
    get().persist()
    return { ok: true, message: reward.requiresApproval ? 'Requested! Waiting for approval.' : 'Redeemed!' }
  },
  resolveRedemption: (redemptionId, approve) => {
    set((s) => ({
      redemptions: s.redemptions.map((r) =>
        r.id === redemptionId ? { ...r, status: approve ? 'approved' : 'denied', resolvedAt: new Date().toISOString() } : r
      ),
    }))
    get().persist()
  },

  addCategory: (name, emoji, color) => {
    set((s) => ({ categories: [...s.categories, { id: uid('cat'), name, emoji, color }] }))
    get().persist()
  },

  pushNotification: (n) => {
    const notif: AppNotification = { ...n, id: uid('ntf'), createdAt: new Date().toISOString(), read: false }
    set((s) => ({ notifications: [notif, ...s.notifications] }))
    get().persist()
  },
  markNotificationRead: (id) => {
    set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }))
    get().persist()
  },
  markAllNotificationsRead: () => {
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }))
    get().persist()
  },

  updateSettings: (patch) => {
    set((s) => ({ settings: { ...s.settings, ...patch } }))
    get().persist()
  },
  updateNotificationSettings: (patch) => {
    set((s) => ({ settings: { ...s.settings, notifications: { ...s.settings.notifications, ...patch } } }))
    get().persist()
  },
  setCurrentUser: (id) => {
    set((s) => ({ settings: { ...s.settings, currentUserId: id } }))
    get().persist()
  },
  completeOnboarding: () => {
    set((s) => ({ settings: { ...s.settings, onboardingComplete: true } }))
    get().persist()
  },
  resetDemoData: () => {
    set({ ...buildDemoState(), celebrations: [], hydrated: true })
    get().persist()
  },

  finishOnboardingSetup: ({ familyName, self, members, choreTemplateIds, requireApprovalDefault, notificationPrefs }) => {
    const selfUser: User = {
      id: uid('u'),
      name: self.name,
      avatarEmoji: self.avatarEmoji,
      color: self.color,
      role: 'admin',
      xp: 0,
      points: 0,
      createdAt: new Date().toISOString(),
    }
    const memberUsers: User[] = members
      .filter((m) => m.name.trim())
      .map((m) => ({
        id: uid('u'),
        name: m.name.trim(),
        avatarEmoji: m.avatarEmoji,
        color: m.color,
        role: 'member',
        xp: 0,
        points: 0,
        createdAt: new Date().toISOString(),
      }))
    const allUsers = [selfUser, ...memberUsers]

    const chosenTemplates = ONBOARDING_CHORE_TEMPLATES.filter((t) => choreTemplateIds.includes(t.id))
    const chores: Chore[] = chosenTemplates.map((t) => {
      const xp = suggestedXP(t.difficulty, t.estimatedMinutes)
      return {
        id: uid('chore'),
        title: t.title,
        description: '',
        emoji: t.emoji,
        categoryId: t.categoryId,
        assigneeIds: [selfUser.id],
        priority: 'medium',
        difficulty: t.difficulty,
        estimatedMinutes: t.estimatedMinutes,
        points: suggestedPoints(xp),
        xp,
        dueDate: todayISO(),
        recurrence: { frequency: t.frequency, startDate: todayISO(), daysOfWeek: t.frequency === 'weekly' ? [new Date().getDay()] : undefined },
        reminder: '30-before',
        subtasks: [],
        dependsOn: [],
        comments: [],
        photos: [],
        history: [],
        createdAt: new Date().toISOString(),
        archived: false,
        color: DEFAULT_CATEGORIES.find((c) => c.id === t.categoryId)?.color ?? '#7c5cff',
      }
    })

    set((s) => ({
      family: { id: uid('fam'), name: familyName || 'My Household', memberIds: allUsers.map((u) => u.id), fairnessTarget: 85 },
      users: allUsers,
      categories: DEFAULT_CATEGORIES,
      chores,
      rewards: buildRewards().map((r) => ({ ...r, requiresApproval: requireApprovalDefault })),
      redemptions: [],
      earnedBadges: [],
      streaks: allUsers.map((u) => ({ userId: u.id, current: 0, longest: 0, lastCompletedDate: null, freezeAvailable: true, freezeUsedThisMonth: false })),
      notifications: [],
      settings: {
        ...s.settings,
        notifications: { ...s.settings.notifications, ...notificationPrefs },
        // onboardingComplete stays false here — the wizard still has a final
        // "you're ready" screen to show; completeOnboarding() flips it once the
        // user dismisses that screen.
        currentUserId: selfUser.id,
      },
      chatHistory: [],
    }))
    get().persist()
  },

  sendChatMessage: (text) => {
    const userMsg: ChatMessage = { id: uid('msg'), role: 'user', text, createdAt: new Date().toISOString() }
    set((s) => ({ chatHistory: [...s.chatHistory, userMsg] }))
    const s = get()
    const intent = parseActionIntent(text, { chores: s.chores, users: s.users, categories: s.categories, currentUserId: s.settings.currentUserId })
    const reply = intent?.reply ?? answerAssistant(text, { chores: s.chores, users: s.users, currentUserId: s.settings.currentUserId })
    const botMsg: ChatMessage = {
      id: uid('msg'),
      role: 'assistant',
      text: reply,
      createdAt: new Date().toISOString(),
      pendingAction: intent?.action,
      actionLabel: intent?.actionLabel,
      actionStatus: intent?.action ? 'proposed' : undefined,
    }
    set((state) => ({ chatHistory: [...state.chatHistory, botMsg] }))
    get().persist()
  },

  confirmPendingAction: (messageId) => {
    const s = get()
    const msg = s.chatHistory.find((m) => m.id === messageId)
    const action = msg?.pendingAction
    if (!action || msg?.actionStatus !== 'proposed') return

    let confirmText = ''
    const userName = s.users.find((u) => u.id === action.userId)?.name ?? 'them'

    if (action.kind === 'assign-chores') {
      action.items.forEach((item) => {
        const xp = suggestedXP(item.difficulty, item.estimatedMinutes)
        get().addChore({
          title: item.title,
          description: '',
          emoji: item.emoji,
          categoryId: item.categoryId,
          assigneeIds: [action.userId],
          priority: 'medium',
          difficulty: item.difficulty,
          estimatedMinutes: item.estimatedMinutes,
          points: suggestedPoints(xp),
          xp,
          dueDate: action.date,
          recurrence: { frequency: 'none', startDate: action.date },
          reminder: 'none',
          subtasks: [],
          dependsOn: [],
          color: s.categories.find((c) => c.id === item.categoryId)?.color ?? '#7c5cff',
        })
      })
      confirmText = `Done! Added ${action.items.length} chore${action.items.length === 1 ? '' : 's'} for ${userName} on ${friendlyDate(action.date)}. 🎉`
    } else if (action.kind === 'move-chores') {
      action.choreIds.forEach((id) => get().moveChoreDate(id, action.toDate))
      confirmText = `Moved ${action.choreIds.length} chore${action.choreIds.length === 1 ? '' : 's'} for ${userName} to ${friendlyDate(action.toDate)}. ✅`
    } else if (action.kind === 'create-recurring') {
      const xp = suggestedXP('medium', 20)
      get().addChore({
        title: action.title,
        description: '',
        emoji: action.emoji,
        categoryId: action.categoryId,
        assigneeIds: [action.userId],
        priority: 'medium',
        difficulty: 'medium',
        estimatedMinutes: 20,
        points: suggestedPoints(xp),
        xp,
        dueDate: action.startDate,
        dueTime: action.time,
        recurrence: { frequency: 'weekly', daysOfWeek: action.daysOfWeek, startDate: action.startDate },
        reminder: action.time ? '30-before' : 'none',
        subtasks: [],
        dependsOn: [],
        color: s.categories.find((c) => c.id === action.categoryId)?.color ?? '#7c5cff',
      })
      confirmText = `Done! "${action.title}" is now scheduled for ${userName} every ${WEEKDAY_LABELS_FULL[action.daysOfWeek[0]]}. 🎉`
    }

    const botMsg: ChatMessage = { id: uid('msg'), role: 'assistant', text: confirmText, createdAt: new Date().toISOString() }
    set((state) => ({
      chatHistory: [...state.chatHistory.map((m) => (m.id === messageId ? { ...m, actionStatus: 'applied' as const } : m)), botMsg],
    }))
    get().persist()
  },

  dismissPendingAction: (messageId) => {
    const botMsg: ChatMessage = { id: uid('msg'), role: 'assistant', text: `No problem — I won't make that change.`, createdAt: new Date().toISOString() }
    set((state) => ({
      chatHistory: [...state.chatHistory.map((m) => (m.id === messageId ? { ...m, actionStatus: 'dismissed' as const } : m)), botMsg],
    }))
    get().persist()
  },

  dismissCelebration: () => {
    set((s) => ({ celebrations: s.celebrations.slice(1) }))
  },
}))

export const BADGE_DEFS = BADGES
