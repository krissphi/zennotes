import { get } from 'idb-keyval'
import { NotebookRegistryService } from './NotebookRegistryService'
import { TrashStorageService } from './TrashStorageService'

export interface BlobGCStats {
  scannedBlobs: number
  referencedBlobs: number
  deletedOrphans: number
}

export class BlobGCService {
  /**
   * Scans all stored blobs and deletes any that are no longer referenced
   * in any active notebook document or trash items.
   */
  public static async runBlobGC(
    getAllBlobIds: () => Promise<string[]>,
    deleteBlob: (id: string) => Promise<void>,
    extractBlobIds: (text?: string | null) => string[]
  ): Promise<BlobGCStats> {
    const allStoredBlobIds = await getAllBlobIds()
    if (allStoredBlobIds.length === 0) {
      return { scannedBlobs: 0, referencedBlobs: 0, deletedOrphans: 0 }
    }

    const referencedIds = new Set<string>()
    const isIdb = typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined'

    // 1. Scan all active notebook documents
    if (isIdb) {
      try {
        const notebooks = await NotebookRegistryService.listNotebooks()

        for (const nb of notebooks) {
          const storageKey = NotebookRegistryService.getStorageKey(nb.id)
          let docData: { nodes?: Record<string, { content?: string; note?: string }> } | null = null

          try {
            docData = (await get(storageKey)) || null
          } catch {
            // Fallback
          }

          if (!docData && typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(storageKey)
            if (raw) {
              try {
                docData = JSON.parse(raw)
              } catch {}
            }
          }

          if (docData?.nodes) {
            for (const node of Object.values(docData.nodes)) {
              if (node.content) {
                for (const id of extractBlobIds(node.content)) referencedIds.add(id)
              }
              if (node.note) {
                for (const id of extractBlobIds(node.note)) referencedIds.add(id)
              }
            }
          }
        }
      } catch (err) {
        console.warn('Blob GC: Error scanning notebook documents:', err)
      }
    }

    // 2. Scan all trash items
    if (isIdb) {
      try {
        const trashItems = await TrashStorageService.loadTrash()

        for (const item of trashItems) {
          if (item.nodeData?.content) {
            for (const id of extractBlobIds(item.nodeData.content)) referencedIds.add(id)
          }
          if (item.nodeData?.note) {
            for (const id of extractBlobIds(item.nodeData.note)) referencedIds.add(id)
          }
          if (Array.isArray(item.descendants)) {
            for (const d of item.descendants) {
              if (d.content) {
                for (const id of extractBlobIds(d.content)) referencedIds.add(id)
              }
              if (d.note) {
                for (const id of extractBlobIds(d.note)) referencedIds.add(id)
              }
            }
          }
        }
      } catch (err) {
        console.warn('Blob GC: Error scanning trash items:', err)
      }
    }

    // 3. Delete any blob that is NOT in referencedIds
    let deletedCount = 0
    for (const storedId of allStoredBlobIds) {
      if (!referencedIds.has(storedId)) {
        await deleteBlob(storedId)
        deletedCount++
      }
    }

    return {
      scannedBlobs: allStoredBlobIds.length,
      referencedBlobs: referencedIds.size,
      deletedOrphans: deletedCount,
    }
  }
}
