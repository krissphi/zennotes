import React, { useState } from 'react'
import {
  Check,
  Loader2,
  Sparkles,
  Menu,
  ArrowLeft,
} from 'lucide-react'
import { LiveSearch } from '../search/LiveSearch'
import { MobileSearchNavbar } from './MobileSearchNavbar'
import { NavbarActions } from './NavbarActions'
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
  onInstallApp?: () => void
  canInstall?: boolean
  onOpenGraph?: () => void
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
  onInstallApp,
  canInstall,
  onOpenGraph,
}) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const isHoisted = Boolean(focusedNodeId && focusedNodeId !== doc.rootId)
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery)

  if (searchQuery && prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery)
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileSearchOpen(true)
    }
  }

  // Mobile full-width search mode
  if (isMobileSearchOpen) {
    return (
      <MobileSearchNavbar
        doc={doc}
        searchQuery={searchQuery}
        onSelectNode={onSelectNode}
        onClose={() => setIsMobileSearchOpen(false)}
        onClearSearchQuery={onClearSearchQuery}
      />
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

      {/* Right: Clean, Minimalist Action Area */}
      <NavbarActions
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
        onCollapseAll={onCollapseAll}
        onExpandAll={onExpandAll}
        onOpenMobileSearch={() => setIsMobileSearchOpen(true)}
        onToggleTheme={onToggleTheme}
        isDark={isDark}
        onOpenGraph={onOpenGraph}
        onOpenVault={onOpenVault}
        isVaultConnected={isVaultConnected}
        vaultFolderName={vaultFolderName}
        onOpenExportImport={onOpenExportImport}
        onOpenTrash={onOpenTrash}
        trashCount={trashCount}
        onOpenShortcuts={onOpenShortcuts}
        canInstall={canInstall}
        onInstallApp={onInstallApp}
      />
    </header>
  )
}
