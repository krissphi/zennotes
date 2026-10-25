import React, { useState, useRef, useEffect } from 'react'
import { Search, X, CornerDownLeft, FileText } from 'lucide-react'
import type { TreeDocument } from '../../core/models/TreeDocument'

interface LiveSearchProps {
  doc: TreeDocument
  onSelectNode: (nodeId: string) => void
  autoFocus?: boolean
  onClose?: () => void
}

export const LiveSearch: React.FC<LiveSearchProps> = ({
  doc,
  onSelectNode,
  autoFocus,
  onClose,
}) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
      setIsOpen(true)
    }
  }, [autoFocus])

  const allNodes = doc.getAllNodes().filter((n) => n.id !== doc.rootId)
  const results = query.trim()
    ? allNodes.filter((n) => n.content.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : []

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
          placeholder="Search notes..."
          className="w-full pl-8 pr-12 py-1.5 text-xs bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200/70 dark:hover:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-900 text-[#0F172A] dark:text-[#F8FAFC] border border-transparent focus:border-emerald-500/50 rounded-lg outline-none transition-all placeholder:text-[#64748B] dark:placeholder:text-[#94A3B8]"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {query ? (
            <button
              onClick={() => {
                setQuery('')
                setIsOpen(false)
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
          {results.length > 0 ? (
            results.map((node, index) => {
              const crumbs = doc.getBreadcrumbs(node.id)
              const pathString = crumbs
                .slice(0, -1)
                .map((c) => (c.id === doc.rootId ? 'Root' : c.content || '...'))
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
                      <span>{node.content || '(empty item)'}</span>
                    </p>
                  </div>
                  <CornerDownLeft className="w-3 h-3 text-[#64748B] dark:text-[#94A3B8] shrink-0 opacity-60" />
                </div>
              )
            })
          ) : (
            <div className="py-4 text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
              No matching notes found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
