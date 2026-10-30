import React from 'react'
import { NodeBullet } from './NodeBullet'
import { NodeContent } from './NodeContent'
import { TreeNodeActions } from './TreeNodeActions'
import type { TreeDocument } from '../../core/models/TreeDocument'
import { processImageFile } from '../../lib/imageUtils'
import { processAttachmentFile, getNodeDisplayText, parseNodeMedia } from '../../lib/attachmentUtils'
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
  onZoomIn: (id: string) => void
  onSetActiveId: (id: string | null) => void
  onSelectTag?: (tag: string) => void
  depth?: number
  renderChildren?: boolean
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
  onZoomIn,
  onSetActiveId,
  onSelectTag,
  depth = 1,
  renderChildren = true,
}) => {
  const touchStartX = React.useRef<number | null>(null)
  const touchStartY = React.useRef<number | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleToggleCollapse = React.useCallback(() => onToggleCollapse(nodeId), [onToggleCollapse, nodeId])
  const handleZoomIn = React.useCallback(() => onZoomIn(nodeId), [onZoomIn, nodeId])
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
  const handleBlur = React.useCallback(() => onSetActiveId(null), [onSetActiveId])

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
      const { images, attachments } = parseNodeMedia(currentNode.content)
      const markdowns: string[] = []
      for (const f of files) {
        if (f.type.startsWith('image/')) {
          const res = await processImageFile(f)
          const isDuplicate = images.some((img) => img.src === res.dataUrl)
          if (isDuplicate) {
            toast.info(`Image "${res.name}" is already attached to this note`)
            continue
          }
          markdowns.push(res.markdown)
        } else {
          const res = await processAttachmentFile(f)
          const isDuplicate = attachments.some(
            (att) =>
              att.dataUrl.split('?')[0] === res.dataUrl.split('?')[0] ||
              (att.name.toLowerCase() === res.name.toLowerCase() && att.sizeBytes === f.size)
          )
          if (isDuplicate) {
            toast.info(`File "${res.name}" is already attached to this note`)
            continue
          }
          markdowns.push(res.markdown)
        }
      }
      if (markdowns.length === 0) return
      const newMedia = markdowns.join('\n')
      const updated = currentNode.content ? `${currentNode.content}\n${newMedia}` : newMedia
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
      style={!renderChildren && depth > 1 ? { paddingLeft: `${(depth - 1) * 20}px` } : undefined}
      className="flex flex-col group/row relative"
    >
      {/* Flattened virtual guide line indicator */}
      {!renderChildren && depth > 1 && (
        <div
          className="absolute top-0 bottom-0 pointer-events-none border-l border-[#E2E8F0]/70 dark:border-[#27272A]/70"
          style={{ left: `${(depth - 1) * 20 - 10}px` }}
        />
      )}
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
            isEditing={isEditing}
            onToggleCollapse={handleToggleCollapse}
            onZoomIn={handleZoomIn}
            onAddChild={handleAddChild}
          />
        </div>

        {/* Content text */}
        <div className="flex-1 min-w-0 pt-0.5 pl-0.5">
          <NodeContent
            nodeId={node.id}
            content={node.content}
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
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSelectTag={onSelectTag}
          />
        </div>

        {/* Quick Actions */}
        <TreeNodeActions
          nodeId={node.id}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onAddChild={onAddChild}
          onRequestDeleteNode={(id) => onRequestDeleteNode(id, true)}
          onAttachClick={handleAttachClick}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
        />
      </div>

      {/* Children Nodes (if not collapsed and recursive rendering enabled) with Guide Line */}
      {renderChildren && hasChildren && !node.isCollapsed && (
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
