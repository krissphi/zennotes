import { get, set, del } from 'idb-keyval'
import { TrashStorageService } from './TrashStorageService'

export interface NotebookMeta {
  id: string
  title: string
  updatedAt: number
}

const REGISTRY_KEY = 'zennotes_notebook_index'
const ACTIVE_NOTEBOOK_KEY = 'zennotes_active_notebook_id'
const DEFAULT_ID = 'default'

export class NotebookRegistryService {
  public static async listNotebooks(): Promise<NotebookMeta[]> {
    const list = await get<NotebookMeta[]>(REGISTRY_KEY)
    if (!list || list.length === 0) {
      const initial: NotebookMeta[] = [
        { id: DEFAULT_ID, title: 'My Workspace', updatedAt: Date.now() },
      ]
      await set(REGISTRY_KEY, initial)
      return initial
    }
    return list
  }

  public static async createNotebook(title: string): Promise<NotebookMeta> {
    const notebooks = await this.listNotebooks()
    const id = `nb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    const newNotebook: NotebookMeta = {
      id,
      title: title.trim() || 'Untitled Notebook',
      updatedAt: Date.now(),
    }
    notebooks.push(newNotebook)
    await set(REGISTRY_KEY, notebooks)
    this.setActiveNotebookId(id)
    return newNotebook
  }

  public static async renameNotebook(id: string, title: string): Promise<void> {
    const notebooks = await this.listNotebooks()
    const target = notebooks.find((nb) => nb.id === id)
    if (target) {
      target.title = title.trim() || 'Untitled'
      target.updatedAt = Date.now()
      await set(REGISTRY_KEY, notebooks)
    }
  }

  public static async deleteNotebook(id: string): Promise<string> {
    const notebooks = await this.listNotebooks()
    if (notebooks.length <= 1) {
      return notebooks[0].id // Keep at least one notebook
    }

    // Clean up document data in IndexedDB & localStorage
    const storageKey = this.getStorageKey(id)
    try {
      await del(storageKey)
    } catch (e) {
      console.error('Failed to delete notebook document storage:', e)
    }
    localStorage.removeItem(storageKey)

    // Clean up trash for this notebook
    try {
      await TrashStorageService.clearAll(id)
    } catch (e) {
      console.error('Failed to delete notebook trash:', e)
    }

    const filtered = notebooks.filter((nb) => nb.id !== id)
    await set(REGISTRY_KEY, filtered)
    const active = this.getActiveNotebookId()
    if (active === id) {
      this.setActiveNotebookId(filtered[0].id)
      return filtered[0].id
    }
    return active
  }

  public static getActiveNotebookId(): string {
    return localStorage.getItem(ACTIVE_NOTEBOOK_KEY) || DEFAULT_ID
  }

  public static setActiveNotebookId(id: string): void {
    localStorage.setItem(ACTIVE_NOTEBOOK_KEY, id)
  }

  public static getStorageKey(notebookId: string): string {
    if (notebookId === DEFAULT_ID) {
      return 'zennotes_document' // Backwards compatible with existing user notes
    }
    return `zennotes_document_${notebookId}`
  }
}
