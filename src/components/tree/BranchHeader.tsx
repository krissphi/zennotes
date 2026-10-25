import React, { useRef, useLayoutEffect } from 'react'
import { ArrowLeft, ChevronRight, Home } from 'lucide-react'
import type { TreeNode } from '../../core/models/TreeNode'

interface BranchHeaderProps {
  node: TreeNode
  breadcrumbs?: TreeNode[]
  onUpdateContent: (content: string) => void
  onUpdateNote: (note: string) => void
  onZoomOut?: () => void
  onSelectNode?: (id: string) => void
}

export const BranchHeader: React.FC<BranchHeaderProps> = ({
  node,
  breadcrumbs,
  onUpdateContent,
  onUpdateNote,
  onZoomOut,
  onSelectNode,
}) => {
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null)
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = 'inherit'
      titleTextareaRef.current.style.height = `${titleTextareaRef.current.scrollHeight}px`
    }
  }, [node.content])

  useLayoutEffect(() => {
    if (noteTextareaRef.current) {
      noteTextareaRef.current.style.height = 'inherit'
      noteTextareaRef.current.style.height = `${Math.max(20, noteTextareaRef.current.scrollHeight)}px`
    }
  }, [node.note])

  return (
    <div className="mb-6 pb-4 border-b border-[#E2E8F0] dark:border-[#27272A]">
      {/* Breadcrumb Trail & Back Navigation */}
      <div className="flex items-center flex-wrap gap-1.5 mb-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
        {onZoomOut && (
          <button
            onClick={onZoomOut}
            className="inline-flex items-center gap-1 px-2 py-1 mr-1 text-xs font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            title="Back to parent branch"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        )}

        {breadcrumbs && breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1
          const isFirst = idx === 0

          return (
            <React.Fragment key={crumb.id}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-[#94A3B8] dark:text-[#52525B] shrink-0" />}
              <button
                onClick={() => onSelectNode && onSelectNode(crumb.id)}
                disabled={isLast}
                className={`flex items-center gap-1 rounded px-1.5 py-0.5 truncate max-w-[150px] transition-colors ${
                  isLast
                    ? 'font-semibold text-emerald-600 dark:text-emerald-400 cursor-default'
                    : 'hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                {isFirst && <Home className="w-3 h-3 shrink-0" />}
                <span className="truncate">{crumb.content || (isFirst ? 'Root' : 'Untitled')}</span>
              </button>
            </React.Fragment>
          )
        })}
      </div>

      {/* Editable Branch Title */}
      <textarea
        ref={titleTextareaRef}
        rows={1}
        value={node.content}
        onChange={(e) => onUpdateContent(e.target.value)}
        placeholder="Branch name / topic..."
        className="w-full text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight bg-transparent border-none outline-none focus:ring-1 focus:ring-emerald-500/40 rounded px-1 -mx-1 transition-all placeholder:text-[#94A3B8] dark:placeholder:text-[#52525B] resize-none overflow-hidden"
      />

      {/* Editable Subheader / Note */}
      <textarea
        ref={noteTextareaRef}
        rows={1}
        value={node.note || ''}
        onChange={(e) => onUpdateNote(e.target.value)}
        placeholder="Add a subheader or note for this branch..."
        className="w-full text-xs text-[#64748B] dark:text-[#94A3B8] bg-transparent border-none outline-none focus:ring-1 focus:ring-emerald-500/40 rounded px-1 -mx-1 mt-1 transition-all placeholder:text-[#94A3B8] dark:placeholder:text-[#52525B] resize-none overflow-hidden leading-relaxed"
      />
    </div>
  )
}
