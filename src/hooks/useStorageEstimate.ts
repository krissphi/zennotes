import { useState, useEffect, useCallback } from 'react'
import { formatFileSize } from '../lib/attachmentUtils'

export interface StorageEstimateData {
  usage: number
  quota: number
  usageFormatted: string
  quotaFormatted: string
  percentage: number
  isPersisted: boolean
  isSupported: boolean
}

export function useStorageEstimate() {
  const [data, setData] = useState<StorageEstimateData>({
    usage: 0,
    quota: 0,
    usageFormatted: '0 B',
    quotaFormatted: '0 B',
    percentage: 0,
    isPersisted: false,
    isSupported: typeof navigator !== 'undefined' && Boolean(navigator.storage?.estimate),
  })

  const refresh = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return

    try {
      const estimate = await navigator.storage.estimate()
      const usage = estimate.usage || 0
      const quota = estimate.quota || 0
      const percentage = quota > 0 ? (usage / quota) * 100 : 0
      const isPersisted = navigator.storage.persisted ? await navigator.storage.persisted() : false

      setData({
        usage,
        quota,
        usageFormatted: formatFileSize(usage),
        quotaFormatted: formatFileSize(quota),
        percentage: Math.min(100, Math.max(0, percentage)),
        isPersisted,
        isSupported: true,
      })
    } catch (err) {
      console.error('Failed to get storage estimate:', err)
    }
  }, [])

  const requestPersistence = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      const granted = await navigator.storage.persist()
      await refresh()
      return granted
    }
    return false
  }, [refresh])

  useEffect(() => {
    let isMounted = true
    const init = async () => {
      if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return
      try {
        const estimate = await navigator.storage.estimate()
        if (!isMounted) return
        const usage = estimate.usage || 0
        const quota = estimate.quota || 0
        const percentage = quota > 0 ? (usage / quota) * 100 : 0
        const isPersisted = navigator.storage.persisted ? await navigator.storage.persisted() : false
        if (!isMounted) return

        setData({
          usage,
          quota,
          usageFormatted: formatFileSize(usage),
          quotaFormatted: formatFileSize(quota),
          percentage: Math.min(100, Math.max(0, percentage)),
          isPersisted,
          isSupported: true,
        })
      } catch (err) {
        console.error('Failed to get storage estimate:', err)
      }
    }
    void init()
    return () => {
      isMounted = false
    }
  }, [])

  return {
    ...data,
    refresh,
    requestPersistence,
  }
}
