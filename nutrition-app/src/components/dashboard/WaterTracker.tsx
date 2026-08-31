import { Droplet } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { todayISO } from '@/utils/date';
import { ProgressBar } from '@/components/ui/ProgressBar';

const DAILY_GOAL_ML = 2000;

export function WaterTracker() {
  const date = todayISO();
  const waterLog = useAppStore((s) => s.waterLog);
  const addWater = useAppStore((s) => s.addWater);
  const current = waterLog[date] ?? 0;

  return (
    <div className="rounded-xl2 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-ink">
          <Droplet size={15} className="text-blue-400" />
          Water
        </h3>
        <span className="text-sm font-semibold tabular-nums text-ink">
          {(current / 1000).toFixed(1)}L <span className="text-xs font-normal text-muted">/ {(DAILY_GOAL_ML / 1000).toFixed(1)}L</span>
        </span>
      </div>
      <ProgressBar value={current} max={DAILY_GOAL_ML} color="#3B82F6" className="mt-2.5" />
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => addWater(250, date)}
          className="flex-1 rounded-lg bg-blue-50 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 active:scale-95"
        >
          +250ml
        </button>
        <button
          onClick={() => addWater(500, date)}
          className="flex-1 rounded-lg bg-blue-50 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 active:scale-95"
        >
          +500ml
        </button>
        {current > 0 && (
          <button
            onClick={() => addWater(-current, date)}
            className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-muted transition hover:bg-gray-100 active:scale-95"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
