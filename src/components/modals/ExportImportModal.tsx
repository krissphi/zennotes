import React, { useState } from 'react'
import { X, Copy, Check, Upload, FileText, Code2 } from 'lucide-react'
import type { TreeDocument } from '../../core/models/TreeDocument'
import { ExportImportService } from '../../core/services/ExportImportService'

interface ExportImportModalProps {
  isOpen: boolean
  onClose: () => void
  doc: TreeDocument
  onImportDocument: (doc: TreeDocument) => void
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  doc,
  onImportDocument,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [copiedMd, setCopiedMd] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCopyMarkdown = () => {
    const md = ExportImportService.exportToMarkdown(doc)
    navigator.clipboard.writeText(md)
    setCopiedMd(true)
    setTimeout(() => setCopiedMd(false), 2000)
  }

  const handleDownloadMarkdown = () => {
    const md = ExportImportService.exportToMarkdown(doc)
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.title || 'notes'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadJSON = () => {
    const json = ExportImportService.exportToJSON(doc)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.title || 'notes'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleApplyImport = () => {
    setImportError(null)
    const trimmed = importText.trim()
    if (!trimmed) {
      setImportError('Import content cannot be empty')
      return
    }

    try {
      let imported: TreeDocument
      if (trimmed.startsWith('{')) {
        imported = ExportImportService.importFromJSON(trimmed)
      } else {
        imported = ExportImportService.importFromMarkdown('Imported Notes', trimmed)
      }
      onImportDocument(imported)
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid format'
      setImportError(`Failed to import: ${message}`)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] rounded-2xl shadow-xl p-4 sm:p-6 text-[#0F172A] dark:text-[#F8FAFC] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#27272A]">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('export')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'export'
                  ? 'bg-emerald-600 text-white'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              Export Notes
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'import'
                  ? 'bg-emerald-600 text-white'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              Import Notes
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {activeTab === 'export' ? (
          <div className="mt-5 space-y-3">
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Select your preferred export format for offline backups or external tools.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleCopyMarkdown}
                className="flex items-center justify-center gap-2 p-3 text-xs font-medium border border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-zinc-800/40 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                {copiedMd ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedMd ? 'Copied to Clipboard!' : 'Copy Markdown'}</span>
              </button>

              <button
                onClick={handleDownloadMarkdown}
                className="flex items-center justify-center gap-2 p-3 text-xs font-medium border border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-zinc-800/40 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Download .md File</span>
              </button>

              <button
                onClick={handleDownloadJSON}
                className="flex items-center justify-center gap-2 p-3 text-xs font-medium border border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-zinc-800/40 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors sm:col-span-2"
              >
                <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Download Full Backup (.json)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Paste bulleted Markdown (indented with spaces/tabs) or raw JSON backup:
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="- Item 1&#10;  - Sub item A&#10;  - Sub item B"
              rows={6}
              className="w-full text-xs font-mono p-3 bg-slate-50 dark:bg-zinc-950/60 border border-[#E2E8F0] dark:border-[#27272A] text-[#0F172A] dark:text-[#F8FAFC] rounded-xl outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {importError && <p className="text-xs text-red-500">{importError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyImport}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Notes</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
