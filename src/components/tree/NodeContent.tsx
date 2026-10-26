import React, { useRef, useEffect, useLayoutEffect } from 'react'
import { FormattedNodeText } from './FormattedNodeText'

interface NodeContentProps {
  nodeId: string
  content: string
  isCompleted: boolean
  isFocused: boolean
  onChange: (value: string) => void
  onAddSibling: () => void
  onIndent: () => void
  onOutdent: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onNavigateUp?: () => void
  onNavigateDown?: () => void
  onNavigateToWikilink?: (title: string) => void
  onToggleComplete: () => void
  onFocus: () => void
}

export const NodeContent: React.FC<NodeContentProps> = ({
  content,
  isCompleted,
  isFocused,
  onChange,
  onAddSibling,
  onIndent,
  onOutdent,
  onDelete,
  onMoveUp,
  onMoveDown,
  onNavigateUp,
  onNavigateDown,
  onNavigateToWikilink,
  onToggleComplete,
  onFocus,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus input when requested
  useEffect(() => {
    if (isFocused && textareaRef.current && document.activeElement !== textareaRef.current) {
      textareaRef.current.focus()
      const len = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(len, len)
    }
  }, [isFocused])

  // Synchronous height adjustment that responds to text changes AND dynamic window resizing
  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return

    // If native CSS field-sizing is supported, CSS handles resizing automatically
    if (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('field-sizing', 'content')) {
      el.style.height = ''
      return
    }

    const adjust = () => {
      el.style.height = 'auto'
      el.style.height = `${Math.max(24, el.scrollHeight)}px`
    }

    adjust()
    window.addEventListener('resize', adjust)
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && el.parentElement) {
      ro = new ResizeObserver(adjust)
      ro.observe(el.parentElement)
    }

    return () => {
      window.removeEventListener('resize', adjust)
      if (ro) ro.disconnect()
    }
  }, [content])

  const handleContainerClick = () => {
    onFocus()
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      onToggleComplete()
      return
    }

    if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault()
      onMoveUp()
      return
    }
    if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault()
      onMoveDown()
      return
    }

    // Normal ArrowUp / ArrowDown navigation between nodes when at text boundary
    if (!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      if (e.key === 'ArrowUp' && textareaRef.current) {
        const { selectionStart, selectionEnd } = textareaRef.current
        if (selectionStart === 0 && selectionEnd === 0) {
          e.preventDefault()
          onNavigateUp?.()
          return
        }
      }
      if (e.key === 'ArrowDown' && textareaRef.current) {
        const { selectionStart, selectionEnd } = textareaRef.current
        if (selectionStart === content.length && selectionEnd === content.length) {
          e.preventDefault()
          onNavigateDown?.()
          return
        }
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) onOutdent()
      else onIndent()
      return
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onAddSibling()
      return
    }

    if (e.key === 'Backspace' && content === '') {
      e.preventDefault()
      onDelete()
    }
  }

  const hasFormatting = /#[a-zA-Z0-9_-]+|https?:\/\/|`|\[\[/.test(content)

  return (
    <div
      onClick={handleContainerClick}
      className="relative w-full min-h-[24px] cursor-text"
    >
      {/* Rich formatting overlay when not actively editing */}
      {!isFocused && hasFormatting ? (
        <div className="w-full">
          <FormattedNodeText
            content={content}
            isCompleted={isCompleted}
            onActivate={handleContainerClick}
            onNavigateToWikilink={onNavigateToWikilink}
          />
          {/* Kept mounted for instant focus transitions */}
          <textarea
            ref={textareaRef}
            value={content}
            rows={1}
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            className="sr-only"
          />
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={content}
          rows={1}
          placeholder="Type note..."
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          className={`w-full resize-none overflow-hidden bg-transparent text-sm leading-relaxed outline-none border-none py-0.5 px-0 ${
            content.trim().startsWith('```') ? 'font-mono text-xs sm:text-[13px]' : ''
          } ${
            isCompleted
              ? 'line-through text-[#64748B]/70 dark:text-[#94A3B8]/60'
              : 'text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] dark:placeholder:text-[#52525B]'
          }`}
        />
      )}
    </div>
  )
}
