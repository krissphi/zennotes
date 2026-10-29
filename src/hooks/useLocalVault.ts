import { useState, useEffect, useCallback, useRef } from 'react'
import { LocalVaultService } from '../core/services/LocalVaultService'
import type { TreeDocument } from '../core/models/TreeDocument'

export function useLocalVault(doc: TreeDocument) {
  const [isSupported] = useState(() => LocalVaultService.isSupported())
  const [isConnected, setIsConnected] = useState(false)
  const [folderName, setFolderName] = useState<string | null>(null)
  const [autoSync, setAutoSyncState] = useState(() => LocalVaultService.isAutoSyncEnabled())
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const docRef = useRef(doc)

  useEffect(() => {
    docRef.current = doc
  }, [doc])

  // Check connection status on mount
  useEffect(() => {
    let isMounted = true
    const initStatus = async () => {
      if (!LocalVaultService.isSupported()) return
      const handle = await LocalVaultService.getDirectoryHandle()
      if (!isMounted) return
      if (handle) {
        const hasPerm = await LocalVaultService.verifyPermission(handle, false)
        if (!isMounted) return
        setIsConnected(hasPerm)
        setFolderName(handle.name)
      } else {
        setIsConnected(false)
        setFolderName(null)
      }
    }
    void initStatus()
    return () => {
      isMounted = false
    }
  }, [])

  const checkStatus = useCallback(async () => {
    if (!LocalVaultService.isSupported()) return

    const handle = await LocalVaultService.getDirectoryHandle()
    if (handle) {
      const hasPerm = await LocalVaultService.verifyPermission(handle, false)
      setIsConnected(hasPerm)
      setFolderName(handle.name)
    } else {
      setIsConnected(false)
      setFolderName(null)
    }
  }, [])

  const connectVault = useCallback(async () => {
    try {
      const handle = await LocalVaultService.connectVault()
      if (handle) {
        setIsConnected(true)
        setFolderName(handle.name)
        setAutoSyncState(true)
        // Perform initial sync
        await LocalVaultService.syncDocumentToVault(docRef.current)
        setLastSyncedAt(Date.now())
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to connect vault:', err)
      return false
    }
  }, [])

  const disconnectVault = useCallback(async () => {
    await LocalVaultService.disconnectVault()
    setIsConnected(false)
    setFolderName(null)
    setAutoSyncState(false)
  }, [])

  const syncNow = useCallback(async () => {
    if (!isConnected) return false
    setIsSyncing(true)
    try {
      const success = await LocalVaultService.syncDocumentToVault(docRef.current)
      if (success) {
        setLastSyncedAt(Date.now())
      }
      return success
    } finally {
      setIsSyncing(false)
    }
  }, [isConnected])

  const toggleAutoSync = useCallback(() => {
    const nextVal = !autoSync
    LocalVaultService.setAutoSync(nextVal)
    setAutoSyncState(nextVal)
  }, [autoSync])

  // Auto-sync whenever document is updated if autoSync is active
  useEffect(() => {
    if (isConnected && autoSync && doc) {
      const timer = setTimeout(() => {
        LocalVaultService.syncDocumentToVault(doc).then((success) => {
          if (success) setLastSyncedAt(Date.now())
        })
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [doc, isConnected, autoSync])

  return {
    isSupported,
    isConnected,
    folderName,
    autoSync,
    isSyncing,
    lastSyncedAt,
    connectVault,
    disconnectVault,
    syncNow,
    toggleAutoSync,
    refreshStatus: checkStatus,
  }
}
