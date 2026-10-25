import React, { useState } from 'react'
import { Network, Home, X, Search } from 'lucide-react'
import { SidebarTreeItem } from './SidebarTreeItem'
import { NotebookSwitcher } from './NotebookSwitcher'
import type { TreeDocument } from '../../core/models/TreeDocument'
import type { NotebookMeta } from '../../core/services/NotebookRegistryService'

interface SidebarProps {
  onClose: () => void
  doc: TreeDocument
  focusedNodeId: string
  onSelectNode: (nodeId: string) => void
  notebooks?: NotebookMeta[]
  activeNotebookId?: string
  onSelectNotebook?: (id: string) => void
  onCreateNotebook?: (title: string) => void
  onRenameNotebook?: (id: string, newTitle: string) => void
  onDeleteNotebook?: (id: string) => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  onClose,
  doc,
  focusedNodeId,
  onSelectNode,
  notebooks,
  activeNotebookId,
  onSelectNotebook,
  onCreateNotebook,
  onRenameNotebook,
  onDeleteNotebook,
}) => {
  const [filterText, setFilterText] = useState('')
  const rootNode = doc.getRootNode()
  const isRootFocused = focusedNodeId === doc.rootId

  // If there's filter text, show matching items flat
  const allNodes = doc.getAllNodes().filter((n) => n.id !== doc.rootId)
  const filteredNodes = filterText.trim()
    ? allNodes.filter((n) => n.content.toLowerCase().includes(filterText.toLowerCase()))
    : null

  const handleNodeClick = (nodeId: string) => {
    onSelectNode(nodeId)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose()
    }
  }

  const handleNotebookSelect = (id: string) => {
    onSelectNotebook?.(id)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose()
    }
  }

  return (
    <aside className="w-full shrink-0 bg-slate-50 dark:bg-[#111113] border-r border-[#E2E8F0] dark:border-[#27272A] flex flex-col h-full select-none transition-colors">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-[#E2E8F0] dark:border-[#27272A]">
        <div className="flex items-center gap-2 text-[#0F172A] dark:text-[#F8FAFC] font-medium text-xs">
          <Network className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Tree Map</span>
        </div>
        <button
          onClick={onClose}
          title="Close Sidebar"
          className="p-1 rounded text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Notebook Switcher Dropdown */}
      {notebooks && activeNotebookId && onSelectNotebook && onCreateNotebook && onRenameNotebook && onDeleteNotebook && (
        <NotebookSwitcher
          notebooks={notebooks}
          activeId={activeNotebookId}
          onSelectNotebook={handleNotebookSelect}
          onCreateNotebook={onCreateNotebook}
          onRenameNotebook={onRenameNotebook}
          onDeleteNotebook={onDeleteNotebook}
        />
      )}

      {/* Filter / Quick Search */}
      <div className="p-2.5 border-b border-[#E2E8F0]/70 dark:border-[#27272A]">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-zinc-900 border border-[#E2E8F0] dark:border-[#27272A] rounded-md">
          <Search className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8]" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter tree..."
            className="w-full text-xs bg-transparent outline-none text-[#0F172A] dark:text-white placeholder:text-[#64748B] dark:placeholder:text-[#94A3B8]"
          />
        </div>
      </div>

      {/* Root Node Quick Jump */}
      <div className="px-2 pt-2">
        <button
          onClick={() => handleNodeClick(doc.rootId)}
          className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-xs transition-colors ${
            isRootFocused
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-[#475569] dark:text-[#CBD5E1] hover:bg-slate-200/60 dark:hover:bg-zinc-800/80 hover:text-[#0F172A] dark:hover:text-white'
          }`}
        >
          <Home className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate flex-1 text-left font-medium">
            {doc.title || 'Root Document'}
          </span>
          <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Root</span>
        </button>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {filteredNodes ? (
          filteredNodes.length > 0 ? (
            filteredNodes.map((node) => (
              <div
                key={node.id}
                onClick={() => handleNodeClick(node.id)}
                className={`py-1.5 px-2 rounded-md cursor-pointer text-xs truncate transition-colors ${
                  node.id === focusedNodeId
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium'
                    : 'text-[#475569] dark:text-[#CBD5E1] hover:bg-slate-200/60 dark:hover:bg-zinc-800/80'
                }`}
              >
                {node.content || '(empty item)'}
              </div>
            ))
          ) : (
            <p className="text-center py-6 text-xs text-[#64748B] dark:text-[#94A3B8]">
              No matching items found
            </p>
          )
        ) : (
          rootNode.childrenIds.map((childId) => (
            <SidebarTreeItem
              key={childId}
              nodeId={childId}
              doc={doc}
              focusedNodeId={focusedNodeId}
              onSelectNode={handleNodeClick}
            />
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3.5 py-2.5 border-t border-[#E2E8F0] dark:border-[#27272A] text-[11px] text-[#64748B] dark:text-[#94A3B8] flex items-center justify-between">
        <span>Total: {doc.getAllNodes().length - 1} items</span>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Click to focus</span>
      </div>
    </aside>
  )
}
