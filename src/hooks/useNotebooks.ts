import { useState, useEffect, useCallback } from 'react'
import {
  NotebookRegistryService,
  type NotebookMeta,
} from '../core/services/NotebookRegistryService'
import { IndexedDBStorageService } from '../core/services/IndexedDBStorageService'
import type { TreeDocument } from '../core/models/TreeDocument'

export function useNotebooks() {
  const [notebooks, setNotebooks] = useState<NotebookMeta[]>([])
  const [activeNotebookId, setActiveId] = useState<string>(() =>
    NotebookRegistryService.getActiveNotebookId()
  )

  useEffect(() => {
    NotebookRegistryService.listNotebooks().then((list) => {
      setNotebooks(list)
    })
  }, [])

  const switchNotebook = useCallback((id: string) => {
    NotebookRegistryService.setActiveNotebookId(id)
    setActiveId(id)
  }, [])

  const createNotebook = useCallback(async (title: string) => {
    const created = await NotebookRegistryService.createNotebook(title)
    const list = await NotebookRegistryService.listNotebooks()
    setNotebooks(list)
    setActiveId(created.id)
    return created
  }, [])

  const createNotebookWithDoc = useCallback(async (doc: TreeDocument) => {
    const title = doc.title || 'Imported Notes'
    const created = await NotebookRegistryService.createNotebook(title)
    const storageKey = NotebookRegistryService.getStorageKey(created.id)
    const storageService = new IndexedDBStorageService(storageKey)
    await storageService.saveDocument(doc.toJSON())
    const list = await NotebookRegistryService.listNotebooks()
    setNotebooks(list)
    setActiveId(created.id)
    return created
  }, [])

  const renameNotebook = useCallback(async (id: string, newTitle: string) => {
    await NotebookRegistryService.renameNotebook(id, newTitle)
    const list = await NotebookRegistryService.listNotebooks()
    setNotebooks(list)
  }, [])

  const deleteNotebook = useCallback(async (id: string) => {
    const newActiveId = await NotebookRegistryService.deleteNotebook(id)
    const list = await NotebookRegistryService.listNotebooks()
    setNotebooks(list)
    setActiveId(newActiveId)
  }, [])

  return {
    notebooks,
    activeNotebookId,
    switchNotebook,
    createNotebook,
    createNotebookWithDoc,
    renameNotebook,
    deleteNotebook,
  }
}
