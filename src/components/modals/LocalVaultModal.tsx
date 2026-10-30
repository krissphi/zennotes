import {
  AlertCircle,
  FolderOpen,
  FolderSync,
  HardDrive,
  RefreshCw,
  Unlink,
  X,
} from "lucide-react";
import React, { useEffect } from "react";

interface LocalVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSupported: boolean;
  isConnected: boolean;
  folderName: string | null;
  autoSync: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  onConnect: () => Promise<boolean>;
  onDisconnect: () => Promise<void>;
  onSyncNow: () => Promise<boolean>;
  onToggleAutoSync: () => void;
}

export const LocalVaultModal: React.FC<LocalVaultModalProps> = ({
  isOpen,
  onClose,
  isSupported,
  isConnected,
  folderName,
  autoSync,
  isSyncing,
  lastSyncedAt,
  onConnect,
  onDisconnect,
  onSyncNow,
  onToggleAutoSync,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white dark:bg-[#18181B] rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-[#27272A] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E2E8F0] dark:border-[#27272A]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                Local Folder Vault
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Sync notes directly to your local computer folder
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {!isSupported ? (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Browser Unsupported</p>
                <p className="leading-relaxed">
                  The File System Access API requires a desktop Chromium browser
                  such as <strong>Google Chrome</strong>,{" "}
                  <strong>Microsoft Edge</strong>, or <strong>Brave</strong>.
                  You can still use manual Markdown export anytime.
                </p>
              </div>
            </div>
          ) : !isConnected ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 mx-auto flex items-center justify-center">
                <HardDrive className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Connect Local Folder
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-xs mx-auto">
                  Notes will automatically save as <code>.md</code> files in
                  your chosen directory. You can open and edit them anytime with
                  Obsidian or VS Code.
                </p>
              </div>
              <button
                type="button"
                onClick={onConnect}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Select Vault Folder</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connected Status Card */}
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-emerald-900 dark:text-emerald-200 truncate">
                      Connected: <span className="font-bold">{folderName}</span>
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      {lastSyncedAt
                        ? `Last synced: ${new Date(lastSyncedAt).toLocaleTimeString()}`
                        : "Ready to sync"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onSyncNow}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`}
                  />
                  <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
                </button>
              </div>

              {/* Auto-Sync Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700">
                <div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    Auto-Sync
                  </p>
                  <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                    Save changes to .md files automatically while typing
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onToggleAutoSync}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoSync
                      ? "bg-emerald-600"
                      : "bg-slate-300 dark:bg-zinc-600"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      autoSync ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Disconnect Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onDisconnect}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Disconnect Folder</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
