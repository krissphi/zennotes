import { useState, useEffect, useRef, useCallback } from 'react'
import { TreeDocument } from '../core/models/TreeDocument'
import { IndexedDBStorageService } from '../core/services/IndexedDBStorageService'
import { NotebookRegistryService } from '../core/services/NotebookRegistryService'

export function useTreePersistence(
  notebookId: string,
  flushHistory: () => void,
  onApplySyncedDoc: (doc: TreeDocument) => void
) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingDocRef = useRef<TreeDocument | null>(null)

  const activeStorageServiceRef = useRef<IndexedDBStorageService>(
    new IndexedDBStorageService(NotebookRegistryService.getStorageKey(notebookId))
  )

  useEffect(() => {
    activeStorageServiceRef.current = new IndexedDBStorageService(
      NotebookRegistryService.getStorageKey(notebookId)
    )
  }, [notebookId])

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
      const docJson = docToSave.toJSON()
      await storageService.saveDocument(docJson)
      setSaveStatus('saved')
      if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
        try {
          const channel = new BroadcastChannel('zennotes_tab_sync')
          channel.postMessage({ notebookId, docData: docJson })
          channel.close()
        } catch {
          // BroadcastChannel unavailable
        }
      }
    } catch (e) {
      console.error('Save failed:', e)
      setSaveStatus('error')
    }
  }, [flushHistory, notebookId])

  // Stable ref for flushSave to prevent infinite render loops in effects
  const flushSaveRef = useRef(flushSave)
  useEffect(() => {
    flushSaveRef.current = flushSave
  })

  // Auto-save with debounce
  const triggerAutoSave = useCallback(
    (newDoc: TreeDocument) => {
      pendingDocRef.current = newDoc
      setSaveStatus('saving')
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        flushSave()
      }, 600)
    },
    [flushSave]
  )

  // Life-cycle listeners
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushSaveRef.current()
    }
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

  // Real-time multi-tab cross-synchronization listener
  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel('zennotes_tab_sync')
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.notebookId === notebookId && event.data?.docData) {
        try {
          const restored = TreeDocument.fromJSON(event.data.docData)
          onApplySyncedDoc(restored)
        } catch (err) {
          console.warn('Failed to apply tab sync doc:', err)
        }
      }
    }
    channel.addEventListener('message', handleMessage)
    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }, [notebookId, onApplySyncedDoc])

  return {
    saveStatus,
    triggerAutoSave,
    flushSave,
    activeStorageServiceRef,
  }
}
