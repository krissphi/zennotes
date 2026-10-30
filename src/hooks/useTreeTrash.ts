import { useState, useEffect, useCallback } from 'react'
import type { TreeDocument } from '../core/models/TreeDocument'
import { TreeNode, type TreeNodeData } from '../core/models/TreeNode'
import { TrashStorageService } from '../core/services/TrashStorageService'
import { BlobStorageService } from '../core/services/BlobStorageService'
import type { TrashItem } from '../core/models/TrashItem'
import { getNodeDisplayText } from '../lib/attachmentUtils'

export function useTreeTrash(
  doc: TreeDocument,
  notebookId: string,
  mutateDoc: (fn: (cloned: TreeDocument) => void, targetNodeId?: string | null) => void,
  focusedNodeId: string,
  setActiveEditingId: (id: string | null) => void,
  setFocusedNodeId: (id: string) => void
) {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([])

  useEffect(() => {
    let isCancelled = false
    TrashStorageService.loadTrash(notebookId).then((items) => {
      if (!isCancelled) setTrashItems(items)
    })
    return () => {
      isCancelled = true
    }
  }, [notebookId])

  const deleteNode = useCallback(
    (nodeId: string, permanent = false) => {
      const node = doc.getNode(nodeId)
      if (node && nodeId !== doc.rootId) {
        const descendants = doc
          .getDescendantIds(nodeId)
          .map((dId) => doc.getNode(dId)?.toJSON())
          .filter((d): d is TreeNodeData => Boolean(d))

        if (!permanent) {
          TrashStorageService.addTrashItem(
            {
              id: `trash_${Date.now()}_${node.id}`,
              title: getNodeDisplayText(node.content, '(Untitled item)'),
              note: node.note,
              notebookId,
              originalParentId: node.parentId,
              deletedAt: Date.now(),
              nodeData: node.toJSON(),
              descendants,
            },
            notebookId
          ).then(setTrashItems)
        } else {
          // Direct permanent deletion: clean up attached blobs that are no longer referenced anywhere else
          const texts = [
            node.content,
            node.note || '',
            ...descendants.map((d) => `${d.content} ${d.note || ''}`),
          ]
          const deletedIds = new Set([nodeId, ...descendants.map((d) => d.id)])
          const remainingDocTexts = doc
            .getAllNodes()
            .filter((n) => !deletedIds.has(n.id))
            .map((n) => `${n.content} ${n.note || ''}`)
            .join(' ')

          for (const text of texts) {
            for (const bId of BlobStorageService.extractBlobIds(text)) {
              if (!remainingDocTexts.includes(bId)) {
                BlobStorageService.deleteBlob(bId).catch(() => {})
              }
            }
          }
        }
      }

      let nextFocus: string | null = null
      mutateDoc((cloned) => {
        nextFocus = cloned.deleteNode(nodeId).newFocusId
      })
      setActiveEditingId(nextFocus)
      if (
        focusedNodeId === nodeId ||
        (node && doc.getDescendantIds(nodeId).includes(focusedNodeId))
      ) {
        setFocusedNodeId(doc.rootId)
      }
    },
    [doc, mutateDoc, notebookId, focusedNodeId, setActiveEditingId, setFocusedNodeId]
  )

  const restoreFromTrash = useCallback(
    (item: TrashItem) => {
      mutateDoc((cloned) => {
        cloned.insertRestoredSubtree(
          TreeNode.fromJSON(item.nodeData),
          item.descendants.map(TreeNode.fromJSON)
        )
      }, item.nodeData.id)
      TrashStorageService.removeTrashItem(item.id, notebookId).then(setTrashItems)
    },
    [mutateDoc, notebookId]
  )

  const permanentlyDeleteTrash = useCallback(
    async (id: string) => {
      const item = trashItems.find((t) => t.id === id)
      if (item) {
        const texts = [
          item.nodeData.content,
          item.nodeData.note || '',
          ...item.descendants.map((d) => `${d.content} ${d.note || ''}`),
        ]
        const activeDocTexts = doc
          .getAllNodes()
          .map((n) => `${n.content} ${n.note || ''}`)
          .join(' ')
        for (const text of texts) {
          for (const bId of BlobStorageService.extractBlobIds(text)) {
            if (!activeDocTexts.includes(bId)) {
              await BlobStorageService.deleteBlob(bId)
            }
          }
        }
      }
      const updated = await TrashStorageService.removeTrashItem(id, notebookId)
      setTrashItems(updated)
    },
    [doc, notebookId, trashItems]
  )

  const emptyTrash = useCallback(async () => {
    const activeDocTexts = doc
      .getAllNodes()
      .map((n) => `${n.content} ${n.note || ''}`)
      .join(' ')
    for (const item of trashItems) {
      const texts = [
        item.nodeData.content,
        item.nodeData.note || '',
        ...item.descendants.map((d) => `${d.content} ${d.note || ''}`),
      ]
      for (const text of texts) {
        for (const bId of BlobStorageService.extractBlobIds(text)) {
          if (!activeDocTexts.includes(bId)) {
            await BlobStorageService.deleteBlob(bId)
          }
        }
      }
    }
    await TrashStorageService.clearAll(notebookId)
    setTrashItems([])
  }, [doc, notebookId, trashItems])

  return {
    trashItems,
    deleteNode,
    restoreFromTrash,
    permanentlyDeleteTrash,
    emptyTrash,
  }
}
