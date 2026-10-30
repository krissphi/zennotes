import React, { useEffect } from 'react'
import { Trash2, RotateCcw, X, Clock, AlertCircle } from 'lucide-react'
import { TrashUtils, type TrashItem } from '../../core/models/TrashItem'

interface TrashModalProps {
  isOpen: boolean
  onClose: () => void
  items: TrashItem[]
  onRestore: (item: TrashItem) => void
  onPermanentDelete: (id: string) => void
  onEmptyTrash: () => void
}

export const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  onClose,
  items,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
}) => {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] rounded-2xl shadow-2xl p-4 sm:p-6 text-[#0F172A] dark:text-[#F8FAFC] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#27272A]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Trash & Recycle Bin</h2>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                {items.length} item(s) stored
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice info */}
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 p-2.5 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            Deleted items are automatically purged after <b>7 days</b>.
          </span>
        </div>

        {/* List of Trash Items */}
        <div className="mt-3.5 max-h-72 overflow-y-auto divide-y divide-[#E2E8F0]/60 dark:divide-[#27272A] space-y-1">
          {items.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
              Trash is empty. No deleted items.
            </div>
          ) : (
            items.map((item) => {
              const remainingDays = TrashUtils.getRemainingDays(item)
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors group"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-medium text-[#0F172A] dark:text-white truncate">
                      {item.title}
                    </p>
                    {item.note && (
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate mt-0.5">
                        {item.note}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires in {remainingDays} day{remainingDays === 1 ? '' : 's'}
                      </span>
                      {item.descendants.length > 0 && (
                        <span>• {item.descendants.length} sub-item(s)</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onRestore(item)}
                      title="Restore back to tree"
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/50 rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore</span>
                    </button>
                    <button
                      onClick={() => onPermanentDelete(item.id)}
                      title="Permanently delete item"
                      className="p-1 text-[#64748B] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-[#27272A] flex items-center justify-between">
          {items.length > 0 ? (
            <button
              onClick={onEmptyTrash}
              className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
            >
              Empty All Trash
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-[#0F172A] dark:text-white bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
