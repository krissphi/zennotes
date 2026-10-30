import React from 'react'
import { FolderSync, Download, Trash2, Keyboard, Smartphone } from 'lucide-react'

interface NavbarMenuDropdownProps {
  isOpen: boolean
  onClose: () => void
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

export const NavbarMenuDropdown: React.FC<NavbarMenuDropdownProps> = ({
  isOpen,
  onClose,
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
  if (!isOpen) return null

  return (
    <div className="absolute right-0 top-full mt-2 w-60 sm:w-64 bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] rounded-2xl shadow-2xl py-1.5 z-50 text-xs text-[#0F172A] dark:text-[#F8FAFC] divide-y divide-[#E2E8F0]/70 dark:divide-[#27272A] animate-in fade-in zoom-in-95 duration-100">
      {/* Section 1: Storage & Vault */}
      {onOpenVault && (
        <div className="py-1">
          <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">
            Storage Vault
          </div>
          <button
            onClick={() => {
              onOpenVault()
              onClose()
            }}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800/80 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-1">
              <FolderSync
                className={`w-4 h-4 shrink-0 ${
                  isVaultConnected
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-[#64748B] dark:text-[#94A3B8]'
                }`}
              />
              <span className="truncate">
                {isVaultConnected && vaultFolderName
                  ? `Vault: ${vaultFolderName}`
                  : 'Local Folder Vault'}
              </span>
            </div>
            {isVaultConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            )}
          </button>
        </div>
      )}

      {/* Section 2: Data & Notes Management */}
      <div className="py-1">
        <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">
          Notes & Data
        </div>
        <button
          onClick={() => {
            onOpenExportImport()
            onClose()
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800/80 text-left transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Export / Import Notes</span>
        </button>
        <button
          onClick={() => {
            onOpenTrash()
            onClose()
          }}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800/80 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Trash2 className="w-4 h-4 text-amber-500" />
            <span>Trash & Recycle Bin</span>
          </div>
          {trashCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              {trashCount}
            </span>
          )}
        </button>
      </div>

      {/* Section 3: Help & Installation */}
      <div className="py-1">
        <button
          onClick={() => {
            onOpenShortcuts()
            onClose()
          }}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800/80 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Keyboard className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
            <span>Keyboard Shortcuts</span>
          </div>
          <kbd className="text-[10px] text-[#94A3B8] dark:text-[#64748B] font-mono">?</kbd>
        </button>
        {canInstall && onInstallApp && (
          <button
            onClick={() => {
              onInstallApp()
              onClose()
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800/80 text-left text-emerald-600 dark:text-emerald-400 font-medium transition-colors cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>Install ZenNotes App</span>
          </button>
        )}
      </div>
    </div>
  )
}
