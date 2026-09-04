import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { ProgressBar } from '../components/ui/ProgressBar'
import { TextInput } from '../components/ui/Select'
import { Switch } from '../components/ui/Switch'
import { ONBOARDING_CHORE_TEMPLATES } from '../lib/seed'
import { generateDailyPlan, totalPlanMinutes, totalPlanXP } from '../lib/ai'

const AVATAR_OPTIONS = ['🧑', '👩', '👨', '👦', '👧', '🧔', '👵', '👴']
const COLOR_OPTIONS = ['#7c5cff', '#ff6bd6', '#2f8fef', '#ff9f0a', '#33c17a', '#f0403f']

interface MemberDraft {
  name: string
  avatarEmoji: string
  color: string
}

const STEP_TITLES = ['Welcome', 'Your name', 'Your family', 'Add members', 'Choose chores', 'Rewards', 'Reminders', "You're ready"]

export default function Onboarding() {
  const finishOnboardingSetup = useStore((s) => s.finishOnboardingSetup)
  const chores = useStore((s) => s.chores)
  const [step, setStep] = useState(0)

  const [selfName, setSelfName] = useState('')
  const [selfAvatar, setSelfAvatar] = useState(AVATAR_OPTIONS[0])
  const [selfColor, setSelfColor] = useState(COLOR_OPTIONS[0])
  const [familyName, setFamilyName] = useState('')
  const [members, setMembers] = useState<MemberDraft[]>([])
  const [choreIds, setChoreIds] = useState<string[]>(ONBOARDING_CHORE_TEMPLATES.slice(0, 5).map((t) => t.id))
  const [requireApproval, setRequireApproval] = useState(true)
  const [reminders, setReminders] = useState({ choreReminders: true, overdueAlerts: true, streakNudges: true })
  const [finished, setFinished] = useState(false)

  const canNext = useMemo(() => {
    if (step === 1) return selfName.trim().length > 0
    if (step === 2) return familyName.trim().length > 0
    return true
  }, [step, selfName, familyName])

  const goNext = () => {
    if (step === STEP_TITLES.length - 2) {
      finishOnboardingSetup({
        familyName: familyName.trim(),
        self: { name: selfName.trim(), avatarEmoji: selfAvatar, color: selfColor },
        members,
        choreTemplateIds: choreIds,
        requireApprovalDefault: requireApproval,
        notificationPrefs: reminders,
      })
      setFinished(true)
    }
    setStep((s) => Math.min(STEP_TITLES.length - 1, s + 1))
  }

  const plan = finished ? generateDailyPlan(chores, useStore.getState().settings.currentUserId ?? '') : []

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-primary-50 via-canvas to-canvas px-4 py-8 dark:from-primary-900/10">
      <div className="w-full max-w-lg">
        {step > 0 && step < STEP_TITLES.length - 1 && (
          <div className="mb-6">
            <ProgressBar value={(step / (STEP_TITLES.length - 1)) * 100} height={6} />
            <p className="mt-2 text-center text-xs font-bold uppercase tracking-wide text-ink-faint">
              Step {step} of {STEP_TITLES.length - 2}
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22 }}
            className="rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-lift)] sm:p-8"
          >
            {step === 0 && (
              <div className="text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-400 to-primary-600 text-4xl shadow-[var(--shadow-glow)]">🏡</div>
                <h1 className="font-display text-2xl font-extrabold text-ink">Welcome to Homebase</h1>
                <p className="mt-2 text-sm text-ink-soft">
                  The household app that makes chores feel simple, fair, and a little fun. Let's set things up in under a minute.
                </p>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="font-display text-xl font-extrabold text-ink">What should we call you?</h2>
                <p className="mt-1 text-sm text-ink-soft">This is your profile in the household.</p>
                <div className="mt-5 space-y-4">
                  <TextInput label="Your name" placeholder="e.g. Alex" value={selfName} onChange={(e) => setSelfName(e.target.value)} autoFocus />
                  <div>
                    <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Avatar</span>
                    <div className="flex flex-wrap gap-1.5">
                      {AVATAR_OPTIONS.map((a) => (
                        <button key={a} onClick={() => setSelfAvatar(a)} className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl transition ${selfAvatar === a ? 'border-primary-400 bg-primary-50' : 'border-border hover:bg-surface-2'}`}>{a}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Color</span>
                    <div className="flex gap-1.5">
                      {COLOR_OPTIONS.map((c) => (
                        <button key={c} onClick={() => setSelfColor(c)} className="h-8 w-8 rounded-full border-2" style={{ background: c, borderColor: selfColor === c ? c : 'transparent', boxShadow: selfColor === c ? `0 0 0 2px var(--color-surface), 0 0 0 4px ${c}` : 'none' }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="font-display text-xl font-extrabold text-ink">Name your household</h2>
                <p className="mt-1 text-sm text-ink-soft">Something fun, like "The Cohen House" or "Team Awesome."</p>
                <div className="mt-5">
                  <TextInput label="Household name" placeholder="e.g. The Cohen House" value={familyName} onChange={(e) => setFamilyName(e.target.value)} autoFocus />
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="font-display text-xl font-extrabold text-ink">Add family members</h2>
                <p className="mt-1 text-sm text-ink-soft">You can always add more later. Skip if it's just you for now.</p>
                <div className="mt-5 space-y-2.5">
                  {members.map((m, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-xl border border-border p-2.5">
                      <Avatar emoji={m.avatarEmoji} color={m.color} size={32} />
                      <span className="flex-1 text-sm font-semibold text-ink">{m.name || 'Unnamed'}</span>
                      <button onClick={() => setMembers((prev) => prev.filter((_, idx) => idx !== i))} className="rounded-lg p-1.5 text-ink-faint hover:bg-danger-100 hover:text-danger-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <AddMemberRow onAdd={(m) => setMembers((prev) => [...prev, m])} />
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="font-display text-xl font-extrabold text-ink">Choose your starting chores</h2>
                <p className="mt-1 text-sm text-ink-soft">We'll set these up for you — tweak anytime.</p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {ONBOARDING_CHORE_TEMPLATES.map((t) => {
                    const active = choreIds.includes(t.id)
                    return (
                      <button
                        key={t.id}
                        onClick={() => setChoreIds((prev) => (active ? prev.filter((id) => id !== t.id) : [...prev, t.id]))}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-sm font-semibold transition ${active ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200' : 'border-border text-ink-soft hover:bg-surface-2'}`}
                      >
                        <span className="text-lg">{t.emoji}</span>
                        <span className="flex-1">{t.title}</span>
                        {active && <Check size={14} />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <h2 className="font-display text-xl font-extrabold text-ink">Set up your reward system</h2>
                <p className="mt-1 text-sm text-ink-soft">Points earned from chores can be redeemed in the shop.</p>
                <div className="mt-5 rounded-2xl border border-border p-4">
                  <Switch checked={requireApproval} onChange={setRequireApproval} label="Require approval for redemptions" description="A parent/admin confirms before rewards are given" />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-ink-soft">
                  <div className="rounded-xl bg-surface-2 py-2.5">🎮 Gaming time</div>
                  <div className="rounded-xl bg-surface-2 py-2.5">🍕 Choose dinner</div>
                  <div className="rounded-xl bg-surface-2 py-2.5">🎬 Movie pick</div>
                </div>
              </div>
            )}

            {step === 6 && (
              <div>
                <h2 className="font-display text-xl font-extrabold text-ink">Reminder preferences</h2>
                <p className="mt-1 text-sm text-ink-soft">Gentle nudges — never spammy.</p>
                <div className="mt-5 divide-y divide-border rounded-2xl border border-border px-4">
                  <Switch checked={reminders.choreReminders} onChange={(v) => setReminders((r) => ({ ...r, choreReminders: v }))} label="Chore reminders" />
                  <Switch checked={reminders.overdueAlerts} onChange={(v) => setReminders((r) => ({ ...r, overdueAlerts: v }))} label="Overdue alerts" />
                  <Switch checked={reminders.streakNudges} onChange={(v) => setReminders((r) => ({ ...r, streakNudges: v }))} label="Streak nudges" />
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="text-center">
                <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-success-100 text-4xl dark:bg-success-500/15">🎉</span>
                <h2 className="font-display text-xl font-extrabold text-ink">You're all set, {selfName || 'there'}!</h2>
                <p className="mt-1 text-sm text-ink-soft">Here's your personalized plan for today.</p>
                {plan.length > 0 ? (
                  <div className="mt-5 space-y-2 text-left">
                    {plan.map((p) => (
                      <div key={p.choreId} className="flex items-center gap-3 rounded-xl border border-border p-2.5">
                        <span className="text-lg">{p.emoji}</span>
                        <span className="flex-1 text-sm font-semibold text-ink">{p.title}</span>
                        <span className="text-xs font-bold text-ink-faint">{p.minutes} min</span>
                      </div>
                    ))}
                    <p className="pt-1 text-center text-xs font-semibold text-ink-faint">
                      {totalPlanMinutes(plan)} min total · +{totalPlanXP(plan)} XP potential
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-ink-faint">No chores due today yet — add some from My Chores whenever you're ready.</p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-5 flex items-center justify-between">
          {step > 0 && step < STEP_TITLES.length - 1 ? (
            <Button variant="ghost" icon={<ArrowLeft size={15} />} onClick={() => setStep((s) => s - 1)}>Back</Button>
          ) : (
            <span />
          )}
          {step < STEP_TITLES.length - 1 ? (
            <Button iconRight={<ArrowRight size={15} />} disabled={!canNext} onClick={goNext}>
              {step === 0 ? "Let's go" : step === STEP_TITLES.length - 2 ? 'Finish setup' : 'Continue'}
            </Button>
          ) : (
            <Button icon={<Sparkles size={15} />} className="w-full" onClick={() => useStore.getState().completeOnboarding()}>
              Enter Homebase
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function AddMemberRow({ onAdd }: { onAdd: (m: MemberDraft) => void }) {
  const [name, setName] = useState('')
  const [avatarEmoji, setAvatarEmoji] = useState('👦')
  const [colorIndex, setColorIndex] = useState(0)
  const color = COLOR_OPTIONS[colorIndex % COLOR_OPTIONS.length]

  return (
    <div className="flex items-center gap-2">
      <select value={avatarEmoji} onChange={(e) => setAvatarEmoji(e.target.value)} className="focus-ring h-9 rounded-xl border border-border bg-surface px-1.5 text-lg">
        {AVATAR_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Family member name"
        className="focus-ring h-9 flex-1 rounded-xl border border-border bg-surface px-3 text-sm"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && name.trim()) {
            onAdd({ name: name.trim(), avatarEmoji, color })
            setName('')
            setColorIndex((i) => i + 1)
          }
        }}
      />
      <Button
        variant="secondary"
        size="sm"
        icon={<Plus size={13} />}
        onClick={() => {
          if (!name.trim()) return
          onAdd({ name: name.trim(), avatarEmoji, color })
          setName('')
          setColorIndex((i) => i + 1)
        }}
      >
        Add
      </Button>
    </div>
  )
}
