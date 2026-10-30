import { createStore, get, set, del, keys } from 'idb-keyval'
import { BlobGCService, type BlobGCStats } from './BlobGCService'

export interface BlobRecord {
  id: string
  name: string
  mimeType: string
  sizeBytes: number
  blob?: Blob
  dataUrl?: string
  createdAt: number
}

// In-memory fallback for environments without IndexedDB (e.g. Vitest / Node)
const memoryStore = new Map<string, BlobRecord>()

// Object URL cache to prevent creating duplicate object URLs
const objectUrlCache = new Map<string, string>()

// Check IndexedDB availability safely
function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined'
}

let customStore: ReturnType<typeof createStore> | null = null
if (isIndexedDBAvailable()) {
  try {
    customStore = createStore('zennotes_blobs_db', 'blobs')
  } catch (e) {
    console.warn('Failed to initialize IndexedDB store for blobs:', e)
  }
}

export class BlobStorageService {
  public static async saveBlob(record: {
    id: string
    name: string
    mimeType: string
    sizeBytes: number
    blob?: Blob
    dataUrl?: string
  }): Promise<string> {
    const fullRecord: BlobRecord = {
      id: record.id,
      name: record.name,
      mimeType: record.mimeType,
      sizeBytes: record.sizeBytes,
      blob: record.blob,
      dataUrl: record.dataUrl,
      createdAt: Date.now(),
    }

    memoryStore.set(record.id, fullRecord)

    if (customStore) {
      try {
        await set(record.id, fullRecord, customStore)
      } catch (err) {
        console.warn('Failed to save blob to IndexedDB, stored in memory cache:', err)
      }
    }

    return record.id
  }

  public static async getBlobRecord(id: string): Promise<BlobRecord | null> {
    if (memoryStore.has(id)) {
      return memoryStore.get(id) || null
    }

    if (customStore) {
      try {
        const record = await get<BlobRecord>(id, customStore)
        if (record) {
          memoryStore.set(id, record)
          return record
        }
      } catch (err) {
        console.error('Failed to retrieve blob from IndexedDB:', err)
      }
    }

    return null
  }

  public static async getBlobUrl(blobIdOrUrl: string): Promise<string> {
    // If it's already an HTTP, HTTPS, or raw data URL, return it directly
    if (
      blobIdOrUrl.startsWith('http://') ||
      blobIdOrUrl.startsWith('https://') ||
      blobIdOrUrl.startsWith('data:')
    ) {
      return blobIdOrUrl
    }

    // Extract raw blobId if prefixed with zenblob:
    let blobId = blobIdOrUrl
    if (blobId.startsWith('zenblob:')) {
      blobId = blobId.slice('zenblob:'.length)
    }
    // Strip query parameters if present (e.g. ?name=...&size=...)
    const queryIdx = blobId.indexOf('?')
    if (queryIdx !== -1) {
      blobId = blobId.substring(0, queryIdx)
    }

    // Check object URL cache
    if (objectUrlCache.has(blobId)) {
      return objectUrlCache.get(blobId)!
    }

    const record = await this.getBlobRecord(blobId)
    if (!record) {
      return ''
    }

    if (record.blob && typeof URL !== 'undefined' && URL.createObjectURL) {
      try {
        const objectUrl = URL.createObjectURL(record.blob)
        objectUrlCache.set(blobId, objectUrl)
        return objectUrl
      } catch (e) {
        console.warn('Failed to createObjectURL from blob:', e)
      }
    }

    if (record.dataUrl) {
      return record.dataUrl
    }

    return ''
  }

  public static async deleteBlob(blobIdOrUrl: string): Promise<void> {
    let blobId = blobIdOrUrl
    if (blobId.startsWith('zenblob:')) {
      blobId = blobId.slice('zenblob:'.length)
    }
    const queryIdx = blobId.indexOf('?')
    if (queryIdx !== -1) {
      blobId = blobId.substring(0, queryIdx)
    }

    if (objectUrlCache.has(blobId)) {
      const url = objectUrlCache.get(blobId)!
      if (typeof URL !== 'undefined' && URL.revokeObjectURL) {
        URL.revokeObjectURL(url)
      }
      objectUrlCache.delete(blobId)
    }

    memoryStore.delete(blobId)

    if (customStore) {
      try {
        await del(blobId, customStore)
      } catch (err) {
        console.error('Failed to delete blob from IndexedDB:', err)
      }
    }
  }

  public static async getAllBlobIds(): Promise<string[]> {
    const ids = new Set<string>()
    for (const k of memoryStore.keys()) {
      ids.add(k)
    }
    if (customStore) {
      try {
        const dbKeys = await keys(customStore)
        for (const k of dbKeys) {
          ids.add(String(k))
        }
      } catch (e) {
        console.error('Failed to get blob keys:', e)
      }
    }
    return Array.from(ids)
  }

  public static extractBlobIds(text?: string | null): string[] {
    if (!text || !text.includes('zenblob:')) return []
    const matches = text.matchAll(/zenblob:([a-zA-Z0-9_-]+)/g)
    const ids: string[] = []
    for (const m of matches) {
      if (m[1] && !ids.includes(m[1])) {
        ids.push(m[1])
      }
    }
    return ids
  }

  /**
   * Scans all stored blobs and deletes any that are no longer referenced
   * in any active notebook document or trash items.
   */
  public static async runBlobGC(): Promise<BlobGCStats> {
    return BlobGCService.runBlobGC(
      () => this.getAllBlobIds(),
      (id) => this.deleteBlob(id),
      (text) => this.extractBlobIds(text)
    )
  }

  public static async clearAllBlobs(): Promise<void> {
    objectUrlCache.forEach((url) => {
      if (typeof URL !== 'undefined' && URL.revokeObjectURL) {
        URL.revokeObjectURL(url)
      }
    })
    objectUrlCache.clear()
    memoryStore.clear()

    if (customStore) {
      try {
        const allKeys = await keys(customStore)
        for (const k of allKeys) {
          await del(k, customStore)
        }
      } catch (err) {
        console.error('Failed to clear blobs from IndexedDB:', err)
      }
    }
  }
}
