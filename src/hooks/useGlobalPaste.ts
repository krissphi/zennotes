import { useEffect } from 'react'
import { getAllFiles, processAttachmentFile } from '../lib/attachmentUtils'
import { processImageFile } from '../lib/imageUtils'
import { toast } from '../lib/toast'

interface UseGlobalPasteProps {
  focusedNodeId: string
  onAddChild: (parentId: string, content?: string) => string | null
}

export function useGlobalPaste({ focusedNodeId, onAddChild }: UseGlobalPasteProps) {
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) {
        return
      }

      const files = getAllFiles(e.clipboardData)
      if (files.length === 0) return

      e.preventDefault()
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
          console.error('Failed to paste file globally:', err)
          if (err instanceof Error) {
            toast.error(err.message)
          }
        }
      }
    }

    window.addEventListener('paste', handleGlobalPaste)
    return () => window.removeEventListener('paste', handleGlobalPaste)
  }, [focusedNodeId, onAddChild])
}
