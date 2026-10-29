import React from 'react'
import { X, Keyboard } from 'lucide-react'

interface ShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const shortcuts = [
    { key: 'Enter', desc: 'Create new sibling item' },
    { key: 'Shift + Enter', desc: 'Line break within same item' },
    { key: 'Tab', desc: 'Indent item one level deeper' },
    { key: 'Shift + Tab', desc: 'Outdent item one level outward' },
    { key: 'Backspace', desc: 'Delete item when empty' },
    { key: 'Ctrl + Enter', desc: 'Toggle completion checkmark' },
    { key: '``` or `code`', desc: 'Code block with copy button' },
    { key: 'Alt + ↑ / ↓', desc: 'Reorder item position up / down' },
    { key: 'Click Bullet', desc: 'Zoom in (hoist) into branch' },
    { key: 'Ctrl + Z', desc: 'Undo tree edit' },
    { key: 'Ctrl + Y / Ctrl+Shift+Z', desc: 'Redo tree edit' },
    { key: 'Ctrl + Shift + C', desc: 'Collapse all sub-branches' },
    { key: 'Ctrl + Shift + E', desc: 'Expand all sub-branches' },
    { key: 'Ctrl + K', desc: 'Open global quick search' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] rounded-2xl shadow-xl p-4 sm:p-6 text-[#0F172A] dark:text-[#F8FAFC] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#27272A]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-semibold">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 divide-y divide-[#E2E8F0]/60 dark:divide-[#27272A] text-xs">
          {shortcuts.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2.5">
              <span className="text-[#64748B] dark:text-[#94A3B8]">{item.desc}</span>
              <kbd className="px-2 py-1 font-mono text-[11px] font-medium bg-slate-100 dark:bg-zinc-800 border border-[#E2E8F0] dark:border-[#27272A] text-[#0F172A] dark:text-white rounded-md shadow-2xs">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
