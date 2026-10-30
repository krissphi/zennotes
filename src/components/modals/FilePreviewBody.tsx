import React from 'react'
import { Loader2, Music2, Volume2, Download } from 'lucide-react'
import { formatFileSize, type AttachmentCategoryInfo } from '../../lib/attachmentUtils'
import { highlightCode } from '../../lib/syntaxHighlighter'

interface FilePreviewBodyProps {
  isLoading: boolean
  meta: AttachmentCategoryInfo
  name: string
  sizeBytes: number
  resolvedUrl: string
  textContent: string | null
  renderCategoryIcon: () => React.ReactNode
  onDownload: () => void
}

export const FilePreviewBody: React.FC<FilePreviewBodyProps> = ({
  isLoading,
  meta,
  name,
  sizeBytes,
  resolvedUrl,
  textContent,
  renderCategoryIcon,
  onDownload,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
        <span>Loading file preview...</span>
      </div>
    )
  }

  if (meta.category === 'pdf') {
    return (
      <iframe
        src={resolvedUrl}
        title={name}
        className="w-full h-full border-none bg-white"
      />
    )
  }

  if (meta.category === 'audio') {
    return (
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
    )
  }

  if (textContent !== null) {
    return (
      <div className="w-full h-full overflow-auto p-4 font-mono text-xs leading-relaxed bg-white dark:bg-zinc-900 select-text">
        <pre className="whitespace-pre-wrap">{highlightCode(textContent)}</pre>
      </div>
    )
  }

  return (
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
        onClick={onDownload}
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
      >
        <Download className="w-4 h-4" />
        <span>Download {meta.badgeLabel} File</span>
      </button>
    </div>
  )
}
