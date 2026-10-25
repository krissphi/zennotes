import { get, set } from 'idb-keyval'
import { TrashUtils, type TrashItem } from '../models/TrashItem'

const TRASH_STORAGE_KEY = 'zennotes_trash_items'

export class TrashStorageService {
  private static async loadAllRaw(): Promise<TrashItem[]> {
    try {
      const items = (await get<TrashItem[]>(TRASH_STORAGE_KEY)) || []
      // Auto-purge items expired after 7 days
      const validItems = items.filter((item) => !TrashUtils.isExpired(item))
      if (validItems.length !== items.length) {
        await set(TRASH_STORAGE_KEY, validItems)
      }
      return validItems
    } catch (e) {
      console.error('Failed to load trash:', e)
      return []
    }
  }

  public static async loadTrash(notebookId?: string): Promise<TrashItem[]> {
    const all = await this.loadAllRaw()
    if (!notebookId) return all
    return all.filter(
      (item) => item.notebookId === notebookId || (!item.notebookId && notebookId === 'default')
    )
  }

  public static async saveTrash(items: TrashItem[]): Promise<void> {
    try {
      await set(TRASH_STORAGE_KEY, items)
    } catch (e) {
      console.error('Failed to save trash:', e)
    }
  }

  public static async addTrashItem(item: TrashItem, notebookId = 'default'): Promise<TrashItem[]> {
    const all = await this.loadAllRaw()
    const itemWithNotebook: TrashItem = {
      ...item,
      notebookId: item.notebookId || notebookId,
    }
    const updated = [itemWithNotebook, ...all]
    await this.saveTrash(updated)
    return this.loadTrash(notebookId)
  }

  public static async removeTrashItem(id: string, notebookId?: string): Promise<TrashItem[]> {
    const all = await this.loadAllRaw()
    const updated = all.filter((item) => item.id !== id)
    await this.saveTrash(updated)
    return this.loadTrash(notebookId)
  }

  public static async clearAll(notebookId?: string): Promise<TrashItem[]> {
    if (!notebookId) {
      await this.saveTrash([])
      return []
    }
    const all = await this.loadAllRaw()
    const remaining = all.filter(
      (item) => item.notebookId !== notebookId && !(!item.notebookId && notebookId === 'default')
    )
    await this.saveTrash(remaining)
    return []
  }
}
