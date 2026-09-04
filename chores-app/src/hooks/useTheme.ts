import { useEffect } from 'react'
import { useStore } from '../store/useStore'

export function useThemeEffect() {
  const themeMode = useStore((s) => s.settings.themeMode)

  useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = () => {
      const isDark = themeMode === 'dark' || (themeMode === 'system' && mq.matches)
      root.classList.toggle('dark', isDark)
    }
    apply()

    if (themeMode === 'system') {
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [themeMode])
}
