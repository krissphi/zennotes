import { useEffect } from 'react'

interface UseGlobalKeyboardProps {
  onEscape: () => void
  onCollapseAll: (id: string) => void
  onExpandAll: (id: string) => void
  onUndo: () => void
  onRedo: () => void
  focusedNodeId: string
}

export function useGlobalKeyboard({
  onEscape,
  onCollapseAll,
  onExpandAll,
  onUndo,
  onRedo,
  focusedNodeId,
}: UseGlobalKeyboardProps) {
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape()
        return
      }

      const target = e.target as HTMLElement | null
      if (target?.closest('[role="dialog"]') || target?.closest('.fixed')) return

      const isCtrl = e.ctrlKey || e.metaKey

      // Collapse All / Expand All keyboard shortcuts (Ctrl+Shift+C / Ctrl+Shift+E)
      if (isCtrl && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        onCollapseAll(focusedNodeId)
        return
      }
      if (isCtrl && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        onExpandAll(focusedNodeId)
        return
      }

      // Undo / Redo
      if (isCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) onRedo()
        else onUndo()
        return
      }
      if (isCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        onRedo()
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [onEscape, onCollapseAll, onExpandAll, onUndo, onRedo, focusedNodeId])
}
