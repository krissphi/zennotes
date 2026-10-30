import React from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, Paperclip } from 'lucide-react'

interface TreeNodeActionsProps {
  nodeId: string
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onAddChild: (id: string) => void
  onRequestDeleteNode: (id: string) => void
  onAttachClick: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const TreeNodeActions: React.FC<TreeNodeActionsProps> = ({
  nodeId,
  onMoveUp,
  onMoveDown,
  onAddChild,
  onRequestDeleteNode,
  onAttachClick,
  fileInputRef,
  onFileChange,
}) => {
  return (
    <div className="hidden sm:flex items-center gap-0.5 transition-opacity pr-1 pt-0.5 shrink-0 opacity-0 group-hover/row:opacity-100">
      <button
        onClick={() => onMoveUp(nodeId)}
        title="Move up (Alt + ↑)"
        className="hidden sm:inline-flex p-1 rounded text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-zinc-700 transition-colors"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onMoveDown(nodeId)}
        title="Move down (Alt + ↓)"
        className="hidden sm:inline-flex p-1 rounded text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-zinc-700 transition-colors"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onAddChild(nodeId)}
        title="Add sub-item (Child)"
        className="hidden sm:inline-flex p-1 rounded text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-zinc-700 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onAttachClick}
        title="Attach file (Images, PDF, Docs, Archives...)"
        className="hidden sm:inline-flex p-1 rounded text-[#64748B] dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/80 dark:hover:bg-zinc-700 transition-colors"
      >
        <Paperclip className="w-3.5 h-3.5" />
      </button>

      <input
        type="file"
        ref={fileInputRef}
        multiple
        onChange={onFileChange}
        className="hidden"
        aria-hidden="true"
      />

      <button
        onClick={() => onRequestDeleteNode(nodeId)}
        title="Delete item"
        className="hidden sm:inline-flex p-1 rounded text-[#64748B] dark:text-[#94A3B8] hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-200/80 dark:hover:bg-zinc-700 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
