import { describe, it, expect } from 'vitest'
import {
  applySmartFormatting,
  findFormattingDelimiters,
  checkHasRichFormatting,
} from '../formattingUtils'

describe('formattingUtils', () => {
  describe('applySmartFormatting', () => {
    it('wraps empty text with prefix and suffix and toggles off upon repeated trigger', () => {
      // 1st press on empty text
      const step1 = applySmartFormatting('', 0, 0, '**')
      expect(step1.text).toBe('****')
      expect(step1.start).toBe(2)
      expect(step1.end).toBe(2)

      // 2nd press immediately (cursor in middle) -> toggles OFF instead of spamming stars
      const step2 = applySmartFormatting(step1.text, step1.start, step1.end, '**')
      expect(step2.text).toBe('')
      expect(step2.start).toBe(0)
      expect(step2.end).toBe(0)

      // 3rd press -> back to ****
      const step3 = applySmartFormatting(step2.text, step2.start, step2.end, '**')
      expect(step3.text).toBe('****')
      expect(step3.start).toBe(2)
      expect(step3.end).toBe(2)
    })

    it('wraps an unselected word when cursor is inside or adjacent to it', () => {
      // Cursor inside "bold": "hello bo|ld world" (pos = 8)
      const res1 = applySmartFormatting('hello bold world', 8, 8, '**')
      expect(res1.text).toBe('hello **bold** world')
      expect(res1.start).toBe(10)

      // Toggling bold again when cursor is inside "**bold**" removes bold
      const res2 = applySmartFormatting(res1.text, res1.start, res1.end, '**')
      expect(res2.text).toBe('hello bold world')
      expect(res2.start).toBe(8)
    })

    it('wraps selected text and toggles off cleanly', () => {
      // Select "bold": start = 6, end = 10
      const res1 = applySmartFormatting('hello bold world', 6, 10, '**')
      expect(res1.text).toBe('hello **bold** world')
      expect(res1.start).toBe(8)
      expect(res1.end).toBe(12)

      // Toggle off when selected
      const res2 = applySmartFormatting(res1.text, res1.start, res1.end, '**')
      expect(res2.text).toBe('hello bold world')
      expect(res2.start).toBe(6)
      expect(res2.end).toBe(10)
    })

    it('unwraps when user selects already wrapped text including delimiters', () => {
      // Selected "**bold**" directly (start = 6, end = 14)
      const res = applySmartFormatting('hello **bold** world', 6, 14, '**')
      expect(res.text).toBe('hello bold world')
      expect(res.start).toBe(6)
      expect(res.end).toBe(10)
    })

    it('supports italic (*) and isolates it from bold (**)', () => {
      // Italic on word
      const res1 = applySmartFormatting('italic', 2, 2, '*')
      expect(res1.text).toBe('*italic*')

      // Toggle off italic
      const res2 = applySmartFormatting(res1.text, 3, 3, '*')
      expect(res2.text).toBe('italic')

      // Italic inside bold text should not confuse delimiters
      const res3 = applySmartFormatting('**bold**', 3, 3, '*')
      expect(res3.text).toBe('***bold***')
    })

    it('supports strikethrough (~~) via Ctrl+T or Ctrl+Shift+S', () => {
      const res1 = applySmartFormatting('strike', 2, 2, '~~')
      expect(res1.text).toBe('~~strike~~')

      const res2 = applySmartFormatting(res1.text, 4, 4, '~~')
      expect(res2.text).toBe('strike')
    })
  })

  describe('findFormattingDelimiters', () => {
    it('distinguishes single asterisk (italic) from double asterisk (bold)', () => {
      expect(findFormattingDelimiters('**bold**', '**')).toEqual([0, 6])
      expect(findFormattingDelimiters('**bold**', '*')).toEqual([])
      expect(findFormattingDelimiters('*italic*', '*')).toEqual([0, 7])
      expect(findFormattingDelimiters('*italic*', '**')).toEqual([])
    })
  })

  describe('checkHasRichFormatting', () => {
    it('detects all supported markdown formatting and ignores plain text', () => {
      expect(checkHasRichFormatting('Plain text without markdown')).toBe(false)
      expect(checkHasRichFormatting('123 456')).toBe(false)

      expect(checkHasRichFormatting('Text with **bold** word')).toBe(true)
      expect(checkHasRichFormatting('Text with *italic* word')).toBe(true)
      expect(checkHasRichFormatting('Text with ~~strike~~ word')).toBe(true)
      expect(checkHasRichFormatting('Text with `code` snippet')).toBe(true)
      expect(checkHasRichFormatting('Text with [Link](https://example.com)')).toBe(true)
      expect(checkHasRichFormatting('Text with #tag')).toBe(true)
      expect(checkHasRichFormatting('Text with [[WikiPage]]')).toBe(true)
      expect(checkHasRichFormatting('https://antigravity.google.com')).toBe(true)
      expect(checkHasRichFormatting('```js\nconsole.log(1)\n```')).toBe(true)
    })
  })
})
