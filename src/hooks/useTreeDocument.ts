import { useState, useEffect, useRef, useCallback } from 'react'
import { TreeDocument } from '../core/models/TreeDocument'
import { TreeNode, type TreeNodeData } from '../core/models/TreeNode'
import { IndexedDBStorageService } from '../core/services/IndexedDBStorageService'
import { TrashStorageService } from '../core/services/TrashStorageService'
import { NotebookRegistryService } from '../core/services/NotebookRegistryService'
import { useDocumentHistory } from './useDocumentHistory'
import type { TrashItem } from '../core/models/TrashItem'

const storage = new IndexedDBStorageService()

export function useTreeDocument(notebookId = 'default') {
  const [doc, setDoc] = useState<TreeDocument>(() => TreeDocument.createDefault())
  const [focusedNodeId, setFocusedNodeId] = useState<string>('root')
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [isLoaded, setIsLoaded] = useState(false)
  const [trashItems, setTrashItems] = useState<TrashItem[]>([])
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingDocRef = useRef<TreeDocument | null>(null)

  const history = useDocumentHistory()

  // Flush pending save immediately
  const flushSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    if (!pendingDocRef.current) return
    const docToSave = pendingDocRef.current
    pendingDocRef.current = null
    try {
      await storage.saveDocument(docToSave.toJSON())
      setSaveStatus('saved')
    } catch (e) {
      console.error('Save failed:', e)
      setSaveStatus('error')
    }
  }, [])

  // Auto-save with debounce
  const triggerAutoSave = useCallback((newDoc: TreeDocument) => {
    pendingDocRef.current = newDoc
    setSaveStatus('saving')
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => { flushSave() }, 600)
  }, [flushSave])

  // Life-cycle listeners
  useEffect(() => {
    const handleBeforeUnload = () => { flushSave() }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushSave()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [flushSave])

  // Load from IndexedDB on notebookId change
  useEffect(() => {
    async function loadData() {
      await flushSave()
      setIsLoaded(false)
      const storageKey = NotebookRegistryService.getStorageKey(notebookId)
      storage.setStorageKey(storageKey)
      try {
        const loadedData = await storage.loadDocument()
        if (loadedData) {
          const loadedDoc = TreeDocument.fromJSON(loadedData)
          setDoc(loadedDoc)
          setFocusedNodeId(loadedDoc.rootId)
          history.resetHistory(loadedData)
        } else {
          const freshDoc = TreeDocument.createDefault()
          setDoc(freshDoc)
          setFocusedNodeId(freshDoc.rootId)
          history.resetHistory(freshDoc.toJSON())
        }
        const loadedTrash = await TrashStorageService.loadTrash(notebookId)
        setTrashItems(loadedTrash)
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setIsLoaded(true)
      }
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notebookId, flushSave])

  const mutateDoc = useCallback(
    (mutator: (cloned: TreeDocument) => void, newActiveId?: string | null) => {
      setDoc((prev) => {
        const cloned = prev.clone()
        mutator(cloned)
        history.pushState(cloned.toJSON())
        triggerAutoSave(cloned)
        return cloned
      })
      if (newActiveId !== undefined) setActiveEditingId(newActiveId)
    },
    [triggerAutoSave, history]
  )

  const undo = useCallback(() => {
    const prevState = history.undo()
    if (prevState) {
      const restored = TreeDocument.fromJSON(prevState)
      setDoc(restored)
      triggerAutoSave(restored)
    }
  }, [history, triggerAutoSave])

  const redo = useCallback(() => {
    const nextState = history.redo()
    if (nextState) {
      const restored = TreeDocument.fromJSON(nextState)
      setDoc(restored)
      triggerAutoSave(restored)
    }
  }, [history, triggerAutoSave])

  const updateTitle = useCallback((title: string) => {
    mutateDoc((cloned) => { cloned.title = title })
  }, [mutateDoc])

  const updateContent = useCallback((nodeId: string, content: string) => {
    mutateDoc((cloned) => { cloned.getNode(nodeId)?.setContent(content) })
  }, [mutateDoc])

  const updateNote = useCallback((nodeId: string, note: string) => {
    mutateDoc((cloned) => { cloned.getNode(nodeId)?.setNote(note) })
  }, [mutateDoc])

  const addSibling = useCallback((refId: string) => {
    let createdId: string | null = null
    mutateDoc((cloned) => { createdId = cloned.createSiblingNode(refId).id })
    if (createdId) setActiveEditingId(createdId)
    return createdId
  }, [mutateDoc])

  const addChild = useCallback((parentId: string) => {
    let createdId: string | null = null
    mutateDoc((cloned) => { createdId = cloned.createChildNode(parentId).id })
    if (createdId) setActiveEditingId(createdId)
    return createdId
  }, [mutateDoc])

  const deleteNode = useCallback((nodeId: string) => {
    const node = doc.getNode(nodeId)
    if (node && nodeId !== doc.rootId) {
      const descendants = doc.getDescendantIds(nodeId)
        .map((dId) => doc.getNode(dId)?.toJSON())
        .filter((d): d is TreeNodeData => Boolean(d))

      TrashStorageService.addTrashItem({
        id: `trash_${Date.now()}_${node.id}`,
        title: node.content || '(Untitled item)',
        note: node.note,
        notebookId,
        originalParentId: node.parentId,
        deletedAt: Date.now(),
        nodeData: node.toJSON(),
        descendants,
      }, notebookId).then(setTrashItems)
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

  const permanentlyDeleteTrash = useCallback((id: string) => {
    TrashStorageService.removeTrashItem(id, notebookId).then(setTrashItems)
  }, [notebookId])

  const emptyTrash = useCallback(() => {
    TrashStorageService.clearAll(notebookId).then(() => setTrashItems([]))
  }, [notebookId])

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
    toggleComplete,
    zoomToNode,
    zoomOut,
    replaceDocument,
  }
}
