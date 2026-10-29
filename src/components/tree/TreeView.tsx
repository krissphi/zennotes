import React, { useState, useMemo, useCallback } from 'react'
import { Plus, Paperclip, Zap } from 'lucide-react'
import { TreeNodeItem } from './TreeNodeItem'
import { BranchHeader } from './BranchHeader'
import type { TreeDocument } from '../../core/models/TreeDocument'
import { processImageFile } from '../../lib/imageUtils'
import { hasFiles, getAllFiles, processAttachmentFile } from '../../lib/attachmentUtils'
import { useVirtualList } from '../../hooks/useVirtualList'
import { toast } from '../../lib/toast'

interface TreeViewProps {
  doc: TreeDocument
  focusedNodeId: string
  activeEditingId: string | null
  onUpdateContent: (id: string, content: string) => void
  onUpdateNote: (id: string, note: string) => void
  onAddSibling: (id: string) => void
  onAddChild: (id: string, content?: string) => void
  onRequestDeleteNode: (id: string, forceConfirm?: boolean) => void
  onIndent: (id: string) => void
  onOutdent: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onToggleCollapse: (id: string) => void
  onToggleComplete: (id: string) => void
  onZoomIn: (id: string) => void
  onZoomOut?: () => void
  onSetActiveId: (id: string) => void
  onNavigateToWikilink?: (title: string) => void
  onSelectTag?: (tag: string) => void
  onCollapseAll?: (fromNodeId?: string) => void
  onExpandAll?: (fromNodeId?: string) => void
}

export const TreeView: React.FC<TreeViewProps> = ({
  doc,
  focusedNodeId,
  activeEditingId,
  onUpdateContent,
  onUpdateNote,
  onAddSibling,
  onAddChild,
  onRequestDeleteNode,
  onIndent,
  onOutdent,
  onMoveUp,
  onMoveDown,
  onToggleCollapse,
  onToggleComplete,
  onZoomIn,
  onZoomOut,
  onSetActiveId,
  onNavigateToWikilink,
  onSelectTag,
  onCollapseAll,
  onExpandAll,
}) => {
  const focusedNode = doc.getNode(focusedNodeId) || doc.getRootNode()
  const isRoot = focusedNode.id === doc.rootId
  const childrenIds = focusedNode.childrenIds

  // Virtualization windowing for branches with > 40 items
  const { containerRef, totalHeight, virtualRows, measureElement, isVirtualActive } = useVirtualList({
    itemCount: childrenIds.length,
    estimateHeight: 38,
    overscan: 10,
  })

  // Compute all currently visible (uncollapsed) node IDs in top-to-bottom order for arrow-key navigation
  const visibleNodeIds = useMemo(() => {
    const list: string[] = []
    const traverse = (nodeId: string) => {
      const node = doc.getNode(nodeId)
      if (!node) return
      list.push(nodeId)
      if (!node.isCollapsed && node.childrenIds.length > 0) {
        node.childrenIds.forEach(traverse)
      }
    }
    const startNode = doc.getNode(focusedNodeId) || doc.getRootNode()
    startNode.childrenIds.forEach(traverse)
    return list
  }, [doc, focusedNodeId])

  const handleNavigateUp = useCallback((currentId: string) => {
    const idx = visibleNodeIds.indexOf(currentId)
    if (idx > 0) {
      onSetActiveId(visibleNodeIds[idx - 1])
    }
  }, [visibleNodeIds, onSetActiveId])

  const handleNavigateDown = useCallback((currentId: string) => {
    const idx = visibleNodeIds.indexOf(currentId)
    if (idx !== -1 && idx < visibleNodeIds.length - 1) {
      onSetActiveId(visibleNodeIds[idx + 1])
    }
  }, [visibleNodeIds, onSetActiveId])

  const [isCanvasDragOver, setIsCanvasDragOver] = useState(false)

  const handleCanvasDragOver = (e: React.DragEvent) => {
    if (hasFiles(e)) {
      e.preventDefault()
      setIsCanvasDragOver(true)
    }
  }

  const handleCanvasDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsCanvasDragOver(false)
    }
  }

  const handleCanvasDrop = async (e: React.DragEvent) => {
    if (!hasFiles(e)) return
    e.preventDefault()
    setIsCanvasDragOver(false)

    const files = getAllFiles(e.dataTransfer)
    if (files.length === 0) return

    for (const f of files) {
      try {
        if (f.type.startsWith('image/')) {
          const res = await processImageFile(f)
          onAddChild(focusedNode.id, res.markdown)
        } else {
          const res = await processAttachmentFile(f)
          onAddChild(focusedNode.id, res.markdown)
        }
      } catch (err: unknown) {
        console.error('Failed to process dropped file:', err)
        if (err instanceof Error) toast.error(err.message)
      }
    }
  }

  return (
    <div
      onDragOver={handleCanvasDragOver}
      onDragLeave={handleCanvasDragLeave}
      onDrop={handleCanvasDrop}
      className="relative w-full max-w-3xl mx-auto px-3 sm:px-5 md:px-6 py-4 sm:py-6 pb-32 sm:pb-24 min-h-full"
    >
      {/* Drag & Drop Visual Overlay */}
      {isCanvasDragOver && (
        <div className="fixed inset-0 z-40 bg-emerald-950/20 dark:bg-emerald-950/40 backdrop-blur-xs flex items-center justify-center pointer-events-none animate-in fade-in duration-100">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/95 dark:bg-[#18181B]/95 border-2 border-dashed border-emerald-500 shadow-2xl text-emerald-600 dark:text-emerald-400">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Paperclip className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Drop files to add notes</p>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                Images, PDF, Word, Excel, Archives will be added to this branch
              </p>
            </div>
          </div>
        </div>
      )}

      {/* If Hoisted (Zoomed In), show editable branch header with name & subheader */}
      {!isRoot && (
        <BranchHeader
          key={focusedNode.id}
          node={focusedNode}
          doc={doc}
          breadcrumbs={doc.getBreadcrumbs(focusedNode.id)}
          onUpdateContent={(content) => onUpdateContent(focusedNode.id, content)}
          onUpdateNote={(note) => onUpdateNote(focusedNode.id, note)}
          onZoomOut={onZoomOut}
          onSelectNode={onZoomIn}
          onCollapseAll={() => onCollapseAll?.(focusedNode.id)}
          onExpandAll={() => onExpandAll?.(focusedNode.id)}
        />
      )}

      {/* Children list (Windowed virtual scrolling for branches > 40 items, direct render for standard branches) */}
      {isVirtualActive ? (
        <div ref={containerRef} role="tree" aria-label="Notes hierarchy" className="relative w-full my-1">
          <div className="mb-2 px-2.5 py-1 inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800/40 select-none">
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            <span>Virtual Scrolling Active ({childrenIds.length} items)</span>
          </div>
          <div
            style={{
              height: `${totalHeight}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualRows.map((virtualItem) => {
              const childId = childrenIds[virtualItem.index]
              return (
                <div
                  key={childId}
                  ref={(el) => measureElement(virtualItem.index, el)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.top}px)`,
                  }}
                >
                  <TreeNodeItem
                    nodeId={childId}
                    doc={doc}
                    depth={1}
                    activeEditingId={activeEditingId}
                    onUpdateContent={onUpdateContent}
                    onAddSibling={onAddSibling}
                    onAddChild={onAddChild}
                    onRequestDeleteNode={onRequestDeleteNode}
                    onIndent={onIndent}
                    onOutdent={onOutdent}
                    onMoveUp={onMoveUp}
                    onMoveDown={onMoveDown}
                    onNavigateUp={handleNavigateUp}
                    onNavigateDown={handleNavigateDown}
                    onToggleCollapse={onToggleCollapse}
                    onToggleComplete={onToggleComplete}
                    onZoomIn={onZoomIn}
                    onSetActiveId={onSetActiveId}
                    onNavigateToWikilink={onNavigateToWikilink}
                    onSelectTag={onSelectTag}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div role="tree" aria-label="Notes hierarchy" className="space-y-1">
          {childrenIds.map((childId) => (
            <TreeNodeItem
              key={childId}
              nodeId={childId}
              doc={doc}
              depth={1}
              activeEditingId={activeEditingId}
              onUpdateContent={onUpdateContent}
              onAddSibling={onAddSibling}
              onAddChild={onAddChild}
              onRequestDeleteNode={onRequestDeleteNode}
              onIndent={onIndent}
              onOutdent={onOutdent}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onNavigateUp={handleNavigateUp}
              onNavigateDown={handleNavigateDown}
              onToggleCollapse={onToggleCollapse}
              onToggleComplete={onToggleComplete}
              onZoomIn={onZoomIn}
              onSetActiveId={onSetActiveId}
              onNavigateToWikilink={onNavigateToWikilink}
              onSelectTag={onSelectTag}
            />
          ))}
        </div>
      )}

      {/* Empty State or Bottom Add Button */}
      {childrenIds.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-3">This branch has no items yet.</p>
          <button
            onClick={() => onAddChild(focusedNode.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Item</span>
          </button>
        </div>
      ) : (
        <div className="mt-4 pt-2">
          <button
            onClick={() => onAddChild(focusedNode.id)}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add item below</span>
          </button>
        </div>
      )}
    </div>
  )
}
