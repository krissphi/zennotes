import React from 'react'
import { Plus, Trash2, Check, X, ChevronUp, ChevronDown, Paperclip } from 'lucide-react'
import { NodeBullet } from './NodeBullet'
import { NodeContent } from './NodeContent'
import type { TreeDocument } from '../../core/models/TreeDocument'
import { processImageFile } from '../../lib/imageUtils'
import { processAttachmentFile, getNodeDisplayText } from '../../lib/attachmentUtils'
import { toast } from '../../lib/toast'

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
  onSelectTag?: (tag: string) => void
  depth?: number
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
  onSelectTag,
  depth = 1,
}) => {
  const touchStartX = React.useRef<number | null>(null)
  const touchStartY = React.useRef<number | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleToggleCollapse = React.useCallback(() => onToggleCollapse(nodeId), [onToggleCollapse, nodeId])
  const handleZoomIn = React.useCallback(() => onZoomIn(nodeId), [onZoomIn, nodeId])
  const handleToggleComplete = React.useCallback(() => onToggleComplete(nodeId), [onToggleComplete, nodeId])
  const handleAddChild = React.useCallback(() => onAddChild(nodeId), [onAddChild, nodeId])
  const handleUpdateContent = React.useCallback((val: string) => onUpdateContent(nodeId, val), [onUpdateContent, nodeId])
  const handleAddSibling = React.useCallback(() => onAddSibling(nodeId), [onAddSibling, nodeId])
  const handleIndent = React.useCallback(() => onIndent(nodeId), [onIndent, nodeId])
  const handleOutdent = React.useCallback(() => onOutdent(nodeId), [onOutdent, nodeId])
  const handleMoveUp = React.useCallback(() => onMoveUp(nodeId), [onMoveUp, nodeId])
  const handleMoveDown = React.useCallback(() => onMoveDown(nodeId), [onMoveDown, nodeId])
  const handleNavigateUp = React.useCallback(() => onNavigateUp?.(nodeId), [onNavigateUp, nodeId])
  const handleNavigateDown = React.useCallback(() => onNavigateDown?.(nodeId), [onNavigateDown, nodeId])
  const handleFocus = React.useCallback(() => onSetActiveId(nodeId), [onSetActiveId, nodeId])

  const handleNavigateLeft = React.useCallback(() => {
    const currentNode = doc.getNode(nodeId)
    if (!currentNode) return
    if (currentNode.hasChildren() && !currentNode.isCollapsed) {
      onToggleCollapse(nodeId)
    } else if (currentNode.parentId && currentNode.parentId !== doc.rootId) {
      onSetActiveId(currentNode.parentId)
    }
  }, [doc, nodeId, onToggleCollapse, onSetActiveId])

  const handleNavigateRight = React.useCallback(() => {
    const currentNode = doc.getNode(nodeId)
    if (!currentNode) return
    if (currentNode.hasChildren() && currentNode.isCollapsed) {
      onToggleCollapse(nodeId)
    } else if (currentNode.hasChildren() && !currentNode.isCollapsed && currentNode.childrenIds.length > 0) {
      onSetActiveId(currentNode.childrenIds[0])
    }
  }, [doc, nodeId, onToggleCollapse, onSetActiveId])

  const handleDeleteOrOutdent = React.useCallback(() => {
    const currentNode = doc.getNode(nodeId)
    if (!currentNode) return
    const parent = currentNode.parentId ? doc.getNode(currentNode.parentId) : null
    if (parent && parent.id !== doc.rootId) {
      onOutdent(nodeId)
    } else {
      onRequestDeleteNode(nodeId, false)
    }
  }, [doc, nodeId, onOutdent, onRequestDeleteNode])

  const handleAttachClick = React.useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentNode = doc.getNode(nodeId)
    if (!currentNode) return
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length === 0) return

    try {
      const markdowns: string[] = []
      for (const f of files) {
        if (f.type.startsWith('image/')) {
          const res = await processImageFile(f)
          markdowns.push(res.markdown)
        } else {
          const res = await processAttachmentFile(f)
          markdowns.push(res.markdown)
        }
      }
      const newMedia = markdowns.join('\n')
      const updated = currentNode.content.trim() ? `${currentNode.content.trim()}\n${newMedia}` : newMedia
      onUpdateContent(nodeId, updated)
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [doc, nodeId, onUpdateContent])

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
        onIndent(nodeId)
      } else {
        onOutdent(nodeId)
      }
    }
  }

  const node = doc.getNode(nodeId)
  if (!node) return null

  const hasChildren = node.hasChildren()
  const isEditing = activeEditingId === node.id

  return (
    <div
      role="treeitem"
      aria-expanded={hasChildren ? !node.isCollapsed : undefined}
      aria-selected={isEditing}
      aria-level={depth}
      aria-label={getNodeDisplayText(node.content, 'Untitled item')}
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
            onToggleCollapse={handleToggleCollapse}
            onZoomIn={handleZoomIn}
            onToggleComplete={handleToggleComplete}
            onAddChild={handleAddChild}
          />
        </div>

        {/* Content text */}
        <div className="flex-1 min-w-0 pt-0.5 pl-0.5">
          <NodeContent
            nodeId={node.id}
            content={node.content}
            isCompleted={node.isCompleted}
            isFocused={isEditing}
            onChange={handleUpdateContent}
            onAddSibling={handleAddSibling}
            onIndent={handleIndent}
            onOutdent={handleOutdent}
            onDelete={handleDeleteOrOutdent}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onNavigateUp={handleNavigateUp}
            onNavigateDown={handleNavigateDown}
            onNavigateLeft={handleNavigateLeft}
            onNavigateRight={handleNavigateRight}
            onNavigateToWikilink={onNavigateToWikilink}
            onToggleComplete={handleToggleComplete}
            onFocus={handleFocus}
            onSelectTag={onSelectTag}
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

          {/* Attach file (Images, PDF, Docs, Archives...) */}
          <button
            onClick={handleAttachClick}
            title="Attach file (Images, PDF, Docs, Archives...)"
            className="hidden sm:inline-flex p-1 rounded text-[#64748B] dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/80 dark:hover:bg-zinc-700 transition-colors"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>

          {/* Hidden file input for attachment */}
          <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
          />

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
        <div role="group" className="ml-4 sm:ml-5 pl-2 border-l border-[#E2E8F0] dark:border-[#27272A] space-y-0.5">
          {node.childrenIds.map((childId) => (
            <TreeNodeItem
              key={childId}
              nodeId={childId}
              doc={doc}
              depth={depth + 1}
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
              onSelectTag={onSelectTag}
            />
          ))}
        </div>
      )}
    </div>
  )
})
