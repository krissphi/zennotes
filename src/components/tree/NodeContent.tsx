import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import { FormattedNodeText } from './FormattedNodeText'
import { NodeImage } from './NodeImage'
import { NodeAttachment } from './NodeAttachment'
import { processImageFile } from '../../lib/imageUtils'
import {
  parseNodeMedia,
  processAttachmentFile,
  hasFiles,
  getAllFiles,
  formatFileSize,
  MAX_ATTACHMENT_SIZE_BYTES,
} from '../../lib/attachmentUtils'
import { toast } from '../../lib/toast'

interface NodeContentProps {
  nodeId: string
  content: string
  isCompleted: boolean
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
  onToggleComplete: () => void
  onFocus: () => void
  onOpenAttachmentPicker?: (triggerFn: () => void) => void
  onSelectTag?: (tag: string) => void
}

export const NodeContent: React.FC<NodeContentProps> = ({
  content,
  isCompleted,
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
  onToggleComplete,
  onFocus,
  onSelectTag,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Separate markdown image & attachment tags from clean text so users never see raw base64 code
  const { cleanText, images, attachments } = useMemo(() => parseNodeMedia(content), [content])
  const hasImages = images.length > 0
  const hasAttachments = attachments.length > 0
  const hasMedia = hasImages || hasAttachments

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

  const [isDragOver, setIsDragOver] = useState(false)

  const handleTextChange = (newText: string) => {
    if (!hasMedia) {
      onChange(newText)
      return
    }
    const trimmed = newText.trim()
    const mediaParts: string[] = []
    if (hasImages) {
      mediaParts.push(images.map((i) => i.fullMatch).join('\n'))
    }
    if (hasAttachments) {
      mediaParts.push(attachments.map((a) => a.fullMatch).join('\n'))
    }
    const mediaString = mediaParts.join('\n')
    onChange(trimmed ? `${trimmed}\n${mediaString}` : mediaString)
  }

  const handleRemoveImage = (fullMatch: string) => {
    const remainingImages = images.filter((i) => i.fullMatch !== fullMatch)
    const parts: string[] = []
    if (cleanText.trim()) parts.push(cleanText.trim())
    if (remainingImages.length > 0) {
      parts.push(remainingImages.map((i) => i.fullMatch).join('\n'))
    }
    if (attachments.length > 0) {
      parts.push(attachments.map((a) => a.fullMatch).join('\n'))
    }
    onChange(parts.join('\n'))
  }

  const handleRemoveAttachment = (fullMatch: string) => {
    const remainingAttachments = attachments.filter((a) => a.fullMatch !== fullMatch)
    const parts: string[] = []
    if (cleanText.trim()) parts.push(cleanText.trim())
    if (images.length > 0) {
      parts.push(images.map((i) => i.fullMatch).join('\n'))
    }
    if (remainingAttachments.length > 0) {
      parts.push(remainingAttachments.map((a) => a.fullMatch).join('\n'))
    }
    onChange(parts.join('\n'))
  }

  // Common helper to process an array of files into markdown and append to the node
  const processAndAppendFiles = async (files: File[]) => {
    if (files.length === 0) return
    const markdowns: string[] = []

    for (const f of files) {
      if (f.type.startsWith('image/')) {
        const res = await processImageFile(f)
        markdowns.push(res.markdown)
      } else {
        const res = await processAttachmentFile(f)
        markdowns.push(res.markdown)
      }
    }

    const newMediaMarkdown = markdowns.join('\n')
    const existingMedia: string[] = []
    if (images.length > 0) existingMedia.push(images.map((i) => i.fullMatch).join('\n'))
    if (attachments.length > 0) existingMedia.push(attachments.map((a) => a.fullMatch).join('\n'))
    existingMedia.push(newMediaMarkdown)
    const combinedMedia = existingMedia.join('\n')

    onChange(cleanText.trim() ? `${cleanText.trim()}\n${combinedMedia}` : combinedMedia)
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedFiles = getAllFiles(e.clipboardData)
    if (pastedFiles.length === 0) return

    e.preventDefault()
    try {
      await processAndAppendFiles(pastedFiles)
    } catch (err: unknown) {
      console.error('Failed to paste file:', err)
      if (err instanceof Error) {
        toast.error(err.message)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (hasFiles(e)) {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    if (!hasFiles(e)) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const droppedFiles = getAllFiles(e.dataTransfer)
    if (droppedFiles.length === 0) return

    try {
      await processAndAppendFiles(droppedFiles)
    } catch (err: unknown) {
      console.error('Failed to drop file:', err)
      if (err instanceof Error) {
        toast.error(err.message)
      }
    }
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length === 0) return

    try {
      await processAndAppendFiles(files)
    } catch (err: unknown) {
      console.error('Failed to attach file:', err)
      if (err instanceof Error) {
        toast.error(err.message)
      }
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      onToggleComplete()
      return
    }

    if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault()
      onMoveUp()
      return
    }
    if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault()
      onMoveDown()
      return
    }

    // Normal ArrowUp / ArrowDown / ArrowLeft / ArrowRight navigation between nodes when at text boundary
    if (!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      if (e.key === 'ArrowUp' && textareaRef.current) {
        const { selectionStart, selectionEnd } = textareaRef.current
        if (selectionStart === 0 && selectionEnd === 0) {
          e.preventDefault()
          onNavigateUp?.()
          return
        }
      }
      if (e.key === 'ArrowDown' && textareaRef.current) {
        const { selectionStart, selectionEnd } = textareaRef.current
        if (selectionStart === cleanText.length && selectionEnd === cleanText.length) {
          e.preventDefault()
          onNavigateDown?.()
          return
        }
      }
      if (e.key === 'ArrowLeft' && textareaRef.current) {
        const { selectionStart, selectionEnd } = textareaRef.current
        if (selectionStart === 0 && selectionEnd === 0) {
          e.preventDefault()
          onNavigateLeft?.()
          return
        }
      }
      if (e.key === 'ArrowRight' && textareaRef.current) {
        const { selectionStart, selectionEnd } = textareaRef.current
        if (selectionStart === cleanText.length && selectionEnd === cleanText.length) {
          e.preventDefault()
          onNavigateRight?.()
          return
        }
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) onOutdent()
      else onIndent()
      return
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onAddSibling()
      return
    }

    if (e.key === 'Backspace' && cleanText === '') {
      e.preventDefault()
      if (hasAttachments) {
        // Remove the last attachment first
        handleRemoveAttachment(attachments[attachments.length - 1].fullMatch)
      } else if (hasImages) {
        // Remove the last image next
        handleRemoveImage(images[images.length - 1].fullMatch)
      } else {
        onDelete()
      }
    }
  }

  const hasFormatting = /#[a-zA-Z0-9_-]+|https?:\/\/|`|\[\[/.test(cleanText)

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
            isCompleted={isCompleted}
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
            } ${
              isCompleted
                ? 'line-through text-[#64748B]/70 dark:text-[#94A3B8]/60'
                : 'text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] dark:placeholder:text-[#52525B]'
            }`}
          />
        )
      )}
    </div>
  )
}
