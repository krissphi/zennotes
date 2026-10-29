import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Search, X, CornerDownLeft, FileText, Zap } from 'lucide-react'
import type { TreeDocument } from '../../core/models/TreeDocument'
import type { TreeNode } from '../../core/models/TreeNode'
import { getNodeDisplayText, parseNodeMedia } from '../../lib/attachmentUtils'
import { SearchIndexService } from '../../core/services/SearchIndexService'

interface LiveSearchProps {
  doc: TreeDocument
  onSelectNode: (nodeId: string) => void
  autoFocus?: boolean
  onClose?: () => void
  externalQuery?: string | null
  onClearExternalQuery?: () => void
}

export const LiveSearch: React.FC<LiveSearchProps> = ({
  doc,
  onSelectNode,
  autoFocus,
  onClose,
  externalQuery,
  onClearExternalQuery,
}) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [prevExternalQuery, setPrevExternalQuery] = useState(externalQuery)

  if (externalQuery && prevExternalQuery !== externalQuery) {
    setPrevExternalQuery(externalQuery)
    setQuery(externalQuery)
    setIsOpen(true)
  }

  useEffect(() => {
    if (externalQuery) {
      inputRef.current?.focus()
    }
  }, [externalQuery])

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
      setIsOpen(true)
    }
  }, [autoFocus])

  // MiniSearch full text & fuzzy search engine instance with incremental indexing
  const searchIndex = useMemo(() => new SearchIndexService(), [])
  const prevNodesRef = useRef<Map<string, { content: string; note: string; parentId: string | null }>>(new Map())
  const isIndexedRef = useRef(false)

  useEffect(() => {
    if (!isIndexedRef.current) {
      searchIndex.indexDocument(doc)
      isIndexedRef.current = true
      const initialMap = new Map<string, { content: string; note: string; parentId: string | null }>()
      for (const n of doc.getAllNodes()) {
        if (n.id !== doc.rootId) {
          initialMap.set(n.id, { content: n.content, note: n.note, parentId: n.parentId })
        }
      }
      prevNodesRef.current = initialMap
      return
    }

    // Incremental update: update only modified nodes, remove deleted nodes
    const currentNodes = doc.getAllNodes().filter((n) => n.id !== doc.rootId)
    const currentIds = new Set<string>()
    const nextMap = new Map<string, { content: string; note: string; parentId: string | null }>()

    for (const node of currentNodes) {
      currentIds.add(node.id)
      const prev = prevNodesRef.current.get(node.id)
      if (
        !prev ||
        prev.content !== node.content ||
        prev.note !== node.note ||
        prev.parentId !== node.parentId
      ) {
        searchIndex.updateNode(node, doc)
      }
      nextMap.set(node.id, { content: node.content, note: node.note, parentId: node.parentId })
    }

    for (const oldId of prevNodesRef.current.keys()) {
      if (!currentIds.has(oldId)) {
        searchIndex.removeNode(oldId)
      }
    }

    prevNodesRef.current = nextMap
  }, [doc, searchIndex])

  const results = useMemo(() => {
    const q = query.trim()
    if (!q) return []

    // 1. MiniSearch fuzzy and prefix query
    const hits = searchIndex.search(q, 15)
    if (hits.length > 0) {
      const matched = hits
        .map((h) => doc.getNode(h.id))
        .filter((n): n is TreeNode => Boolean(n))
      if (matched.length > 0) return matched
    }

    // 2. Direct clean text fallback for special syntax / non-alphanumeric queries
    const lowerQ = q.toLowerCase()
    return doc
      .getAllNodes()
      .filter((n) => {
        if (n.id === doc.rootId) return false
        const { cleanText } = parseNodeMedia(n.content)
        return (
          cleanText.toLowerCase().includes(lowerQ) ||
          (n.note ? n.note.toLowerCase().includes(lowerQ) : false)
        )
      })
      .slice(0, 15)
  }, [doc, query, searchIndex])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Global shortcut Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSelect = (nodeId: string) => {
    onSelectNode(nodeId)
    setIsOpen(false)
    setQuery('')
    onClearExternalQuery?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex].id)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      onClose?.()
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm sm:max-w-md mx-2">
      {/* Live Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setSelectedIndex(0)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Fuzzy search notes & tags..."
          className="w-full pl-8 pr-12 py-1.5 text-xs bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200/70 dark:hover:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-900 text-[#0F172A] dark:text-[#F8FAFC] border border-transparent focus:border-emerald-500/50 rounded-lg outline-none transition-all placeholder:text-[#64748B] dark:placeholder:text-[#94A3B8]"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {query ? (
            <button
              onClick={() => {
                setQuery('')
                setIsOpen(false)
                onClearExternalQuery?.()
              }}
              className="p-0.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-[#27272A] px-1.5 py-0.2 rounded shadow-2xs">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Floating Live Results Dropdown */}
      {isOpen && query.trim() !== '' && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-[#E2E8F0]/60 dark:divide-[#27272A] max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-900/60 border-b border-[#E2E8F0]/80 dark:border-[#27272A] flex items-center justify-between text-[10px] text-[#64748B] dark:text-[#94A3B8]">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-500" />
              <span>MiniSearch Fuzzy Indexing</span>
            </span>
            <span>{results.length} result(s)</span>
          </div>

          {results.length > 0 ? (
            results.map((node, index) => {
              const crumbs = doc.getBreadcrumbs(node.id)
              const pathString = crumbs
                .slice(0, -1)
                .map((c) => (c.id === doc.rootId ? 'Root' : getNodeDisplayText(c.content) || '...'))
                .join(' > ')
              const isSelected = index === selectedIndex

              return (
                <div
                  key={node.id}
                  onClick={() => handleSelect(node.id)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-2.5 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/10 text-[#0F172A] dark:text-white'
                      : 'hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] truncate mb-0.5">{pathString}</p>
                    <p className="text-xs font-medium text-[#0F172A] dark:text-white truncate flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{getNodeDisplayText(node.content) || '(empty item)'}</span>
                    </p>
                    {node.note && (
                      <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] italic truncate pl-4.5 mt-0.5">
                        Note: {node.note}
                      </p>
                    )}
                  </div>
                  <CornerDownLeft className="w-3 h-3 text-[#64748B] dark:text-[#94A3B8] shrink-0 opacity-60" />
                </div>
              )
            })
          ) : (
            <div className="py-6 text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
              No matching notes found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}
