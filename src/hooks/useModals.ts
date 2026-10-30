import { useState, useCallback } from 'react'
import type { TreeNode } from '../core/models/TreeNode'
import { getNodeDisplayText } from '../lib/attachmentUtils'

const SUPPRESS_KEY = 'zennotes_suppress_delete_date'

export interface NodeToDelete {
  id: string
  content: string
  childCount: number
}

export function useModals() {
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [isTrashOpen, setIsTrashOpen] = useState(false)
  const [isVaultOpen, setIsVaultOpen] = useState(false)
  const [isGraphOpen, setIsGraphOpen] = useState(false)
  const [nodeToDelete, setNodeToDelete] = useState<NodeToDelete | null>(null)

  // Cache delete confirmation suppression in state to avoid reading localStorage on every delete request
  const [suppressedDate, setSuppressedDate] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      return localStorage.getItem(SUPPRESS_KEY)
    } catch {
      return null
    }
  })

  const requestDeleteNode = useCallback(
    (
      nodeId: string,
      node: TreeNode | undefined,
      childCount: number,
      forceConfirm = false,
      onDirectDelete: (id: string) => void
    ) => {
      if (!node) return

      const today = new Date().toISOString().split('T')[0]
      const isSuppressed = suppressedDate === today

      if ((!forceConfirm && !node.content.trim() && childCount === 0) || isSuppressed) {
        onDirectDelete(nodeId)
        return
      }

      setNodeToDelete({
        id: node.id,
        content: getNodeDisplayText(node.content, 'Untitled item'),
        childCount,
      })
    },
    [suppressedDate]
  )

  const confirmDelete = useCallback(
    (dontAskToday: boolean, onConfirmDelete: (id: string) => void) => {
      if (nodeToDelete) {
        onConfirmDelete(nodeToDelete.id)
        if (dontAskToday) {
          const today = new Date().toISOString().split('T')[0]
          try {
            localStorage.setItem(SUPPRESS_KEY, today)
          } catch {}
          setSuppressedDate(today)
        }
        setNodeToDelete(null)
      }
    },
    [nodeToDelete]
  )

  const closeAllModals = useCallback(() => {
    setIsExportOpen(false)
    setIsShortcutsOpen(false)
    setIsTrashOpen(false)
    setIsVaultOpen(false)
    setIsGraphOpen(false)
    setNodeToDelete(null)
  }, [])

  return {
    isExportOpen,
    setIsExportOpen,
    isShortcutsOpen,
    setIsShortcutsOpen,
    isTrashOpen,
    setIsTrashOpen,
    isVaultOpen,
    setIsVaultOpen,
    isGraphOpen,
    setIsGraphOpen,
    nodeToDelete,
    setNodeToDelete,
    requestDeleteNode,
    confirmDelete,
    closeAllModals,
  }
}
