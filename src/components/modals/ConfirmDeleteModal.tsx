import React, { useState, useEffect } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (dontAskToday: boolean) => void
  nodeContent: string
  childCount: number
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  nodeContent,
  childCount,
}) => {
  const [dontAskToday, setDontAskToday] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        onConfirm(dontAskToday)
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onConfirm, dontAskToday])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] rounded-2xl shadow-xl p-5 text-[#0F172A] dark:text-[#F8FAFC]">
        {/* Header Icon & Close */}
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-4 h-4" />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Warning */}
        <div className="mt-3">
          <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white">
            Move to Trash?
          </h3>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
            Item will be kept in Trash for 7 days before permanent deletion.
          </p>

          <div className="mt-2.5 p-2.5 bg-slate-50 dark:bg-zinc-800/60 border border-[#E2E8F0] dark:border-[#27272A] rounded-lg text-xs font-medium text-[#0F172A] dark:text-white truncate">
            {nodeContent.trim() ? `"${nodeContent}"` : '(Untitled item)'}
          </div>

          {childCount > 0 && (
            <div className="mt-2.5 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 p-2.5 rounded-lg">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                This item has <b>{childCount}</b> nested child item(s) that will also be moved.
              </span>
            </div>
          )}

          {/* Don't ask again today option */}
          <label className="mt-3.5 flex items-center gap-2 cursor-pointer select-none text-xs text-[#64748B] dark:text-[#94A3B8]">
            <input
              type="checkbox"
              checked={dontAskToday}
              onChange={(e) => setDontAskToday(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[#CBD5E1] dark:border-[#334155] text-red-600 focus:ring-red-500 accent-red-600"
            />
            <span>Don't ask again today</span>
          </label>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(dontAskToday)
              onClose()
            }}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs"
          >
            Move to Trash
          </button>
        </div>
      </div>
    </div>
  )
}
