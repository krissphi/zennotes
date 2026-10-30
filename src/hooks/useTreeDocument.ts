import { useState, useEffect, useRef, useCallback } from 'react'
import { TreeDocument } from '../core/models/TreeDocument'
import type { TreeNode } from '../core/models/TreeNode'
import { IndexedDBStorageService } from '../core/services/IndexedDBStorageService'
import { NotebookRegistryService } from '../core/services/NotebookRegistryService'
import { BlobStorageService } from '../core/services/BlobStorageService'
import { useDocumentHistory } from './useDocumentHistory'
import { useTreePersistence } from './useTreePersistence'
import { useTreeTrash } from './useTreeTrash'

export function useTreeDocument(notebookId = 'default') {
  const [doc, setDoc] = useState<TreeDocument>(() => TreeDocument.createDefault())
  const [focusedNodeId, setFocusedNodeId] = useState<string>('root')
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const historyTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingHistoryStateRef = useRef<TreeDocument | null>(null)

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

  const {
    saveStatus,
    triggerAutoSave,
    flushSave,
    activeStorageServiceRef,
  } = useTreePersistence(notebookId, flushHistory, setDoc)

  // Load from IndexedDB on notebookId change ONLY
  useEffect(() => {
    let isCancelled = false
    async function loadData() {
      // Flush any pending save to the PREVIOUS storage instance before switching
      await flushSave()
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

  /**
   * Granular mutation with structural sharing (O(1) node clone instead of O(N) full tree clone).
   * Prevents full tree cloning and massive GC spikes on frequent operations like typing.
   */
  const mutateSingleNode = useCallback(
    (
      nodeId: string,
      updater: (node: TreeNode) => void,
      isTextEdit = false
    ) => {
      setDoc((prev) => {
        const cloned = prev.cloneWithNodeUpdate(nodeId, updater)

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
    mutateSingleNode(nodeId, (node) => node.setContent(content), true)
  }, [mutateSingleNode])

  const updateNote = useCallback((nodeId: string, note: string) => {
    mutateSingleNode(nodeId, (node) => node.setNote(note), true)
  }, [mutateSingleNode])

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

  const {
    trashItems,
    deleteNode,
    restoreFromTrash,
    permanentlyDeleteTrash,
    emptyTrash,
  } = useTreeTrash(
    doc,
    notebookId,
    mutateDoc,
    focusedNodeId,
    setActiveEditingId,
    setFocusedNodeId
  )

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
    mutateSingleNode(nodeId, (node) => node.toggleCollapse())
  }, [mutateSingleNode])

  const collapseAll = useCallback((fromNodeId?: string) => {
    mutateDoc((cloned) => { cloned.collapseAll(fromNodeId) })
  }, [mutateDoc])

  const expandAll = useCallback((fromNodeId?: string) => {
    mutateDoc((cloned) => { cloned.expandAll(fromNodeId) })
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
    zoomToNode,
    zoomOut,
    replaceDocument,
  }
}
