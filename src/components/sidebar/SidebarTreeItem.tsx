import React, { useState } from 'react'
import { ChevronRight, ChevronDown, CircleDot, FileText } from 'lucide-react'
import type { TreeDocument } from '../../core/models/TreeDocument'
import { getNodeDisplayText } from '../../lib/attachmentUtils'

interface SidebarTreeItemProps {
  nodeId: string
  doc: TreeDocument
  focusedNodeId: string
  onSelectNode: (nodeId: string) => void
  depth?: number
}

export const SidebarTreeItem: React.FC<SidebarTreeItemProps> = ({
  nodeId,
  doc,
  focusedNodeId,
  onSelectNode,
  depth = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const node = doc.getNode(nodeId)
  if (!node) return null

  const hasChildren = node.hasChildren()
  const isFocused = node.id === focusedNodeId

  return (
    <div
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isFocused}
      aria-level={depth + 1}
      aria-label={getNodeDisplayText(node.content) || 'Untitled item'}
      className="flex flex-col select-none text-xs"
    >
      <div
        className={`flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer transition-colors group ${
          isFocused
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
            : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-slate-200/60 dark:hover:bg-zinc-800/80 hover:text-[#0F172A] dark:hover:text-white'
        }`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={() => onSelectNode(node.id)}
      >
        {/* Toggle chevron if has children */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded((prev) => !prev)
            }}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            className="w-4 h-4 flex items-center justify-center rounded text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        ) : (
          <span className="w-4 h-4 flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-[#CBD5E1] dark:bg-[#475569]" />
          </span>
        )}

        {/* Node Icon */}
        {isFocused ? (
          <CircleDot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-[#64748B]/70 dark:text-[#94A3B8]/70 group-hover:text-[#334155] dark:group-hover:text-[#E2E8F0] shrink-0" />
        )}

        {/* Node Title */}
        <span className="truncate flex-1">
          {getNodeDisplayText(node.content) || '(empty item)'}
        </span>

        {/* Children count badge */}
        {hasChildren && (
          <span className="text-[10px] px-1.5 py-0.2 text-[#64748B] dark:text-[#94A3B8] bg-slate-200/80 dark:bg-zinc-800 rounded-full">
            {node.childrenIds.length}
          </span>
        )}
      </div>

      {/* Render children recursively */}
      {hasChildren && isExpanded && (
        <div role="group" className="flex flex-col">
          {node.childrenIds.map((childId) => (
            <SidebarTreeItem
              key={childId}
              nodeId={childId}
              doc={doc}
              focusedNodeId={focusedNodeId}
              onSelectNode={onSelectNode}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
