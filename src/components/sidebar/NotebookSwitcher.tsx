import React, { useState, useRef, useEffect } from 'react'
import { BookMarked, ChevronDown, Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import type { NotebookMeta } from '../../core/services/NotebookRegistryService'

interface NotebookSwitcherProps {
  notebooks: NotebookMeta[]
  activeId: string
  onSelectNotebook: (id: string) => void
  onCreateNotebook: (title: string) => void
  onRenameNotebook: (id: string, newTitle: string) => void
  onDeleteNotebook: (id: string) => void
}

export const NotebookSwitcher: React.FC<NotebookSwitcherProps> = ({
  notebooks,
  activeId,
  onSelectNotebook,
  onCreateNotebook,
  onRenameNotebook,
  onDeleteNotebook,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [notebookToDelete, setNotebookToDelete] = useState<NotebookMeta | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeNotebook = notebooks.find((nb) => nb.id === activeId) || notebooks[0]

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setIsCreating(false)
        setEditingId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleStartCreate = () => {
    setIsCreating(true)
    setNewTitle('')
  }

  const handleConfirmCreate = () => {
    if (newTitle.trim()) {
      onCreateNotebook(newTitle.trim())
      setIsCreating(false)
      setNewTitle('')
      setIsOpen(false)
    }
  }

  const handleStartRename = (nb: NotebookMeta, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(nb.id)
    setEditTitle(nb.title)
  }

  const handleConfirmRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (editTitle.trim()) {
      onRenameNotebook(id, editTitle.trim())
      setEditingId(null)
    }
  }

  return (
    <div ref={dropdownRef} className="relative w-full px-2.5 pt-2">
      {/* Current Notebook Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-[#E2E8F0] dark:border-[#27272A] hover:border-emerald-500/40 text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] transition-colors shadow-2xs"
      >
        <div className="flex items-center gap-2 truncate">
          <BookMarked className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="truncate">{activeNotebook?.title || 'Notebook'}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[#64748B] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-2.5 right-2.5 mt-1.5 z-50 bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] rounded-xl shadow-xl overflow-hidden divide-y divide-[#E2E8F0]/60 dark:divide-[#27272A] animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-52 overflow-y-auto p-1 space-y-0.5">
            {notebooks.map((nb) => {
              const isActive = nb.id === activeId
              const isRenaming = editingId === nb.id

              if (isRenaming) {
                return (
                  <div key={nb.id} className="flex items-center gap-1 p-1">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      autoFocus
                      className="flex-1 px-2 py-1 text-xs bg-slate-100 dark:bg-zinc-800 rounded outline-none border border-emerald-500 text-[#0F172A] dark:text-white"
                      onKeyDown={(e) => e.key === 'Enter' && handleConfirmRename(nb.id, e as unknown as React.MouseEvent)}
                    />
                    <button onClick={(e) => handleConfirmRename(nb.id, e)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                      <Check className="w-3 h-3" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1 text-[#64748B] hover:bg-slate-100 rounded">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )
              }

              return (
                <div
                  key={nb.id}
                  onClick={() => {
                    onSelectNotebook(nb.id)
                    setIsOpen(false)
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-xs transition-colors group ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-[#475569] dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-[#0F172A] dark:hover:text-white'
                  }`}
                >
                  <span className="truncate flex-1">{nb.title}</span>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleStartRename(nb, e)}
                      title="Rename Notebook"
                      className="p-1 hover:text-[#0F172A] dark:hover:text-white rounded"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {notebooks.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setNotebookToDelete(nb)
                        }}
                        title="Delete Notebook"
                        className="p-1 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Delete Notebook Confirmation */}
          {notebookToDelete && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/60 border-t border-red-200 dark:border-red-900/60 text-xs">
              <p className="font-semibold text-red-900 dark:text-red-200">
                Delete "{notebookToDelete.title}"?
              </p>
              <p className="text-[11px] text-red-700 dark:text-red-300/80 mt-0.5 leading-snug">
                All notes and trash in this notebook will be permanently erased.
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setNotebookToDelete(null)}
                  className="px-2 py-1 text-[11px] font-medium rounded-md bg-white dark:bg-zinc-800 text-[#475569] dark:text-[#CBD5E1] border border-[#E2E8F0] dark:border-[#27272A] hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteNotebook(notebookToDelete.id)
                    setNotebookToDelete(null)
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}

          {/* Create New Notebook Section */}
          <div className="p-1.5 bg-slate-50/70 dark:bg-zinc-900/60">
            {isCreating ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Notebook name..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  className="flex-1 px-2 py-1 text-xs bg-white dark:bg-zinc-800 rounded outline-none border border-emerald-500 text-[#0F172A] dark:text-white"
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmCreate()}
                />
                <button
                  onClick={handleConfirmCreate}
                  className="px-2 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                >
                  Add
                </button>
                <button onClick={() => setIsCreating(false)} className="p-1 text-[#64748B] hover:bg-slate-200 rounded">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleStartCreate}
                className="w-full flex items-center justify-center gap-1.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Notebook</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
