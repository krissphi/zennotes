import React, { useState, useRef } from 'react'
import { processImageFile } from '../../lib/imageUtils'
import {
  processAttachmentFile,
  hasFiles,
  getAllFiles,
  type ParsedAttachment,
} from '../../lib/attachmentUtils'
import { toast } from '../../lib/toast'

interface UseNodeMediaHandlerOptions {
  cleanText: string
  images: Array<{ alt: string; src: string; fullMatch: string }>
  attachments: ParsedAttachment[]
  onChange: (value: string) => void
}

export function useNodeMediaHandler({
  cleanText,
  images,
  attachments,
  onChange,
}: UseNodeMediaHandlerOptions) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const hasImages = images.length > 0
  const hasAttachments = attachments.length > 0
  const hasMedia = hasImages || hasAttachments

  const handleTextChange = (newText: string) => {
    if (!hasMedia) {
      onChange(newText)
      return
    }
    const mediaParts: string[] = []
    if (hasImages) {
      mediaParts.push(images.map((i) => i.fullMatch).join('\n'))
    }
    if (hasAttachments) {
      mediaParts.push(attachments.map((a) => a.fullMatch).join('\n'))
    }
    const mediaString = mediaParts.join('\n')
    onChange(newText ? `${newText}\n${mediaString}` : mediaString)
  }

  const handleRemoveImage = (fullMatch: string) => {
    const remainingImages = images.filter((i) => i.fullMatch !== fullMatch)
    const parts: string[] = []
    if (cleanText) parts.push(cleanText)
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
    if (cleanText) parts.push(cleanText)
    if (images.length > 0) {
      parts.push(images.map((i) => i.fullMatch).join('\n'))
    }
    if (remainingAttachments.length > 0) {
      parts.push(remainingAttachments.map((a) => a.fullMatch).join('\n'))
    }
    onChange(parts.join('\n'))
  }

  const processAndAppendFiles = async (files: File[]) => {
    if (files.length === 0) return
    const markdowns: string[] = []

    for (const f of files) {
      if (f.type.startsWith('image/')) {
        const res = await processImageFile(f)
        const isDuplicate = images.some((img) => img.src === res.dataUrl)
        if (isDuplicate) {
          toast.info(`Image "${res.name}" is already attached to this note`)
          continue
        }
        markdowns.push(res.markdown)
      } else {
        const res = await processAttachmentFile(f)
        const isDuplicate = attachments.some(
          (att) =>
            att.dataUrl.split('?')[0] === res.dataUrl.split('?')[0] ||
            (att.name.toLowerCase() === res.name.toLowerCase() && att.sizeBytes === f.size)
        )
        if (isDuplicate) {
          toast.info(`File "${res.name}" is already attached to this note`)
          continue
        }
        markdowns.push(res.markdown)
      }
    }

    if (markdowns.length === 0) return

    const newMediaMarkdown = markdowns.join('\n')
    const existingMedia: string[] = []
    if (images.length > 0) existingMedia.push(images.map((i) => i.fullMatch).join('\n'))
    if (attachments.length > 0) existingMedia.push(attachments.map((a) => a.fullMatch).join('\n'))
    existingMedia.push(newMediaMarkdown)
    const combinedMedia = existingMedia.join('\n')

    onChange(cleanText ? `${cleanText}\n${combinedMedia}` : combinedMedia)
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

  return {
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
  }
}
