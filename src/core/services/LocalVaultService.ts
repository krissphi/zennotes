import { get, set, del } from 'idb-keyval'
import { ExportImportService } from './ExportImportService'
import type { TreeDocument } from '../models/TreeDocument'

const VAULT_HANDLE_KEY = 'zennotes_vault_dir_handle'
const VAULT_AUTOSYNC_KEY = 'zennotes_vault_autosync'

export interface VaultStatus {
  isSupported: boolean
  isConnected: boolean
  folderName: string | null
  autoSync: boolean
  lastSyncedAt: number | null
}

export class LocalVaultService {
  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window
  }

  public static isAutoSyncEnabled(): boolean {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem(VAULT_AUTOSYNC_KEY) === 'true'
  }

  public static setAutoSync(enabled: boolean): void {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(VAULT_AUTOSYNC_KEY, enabled ? 'true' : 'false')
  }

  public static async getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
    if (!this.isSupported()) return null
    try {
      const handle = await get<FileSystemDirectoryHandle>(VAULT_HANDLE_KEY)
      return handle || null
    } catch (err) {
      console.error('Failed to get vault directory handle:', err)
      return null
    }
  }

  public static async verifyPermission(
    dirHandle: FileSystemDirectoryHandle,
    requestIfDenied = false
  ): Promise<boolean> {
    try {
      const handle = dirHandle as unknown as {
        queryPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>
        requestPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>
      }

      if (!handle.queryPermission) return true

      const opts = { mode: 'readwrite' as const }
      if ((await handle.queryPermission(opts)) === 'granted') {
        return true
      }
      if (requestIfDenied && handle.requestPermission && (await handle.requestPermission(opts)) === 'granted') {
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to verify directory permission:', err)
      return false
    }
  }

  public static async connectVault(): Promise<FileSystemDirectoryHandle | null> {
    if (!this.isSupported()) {
      throw new Error('File System Access API is not supported on this browser.')
    }

    try {
      const dirHandle = await (window as unknown as {
        showDirectoryPicker: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>
      }).showDirectoryPicker({ mode: 'readwrite' })

      await set(VAULT_HANDLE_KEY, dirHandle)
      this.setAutoSync(true)
      return dirHandle
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return null // User cancelled picker
      }
      throw err
    }
  }

  public static async disconnectVault(): Promise<void> {
    await del(VAULT_HANDLE_KEY)
    this.setAutoSync(false)
  }

  public static async syncDocumentToVault(
    doc: TreeDocument,
    customTitle?: string
  ): Promise<boolean> {
    const dirHandle = await this.getDirectoryHandle()
    if (!dirHandle) return false

    const hasPermission = await this.verifyPermission(dirHandle, false)
    if (!hasPermission) return false

    try {
      const rawTitle = customTitle || doc.title || 'ZenNotes'
      const safeTitle = rawTitle.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'Notes'
      const fileName = `${safeTitle}.md`

      const markdown = ExportImportService.exportToMarkdown(doc)
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(markdown)
      await writable.close()
      return true
    } catch (err) {
      console.error('Failed to sync document to vault:', err)
      return false
    }
  }
}
