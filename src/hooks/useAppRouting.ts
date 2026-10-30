import { useState, useEffect, useMemo } from 'react'
import { useIsShareOrShortcut } from './useWebShareTarget'

export function useAppRouting() {
  const isPwa = useMemo(() => {
    if (typeof window === 'undefined') return false
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      new URLSearchParams(window.location.search).get('source') === 'pwa'
    )
  }, [])

  const isShareOrShortcut = useIsShareOrShortcut()

  const [view, setView] = useState<'landing' | 'app'>(() => {
    if (typeof window === 'undefined' || isPwa || isShareOrShortcut) return 'app'
    return window.location.hash === '#app' ? 'app' : 'landing'
  })

  useEffect(() => {
    const handleHashChange = () => {
      if (!isPwa) setView(window.location.hash === '#app' ? 'app' : 'landing')
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [isPwa])

  const openApp = () => {
    setView('app')
    window.location.hash = '#app'
  }

  const goToLanding = () => {
    setView('landing')
    window.location.hash = ''
  }

  return { isPwa, view, openApp, goToLanding }
}
