import React from 'react'
import { Upload, AlertTriangle } from 'lucide-react'

interface ImportTabContentProps {
  docTitle?: string
  importDestination: 'new_notebook' | 'replace_current'
  setImportDestination: (dest: 'new_notebook' | 'replace_current') => void
  importText: string
  setImportText: (text: string) => void
  importError: string | null
  isSubmitting: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onApplyImport: () => void
  onClose: () => void
}

export const ImportTabContent: React.FC<ImportTabContentProps> = ({
  docTitle,
  importDestination,
  setImportDestination,
  importText,
  setImportText,
  importError,
  isSubmitting,
  fileInputRef,
  onFileUpload,
  onApplyImport,
  onClose,
}) => {
  return (
    <div className="mt-5 space-y-4">
      {/* Import destination toggle */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC]">
          Import Destination
        </label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label
            className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
              importDestination === 'new_notebook'
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                : 'border-[#E2E8F0] dark:border-[#27272A] hover:bg-slate-50 dark:hover:bg-zinc-800/50'
            }`}
          >
            <input
              type="radio"
              name="import_dest"
              value="new_notebook"
              checked={importDestination === 'new_notebook'}
              onChange={() => setImportDestination('new_notebook')}
              className="text-emerald-600 accent-emerald-600"
            />
            <span>Create as new notebook</span>
          </label>

          <label
            className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
              importDestination === 'replace_current'
                ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200'
                : 'border-[#E2E8F0] dark:border-[#27272A] hover:bg-slate-50 dark:hover:bg-zinc-800/50'
            }`}
          >
            <input
              type="radio"
              name="import_dest"
              value="replace_current"
              checked={importDestination === 'replace_current'}
              onChange={() => setImportDestination('replace_current')}
              className="text-amber-600 accent-amber-600"
            />
            <span>Replace active notebook</span>
          </label>
        </div>

        {importDestination === 'replace_current' && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Warning: This will overwrite current notes in "{docTitle || 'this workspace'}".</span>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            Paste Markdown, OPML XML, or JSON backup:
          </span>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileUpload}
            accept=".md,.markdown,.json,.opml,.xml,.txt"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
          >
            Or upload file...
          </button>
        </div>

        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="- Item 1&#10;  - Sub item A&#10;  > Note for sub item A&#10;  - Sub item B"
          rows={6}
          className="w-full text-xs font-mono p-3 bg-slate-50 dark:bg-zinc-950/60 border border-[#E2E8F0] dark:border-[#27272A] text-[#0F172A] dark:text-[#F8FAFC] rounded-xl outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {importError && <p className="text-xs text-red-500">{importError}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          disabled={isSubmitting}
          onClick={onApplyImport}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{isSubmitting ? 'Importing...' : 'Import Notes'}</span>
        </button>
      </div>
    </div>
  )
}
