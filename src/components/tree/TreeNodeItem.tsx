import React from 'react'
import { Plus, Trash2, Check, X, ChevronUp, ChevronDown } from 'lucide-react'
import { NodeBullet } from './NodeBullet'
import { NodeContent } from './NodeContent'
import type { TreeDocument } from '../../core/models/TreeDocument'

interface TreeNodeItemProps {
  nodeId: string
  doc: TreeDocument
  activeEditingId: string | null
  onUpdateContent: (id: string, content: string) => void
  onAddSibling: (id: string) => void
  onAddChild: (id: string) => void
  onRequestDeleteNode: (id: string, forceConfirm?: boolean) => void
  onIndent: (id: string) => void
  onOutdent: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onNavigateUp?: (id: string) => void
  onNavigateDown?: (id: string) => void
  onNavigateToWikilink?: (title: string) => void
  onToggleCollapse: (id: string) => void
  onToggleComplete: (id: string) => void
  onZoomIn: (id: string) => void
  onSetActiveId: (id: string) => void
}

export const TreeNodeItem: React.FC<TreeNodeItemProps> = React.memo(({
  nodeId,
  doc,
  activeEditingId,
  onUpdateContent,
  onAddSibling,
  onAddChild,
  onRequestDeleteNode,
  onIndent,
  onOutdent,
  onMoveUp,
  onMoveDown,
  onNavigateUp,
  onNavigateDown,
  onNavigateToWikilink,
  onToggleCollapse,
  onToggleComplete,
  onZoomIn,
  onSetActiveId,
}) => {
  const touchStartX = React.useRef<number | null>(null)
  const touchStartY = React.useRef<number | null>(null)

  const node = doc.getNode(nodeId)
  if (!node) return null

  const hasChildren = node.hasChildren()
  const isEditing = activeEditingId === node.id

  const handleDeleteOrOutdent = () => {
    const parent = node.parentId ? doc.getNode(node.parentId) : null
    if (parent && parent.id !== doc.rootId) {
      onOutdent(node.id)
    } else {
      onRequestDeleteNode(node.id, false)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    touchStartX.current = null
    touchStartY.current = null

    if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.6) {
      if (deltaX > 0) {
        onIndent(node.id)
      } else {
        onOutdent(node.id)
      }
    }
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex flex-col group/row"
    >
      {/* Node Row */}
      <div
        className={`flex items-start gap-1.5 py-0.5 px-1 rounded-lg transition-colors relative ${
          isEditing
            ? 'bg-slate-500/[0.03] dark:bg-white/[0.02]'
            : 'hover:bg-slate-100/50 dark:hover:bg-zinc-800/30'
        }`}
      >
        {/* Single Bullet Point (with green dot indicator when active) */}
        <div className="mt-0.5 shrink-0">
          <NodeBullet
            hasChildren={hasChildren}
            isCollapsed={node.isCollapsed}
            isCompleted={node.isCompleted}
            isEditing={isEditing}
            onToggleCollapse={() => onToggleCollapse(node.id)}
            onZoomIn={() => onZoomIn(node.id)}
            onToggleComplete={() => onToggleComplete(node.id)}
            onAddChild={() => onAddChild(node.id)}
          />
        </div>

        {/* Content text */}
        <div className="flex-1 min-w-0 pt-0.5 pl-0.5">
          <NodeContent
            nodeId={node.id}
            content={node.content}
            isCompleted={node.isCompleted}
            isFocused={isEditing}
            onChange={(val) => onUpdateContent(node.id, val)}
            onAddSibling={() => onAddSibling(node.id)}
            onIndent={() => onIndent(node.id)}
            onOutdent={() => onOutdent(node.id)}
            onDelete={handleDeleteOrOutdent}
            onMoveUp={() => onMoveUp(node.id)}
            onMoveDown={() => onMoveDown(node.id)}
            onNavigateUp={() => onNavigateUp?.(node.id)}
            onNavigateDown={() => onNavigateDown?.(node.id)}
            onNavigateToWikilink={onNavigateToWikilink}
            onToggleComplete={() => onToggleComplete(node.id)}
            onFocus={() => onSetActiveId(node.id)}
          />
        </div>

        {/* Quick Actions (Desktop mouse hover only — never stealing text space on mobile or during active typing) */}
        <div className="hidden sm:flex items-center gap-0.5 transition-opacity pr-1 pt-0.5 shrink-0 opacity-0 group-hover/row:opacity-100">
          {/* Quick Reorder Up / Down buttons */}
          <button
            onClick={() => onMoveUp(node.id)}
            title="Move up (Alt + ↑)"
            className="hidden sm:inline-flex p-1 rounded text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-zinc-700 transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMoveDown(node.id)}
            title="Move down (Alt + ↓)"
            className="hidden sm:inline-flex p-1 rounded text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-zinc-700 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* Complete / Uncomplete */}
          <button
            onClick={() => onToggleComplete(node.id)}
            title={
              node.isCompleted
                ? 'Mark incomplete (Ctrl + Enter)'
                : 'Mark complete (Ctrl + Enter)'
            }
            className={`p-1 rounded transition-colors ${
              node.isCompleted
                ? 'text-amber-700 dark:text-amber-400 hover:text-amber-800 hover:bg-amber-100/60 dark:hover:bg-amber-950/40'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/80 dark:hover:bg-zinc-700'
            }`}
          >
            {node.isCompleted ? (
              <X className="w-3.5 h-3.5" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Add child */}
          <button
            onClick={() => onAddChild(node.id)}
            title="Add sub-item (Child)"
            className="hidden sm:inline-flex p-1 rounded text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-zinc-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={() => onRequestDeleteNode(node.id, true)}
            title="Delete item"
            className="p-1 rounded text-[#64748B] dark:text-[#94A3B8] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Children Nodes (if not collapsed) with Guide Line */}
      {hasChildren && !node.isCollapsed && (
        <div className="ml-4 sm:ml-5 pl-2 border-l border-[#E2E8F0] dark:border-[#27272A] space-y-0.5">
          {node.childrenIds.map((childId) => (
            <TreeNodeItem
              key={childId}
              nodeId={childId}
              doc={doc}
              activeEditingId={activeEditingId}
              onUpdateContent={onUpdateContent}
              onAddSibling={onAddSibling}
              onAddChild={onAddChild}
              onRequestDeleteNode={onRequestDeleteNode}
              onIndent={onIndent}
              onOutdent={onOutdent}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onNavigateUp={onNavigateUp}
              onNavigateDown={onNavigateDown}
              onNavigateToWikilink={onNavigateToWikilink}
              onToggleCollapse={onToggleCollapse}
              onToggleComplete={onToggleComplete}
              onZoomIn={onZoomIn}
              onSetActiveId={onSetActiveId}
            />
          ))}
        </div>
      )}
    </div>
  )
})
