import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Link2 } from 'lucide-react'
import type { TreeNode } from '../../core/models/TreeNode'
import type { TreeDocument } from '../../core/models/TreeDocument'
import { getNodeDisplayText } from '../../lib/attachmentUtils'

interface BranchBacklinksProps {
  backlinks: TreeNode[]
  doc?: TreeDocument
  onSelectNode?: (id: string) => void
}

export const BranchBacklinks: React.FC<BranchBacklinksProps> = ({
  backlinks,
  doc,
  onSelectNode,
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  if (backlinks.length === 0) return null

  return (
    <div className="mt-4 pt-3 border-t border-[#E2E8F0]/70 dark:border-[#27272A]">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors cursor-pointer select-none"
      >
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
        <Link2 className="w-3.5 h-3.5" />
        <span>Linked References ({backlinks.length})</span>
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-emerald-500/40 animate-in fade-in duration-100">
          {backlinks.map((refNode) => {
            const crumbs = doc?.getBreadcrumbs(refNode.id) || []
            const pathStr = crumbs
              .slice(0, -1)
              .map((c) => (c.id === doc?.rootId ? 'Root' : getNodeDisplayText(c.content) || '...'))
              .join(' > ')

            return (
              <div
                key={refNode.id}
                onClick={() => onSelectNode?.(refNode.id)}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 border border-[#E2E8F0] dark:border-[#27272A] cursor-pointer transition-all group"
              >
                {pathStr && (
                  <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mb-0.5 truncate">
                    {pathStr}
                  </p>
                )}
                <p className="text-xs text-[#0F172A] dark:text-[#F8FAFC] font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {getNodeDisplayText(refNode.content)}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
