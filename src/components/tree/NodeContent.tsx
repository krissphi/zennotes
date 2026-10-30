import React, { useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import { FormattedNodeText } from './FormattedNodeText'
import { NodeImage } from './NodeImage'
import { NodeAttachment } from './NodeAttachment'
import {
  parseNodeMedia,
  formatFileSize,
  MAX_ATTACHMENT_SIZE_BYTES,
} from '../../lib/attachmentUtils'
import { checkHasRichFormatting } from '../../lib/formattingUtils'
import { useNodeMediaHandler } from './useNodeMediaHandler'
import { useNodeKeyboard } from './useNodeKeyboard'

interface NodeContentProps {
  nodeId: string
  content: string
  isFocused: boolean
  onChange: (value: string) => void
  onAddSibling: () => void
  onIndent: () => void
  onOutdent: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onNavigateUp?: () => void
  onNavigateDown?: () => void
  onNavigateLeft?: () => void
  onNavigateRight?: () => void
  onNavigateToWikilink?: (title: string) => void
  onFocus: () => void
  onBlur?: () => void
  onOpenAttachmentPicker?: (triggerFn: () => void) => void
  onSelectTag?: (tag: string) => void
}

export const NodeContent: React.FC<NodeContentProps> = ({
  content,
  isFocused,
  onChange,
  onAddSibling,
  onIndent,
  onOutdent,
  onDelete,
  onMoveUp,
  onMoveDown,
  onNavigateUp,
  onNavigateDown,
  onNavigateLeft,
  onNavigateRight,
  onNavigateToWikilink,
  onFocus,
  onBlur,
  onSelectTag,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Separate markdown image & attachment tags from clean text so users never see raw base64 code
  const { cleanText, images, attachments } = useMemo(() => parseNodeMedia(content), [content])

  const {
    fileInputRef,
    isDragOver,
    hasImages,
    hasAttachments,
    hasMedia,
    handleTextChange,
    handleRemoveImage,
    handleRemoveAttachment,
    handlePaste,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
  } = useNodeMediaHandler({
    cleanText,
    images,
    attachments,
    onChange,
  })

  const { handleKeyDown } = useNodeKeyboard({
    textareaRef,
    cleanText,
    handleTextChange,
    onBlur,
    onMoveUp,
    onMoveDown,
    onNavigateUp,
    onNavigateDown,
    onNavigateLeft,
    onNavigateRight,
    onIndent,
    onOutdent,
    onAddSibling,
    onDelete,
    hasAttachments,
    hasImages,
    attachments,
    images,
    handleRemoveAttachment,
    handleRemoveImage,
  })

  // Focus input when requested
  useEffect(() => {
    if (isFocused && textareaRef.current && document.activeElement !== textareaRef.current) {
      textareaRef.current.focus()
      const len = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(len, len)
    }
  }, [isFocused])

  // Synchronous height adjustment that responds to text changes AND dynamic window resizing
  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return

    // If native CSS field-sizing is supported, CSS handles resizing automatically
    if (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('field-sizing', 'content')) {
      el.style.height = ''
      return
    }

    const adjust = () => {
      el.style.height = 'auto'
      el.style.height = `${Math.max(24, el.scrollHeight)}px`
    }

    adjust()
    window.addEventListener('resize', adjust)
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && el.parentElement) {
      ro = new ResizeObserver(adjust)
      ro.observe(el.parentElement)
    }

    return () => {
      window.removeEventListener('resize', adjust)
      if (ro) ro.disconnect()
    }
  }, [cleanText])

  const handleContainerClick = () => {
    onFocus()
    textareaRef.current?.focus()
  }

  const hasFormatting = checkHasRichFormatting(cleanText)

  return (
    <div
      onClick={handleContainerClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full min-h-[24px] cursor-text rounded-lg transition-all ${
        isDragOver
          ? 'ring-2 ring-emerald-500/80 bg-emerald-50/60 dark:bg-emerald-950/40 p-1 -m-1'
          : ''
      }`}
    >
      {/* Hidden file picker input for attaching any file directly */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        onChange={handleFileInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* 1. Visually rendered images (Visible in BOTH edit mode and view mode) */}
      {hasImages && (
        <div className="flex flex-col gap-2 my-1" onClick={(e) => e.stopPropagation()}>
          {images.map((img, idx) => (
            <NodeImage
              key={`node-img-${idx}`}
              src={img.src}
              alt={img.alt}
              onRemove={() => handleRemoveImage(img.fullMatch)}
            />
          ))}
        </div>
      )}

      {/* 2. Visually rendered file attachments (PDF, DOCX, XLSX, ZIP, audio, etc.) */}
      {hasAttachments && (
        <div className="flex flex-wrap gap-2 my-1.5" onClick={(e) => e.stopPropagation()}>
          {attachments.map((att, idx) => (
            <NodeAttachment
              key={`node-att-${idx}-${att.name}`}
              name={att.name}
              dataUrl={att.dataUrl}
              sizeBytes={att.sizeBytes}
              mimeType={att.mimeType}
              onRemove={() => handleRemoveAttachment(att.fullMatch)}
            />
          ))}
        </div>
      )}

      {/* 3. Text / Note Content (Users only type clean text; never raw base64 code) */}
      {!isFocused && hasFormatting ? (
        <div className="w-full">
          <FormattedNodeText
            content={cleanText}
            onActivate={handleContainerClick}
            onNavigateToWikilink={onNavigateToWikilink}
            onSelectTag={onSelectTag}
          />
          {/* Kept mounted for instant focus transitions */}
          <textarea
            ref={textareaRef}
            value={cleanText}
            rows={1}
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            onPaste={handlePaste}
            className="sr-only"
          />
        </div>
      ) : (
        (isFocused || cleanText.trim().length > 0 || !hasMedia) && (
          <textarea
            ref={textareaRef}
            value={cleanText}
            rows={1}
            placeholder={
              hasMedia
                ? 'Add caption / text...'
                : isDragOver
                  ? `Drop to attach (Max ${formatFileSize(MAX_ATTACHMENT_SIZE_BYTES)})...`
                  : 'Type note...'
            }
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            onPaste={handlePaste}
            className={`w-full resize-none overflow-hidden bg-transparent text-sm leading-relaxed outline-none border-none py-0.5 px-0 ${
              cleanText.trim().startsWith('```') ? 'font-mono text-xs sm:text-[13px]' : ''
            } text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] dark:placeholder:text-[#52525B]`}
          />
        )
      )}
    </div>
  )
}
