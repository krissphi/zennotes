import React, { useState, useRef, useEffect } from 'react'
import {
  Sun,
  Moon,
  Undo2,
  Redo2,
  Search,
  MoreHorizontal,
  ChevronsDownUp,
  ChevronsUpDown,
  Network,
} from 'lucide-react'
import { NavbarMenuDropdown } from './NavbarMenuDropdown'

interface NavbarActionsProps {
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  onCollapseAll?: () => void
  onExpandAll?: () => void
  onOpenMobileSearch: () => void
  onToggleTheme: () => void
  isDark: boolean
  onOpenGraph?: () => void
  onOpenVault?: () => void
  isVaultConnected?: boolean
  vaultFolderName?: string | null
  onOpenExportImport: () => void
  onOpenTrash: () => void
  trashCount: number
  onOpenShortcuts: () => void
  canInstall?: boolean
  onInstallApp?: () => void
}

export const NavbarActions: React.FC<NavbarActionsProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onCollapseAll,
  onExpandAll,
  onOpenMobileSearch,
  onToggleTheme,
  isDark,
  onOpenGraph,
  onOpenVault,
  isVaultConnected,
  vaultFolderName,
  onOpenExportImport,
  onOpenTrash,
  trashCount,
  onOpenShortcuts,
  canInstall,
  onInstallApp,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!isMenuOpen) return
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 relative" ref={menuRef}>
      {/* Undo & Redo (Desktop/Tablet) */}
      {onUndo && (
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl + Z)"
          className="hidden sm:inline-flex p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-25 disabled:hover:bg-transparent rounded-lg transition-colors cursor-pointer"
        >
          <Undo2 className="w-4 h-4" />
        </button>
      )}
      {onRedo && (
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl + Y)"
          className="hidden sm:inline-flex p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-25 disabled:hover:bg-transparent rounded-lg transition-colors cursor-pointer"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      )}

      {/* Collapse All / Expand All (Desktop/Tablet) */}
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

      {/* Mobile Search Icon Button */}
      <button
        onClick={onOpenMobileSearch}
        title="Search notes"
        className="md:hidden p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
      >
        <Search className="w-4 h-4" />
      </button>

      {/* Theme Toggle Button */}
      <button
        onClick={onToggleTheme}
        title={isDark ? 'Light Mode' : 'Dark Mode'}
        className="p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
      >
        {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Interactive Graph View Button */}
      {onOpenGraph && (
        <button
          onClick={onOpenGraph}
          title="Interactive Graph View (2D Idea Map)"
          className="p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
        >
          <Network className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </button>
      )}

      {/* Unified More / Settings Menu Button */}
      <button
        onClick={() => setIsMenuOpen((prev) => !prev)}
        title="More options & settings"
        aria-expanded={isMenuOpen}
        aria-label="More options"
        className={`relative p-1.5 rounded-lg transition-colors cursor-pointer ${
          isMenuOpen
            ? 'bg-slate-200/80 dark:bg-zinc-700 text-[#0F172A] dark:text-white'
            : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
        }`}
      >
        <MoreHorizontal className="w-4 h-4" />
        {/* Subtle status indicator dot */}
        {(trashCount > 0 || isVaultConnected) && (
          <span
            className={`absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-white dark:ring-[#09090B] ${
              trashCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          />
        )}
      </button>

      {/* Unified Clean Dropdown Menu for All Devices */}
      <NavbarMenuDropdown
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
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
    </div>
  )
}
