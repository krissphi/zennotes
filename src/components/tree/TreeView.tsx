import React, { useMemo, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { TreeNodeItem } from './TreeNodeItem'
import { BranchHeader } from './BranchHeader'
import type { TreeDocument } from '../../core/models/TreeDocument'

interface TreeViewProps {
  doc: TreeDocument
  focusedNodeId: string
  activeEditingId: string | null
  onUpdateContent: (id: string, content: string) => void
  onUpdateNote: (id: string, note: string) => void
  onAddSibling: (id: string) => void
  onAddChild: (id: string) => void
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
}) => {
  const focusedNode = doc.getNode(focusedNodeId) || doc.getRootNode()
  const isRoot = focusedNode.id === doc.rootId
  const childrenIds = focusedNode.childrenIds

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

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-5 md:px-6 py-4 sm:py-6 pb-32 sm:pb-24">
      {/* If Hoisted (Zoomed In), show editable branch header with name & subheader */}
      {!isRoot && (
        <BranchHeader
          node={focusedNode}
          breadcrumbs={doc.getBreadcrumbs(focusedNode.id)}
          onUpdateContent={(content) => onUpdateContent(focusedNode.id, content)}
          onUpdateNote={(note) => onUpdateNote(focusedNode.id, note)}
          onZoomOut={onZoomOut}
          onSelectNode={onZoomIn}
        />
      )}

      {/* Children list */}
      <div className="space-y-1">
        {childrenIds.map((childId) => (
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
            onNavigateUp={handleNavigateUp}
            onNavigateDown={handleNavigateDown}
            onToggleCollapse={onToggleCollapse}
            onToggleComplete={onToggleComplete}
            onZoomIn={onZoomIn}
            onSetActiveId={onSetActiveId}
            onNavigateToWikilink={onNavigateToWikilink}
          />
        ))}
      </div>

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
