import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Download,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileAudio,
  FileCode,
  File,
  Loader2,
  Copy,
  Check,
  Music2,
  Volume2,
} from 'lucide-react'
import {
  formatFileSize,
  getAttachmentCategory,
  downloadAttachment,
  dataUrlToBlob,
} from '../../lib/attachmentUtils'
import { BlobStorageService } from '../../core/services/BlobStorageService'
import { highlightCode } from '../../lib/syntaxHighlighter'

interface FilePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  name: string
  dataUrlOrRef: string
  mimeType?: string
  sizeBytes: number
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  name,
  dataUrlOrRef,
  mimeType = '',
  sizeBytes,
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const tempObjectUrlRef = useRef<string | null>(null)

  const meta = getAttachmentCategory(name, mimeType)

  // Resolve blob URL from BlobStorageService or convert data URL
  useEffect(() => {
    let isCancelled = false

    async function resolve() {
      try {
        let url = ''
        if (dataUrlOrRef.startsWith('zenblob:')) {
          url = await BlobStorageService.getBlobUrl(dataUrlOrRef)
        } else if (dataUrlOrRef.startsWith('data:')) {
          const blob = dataUrlToBlob(dataUrlOrRef)
          url = URL.createObjectURL(blob)
          tempObjectUrlRef.current = url
        } else {
          url = dataUrlOrRef
        }

        if (isCancelled) return
        setResolvedUrl(url)

        // If it's a text or code file, read its text content for in-app code viewer
        if (meta.category === 'text' || meta.category === 'code') {
          try {
            const res = await fetch(url)
            const text = await res.text()
            if (!isCancelled) {
              setTextContent(text)
            }
          } catch (e) {
            console.warn('Failed to read text content:', e)
          }
        }
      } catch (err) {
        console.error('Failed to resolve attachment URL:', err)
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    if (isOpen) {
      void resolve()
    }

    return () => {
      isCancelled = true
      if (tempObjectUrlRef.current) {
        URL.revokeObjectURL(tempObjectUrlRef.current)
        tempObjectUrlRef.current = null
      }
    }
  }, [isOpen, dataUrlOrRef, meta.category])

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    downloadAttachment(dataUrlOrRef, name)
  }

  const handleOpenExternal = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (resolvedUrl) {
      window.open(resolvedUrl, '_blank')
    }
  }

  const handleCopyText = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (textContent) {
      navigator.clipboard.writeText(textContent).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  const renderCategoryIcon = () => {
    const iconClass = `w-4 h-4 ${meta.colorClass}`
    switch (meta.category) {
      case 'pdf':
        return <FileText className={iconClass} />
      case 'excel':
        return <FileSpreadsheet className={iconClass} />
      case 'archive':
        return <FileArchive className={iconClass} />
      case 'audio':
        return <FileAudio className={iconClass} />
      case 'code':
        return <FileCode className={iconClass} />
      default:
        return <File className={iconClass} />
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl h-[88vh] max-h-[92vh] bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#0F172A] dark:text-[#F8FAFC]"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] dark:border-[#27272A] bg-slate-50/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 shadow-2xs shrink-0 flex items-center justify-center">
              {renderCategoryIcon()}
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-semibold truncate text-[#0F172A] dark:text-white">
                {name}
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                <span className="font-semibold uppercase px-1 py-0.2 rounded bg-slate-200/80 dark:bg-zinc-700/80">
                  {meta.badgeLabel}
                </span>
                <span>•</span>
                <span>{formatFileSize(sizeBytes)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons in header */}
          <div className="flex items-center gap-1 shrink-0">
            {textContent !== null && (
              <button
                type="button"
                onClick={handleCopyText}
                title="Copy text content"
                className="p-1.5 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenExternal}
              title="Open in new tab"
              className="p-1.5 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleDownload}
              title="Download file"
              className="p-1.5 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close (Esc)"
              className="p-1.5 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-zinc-800 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-100/50 dark:bg-zinc-950 flex flex-col items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
              <span>Loading file preview...</span>
            </div>
          ) : meta.category === 'pdf' ? (
            // PDF In-App Preview (Native embedded browser PDF viewer without opening new tab)
            <iframe
              src={resolvedUrl}
              title={name}
              className="w-full h-full border-none bg-white"
            />
          ) : meta.category === 'audio' ? (
            // Audio In-App Music Player
            <div className="flex flex-col items-center justify-center p-6 sm:p-10 max-w-lg w-full text-center space-y-6">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-xl text-white animate-pulse">
                <Music2 className="w-14 h-14 sm:w-18 sm:h-18 opacity-90" />
                <div className="absolute inset-2 border-2 border-dashed border-white/40 rounded-full" />
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white truncate max-w-md">
                  {name}
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 flex items-center justify-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Audio Preview ({formatFileSize(sizeBytes)})</span>
                </p>
              </div>

              {/* Native In-App Audio Controller */}
              <div className="w-full bg-white dark:bg-zinc-900 border border-[#E2E8F0] dark:border-[#27272A] p-4 rounded-2xl shadow-md">
                <audio
                  controls
                  autoPlay
                  src={resolvedUrl}
                  className="w-full outline-none"
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          ) : textContent !== null ? (
            // Code & Text In-App Viewer
            <div className="w-full h-full overflow-auto p-4 font-mono text-xs leading-relaxed bg-white dark:bg-zinc-900 select-text">
              <pre className="whitespace-pre-wrap">{highlightCode(textContent)}</pre>
            </div>
          ) : (
            // Generic file card
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                {renderCategoryIcon()}
              </div>
              <div>
                <h3 className="text-sm font-semibold">{name}</h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  This file format ({meta.badgeLabel}) does not have an inline viewer.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download {meta.badgeLabel} File</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
