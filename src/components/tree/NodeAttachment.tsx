import React, { useState, useRef, useEffect } from 'react'
import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  File,
  Download,
  Eye,
  Trash2,
  Play,
  Pause,
} from 'lucide-react'
import {
  formatFileSize,
  getAttachmentCategory,
  downloadAttachment,
} from '../../lib/attachmentUtils'
import { FilePreviewModal } from '../modals/FilePreviewModal'
import { BlobStorageService } from '../../core/services/BlobStorageService'

interface NodeAttachmentProps {
  name: string
  dataUrl: string
  sizeBytes: number
  mimeType?: string
  onRemove?: () => void
  className?: string
}

export const NodeAttachment: React.FC<NodeAttachmentProps> = ({
  name,
  dataUrl,
  sizeBytes,
  mimeType = '',
  onRemove,
  className = '',
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [resolvedAudioUrl, setResolvedAudioUrl] = useState<string>('')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const meta = getAttachmentCategory(name, mimeType)
  const isAudio = meta.category === 'audio'
  const isPreviewable =
    meta.category === 'pdf' ||
    meta.category === 'text' ||
    meta.category === 'code' ||
    meta.category === 'audio'

  // Pre-load audio URL if this is an audio attachment
  useEffect(() => {
    let isCancelled = false
    if (isAudio && !resolvedAudioUrl) {
      BlobStorageService.getBlobUrl(dataUrl).then((url) => {
        if (!isCancelled && url) {
          setResolvedAudioUrl(url)
        }
      })
    }
    return () => {
      isCancelled = true
    }
  }, [isAudio, dataUrl, resolvedAudioUrl])

  const handleTogglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isAudio) return

    let urlToPlay = resolvedAudioUrl
    if (!urlToPlay) {
      urlToPlay = await BlobStorageService.getBlobUrl(dataUrl)
      setResolvedAudioUrl(urlToPlay)
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.error('Audio playback error:', err))
      }
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isAudio) {
      void handleTogglePlay(e)
    } else if (isPreviewable) {
      setIsPreviewOpen(true)
    } else {
      downloadAttachment(dataUrl, name)
    }
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    downloadAttachment(dataUrl, name)
  }

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPreviewOpen(true)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (audioRef.current) {
      audioRef.current.pause()
    }
    onRemove?.()
  }

  // Render appropriate icon
  const renderCategoryIcon = () => {
    if (isAudio) {
      return isPlaying ? (
        <Pause className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400 animate-pulse" />
      ) : (
        <Play className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-purple-600 dark:text-purple-400 fill-purple-600 dark:fill-purple-400 ml-0.5" />
      )
    }

    const iconClass = `w-4 h-4 sm:w-4.5 sm:h-4.5 ${meta.colorClass}`
    switch (meta.category) {
      case 'pdf':
        return <FileText className={iconClass} />
      case 'excel':
        return <FileSpreadsheet className={iconClass} />
      case 'archive':
        return <FileArchive className={iconClass} />
      case 'code':
        return <FileCode className={iconClass} />
      default:
        return <File className={iconClass} />
    }
  }

  return (
    <>
      <div
        onClick={handleCardClick}
        title={
          isAudio
            ? `${name} - Click to ${isPlaying ? 'pause' : 'play'} audio inline`
            : `${name} (${formatFileSize(sizeBytes)}) - Click to preview in-app`
        }
        className={`group/attach inline-flex items-center gap-2.5 py-1.5 px-2.5 rounded-xl border select-none transition-all cursor-pointer shadow-xs max-w-full sm:max-w-md ${meta.bgClass} ${meta.borderClass} hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] ${className}`}
      >
        {/* Category Icon / Play Button Box */}
        <div
          onClick={isAudio ? handleTogglePlay : undefined}
          title={isAudio ? (isPlaying ? 'Pause audio' : 'Play audio') : undefined}
          className="shrink-0 p-1.5 rounded-lg bg-white/80 dark:bg-zinc-800/80 shadow-2xs flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        >
          {renderCategoryIcon()}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <span className="text-xs sm:text-[13px] font-medium text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
            <span className="truncate">{name}</span>
            {isPlaying && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Playing
              </span>
            )}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase px-1 py-0.2 rounded text-[9px] bg-slate-200/80 dark:bg-zinc-700/80 text-slate-700 dark:text-slate-300">
              {meta.badgeLabel}
            </span>
            <span>•</span>
            <span>{formatFileSize(sizeBytes)}</span>
            {isAudio && (
              <>
                <span>•</span>
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  {isPlaying ? 'Click to Pause' : 'Click to Play'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Hidden Audio Player for In-Note Audio Playback */}
        {isAudio && resolvedAudioUrl && (
          <audio
            ref={audioRef}
            src={resolvedAudioUrl}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            className="hidden"
          />
        )}

        {/* Action Buttons */}
        <div
          className="flex items-center gap-1 shrink-0 ml-1"
          onClick={(e) => e.stopPropagation()}
        >
          {isPreviewable && (
            <button
              type="button"
              onClick={handlePreview}
              title="Preview in-app"
              className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleDownload}
            title="Download file"
            className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {onRemove && (
            <button
              type="button"
              onClick={handleRemove}
              title="Remove attachment"
              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* In-App File Preview Modal (PDF, Audio Player, Text/Code Reader) */}
      <FilePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        name={name}
        dataUrlOrRef={dataUrl}
        mimeType={mimeType}
        sizeBytes={sizeBytes}
      />
    </>
  )
}
