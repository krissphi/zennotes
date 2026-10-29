import React, { useState, useEffect } from 'react'
import { Maximize2, ImageOff, Copy, Check, Trash2, Loader2 } from 'lucide-react'
import { ImageLightboxModal } from '../modals/ImageLightboxModal'
import { BlobStorageService } from '../../core/services/BlobStorageService'

interface NodeImageProps {
  src: string
  alt?: string
  onRemove?: () => void
}

export const NodeImage: React.FC<NodeImageProps> = ({ src, alt = '', onRemove }) => {
  const [hasError, setHasError] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const isZenBlob = src.startsWith('zenblob:')
  const [blobSrc, setBlobSrc] = useState('')
  const [isLoading, setIsLoading] = useState(isZenBlob)

  const resolvedSrc = isZenBlob ? blobSrc : src

  useEffect(() => {
    let isCancelled = false
    if (isZenBlob) {
      BlobStorageService.getBlobUrl(src)
        .then((url) => {
          if (isCancelled) return
          if (url) {
            setBlobSrc(url)
            setHasError(false)
          } else {
            setHasError(true)
          }
          setIsLoading(false)
        })
        .catch(() => {
          if (!isCancelled) {
            setHasError(true)
            setIsLoading(false)
          }
        })
    }
    return () => {
      isCancelled = true
    }
  }, [src, isZenBlob])

  const handleCopyMarkdown = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(`![${alt || 'image'}](${src})`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleOpenLightbox = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLightboxOpen(true)
  }

  if (hasError) {
    return (
      <div className="my-1.5 p-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center gap-2 text-xs">
        <ImageOff className="w-4 h-4 shrink-0" />
        <span className="truncate">Unable to load image: {alt || src.substring(0, 30)}</span>
      </div>
    )
  }

  if (isLoading && !blobSrc) {
    return (
      <div className="my-2 p-4 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 flex items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
        <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
        <span>Loading image...</span>
      </div>
    )
  }

  return (
    <>
      <div className="group/img relative my-2 inline-block max-w-full rounded-xl overflow-hidden border border-slate-200/90 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 shadow-xs select-none">
        <div className="relative">
          <img
            src={resolvedSrc}
            alt={alt}
            onError={() => setHasError(true)}
            onClick={handleOpenLightbox}
            className="block max-h-80 sm:max-h-96 w-auto max-w-full object-contain cursor-zoom-in rounded-xl transition-transform hover:scale-[1.005]"
            loading="lazy"
          />

          {/* Hover Floating Action Buttons */}
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/60 backdrop-blur-md p-1 rounded-lg text-white">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              title="Copy image markdown"
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleOpenLightbox}
              title="View full screen"
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                title="Remove image"
                className="p-1 hover:bg-red-500/80 rounded transition-colors text-zinc-300 hover:text-white"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {alt && alt !== 'image' && (
          <div className="px-3 py-1.5 text-[11px] text-[#64748B] dark:text-[#94A3B8] border-t border-slate-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 truncate">
            {alt}
          </div>
        )}
      </div>

      <ImageLightboxModal
        isOpen={isLightboxOpen}
        src={resolvedSrc}
        alt={alt}
        onClose={() => setIsLightboxOpen(false)}
      />
    </>
  )
}
