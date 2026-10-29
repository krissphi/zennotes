import React, { useEffect } from 'react'
import { X, Download, Copy, Check, ZoomIn } from 'lucide-react'

interface ImageLightboxModalProps {
  isOpen: boolean
  src: string
  alt?: string
  onClose: () => void
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  src,
  alt = 'Image preview',
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false)

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
    const a = document.createElement('a')
    a.href = src
    a.download = `${alt || 'zennotes-image'}.png`
    a.click()
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(src).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      {/* Top Floating Control Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-4 inset-x-4 max-w-4xl mx-auto flex items-center justify-between z-10 px-4 py-2 bg-zinc-900/80 backdrop-blur-lg border border-zinc-700/60 rounded-xl text-white shadow-2xl"
      >
        <div className="flex items-center gap-2 truncate">
          <ZoomIn className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium truncate text-zinc-200">
            {alt || 'Image Preview'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopy}
            title="Copy image URL / Data"
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            title="Download image"
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            title="Close (Esc)"
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image Preview Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-full max-h-[85vh] flex flex-col items-center justify-center select-none"
      >
        <img
          src={src}
          alt={alt}
          className="max-h-[82vh] max-w-[92vw] object-contain rounded-lg shadow-2xl border border-zinc-800/80"
        />
        {alt && alt !== 'image' && (
          <p className="mt-2 text-xs text-zinc-400 font-medium text-center bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
            {alt}
          </p>
        )}
      </div>
    </div>
  )
}
