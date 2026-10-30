import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

interface UseVirtualListOptions {
  itemCount: number
  estimateHeight?: number
  overscan?: number
  scrollContainerSelector?: string
  resetKey?: unknown
}

export interface VirtualRow {
  index: number
  top: number
  height: number
}

/**
 * High-performance virtual list with dynamic height measurement via ResizeObserver / DOM height detection.
 * Allows nodes with variable contents (images, attachments, multiline notes) to render without overlapping.
 */
export function useVirtualList({
  itemCount,
  estimateHeight = 38,
  overscan = 8,
  scrollContainerSelector = '.overflow-y-auto',
  resetKey,
}: UseVirtualListOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(800)
  const [offsetTop, setOffsetTop] = useState(0)
  const [prevResetKey, setPrevResetKey] = useState(resetKey)
  const [measuredHeights, setMeasuredHeights] = useState<Map<number, number>>(() => new Map())

  // Reset measurements when resetKey changes (e.g. branch navigation)
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey)
    setMeasuredHeights(new Map())
  }

  const roRef = useRef<ResizeObserver | null>(null)

  // Initialize ResizeObserver to detect dynamic content size changes
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return
    roRef.current = new ResizeObserver((entries) => {
      const updates: Array<{ idx: number; height: number }> = []
      for (const entry of entries) {
        const target = entry.target as HTMLElement
        const idxStr = target.dataset.virtualIndex
        if (idxStr !== undefined) {
          const idx = parseInt(idxStr, 10)
          const h = Math.round(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height)
          if (h > 0) {
            updates.push({ idx, height: h })
          }
        }
      }
      if (updates.length > 0) {
        setMeasuredHeights((prev) => {
          let hasChange = false
          const next = new Map(prev)
          for (const u of updates) {
            if (next.get(u.idx) !== u.height) {
              next.set(u.idx, u.height)
              hasChange = true
            }
          }
          return hasChange ? next : prev
        })
      }
    })

    return () => {
      roRef.current?.disconnect()
    }
  }, [])

  const measureElement = useCallback((index: number, el: HTMLElement | null) => {
    if (!el) return
    el.dataset.virtualIndex = String(index)
    if (roRef.current) {
      roRef.current.observe(el)
    }
    const currentH = Math.round(el.offsetHeight)
    if (currentH > 0) {
      setMeasuredHeights((prev) => {
        if (prev.get(index) === currentH) return prev
        const next = new Map(prev)
        next.set(index, currentH)
        return next
      })
    }
  }, [])

  const updateMeasurements = useCallback(() => {
    if (!containerRef.current) return
    const scrollEl = containerRef.current.closest(scrollContainerSelector) as HTMLElement | null
    if (!scrollEl) return

    setScrollTop(scrollEl.scrollTop)
    setViewportHeight(scrollEl.clientHeight)

    const containerRect = containerRef.current.getBoundingClientRect()
    const scrollRect = scrollEl.getBoundingClientRect()
    setOffsetTop(containerRect.top - scrollRect.top + scrollEl.scrollTop)
  }, [scrollContainerSelector])

  useEffect(() => {
    if (!containerRef.current) return
    const scrollEl = containerRef.current.closest(scrollContainerSelector) as HTMLElement | null
    if (!scrollEl) return

    updateMeasurements()

    let rafId: number | null = null
    const handleScroll = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        setScrollTop(scrollEl.scrollTop)
        rafId = null
      })
    }

    const handleResize = () => {
      updateMeasurements()
    }

    scrollEl.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      scrollEl.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [scrollContainerSelector, updateMeasurements])

  // Compute prefix sums of item positions using pure state
  const { positions, totalHeight } = useMemo(() => {
    const pos: number[] = new Array(itemCount)
    let currentTop = 0
    for (let i = 0; i < itemCount; i++) {
      pos[i] = currentTop
      const h = measuredHeights.get(i) ?? estimateHeight
      currentTop += h
    }
    return { positions: pos, totalHeight: currentTop }
  }, [itemCount, estimateHeight, measuredHeights])

  const virtualRows = useMemo<VirtualRow[]>(() => {
    if (itemCount === 0) return []

    const relativeScroll = Math.max(0, scrollTop - offsetTop)
    const viewBottom = relativeScroll + viewportHeight
    const overscanPx = overscan * estimateHeight

    // Find first visible item using binary search on prefix sums
    let startIndex = 0
    let low = 0
    let high = itemCount - 1
    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      const h = measuredHeights.get(mid) ?? estimateHeight
      if (positions[mid] + h >= relativeScroll - overscanPx) {
        startIndex = mid
        high = mid - 1
      } else {
        low = mid + 1
      }
    }

    // Find last visible item
    let endIndex = itemCount
    low = startIndex
    high = itemCount - 1
    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      if (positions[mid] <= viewBottom + overscanPx) {
        endIndex = mid + 1
        low = mid + 1
      } else {
        high = mid - 1
      }
    }

    startIndex = Math.max(0, startIndex)
    endIndex = Math.min(itemCount, endIndex)

    const rows: VirtualRow[] = []
    for (let i = startIndex; i < endIndex; i++) {
      rows.push({
        index: i,
        top: positions[i],
        height: measuredHeights.get(i) ?? estimateHeight,
      })
    }
    return rows
  }, [itemCount, estimateHeight, overscan, scrollTop, offsetTop, viewportHeight, positions, measuredHeights])

  return {
    containerRef,
    totalHeight,
    virtualRows,
    measureElement,
    isVirtualActive: itemCount > 40,
  }
}
