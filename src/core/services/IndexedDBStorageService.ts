import { get, set, del } from 'idb-keyval'
import type { IStorageService } from './IStorageService'
import type { TreeDocumentData } from '../models/TreeDocument'

const DEFAULT_STORAGE_KEY = 'zennotes_document_data'

export class IndexedDBStorageService implements IStorageService {
  constructor(private storageKey: string = DEFAULT_STORAGE_KEY) {}

  public setStorageKey(key: string): void {
    this.storageKey = key
  }

  public async saveDocument(doc: TreeDocumentData): Promise<void> {
    try {
      await set(this.storageKey, doc)
    } catch (err) {
      console.warn('Failed to save to IndexedDB, fallback to localStorage', err)
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(doc))
      } catch (e) {
        console.error('Failed to save to localStorage as well', e)
        throw e
      }
    }
  }

  public async loadDocument(): Promise<TreeDocumentData | null> {
    try {
      const data = await get<TreeDocumentData>(this.storageKey)
      if (data) return data

      const local = localStorage.getItem(this.storageKey)
      if (local) {
        return JSON.parse(local) as TreeDocumentData
      }
      return null
    } catch (err) {
      console.warn('Failed to load from IndexedDB, trying localStorage', err)
      const local = localStorage.getItem(this.storageKey)
      if (local) {
        return JSON.parse(local) as TreeDocumentData
      }
      return null
    }
  }

  public async clearDocument(): Promise<void> {
    try {
      await del(this.storageKey)
    } catch (e) {
      console.error(e)
    }
    localStorage.removeItem(this.storageKey)
  }
}
