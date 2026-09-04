import { Navigate, Route, Routes } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { useStore } from './store/useStore'
import { useThemeEffect } from './hooks/useTheme'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'

const Chores = lazy(() => import('./pages/Chores'))
const Family = lazy(() => import('./pages/Family'))
const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const Rewards = lazy(() => import('./pages/Rewards'))
const Streaks = lazy(() => import('./pages/Streaks'))
const Statistics = lazy(() => import('./pages/Statistics'))
const AIAssistant = lazy(() => import('./pages/AIAssistant'))
const Settings = lazy(() => import('./pages/Settings'))

function PageFallback() {
  return (
    <div className="space-y-4 py-4">
      <div className="skeleton h-8 w-48 rounded-lg" />
      <div className="skeleton h-24 w-full rounded-2xl" />
      <div className="skeleton h-24 w-full rounded-2xl" />
      <div className="skeleton h-24 w-full rounded-2xl" />
    </div>
  )
}

export default function App() {
  const hydrate = useStore((s) => s.hydrate)
  const hydrated = useStore((s) => s.hydrated)
  const onboardingComplete = useStore((s) => s.settings.onboardingComplete)
  useThemeEffect()

  useEffect(() => {
    hydrate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!hydrated) return null

  if (!onboardingComplete) {
    return <Onboarding />
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route
          path="/chores"
          element={
            <Suspense fallback={<PageFallback />}>
              <Chores />
            </Suspense>
          }
        />
        <Route
          path="/family"
          element={
            <Suspense fallback={<PageFallback />}>
              <Family />
            </Suspense>
          }
        />
        <Route
          path="/calendar"
          element={
            <Suspense fallback={<PageFallback />}>
              <CalendarPage />
            </Suspense>
          }
        />
        <Route
          path="/rewards"
          element={
            <Suspense fallback={<PageFallback />}>
              <Rewards />
            </Suspense>
          }
        />
        <Route
          path="/streaks"
          element={
            <Suspense fallback={<PageFallback />}>
              <Streaks />
            </Suspense>
          }
        />
        <Route
          path="/stats"
          element={
            <Suspense fallback={<PageFallback />}>
              <Statistics />
            </Suspense>
          }
        />
        <Route
          path="/ai"
          element={
            <Suspense fallback={<PageFallback />}>
              <AIAssistant />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<PageFallback />}>
              <Settings />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
