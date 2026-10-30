import React, { useState, useEffect } from 'react'
import {
  IndentDecrease,
  IndentIncrease,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Plus,
  Trash2,
  X,
  Undo2,
  Redo2,
  Menu,
  Search,
} from 'lucide-react'

interface MobileToolbarProps {
  activeNodeId: string | null
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  onToggleSidebar?: () => void
  onOpenSearch?: () => void
  onAddNote?: () => void
  onIndent: (id: string) => void
  onOutdent: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onAddChild: (id: string) => void
  onAddSibling: (id: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export const MobileToolbar: React.FC<MobileToolbarProps> = ({
  activeNodeId,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onToggleSidebar,
  onOpenSearch,
  onAddNote,
  onIndent,
  onOutdent,
  onMoveUp,
  onMoveDown,
  onAddChild,
  onAddSibling,
  onDelete,
  onClose,
}) => {
  const [keyboardOffset, setKeyboardOffset] = useState(0)

  // Track virtual keyboard height on iOS Safari & Android Chrome
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return
    const vv = window.visualViewport
    const handleViewport = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setKeyboardOffset(offset)
    }
    vv.addEventListener('resize', handleViewport)
    vv.addEventListener('scroll', handleViewport)
    return () => {
      vv.removeEventListener('resize', handleViewport)
      vv.removeEventListener('scroll', handleViewport)
    }
  }, [])

  const bottomStyle: React.CSSProperties = keyboardOffset > 0
    ? { bottom: `${keyboardOffset}px` }
    : {}

  // Mode 1: Active Editing Mode (Docked Outliner Accessory Toolbar)
  if (activeNodeId) {
    return (
      <div
        style={bottomStyle}
        className="fixed inset-x-0 bottom-0 z-30 md:hidden bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-md border-t border-[#E2E8F0] dark:border-[#27272A] px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-xl transition-all animate-in slide-in-from-bottom duration-150"
      >
        <div className="flex items-center justify-between max-w-md mx-auto gap-0.5">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onOutdent(activeNodeId)}
            title="Outdent"
            className="p-2 rounded-lg text-[#64748B] dark:text-[#94A3B8] active:bg-slate-200 dark:active:bg-zinc-700 active:scale-90 transition-all cursor-pointer"
          >
            <IndentDecrease className="w-4 h-4" />
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onIndent(activeNodeId)}
            title="Indent"
            className="p-2 rounded-lg text-[#64748B] dark:text-[#94A3B8] active:bg-slate-200 dark:active:bg-zinc-700 active:scale-90 transition-all cursor-pointer"
          >
            <IndentIncrease className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-[#E2E8F0] dark:bg-[#27272A]" />

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onMoveUp(activeNodeId)}
            title="Move up"
            className="p-2 rounded-lg text-[#64748B] dark:text-[#94A3B8] active:bg-slate-200 dark:active:bg-zinc-700 active:scale-90 transition-all cursor-pointer"
          >
            <ArrowUp className="w-4 h-4" />
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onMoveDown(activeNodeId)}
            title="Move down"
            className="p-2 rounded-lg text-[#64748B] dark:text-[#94A3B8] active:bg-slate-200 dark:active:bg-zinc-700 active:scale-90 transition-all cursor-pointer"
          >
            <ArrowDown className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-[#E2E8F0] dark:bg-[#27272A]" />

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onAddSibling(activeNodeId)}
            title="Add sibling item"
            className="p-2 rounded-lg text-[#64748B] dark:text-[#94A3B8] active:bg-slate-200 dark:active:bg-zinc-700 active:scale-90 transition-all cursor-pointer"
          >
            <CornerDownLeft className="w-4 h-4" />
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onAddChild(activeNodeId)}
            title="Add sub-item"
            className="p-2 rounded-lg text-[#64748B] dark:text-[#94A3B8] active:bg-slate-200 dark:active:bg-zinc-700 active:scale-90 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onDelete(activeNodeId)}
            title="Delete item"
            className="p-2 rounded-lg text-red-500 active:bg-red-50 dark:active:bg-red-950/40 active:scale-90 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-[#E2E8F0] dark:bg-[#27272A]" />

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClose}
            title="Done"
            className="p-2 rounded-lg text-[#64748B] dark:text-[#94A3B8] active:bg-slate-200 dark:active:bg-zinc-700 active:scale-90 transition-all font-medium cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // Mode 2: Browsing Mode (Bottom Navigation Dock with Thumb-Friendly FAB)
  return (
    <div
      style={bottomStyle}
      className="fixed inset-x-0 bottom-0 z-20 md:hidden bg-white/95 dark:bg-[#111113]/95 backdrop-blur-md border-t border-[#E2E8F0] dark:border-[#27272A] px-4 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg flex items-center justify-between transition-all"
    >
      <div className="flex items-center gap-1 sm:gap-2">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title="Tree Map"
            className="p-2.5 rounded-xl text-[#64748B] dark:text-[#94A3B8] active:bg-slate-100 dark:active:bg-zinc-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            title="Search notes"
            className="p-2.5 rounded-xl text-[#64748B] dark:text-[#94A3B8] active:bg-slate-100 dark:active:bg-zinc-800 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Prominent Floating Add Note Button */}
      {onAddNote && (
        <button
          onClick={onAddNote}
          title="Add new note"
          className="w-12 h-12 -my-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white shadow-md hover:shadow-lg flex items-center justify-center transition-all"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      <div className="flex items-center gap-1 sm:gap-2">
        {onUndo && (
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
            className="p-2.5 rounded-xl text-[#64748B] dark:text-[#94A3B8] disabled:opacity-30 active:bg-slate-100 dark:active:bg-zinc-800 transition-colors"
          >
            <Undo2 className="w-5 h-5" />
          </button>
        )}

        {onRedo && (
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
            className="p-2.5 rounded-xl text-[#64748B] dark:text-[#94A3B8] disabled:opacity-30 active:bg-slate-100 dark:active:bg-zinc-800 transition-colors"
          >
            <Redo2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}
