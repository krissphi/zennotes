import React, { useState } from 'react'
import { processImageFile } from '../../lib/imageUtils'
import { hasFiles, getAllFiles, processAttachmentFile } from '../../lib/attachmentUtils'
import { toast } from '../../lib/toast'

export function useTreeCanvasDrop(
  onAddChild: (id: string, content?: string) => void,
  focusedNodeId: string
) {
  const [isCanvasDragOver, setIsCanvasDragOver] = useState(false)

  const handleCanvasDragOver = (e: React.DragEvent) => {
    if (hasFiles(e)) {
      e.preventDefault()
      setIsCanvasDragOver(true)
    }
  }

  const handleCanvasDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsCanvasDragOver(false)
    }
  }

  const handleCanvasDrop = async (e: React.DragEvent) => {
    if (!hasFiles(e)) return
    e.preventDefault()
    setIsCanvasDragOver(false)

    const files = getAllFiles(e.dataTransfer)
    if (files.length === 0) return

    for (const f of files) {
      try {
        if (f.type.startsWith('image/')) {
          const res = await processImageFile(f)
          onAddChild(focusedNodeId, res.markdown)
        } else {
          const res = await processAttachmentFile(f)
          onAddChild(focusedNodeId, res.markdown)
        }
      } catch (err: unknown) {
        console.error('Failed to process dropped file:', err)
        if (err instanceof Error) toast.error(err.message)
      }
    }
  }

  return {
    isCanvasDragOver,
    handleCanvasDragOver,
    handleCanvasDragLeave,
    handleCanvasDrop,
  }
}
