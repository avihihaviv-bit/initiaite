import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'
import { CelebrationOverlay } from '../gamification/CelebrationOverlay'
import { QuickAddFab } from './QuickAddFab'

export function AppShell() {
  return (
    <div className="flex min-h-svh bg-canvas">
      <Sidebar />
      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <QuickAddFab />
      <CelebrationOverlay />
    </div>
  )
}
