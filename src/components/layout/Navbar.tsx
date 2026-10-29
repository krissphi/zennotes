import React, { useState, useRef, useEffect } from 'react'
import {
  Check,
  Loader2,
  Download,
  Keyboard,
  Sparkles,
  Sun,
  Moon,
  Trash2,
  Undo2,
  Redo2,
  Menu,
  Search,
  ArrowLeft,
  MoreVertical,
  ChevronsDownUp,
  ChevronsUpDown,
  FolderSync,
} from 'lucide-react'
import { LiveSearch } from '../search/LiveSearch'
import type { TreeDocument } from '../../core/models/TreeDocument'

interface NavbarProps {
  title: string
  onTitleChange: (newTitle: string) => void
  saveStatus: 'saved' | 'saving' | 'error'
  doc: TreeDocument
  isDark: boolean
  trashCount: number
  canUndo?: boolean
  canRedo?: boolean
  focusedNodeId?: string
  onUndo?: () => void
  onRedo?: () => void
  onZoomOut?: () => void
  onToggleTheme: () => void
  onOpenTrash: () => void
  onSelectNode: (nodeId: string) => void
  onOpenExportImport: () => void
  onOpenShortcuts: () => void
  onToggleSidebar?: () => void
  onGoToLanding?: () => void
  searchQuery?: string | null
  onClearSearchQuery?: () => void
  onCollapseAll?: () => void
  onExpandAll?: () => void
  onOpenVault?: () => void
  isVaultConnected?: boolean
  vaultFolderName?: string | null
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  onTitleChange,
  saveStatus,
  doc,
  isDark,
  trashCount,
  canUndo,
  canRedo,
  focusedNodeId,
  onUndo,
  onRedo,
  onZoomOut,
  onToggleTheme,
  onOpenTrash,
  onSelectNode,
  onOpenExportImport,
  onOpenShortcuts,
  onToggleSidebar,
  onGoToLanding,
  searchQuery,
  onClearSearchQuery,
  onCollapseAll,
  onExpandAll,
  onOpenVault,
  isVaultConnected,
  vaultFolderName,
}) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isHoisted = Boolean(focusedNodeId && focusedNodeId !== doc.rootId)

  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery)

  if (searchQuery && prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery)
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileSearchOpen(true)
    }
  }

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isMobileMenuOpen])

  // Mobile full-width search mode
  if (isMobileSearchOpen) {
    return (
      <header className="h-[52px] shrink-0 z-30 flex items-center px-2.5 sm:px-4 bg-white/95 dark:bg-[#09090B]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#27272A] gap-2">
        <button
          onClick={() => {
            setIsMobileSearchOpen(false)
            onClearSearchQuery?.()
          }}
          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <LiveSearch
            doc={doc}
            onSelectNode={(nodeId) => {
              onSelectNode(nodeId)
              setIsMobileSearchOpen(false)
            }}
            autoFocus
            onClose={() => {
              setIsMobileSearchOpen(false)
              onClearSearchQuery?.()
            }}
            externalQuery={searchQuery}
            onClearExternalQuery={onClearSearchQuery}
          />
        </div>
      </header>
    )
  }

  return (
    <header className="h-[52px] shrink-0 z-30 flex items-center justify-between px-2.5 sm:px-4 md:px-6 bg-white/95 dark:bg-[#09090B]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#27272A] transition-colors">
      {/* Left: Zoom Out Back or Sidebar Toggle, Brand & Document Title */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 max-w-[200px] sm:max-w-xs md:max-w-sm">
        {isHoisted && onZoomOut ? (
          <button
            onClick={onZoomOut}
            title="Back to parent branch"
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Back</span>
          </button>
        ) : onToggleSidebar ? (
          <button
            onClick={onToggleSidebar}
            title="Toggle Tree Map"
            className="p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
        ) : null}

        <button
          onClick={onGoToLanding}
          disabled={!onGoToLanding}
          title={onGoToLanding ? 'Back to Landing Page' : 'ZenNotes'}
          className={`hidden xs:flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 ${
            onGoToLanding ? 'cursor-pointer hover:bg-emerald-500/20 transition-colors' : 'cursor-default'
          }`}
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Note title..."
          className="text-xs sm:text-sm md:text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC] bg-transparent border-none outline-none focus:ring-1 focus:ring-emerald-500/40 rounded px-1 sm:px-1.5 py-0.5 truncate transition-all hover:bg-black/5 dark:hover:bg-white/5 min-w-0"
        />

        <div className="flex items-center text-xs text-[#64748B] dark:text-[#94A3B8] gap-1 pl-0.5 sm:pl-1 shrink-0">
          {saveStatus === 'saving' && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#64748B]" />
          )}
          {saveStatus === 'saved' && (
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          )}
          {saveStatus === 'error' && (
            <span className="text-red-500 font-medium text-[10px]">Error</span>
          )}
        </div>
      </div>

      {/* Center: Live Search Bar (Desktop / Tablet) */}
      <div className="hidden md:flex flex-1 justify-center max-w-lg mx-2">
        <LiveSearch
          doc={doc}
          onSelectNode={onSelectNode}
          externalQuery={searchQuery}
          onClearExternalQuery={onClearSearchQuery}
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0 relative" ref={menuRef}>
        {/* Undo & Redo (Desktop/Tablet) */}
        {onUndo && (
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl + Z)"
            className="hidden sm:inline-flex p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
        )}
        {onRedo && (
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl + Y)"
            className="hidden sm:inline-flex p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        )}

        {/* Collapse All / Expand All (Desktop) */}
        {onCollapseAll && (
          <button
            onClick={onCollapseAll}
            title="Collapse All (Ctrl + Shift + C)"
            className="hidden sm:inline-flex p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronsDownUp className="w-4 h-4" />
          </button>
        )}
        {onExpandAll && (
          <button
            onClick={onExpandAll}
            title="Expand All (Ctrl + Shift + E)"
            className="hidden sm:inline-flex p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronsUpDown className="w-4 h-4" />
          </button>
        )}

        {/* Local Folder Vault (Desktop) */}
        {onOpenVault && (
          <button
            onClick={onOpenVault}
            title={
              isVaultConnected && vaultFolderName
                ? `Local Vault: ${vaultFolderName}`
                : 'Local Folder Vault (Obsidian Sync)'
            }
            className="hidden md:inline-flex relative p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <FolderSync
              className={`w-4 h-4 ${
                isVaultConnected ? 'text-emerald-600 dark:text-emerald-400' : ''
              }`}
            />
            {isVaultConnected && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#09090B]" />
            )}
          </button>
        )}

        {/* Search Button (Mobile) */}
        <button
          onClick={() => setIsMobileSearchOpen(true)}
          title="Search notes"
          className="md:hidden p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title={isDark ? 'Light Mode' : 'Dark Mode'}
          className="p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Trash / Recycle Bin (Desktop) */}
        <button
          onClick={onOpenTrash}
          title="Open Trash"
          className="hidden md:inline-flex relative p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          {trashCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#09090B]" />
          )}
        </button>

        {/* Shortcuts (Desktop) */}
        <button
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts"
          className="hidden md:inline-flex p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Export / Import (Desktop) */}
        <button
          onClick={onOpenExportImport}
          title="Export / Import Notes"
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-[#27272A] hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden lg:inline">Export / Import</span>
        </button>

        {/* Mobile More Actions Menu (...) */}
        <button
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          title="More actions"
          className="md:hidden p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Mobile Dropdown Menu Sheet */}
        {isMobileMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] rounded-xl shadow-xl py-1.5 z-50 text-xs text-[#0F172A] dark:text-[#F8FAFC] animate-in fade-in zoom-in-95 duration-100">
            {onOpenVault && (
              <button
                onClick={() => {
                  onOpenVault()
                  setIsMobileMenuOpen(false)
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FolderSync
                    className={`w-4 h-4 ${
                      isVaultConnected
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-500'
                    }`}
                  />
                  <span>
                    {isVaultConnected && vaultFolderName
                      ? `Vault: ${vaultFolderName}`
                      : 'Local Folder Vault'}
                  </span>
                </div>
                {isVaultConnected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>
            )}

            {onCollapseAll && (
              <button
                onClick={() => {
                  onCollapseAll()
                  setIsMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-left transition-colors cursor-pointer"
              >
                <ChevronsDownUp className="w-4 h-4 text-slate-500" />
                <span>Collapse All</span>
              </button>
            )}

            {onExpandAll && (
              <button
                onClick={() => {
                  onExpandAll()
                  setIsMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-left transition-colors cursor-pointer"
              >
                <ChevronsUpDown className="w-4 h-4 text-slate-500" />
                <span>Expand All</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenExportImport()
                setIsMobileMenuOpen(false)
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-left transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Export / Import</span>
            </button>

            <button
              onClick={() => {
                onOpenTrash()
                setIsMobileMenuOpen(false)
              }}
              className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4 text-amber-500" />
                <span>Trash ({trashCount})</span>
              </div>
            </button>

            <button
              onClick={() => {
                onOpenShortcuts()
                setIsMobileMenuOpen(false)
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-left transition-colors cursor-pointer"
            >
              <Keyboard className="w-4 h-4 text-slate-500" />
              <span>Shortcuts</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
