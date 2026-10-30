import React from 'react'
import { applySmartFormatting } from '../../lib/formattingUtils'
import type { ParsedAttachment } from '../../lib/attachmentUtils'

interface UseNodeKeyboardOptions {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  cleanText: string
  handleTextChange: (newText: string) => void
  onBlur?: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onNavigateUp?: () => void
  onNavigateDown?: () => void
  onNavigateLeft?: () => void
  onNavigateRight?: () => void
  onIndent: () => void
  onOutdent: () => void
  onAddSibling: () => void
  onDelete: () => void
  hasAttachments: boolean
  hasImages: boolean
  attachments: ParsedAttachment[]
  images: Array<{ alt: string; src: string; fullMatch: string }>
  handleRemoveAttachment: (fullMatch: string) => void
  handleRemoveImage: (fullMatch: string) => void
}

export function useNodeKeyboard({
  textareaRef,
  cleanText,
  handleTextChange,
  onBlur,
  onMoveUp,
  onMoveDown,
  onNavigateUp,
  onNavigateDown,
  onNavigateLeft,
  onNavigateRight,
  onIndent,
  onOutdent,
  onAddSibling,
  onDelete,
  hasAttachments,
  hasImages,
  attachments,
  images,
  handleRemoveAttachment,
  handleRemoveImage,
}: UseNodeKeyboardOptions) {
  // Smart Markdown formatting wrap helper (Bold, Italic, Code, Strikethrough)
  const applyFormatWrap = (prefix: string, suffix = prefix) => {
    const el = textareaRef.current
    if (!el) return
    const res = applySmartFormatting(cleanText, el.selectionStart, el.selectionEnd, prefix, suffix)
    handleTextChange(res.text)
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(res.start, res.end)
        textareaRef.current.focus()
      }
    })
  }

  const applyLinkWrap = () => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = cleanText.substring(start, end)
    const replacement = selected ? `[${selected}](url)` : `[](url)`
    const newCleanText = cleanText.substring(0, start) + replacement + cleanText.substring(end)
    handleTextChange(newCleanText)
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        if (selected) {
          const urlStart = start + selected.length + 3
          textareaRef.current.setSelectionRange(urlStart, urlStart + 3)
        } else {
          textareaRef.current.setSelectionRange(start + 1, start + 1)
        }
        textareaRef.current.focus()
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Text formatting shortcuts (Ctrl+B, Ctrl+I, Ctrl+E, Ctrl+Shift+S, Ctrl+K)
    const isMod = e.ctrlKey || e.metaKey
    if (isMod && !e.altKey) {
      const key = e.key.toLowerCase()
      if (key === 'b') {
        e.preventDefault()
        applyFormatWrap('**')
        return
      }
      if (key === 'i') {
        e.preventDefault()
        applyFormatWrap('*')
        return
      }
      if (key === 'e' || e.key === '`') {
        e.preventDefault()
        applyFormatWrap('`')
        return
      }
      if (key === 't' || (e.shiftKey && (key === 's' || key === 'x'))) {
        e.preventDefault()
        applyFormatWrap('~~')
        return
      }
      if (key === 'k') {
        e.preventDefault()
        e.stopPropagation() // Intercept global search modal when editing node
        applyLinkWrap()
        return
      }
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      textareaRef.current?.blur()
      onBlur?.()
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

    // Normal ArrowUp / ArrowDown / ArrowLeft / ArrowRight navigation between nodes when at text boundary
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
        if (selectionStart === cleanText.length && selectionEnd === cleanText.length) {
          e.preventDefault()
          onNavigateDown?.()
          return
        }
      }
      if (e.key === 'ArrowLeft' && textareaRef.current) {
        const { selectionStart, selectionEnd } = textareaRef.current
        if (selectionStart === 0 && selectionEnd === 0) {
          e.preventDefault()
          onNavigateLeft?.()
          return
        }
      }
      if (e.key === 'ArrowRight' && textareaRef.current) {
        const { selectionStart, selectionEnd } = textareaRef.current
        if (selectionStart === cleanText.length && selectionEnd === cleanText.length) {
          e.preventDefault()
          onNavigateRight?.()
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

    if (e.key === 'Backspace' && cleanText === '') {
      e.preventDefault()
      if (hasAttachments) {
        // Remove the last attachment first
        handleRemoveAttachment(attachments[attachments.length - 1].fullMatch)
      } else if (hasImages) {
        // Remove the last image next
        handleRemoveImage(images[images.length - 1].fullMatch)
      } else {
        onDelete()
      }
    }
  }

  return { handleKeyDown, applyFormatWrap, applyLinkWrap }
}
