import React from 'react'
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
}) => {
  const focusedNode = doc.getNode(focusedNodeId) || doc.getRootNode()
  const isRoot = focusedNode.id === doc.rootId
  const childrenIds = focusedNode.childrenIds

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
            onToggleCollapse={onToggleCollapse}
            onToggleComplete={onToggleComplete}
            onZoomIn={onZoomIn}
            onSetActiveId={onSetActiveId}
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
