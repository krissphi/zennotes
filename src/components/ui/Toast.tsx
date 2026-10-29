import React, { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { toast, type ToastMessage } from '../../lib/toast'

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    return toast.subscribe(setToasts)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((t) => {
        let borderClass = 'border-slate-200 dark:border-zinc-800'
        let bgClass = 'bg-white dark:bg-[#18181B]'
        let textClass = 'text-[#0F172A] dark:text-[#F8FAFC]'
        let IconComponent = Info
        let iconClass = 'text-blue-500'

        if (t.type === 'success') {
          borderClass = 'border-emerald-200 dark:border-emerald-800/60'
          IconComponent = CheckCircle2
          iconClass = 'text-emerald-500'
        } else if (t.type === 'error') {
          borderClass = 'border-red-200 dark:border-red-900/60'
          IconComponent = AlertCircle
          iconClass = 'text-red-500'
        } else if (t.type === 'warning') {
          borderClass = 'border-amber-200 dark:border-amber-800/60'
          IconComponent = AlertTriangle
          iconClass = 'text-amber-500'
        }

        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all transform translate-y-0 opacity-100 ${bgClass} ${borderClass} ${textClass}`}
          >
            <IconComponent className={`w-4 h-4 shrink-0 mt-0.5 ${iconClass}`} />
            <div className="flex-1 text-xs leading-relaxed font-medium break-words">
              {t.message}
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="shrink-0 p-0.5 rounded text-[#64748B] hover:text-[#0F172A] dark:hover:text-white transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
