import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Footprints, Scale } from 'lucide-react';
import { CaloriesChart } from '@/components/stats/CaloriesChart';
import { ProteinChart } from '@/components/stats/ProteinChart';
import { WeightChart } from '@/components/stats/WeightChart';
import { ConsistencyCard } from '@/components/stats/ConsistencyCard';
import { WeeklyGrid } from '@/components/stats/WeeklyGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { HealthConnectModal } from '@/components/health/HealthConnectModal';
import { Button } from '@/components/ui/Button';
import { useLastNDaysStats } from '@/hooks/useHistoryStats';
import { useTargets } from '@/hooks/useTargets';
import { useAppStore } from '@/store/useAppStore';

export function StatisticsPage() {
  const stats = useLastNDaysStats(7);
  const { targets } = useTargets();
  const weightLog = useAppStore((s) => s.weightLog);
  const trackWeight = useAppStore((s) => s.trackWeight);
  const [healthModalOpen, setHealthModalOpen] = useState(false);

  const hasAnyData = stats.some((d) => d.hasEntries);

  return (
    <div className="space-y-4 pb-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">Statistics</h1>
        <p className="mt-1 text-sm text-muted">Your trends over the last 7 days.</p>
      </header>

      <WeeklyGrid />

      {hasAnyData ? (
        <>
          <CaloriesChart data={stats} goal={targets.calories} />
          <ProteinChart data={stats} goal={targets.proteinG} />
          <ConsistencyCard data={stats} goal={targets.calories} />
        </>
      ) : (
        <EmptyState
          icon={<span className="text-xl">📊</span>}
          title="Not enough data yet"
          description="Log a few days of meals to see your trends here."
        />
      )}

      {trackWeight && weightLog.length > 1 ? (
        <WeightChart data={weightLog} />
      ) : (
        <EmptyState
          icon={<Scale size={22} />}
          title="Weight tracking is off"
          description="Enable weight tracking in your profile to see your trend here."
          action={
            <Link to="/profile" className="text-xs font-semibold text-primary-600 hover:underline">
              Go to Profile
            </Link>
          }
        />
      )}

      <div className="rounded-xl2 bg-white p-4 shadow-card">
        <h3 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-ink">
          <Footprints size={15} className="text-muted" />
          Activity
        </h3>
        <EmptyState
          icon={<span className="text-lg">🍎</span>}
          title="No activity data available yet"
          description="Connect Apple Health to see step counts and activity trends here — real HealthKit access needs a native iOS app, not this web version."
          action={
            <Button size="sm" variant="secondary" onClick={() => setHealthModalOpen(true)}>
              Connect
            </Button>
          }
        />
      </div>

      <HealthConnectModal open={healthModalOpen} onClose={() => setHealthModalOpen(false)} />
    </div>
  );
}
