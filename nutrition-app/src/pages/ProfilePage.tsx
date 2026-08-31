import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, LogOut, ShieldAlert, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { healthService } from '@/services/HealthService';
import { HealthConnectModal } from '@/components/health/HealthConnectModal';
import { useTargets } from '@/hooks/useTargets';
import { useDiaryForDate } from '@/hooks/useDiary';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { computeAchievements } from '@/utils/achievements';
import { kgToLb, lbToKg, cmToFtIn, ftInToCm } from '@/utils/units';
import { todayISO } from '@/utils/date';
import type { ActivityLevel, Goal, TrainingType, UserProfile } from '@/types';

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Barely active',
  light: 'Lightly active',
  moderate: 'Moderately active',
  high: 'Very active',
  very_high: 'Extremely active',
};

const GOAL_LABELS: Record<Goal, string> = {
  maintain: 'Maintain weight',
  lose: 'Lose weight',
  gain: 'Gain weight',
  recomposition: 'Build muscle / Recomp',
  performance: 'Sports performance',
};

const TRAINING_LABELS: Record<TrainingType, string> = {
  gym: '🏋️ Gym',
  football: '⚽ Football',
  running: '🏃 Running',
  swimming: '🏊 Swimming',
  cycling: '🚴 Cycling',
  walking: '🚶 Walking',
  other: '🤸 Other',
};

export function ProfilePage() {
  const navigate = useNavigate();
  const profile = useAppStore((s) => s.profile) as UserProfile;
  const updateProfile = useAppStore((s) => s.updateProfile);
  const resetAllData = useAppStore((s) => s.resetAllData);
  const units = useAppStore((s) => s.units);
  const setUnits = useAppStore((s) => s.setUnits);
  const trackWeight = useAppStore((s) => s.trackWeight);
  const setTrackWeight = useAppStore((s) => s.setTrackWeight);
  const weightLog = useAppStore((s) => s.weightLog);
  const addWeightLog = useAppStore((s) => s.addWeightLog);
  const diaryEntries = useAppStore((s) => s.diaryEntries);
  const { targets, bmr, tdee, minorGuardrail } = useTargets();
  const todayDiary = useDiaryForDate(todayISO());

  const [form, setForm] = useState(profile);
  useEffect(() => setForm(profile), [profile]);

  const [todayWeight, setTodayWeight] = useState(weightLog.find((w) => w.date === todayISO())?.weightKg ?? profile.weightKg);
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const healthConnected = healthService.getAuthStatus() === 'connected';

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleTraining(t: TrainingType) {
    setForm((f) => ({
      ...f,
      trainingTypes: f.trainingTypes.includes(t) ? f.trainingTypes.filter((x) => x !== t) : [...f.trainingTypes, t],
    }));
  }

  function save() {
    updateProfile(form);
  }

  function handleClearData() {
    if (window.confirm('This permanently deletes your profile, diary history, favorites, and weight log from this device. Continue?')) {
      resetAllData();
      navigate('/');
    }
  }

  const achievements = computeAchievements(diaryEntries, targets.proteinG);

  const heightDisplay = units === 'imperial' ? cmToFtIn(form.heightCm) : null;
  const weightDisplay = units === 'imperial' ? kgToLb(form.weightKg) : form.weightKg;

  return (
    <div className="space-y-6 pb-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">Profile</h1>
        <p className="mt-1 text-sm text-muted">Manage your details, goals, and preferences.</p>
      </header>

      {/* Plan summary */}
      <div className="rounded-xl2 bg-gradient-to-br from-primary-500 to-primary-600 p-5 text-white shadow-elevated">
        <p className="text-sm font-medium text-primary-50">Estimated daily target</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">~{targets.calories.toLocaleString()} kcal</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <p className="font-bold">{targets.proteinG}g</p>
            <p className="text-xs text-primary-50">Protein</p>
          </div>
          <div>
            <p className="font-bold">{targets.carbsG}g</p>
            <p className="text-xs text-primary-50">Carbs</p>
          </div>
          <div>
            <p className="font-bold">{targets.fatG}g</p>
            <p className="text-xs text-primary-50">Fat</p>
          </div>
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-xs text-primary-50">
          <Info size={13} className="mt-0.5 shrink-0" />
          Estimated via Mifflin-St Jeor (BMR {bmr} kcal × activity = TDEE {tdee} kcal). Not medical advice.
        </p>
      </div>

      {minorGuardrail && (
        <div className="flex gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <ShieldAlert size={18} className="mt-0.5 shrink-0" />
          <span>Your plan is set to healthy maintenance. Please involve a parent, dietitian, or doctor for any weight-related goals.</span>
        </div>
      )}

      {/* Achievements */}
      <section>
        <h2 className="mb-2.5 text-sm font-bold text-ink">Achievements</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {achievements.map((a) => (
            <div
              key={a.label}
              className={`rounded-xl2 p-3 text-center shadow-card ${a.achieved ? 'bg-primary-50' : 'bg-white opacity-70'}`}
            >
              <p className="text-xl">{a.emoji}</p>
              <p className="mt-1 text-base font-bold tabular-nums text-ink">{a.value}</p>
              <p className="text-[11px] text-muted">{a.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Today totals quick glance */}
      <section className="rounded-xl2 bg-white p-4 shadow-card">
        <h2 className="mb-2 text-sm font-bold text-ink">Today so far</h2>
        <p className="text-sm text-muted">
          {Math.round(todayDiary.totals.calories)} kcal · {Math.round(todayDiary.totals.proteinG)}g protein ·{' '}
          {todayDiary.entries.length} item{todayDiary.entries.length === 1 ? '' : 's'} logged
        </p>
      </section>

      {/* Personal details */}
      <section className="space-y-4 rounded-xl2 bg-white p-4 shadow-card">
        <h2 className="text-sm font-bold text-ink">Personal details</h2>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Age">
            <input type="number" value={form.age} onChange={(e) => update('age', Number(e.target.value))} className="input" />
          </Field>
          <Field label="Sex">
            <div className="flex gap-2">
              <Chip selected={form.sex === 'male'} onClick={() => update('sex', 'male')}>
                Male
              </Chip>
              <Chip selected={form.sex === 'female'} onClick={() => update('sex', 'female')}>
                Female
              </Chip>
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={units === 'imperial' ? 'Height (ft/in)' : 'Height (cm)'}>
            {units === 'imperial' && heightDisplay ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={heightDisplay.ft}
                  onChange={(e) => update('heightCm', ftInToCm(Number(e.target.value), heightDisplay.inch))}
                  className="input"
                />
                <input
                  type="number"
                  value={heightDisplay.inch}
                  onChange={(e) => update('heightCm', ftInToCm(heightDisplay.ft, Number(e.target.value)))}
                  className="input"
                />
              </div>
            ) : (
              <input type="number" value={form.heightCm} onChange={(e) => update('heightCm', Number(e.target.value))} className="input" />
            )}
          </Field>
          <Field label={units === 'imperial' ? 'Weight (lb)' : 'Weight (kg)'}>
            <input
              type="number"
              value={weightDisplay}
              onChange={(e) => update('weightKg', units === 'imperial' ? lbToKg(Number(e.target.value)) : Number(e.target.value))}
              className="input"
            />
          </Field>
        </div>

        <Field label="Activity level">
          <select value={form.activityLevel} onChange={(e) => update('activityLevel', e.target.value as ActivityLevel)} className="input">
            {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label={`Workouts per week: ${form.trainingDaysPerWeek}`}>
          <input
            type="range"
            min={0}
            max={7}
            value={form.trainingDaysPerWeek}
            onChange={(e) => update('trainingDaysPerWeek', Number(e.target.value))}
            className="w-full accent-primary-500"
          />
        </Field>

        <Field label="Training types">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TRAINING_LABELS) as TrainingType[]).map((t) => (
              <Chip key={t} selected={form.trainingTypes.includes(t)} onClick={() => toggleTraining(t)}>
                {TRAINING_LABELS[t]}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Goal">
          <select
            value={form.goal}
            onChange={(e) => update('goal', e.target.value as Goal)}
            disabled={form.isMinor}
            className="input disabled:opacity-60"
          >
            {Object.entries(GOAL_LABELS).map(([value, label]) => (
              <option key={value} value={value} disabled={form.isMinor && value !== 'maintain'}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Button fullWidth onClick={save}>
          Save changes
        </Button>
      </section>

      {/* Weight tracking */}
      <section className="space-y-3 rounded-xl2 bg-white p-4 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">Weight tracking</h2>
          <ToggleSwitch checked={trackWeight} onChange={setTrackWeight} />
        </div>
        {trackWeight && (
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
            <span className="text-sm text-muted">Log today&apos;s weight</span>
            <QuantityStepper value={todayWeight} onChange={setTodayWeight} step={0.5} min={20} max={400} suffix="kg" />
          </div>
        )}
        {trackWeight && (
          <Button size="sm" variant="secondary" onClick={() => addWeightLog(todayWeight)}>
            Save today&apos;s weight
          </Button>
        )}
      </section>

      {/* Apple Health */}
      <section className="space-y-2 rounded-xl2 bg-white p-4 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink">
            <span>🍎</span> Apple Health
          </h2>
          <span className={`text-xs font-semibold ${healthConnected ? 'text-primary-600' : 'text-muted'}`}>
            {healthConnected ? 'Connected' : 'Not connected'}
          </span>
        </div>
        <p className="text-xs text-muted">
          Lets Nutrition AI show your steps and activity alongside your food log. Only available in a native iOS build — not
          this web version.
        </p>
        {healthConnected ? (
          <Button size="sm" variant="secondary" onClick={() => healthService.disconnect()}>
            Disconnect
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setHealthModalOpen(true)}>
            Connect Apple Health
          </Button>
        )}
      </section>

      {/* Settings */}
      <section className="space-y-3 rounded-xl2 bg-white p-4 shadow-card">
        <h2 className="text-sm font-bold text-ink">Units</h2>
        <div className="flex gap-2">
          <Chip selected={units === 'metric'} onClick={() => setUnits('metric')}>
            kg / cm
          </Chip>
          <Chip selected={units === 'imperial'} onClick={() => setUnits('imperial')}>
            lb / ft-in
          </Chip>
        </div>
      </section>

      {/* Privacy */}
      <section className="space-y-3 rounded-xl2 bg-white p-4 shadow-card">
        <h2 className="text-sm font-bold text-ink">Privacy</h2>
        <p className="text-xs text-muted">
          All your data — profile, diary, favorites, and photos you scan — is stored only on this device. Nothing is uploaded to a server
          in this demo. Health/activity data is never sent anywhere and isn&apos;t collected at all in this web version.
        </p>
        <Button variant="danger" icon={<Trash2 size={16} />} onClick={handleClearData}>
          Clear all my data
        </Button>
      </section>

      <HealthConnectModal open={healthModalOpen} onClose={() => setHealthModalOpen(false)} />

      <button
        onClick={handleClearData}
        className="flex w-full items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-400 hover:text-red-500"
      >
        <LogOut size={13} /> Reset & start over
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-primary-500' : 'bg-gray-200'}`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  );
}
