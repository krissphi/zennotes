import { useState, useEffect, useRef, useCallback } from 'react'
import { TreeDocument } from '../core/models/TreeDocument'
import { TreeNode, type TreeNodeData } from '../core/models/TreeNode'
import { IndexedDBStorageService } from '../core/services/IndexedDBStorageService'
import { TrashStorageService } from '../core/services/TrashStorageService'
import { NotebookRegistryService } from '../core/services/NotebookRegistryService'
import { BlobStorageService } from '../core/services/BlobStorageService'
import { useDocumentHistory } from './useDocumentHistory'
import type { TrashItem } from '../core/models/TrashItem'
import { getNodeDisplayText } from '../lib/attachmentUtils'

export function useTreeDocument(notebookId = 'default') {
  const [doc, setDoc] = useState<TreeDocument>(() => TreeDocument.createDefault())
  const [focusedNodeId, setFocusedNodeId] = useState<string>('root')
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [isLoaded, setIsLoaded] = useState(false)
  const [trashItems, setTrashItems] = useState<TrashItem[]>([])
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingDocRef = useRef<TreeDocument | null>(null)
  const historyTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingHistoryStateRef = useRef<TreeDocument | null>(null)

  // Isolated storage service reference locked to the active notebook
  const activeStorageServiceRef = useRef<IndexedDBStorageService>(
    new IndexedDBStorageService(NotebookRegistryService.getStorageKey(notebookId))
  )

  const history = useDocumentHistory()
  const { pushState, resetHistory } = history

  // Flush pending history recording immediately
  const flushHistory = useCallback(() => {
    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current)
      historyTimeoutRef.current = null
    }
    if (pendingHistoryStateRef.current) {
      pushState(pendingHistoryStateRef.current.toJSON())
      pendingHistoryStateRef.current = null
    }
  }, [pushState])

  // Flush pending save immediately
  const flushSave = useCallback(async () => {
    flushHistory()
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    if (!pendingDocRef.current) return
    const docToSave = pendingDocRef.current
    pendingDocRef.current = null
    const storageService = activeStorageServiceRef.current
    try {
      await storageService.saveDocument(docToSave.toJSON())
      setSaveStatus('saved')
    } catch (e) {
      console.error('Save failed:', e)
      setSaveStatus('error')
    }
  }, [flushHistory])

  // Stable ref for flushSave to prevent infinite render loops in effects
  const flushSaveRef = useRef(flushSave)
  useEffect(() => {
    flushSaveRef.current = flushSave
  })

  // Auto-save with debounce
  const triggerAutoSave = useCallback((newDoc: TreeDocument) => {
    pendingDocRef.current = newDoc
    setSaveStatus('saving')
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => { flushSave() }, 600)
  }, [flushSave])

  // Life-cycle listeners
  useEffect(() => {
    const handleBeforeUnload = () => { flushSaveRef.current() }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushSaveRef.current()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Load from IndexedDB on notebookId change ONLY
  useEffect(() => {
    let isCancelled = false
    async function loadData() {
      // Flush any pending save to the PREVIOUS storage instance before switching
      await flushSaveRef.current()
      if (isCancelled) return

      setIsLoaded(false)
      const storageKey = NotebookRegistryService.getStorageKey(notebookId)
      const isolatedStorage = new IndexedDBStorageService(storageKey)
      activeStorageServiceRef.current = isolatedStorage

      try {
        const loadedData = await isolatedStorage.loadDocument()
        if (isCancelled) return
        if (loadedData) {
          const loadedDoc = TreeDocument.fromJSON(loadedData)
          setDoc(loadedDoc)
          setFocusedNodeId(loadedDoc.rootId)
          resetHistory(loadedData)
        } else {
          const freshDoc = TreeDocument.createDefault()
          setDoc(freshDoc)
          setFocusedNodeId(freshDoc.rootId)
          resetHistory(freshDoc.toJSON())
        }
        const loadedTrash = await TrashStorageService.loadTrash(notebookId)
        if (isCancelled) return
        setTrashItems(loadedTrash)
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        if (!isCancelled) setIsLoaded(true)
      }
    }
    loadData()
    return () => {
      isCancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notebookId])

  // Periodic orphan blob cleanup in idle background to maintain 0 byte bloat
  useEffect(() => {
    if (!isLoaded) return
    const timer = setTimeout(() => {
      BlobStorageService.runBlobGC().catch((err) => {
        console.warn('Background Blob GC non-fatal error:', err)
      })
    }, 4000)
    return () => clearTimeout(timer)
  }, [isLoaded])

  const mutateDoc = useCallback(
    (
      mutator: (cloned: TreeDocument) => void,
      newActiveId?: string | null,
      isTextEdit = false
    ) => {
      setDoc((prev) => {
        const cloned = prev.clone()
        mutator(cloned)

        if (isTextEdit) {
          pendingHistoryStateRef.current = cloned
          if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current)
          historyTimeoutRef.current = setTimeout(() => {
            flushHistory()
          }, 800)
        } else {
          flushHistory()
          pushState(cloned.toJSON())
        }

        triggerAutoSave(cloned)
        return cloned
      })
      if (newActiveId !== undefined) setActiveEditingId(newActiveId)
    },
    [triggerAutoSave, pushState, flushHistory]
  )

  const undo = useCallback(() => {
    flushHistory()
    const prevState = history.undo()
    if (prevState) {
      const restored = TreeDocument.fromJSON(prevState)
      setDoc(restored)
      triggerAutoSave(restored)
    }
  }, [flushHistory, history, triggerAutoSave])

  const redo = useCallback(() => {
    flushHistory()
    const nextState = history.redo()
    if (nextState) {
      const restored = TreeDocument.fromJSON(nextState)
      setDoc(restored)
      triggerAutoSave(restored)
    }
  }, [flushHistory, history, triggerAutoSave])

  const updateTitle = useCallback((title: string) => {
    mutateDoc((cloned) => { cloned.title = title }, undefined, true)
  }, [mutateDoc])

  const updateContent = useCallback((nodeId: string, content: string) => {
    mutateDoc((cloned) => { cloned.getNode(nodeId)?.setContent(content) }, undefined, true)
  }, [mutateDoc])

  const updateNote = useCallback((nodeId: string, note: string) => {
    mutateDoc((cloned) => { cloned.getNode(nodeId)?.setNote(note) }, undefined, true)
  }, [mutateDoc])

  const addSibling = useCallback((refId: string, content = '') => {
    let createdId: string | null = null
    mutateDoc((cloned) => { createdId = cloned.createSiblingNode(refId, content).id })
    if (createdId) setActiveEditingId(createdId)
    return createdId
  }, [mutateDoc])

  const addChild = useCallback((parentId: string, content = '') => {
    let createdId: string | null = null
    mutateDoc((cloned) => { createdId = cloned.createChildNode(parentId, undefined, content).id })
    if (createdId) setActiveEditingId(createdId)
    return createdId
  }, [mutateDoc])

  const deleteNode = useCallback((nodeId: string, permanent = false) => {
    const node = doc.getNode(nodeId)
    if (node && nodeId !== doc.rootId) {
      const descendants = doc.getDescendantIds(nodeId)
        .map((dId) => doc.getNode(dId)?.toJSON())
        .filter((d): d is TreeNodeData => Boolean(d))

      if (!permanent) {
        TrashStorageService.addTrashItem({
          id: `trash_${Date.now()}_${node.id}`,
          title: getNodeDisplayText(node.content, '(Untitled item)'),
          note: node.note,
          notebookId,
          originalParentId: node.parentId,
          deletedAt: Date.now(),
          nodeData: node.toJSON(),
          descendants,
        }, notebookId).then(setTrashItems)
      } else {
        // Direct permanent deletion: clean up any attached binary blobs immediately
        const texts = [
          node.content,
          node.note || '',
          ...descendants.map((d) => `${d.content} ${d.note || ''}`),
        ]
        for (const text of texts) {
          for (const bId of BlobStorageService.extractBlobIds(text)) {
            BlobStorageService.deleteBlob(bId).catch(() => {})
          }
        }
      }
    }

    let nextFocus: string | null = null
    mutateDoc((cloned) => { nextFocus = cloned.deleteNode(nodeId).newFocusId })
    if (nextFocus) setActiveEditingId(nextFocus)
  }, [doc, mutateDoc, notebookId])

  const restoreFromTrash = useCallback((item: TrashItem) => {
    mutateDoc((cloned) => {
      cloned.insertRestoredSubtree(
        TreeNode.fromJSON(item.nodeData),
        item.descendants.map(TreeNode.fromJSON)
      )
    }, item.nodeData.id)
    TrashStorageService.removeTrashItem(item.id, notebookId).then(setTrashItems)
  }, [mutateDoc, notebookId])

  const permanentlyDeleteTrash = useCallback(async (id: string) => {
    const item = trashItems.find((t) => t.id === id)
    if (item) {
      const texts = [
        item.nodeData.content,
        item.nodeData.note || '',
        ...item.descendants.map((d) => `${d.content} ${d.note || ''}`),
      ]
      for (const text of texts) {
        for (const bId of BlobStorageService.extractBlobIds(text)) {
          await BlobStorageService.deleteBlob(bId)
        }
      }
    }
    const updated = await TrashStorageService.removeTrashItem(id, notebookId)
    setTrashItems(updated)
  }, [notebookId, trashItems])

  const emptyTrash = useCallback(async () => {
    for (const item of trashItems) {
      const texts = [
        item.nodeData.content,
        item.nodeData.note || '',
        ...item.descendants.map((d) => `${d.content} ${d.note || ''}`),
      ]
      for (const text of texts) {
        for (const bId of BlobStorageService.extractBlobIds(text)) {
          await BlobStorageService.deleteBlob(bId)
        }
      }
    }
    await TrashStorageService.clearAll(notebookId)
    setTrashItems([])
  }, [notebookId, trashItems])

  const indentNode = useCallback((nodeId: string) => {
    mutateDoc((cloned) => { cloned.indentNode(nodeId) }, nodeId)
  }, [mutateDoc])

  const outdentNode = useCallback((nodeId: string) => {
    mutateDoc((cloned) => { cloned.outdentNode(nodeId) }, nodeId)
  }, [mutateDoc])

  const moveNode = useCallback((nodeId: string, dir: 'up' | 'down') => {
    mutateDoc((cloned) => { cloned.moveNode(nodeId, dir) }, nodeId)
  }, [mutateDoc])

  const toggleCollapse = useCallback((nodeId: string) => {
    mutateDoc((cloned) => { cloned.getNode(nodeId)?.toggleCollapse() })
  }, [mutateDoc])

  const collapseAll = useCallback((fromNodeId?: string) => {
    mutateDoc((cloned) => { cloned.collapseAll(fromNodeId) })
  }, [mutateDoc])

  const expandAll = useCallback((fromNodeId?: string) => {
    mutateDoc((cloned) => { cloned.expandAll(fromNodeId) })
  }, [mutateDoc])

  const toggleComplete = useCallback((nodeId: string) => {
    mutateDoc((cloned) => { cloned.getNode(nodeId)?.toggleComplete() })
  }, [mutateDoc])

  const zoomToNode = useCallback((nodeId: string) => { setFocusedNodeId(nodeId) }, [])

  const zoomOut = useCallback(() => {
    if (focusedNodeId === doc.rootId) return
    const current = doc.getNode(focusedNodeId)
    setFocusedNodeId(current && current.parentId ? current.parentId : doc.rootId)
  }, [focusedNodeId, doc])

  const replaceDocument = useCallback((newDoc: TreeDocument) => {
    setDoc(newDoc)
    setFocusedNodeId(newDoc.rootId)
    setActiveEditingId(null)
    history.pushState(newDoc.toJSON())
    triggerAutoSave(newDoc)
  }, [triggerAutoSave, history])

  return {
    doc,
    isLoaded,
    focusedNodeId,
    activeEditingId,
    saveStatus,
    trashItems,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undo,
    redo,
    setActiveEditingId,
    setFocusedNodeId,
    updateTitle,
    updateContent,
    updateNote,
    addSibling,
    addChild,
    deleteNode,
    restoreFromTrash,
    permanentlyDeleteTrash,
    emptyTrash,
    indentNode,
    outdentNode,
    moveNode,
    toggleCollapse,
    collapseAll,
    expandAll,
    toggleComplete,
    zoomToNode,
    zoomOut,
    replaceDocument,
  }
}
