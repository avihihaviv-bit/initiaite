import { Navigate, Route, Routes } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import type { LazyExoticComponent, ReactElement } from 'react'
import { AppShell } from './components/layout/AppShell'
import { useStore } from './store/useStore'
import { useThemeEffect } from './hooks/useTheme'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'

const Chores = lazy(() => import('./pages/Chores'))
const People = lazy(() => import('./pages/People'))
const PersonProfile = lazy(() => import('./pages/PersonProfile'))
const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const Schedule = lazy(() => import('./pages/Schedule'))
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

function lazyPage(Component: LazyExoticComponent<() => ReactElement>) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Component />
    </Suspense>
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
        <Route path="/chores" element={lazyPage(Chores)} />
        <Route path="/people" element={lazyPage(People)} />
        <Route path="/people/:personId" element={lazyPage(PersonProfile)} />
        <Route path="/calendar" element={lazyPage(CalendarPage)} />
        <Route path="/schedule" element={lazyPage(Schedule)} />
        <Route path="/rewards" element={lazyPage(Rewards)} />
        <Route path="/streaks" element={lazyPage(Streaks)} />
        <Route path="/stats" element={lazyPage(Statistics)} />
        <Route path="/ai" element={lazyPage(AIAssistant)} />
        <Route path="/settings" element={lazyPage(Settings)} />
        <Route path="/family" element={<Navigate to="/people" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
