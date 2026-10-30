import { useEffect, useRef, useMemo } from 'react'
import { toast } from '../lib/toast'

export function useIsShareOrShortcut() {
  return useMemo(() => {
    if (typeof window === 'undefined') return false
    const params = new URLSearchParams(window.location.search)
    return Boolean(
      params.get('share_title') ||
      params.get('title') ||
      params.get('share_text') ||
      params.get('text') ||
      params.get('share_url') ||
      params.get('url') ||
      params.get('action') === 'new'
    )
  }, [])
}

export function useWebShareTarget(
  isLoaded: boolean,
  focusedNodeId: string,
  rootId: string,
  addChild: (parentId: string, content?: string) => string | null,
  setActiveEditingId: (id: string | null) => void
) {
  const shareHandledRef = useRef(false)
  useEffect(() => {
    if (!isLoaded || shareHandledRef.current || typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const shareTitle = params.get('share_title') || params.get('title')
    const shareText = params.get('share_text') || params.get('text')
    const shareUrl = params.get('share_url') || params.get('url')
    const action = params.get('action')

    const hasShareContent = Boolean(shareTitle || shareText || shareUrl)
    if (hasShareContent || action === 'new') {
      shareHandledRef.current = true
      if (window.location.hash !== '#app') {
        window.location.hash = '#app'
      }

      if (hasShareContent) {
        const parts: string[] = []
        if (shareTitle) parts.push(shareTitle)
        if (shareText) parts.push(shareText)
        if (shareUrl) parts.push(shareUrl)
        const content = parts.join('\n')

        const newId = addChild(focusedNodeId || rootId, content)
        if (newId) {
          setActiveEditingId(newId)
          toast.success('Note added from Web Share')
        }
      } else if (action === 'new') {
        const newId = addChild(focusedNodeId || rootId, '')
        if (newId) {
          setActiveEditingId(newId)
        }
      }

      // Clean query params from URL bar without page refresh
      const cleanUrl = window.location.pathname + window.location.hash
      window.history.replaceState({}, '', cleanUrl)
    }
  }, [isLoaded, focusedNodeId, rootId, addChild, setActiveEditingId])
}
