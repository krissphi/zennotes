import React from 'react'
import {
  ArrowLeft,
  ChevronRight,
  Home,
  FileDown,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react'
import type { TreeNode } from '../../core/models/TreeNode'
import { getNodeDisplayText } from '../../lib/attachmentUtils'

interface BranchToolbarProps {
  breadcrumbs?: TreeNode[]
  onZoomOut?: () => void
  onSelectNode?: (id: string) => void
  onCollapseAll?: () => void
  onExpandAll?: () => void
  onExportBranch?: () => void
  hasDoc: boolean
}

export const BranchToolbar: React.FC<BranchToolbarProps> = ({
  breadcrumbs,
  onZoomOut,
  onSelectNode,
  onCollapseAll,
  onExpandAll,
  onExportBranch,
  hasDoc,
}) => {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2 mb-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
      <div className="flex items-center flex-wrap gap-1.5">
        {onZoomOut && (
          <button
            onClick={onZoomOut}
            className="inline-flex items-center gap-1 px-2 py-1 mr-1 text-xs font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
            title="Back to parent branch"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        )}

        {breadcrumbs &&
          breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1
            const isFirst = idx === 0
            const crumbLabel = isFirst ? 'Root' : getNodeDisplayText(crumb.content, 'Untitled')

            return (
              <React.Fragment key={crumb.id}>
                {idx > 0 && (
                  <ChevronRight className="w-3 h-3 text-[#94A3B8] dark:text-[#52525B] shrink-0" />
                )}
                <button
                  onClick={() => onSelectNode && onSelectNode(crumb.id)}
                  disabled={isLast}
                  className={`flex items-center gap-1 rounded px-1.5 py-0.5 truncate max-w-[150px] transition-colors ${
                    isLast
                      ? 'font-semibold text-emerald-600 dark:text-emerald-400 cursor-default'
                      : 'hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer'
                  }`}
                >
                  {isFirst && <Home className="w-3 h-3 shrink-0" />}
                  <span className="truncate">{crumbLabel}</span>
                </button>
              </React.Fragment>
            )
          })}
      </div>

      {/* Branch Quick Tools: Collapse All, Expand All, Export Branch as Markdown */}
      <div className="flex items-center gap-1">
        {onCollapseAll && (
          <button
            type="button"
            onClick={onCollapseAll}
            title="Collapse all sub-branches (Ctrl+Shift+C)"
            className="p-1.5 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ChevronsDownUp className="w-3.5 h-3.5" />
          </button>
        )}
        {onExpandAll && (
          <button
            type="button"
            onClick={onExpandAll}
            title="Expand all sub-branches (Ctrl+Shift+E)"
            className="p-1.5 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
          </button>
        )}
        {hasDoc && onExportBranch && (
          <button
            type="button"
            onClick={onExportBranch}
            title="Export this branch as Markdown (.md)"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#475569] dark:text-[#CBD5E1] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer border border-[#E2E8F0] dark:border-[#27272A]"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export .md</span>
          </button>
        )}
      </div>
    </div>
  )
}
