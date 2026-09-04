import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, TriangleAlert, Undo2, XCircle } from 'lucide-react'
import clsx from 'clsx'

interface ToastItem {
  id: number
  message: string
  tone: 'success' | 'error' | 'info' | 'warning'
  action?: { label: string; onClick: () => void }
}

interface ToastCtx {
  show: (message: string, opts?: { tone?: ToastItem['tone']; action?: ToastItem['action'] }) => void
}

const Ctx = createContext<ToastCtx | null>(null)

let idCounter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback<ToastCtx['show']>((message, opts) => {
    const id = ++idCounter
    setToasts((t) => [...t, { id, message, tone: opts?.tone ?? 'success', action: opts?.action }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  const icons = {
    success: <CheckCircle2 size={18} className="text-success-500" />,
    error: <XCircle size={18} className="text-danger-500" />,
    info: <Info size={18} className="text-info-500" />,
    warning: <TriangleAlert size={18} className="text-warning-500" />,
  }

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={clsx(
                'pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 py-3 shadow-[var(--shadow-lift)]'
              )}
            >
              {icons[t.tone]}
              <span className="flex-1 text-sm font-medium text-ink">{t.message}</span>
              {t.action && (
                <button
                  onClick={() => {
                    t.action?.onClick()
                    setToasts((ts) => ts.filter((x) => x.id !== t.id))
                  }}
                  className="focus-ring flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-primary-500 hover:bg-primary-50"
                >
                  <Undo2 size={13} /> {t.action.label}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
