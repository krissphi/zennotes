import { useState, useRef, useCallback } from 'react'
import type { TreeDocumentData } from '../core/models/TreeDocument'

const MAX_HISTORY = 50

export function useDocumentHistory(initialState?: TreeDocumentData) {
  const historyRef = useRef<TreeDocumentData[]>(initialState ? [initialState] : [])
  const currentIndexRef = useRef<number>(initialState ? 0 : -1)

  const [capabilities, setCapabilities] = useState({
    canUndo: false,
    canRedo: false,
  })

  const syncCapabilities = useCallback(() => {
    setCapabilities({
      canUndo: currentIndexRef.current > 0,
      canRedo: currentIndexRef.current < historyRef.current.length - 1,
    })
  }, [])

  const pushState = useCallback((state: TreeDocumentData) => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1)
    }

    historyRef.current.push(state)

    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift()
    } else {
      currentIndexRef.current++
    }

    syncCapabilities()
  }, [syncCapabilities])

  const undo = useCallback((): TreeDocumentData | null => {
    if (currentIndexRef.current > 0) {
      currentIndexRef.current--
      syncCapabilities()
      return historyRef.current[currentIndexRef.current]
    }
    return null
  }, [syncCapabilities])

  const redo = useCallback((): TreeDocumentData | null => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      currentIndexRef.current++
      syncCapabilities()
      return historyRef.current[currentIndexRef.current]
    }
    return null
  }, [syncCapabilities])

  const resetHistory = useCallback((initial?: TreeDocumentData) => {
    historyRef.current = initial ? [initial] : []
    currentIndexRef.current = initial ? 0 : -1
    syncCapabilities()
  }, [syncCapabilities])

  return {
    pushState,
    undo,
    redo,
    resetHistory,
    canUndo: capabilities.canUndo,
    canRedo: capabilities.canRedo,
  }
}
