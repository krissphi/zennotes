import React, { useState, useRef } from 'react'
import { X, Copy, Check, FileText, Code2, Layers } from 'lucide-react'
import type { TreeDocument } from '../../core/models/TreeDocument'
import { ExportImportService } from '../../core/services/ExportImportService'
import { ImportTabContent } from './ImportTabContent'

interface ExportImportModalProps {
  isOpen: boolean
  onClose: () => void
  doc: TreeDocument
  onImportDocument: (doc: TreeDocument) => void
  onImportAsNewNotebook?: (doc: TreeDocument) => Promise<unknown>
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  doc,
  onImportDocument,
  onImportAsNewNotebook,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [copiedMd, setCopiedMd] = useState(false)
  const [copiedOpml, setCopiedOpml] = useState(false)
  const [importText, setImportText] = useState('')
  const [importDestination, setImportDestination] = useState<'new_notebook' | 'replace_current'>('new_notebook')
  const [importError, setImportError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleCopyMarkdown = () => {
    const md = ExportImportService.exportToMarkdown(doc)
    navigator.clipboard.writeText(md)
    setCopiedMd(true)
    setTimeout(() => setCopiedMd(false), 2000)
  }

  const handleDownloadMarkdown = () => {
    const md = ExportImportService.exportToMarkdown(doc)
    ExportImportService.downloadFile(md, `${doc.title || 'notes'}.md`, 'text/markdown;charset=utf-8')
  }

  const handleDownloadJSON = () => {
    const json = ExportImportService.exportToJSON(doc)
    ExportImportService.downloadFile(json, `${doc.title || 'notes'}.json`, 'application/json;charset=utf-8')
  }

  const handleCopyOPML = () => {
    const opml = ExportImportService.exportToOPML(doc)
    navigator.clipboard.writeText(opml)
    setCopiedOpml(true)
    setTimeout(() => setCopiedOpml(false), 2000)
  }

  const handleDownloadOPML = () => {
    const opml = ExportImportService.exportToOPML(doc)
    ExportImportService.downloadFile(opml, `${doc.title || 'notes'}.opml`, 'text/xml;charset=utf-8')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        setImportText(content)
      }
    }
    reader.readAsText(file)
  }

  const handleApplyImport = async () => {
    setImportError(null)
    const trimmed = importText.trim()
    if (!trimmed) {
      setImportError('Import content cannot be empty')
      return
    }

    try {
      setIsSubmitting(true)
      let imported: TreeDocument
      if (trimmed.startsWith('{')) {
        imported = ExportImportService.importFromJSON(trimmed)
      } else if (trimmed.startsWith('<?xml') || trimmed.toLowerCase().includes('<opml')) {
        imported = ExportImportService.importFromOPML('Imported Outlines', trimmed)
      } else {
        imported = ExportImportService.importFromMarkdown('Imported Notes', trimmed)
      }

      if (importDestination === 'new_notebook' && onImportAsNewNotebook) {
        await onImportAsNewNotebook(imported)
      } else {
        onImportDocument(imported)
      }
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid format'
      setImportError(`Failed to import: ${message}`)
    } finally {
      setIsSubmitting(false)
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
          <div className="mt-5 space-y-4">
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Select your preferred export format for offline backups or transferring to external tools.
            </p>

            {/* Markdown */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                Markdown Format (.md)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyMarkdown}
                  className="flex items-center justify-center gap-1.5 p-2.5 text-xs font-medium border border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-zinc-800/40 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  {copiedMd ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedMd ? 'Copied!' : 'Copy Markdown'}</span>
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  className="flex items-center justify-center gap-1.5 p-2.5 text-xs font-medium border border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-zinc-800/40 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Download .md</span>
                </button>
              </div>
            </div>

            {/* OPML (Standard Outliner format) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                OPML Outliner Standard (.opml)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyOPML}
                  className="flex items-center justify-center gap-1.5 p-2.5 text-xs font-medium border border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-zinc-800/40 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  {copiedOpml ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedOpml ? 'Copied!' : 'Copy OPML'}</span>
                </button>
                <button
                  onClick={handleDownloadOPML}
                  className="flex items-center justify-center gap-1.5 p-2.5 text-xs font-medium border border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-zinc-800/40 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Download .opml</span>
                </button>
              </div>
            </div>

            {/* JSON Full Backup */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                Full Data Backup (.json)
              </span>
              <button
                onClick={handleDownloadJSON}
                className="w-full flex items-center justify-center gap-2 p-2.5 text-xs font-medium border border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-zinc-800/40 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Download Snapshot (.json)</span>
              </button>
            </div>
          </div>
        ) : (
          <ImportTabContent
            docTitle={doc.title}
            importDestination={importDestination}
            setImportDestination={setImportDestination}
            importText={importText}
            setImportText={setImportText}
            importError={importError}
            isSubmitting={isSubmitting}
            fileInputRef={fileInputRef}
            onFileUpload={handleFileUpload}
            onApplyImport={handleApplyImport}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  )
}
