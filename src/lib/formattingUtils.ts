/**
 * Helper utilities for smart markdown formatting (Bold, Italic, Strikethrough, Code)
 */

export function findFormattingDelimiters(line: string, prefix: string): number[] {
  const isItalic = prefix === '*'
  const isBold = prefix === '**'
  const results: number[] = []
  let i = 0
  while (i < line.length) {
    if (isBold) {
      if (line.substring(i, i + 2) === '**' && (i + 2 >= line.length || line[i + 2] !== '*')) {
        results.push(i)
        i += 2
        continue
      }
    } else if (isItalic) {
      if (
        line[i] === '*' &&
        (i === 0 || line[i - 1] !== '*') &&
        (i + 1 >= line.length || line[i + 1] !== '*')
      ) {
        results.push(i)
        i += 1
        continue
      }
    } else {
      if (line.substring(i, i + prefix.length) === prefix) {
        results.push(i)
        i += prefix.length
        continue
      }
    }
    i++
  }
  return results
}

export interface FormatResult {
  text: string
  start: number
  end: number
}

export function applySmartFormatting(
  cleanText: string,
  start: number,
  end: number,
  prefix: string,
  suffix = prefix
): FormatResult {
  if (start !== end) {
    // 1. Text is selected
    const selected = cleanText.substring(start, end)

    // 1A: Selected text already has prefix and suffix inside the selection (e.g. "**word**")
    if (
      selected.startsWith(prefix) &&
      selected.endsWith(suffix) &&
      selected.length >= prefix.length + suffix.length
    ) {
      const unwrapped = selected.slice(prefix.length, -suffix.length)
      return {
        text: cleanText.substring(0, start) + unwrapped + cleanText.substring(end),
        start,
        end: start + unwrapped.length,
      }
    }

    // 1B: Selection is surrounded by prefix before and suffix after (e.g. "**[word]**")
    const hasPrefixBefore =
      start >= prefix.length && cleanText.substring(start - prefix.length, start) === prefix
    const hasSuffixAfter =
      end + suffix.length <= cleanText.length &&
      cleanText.substring(end, end + suffix.length) === suffix

    if (hasPrefixBefore && hasSuffixAfter) {
      return {
        text:
          cleanText.substring(0, start - prefix.length) +
          selected +
          cleanText.substring(end + suffix.length),
        start: start - prefix.length,
        end: end - prefix.length,
      }
    }

    // 1C: Normal wrap selection
    return {
      text: cleanText.substring(0, start) + prefix + selected + suffix + cleanText.substring(end),
      start: start + prefix.length,
      end: start + prefix.length + selected.length,
    }
  }

  // 2. No text is selected (cursor is at a single position)
  const pos = start

  // 2A: Cursor is directly between empty prefix & suffix (e.g. "**|**")
  const hasPrefixBefore =
    pos >= prefix.length && cleanText.substring(pos - prefix.length, pos) === prefix
  const hasSuffixAfter =
    pos + suffix.length <= cleanText.length &&
    cleanText.substring(pos, pos + suffix.length) === suffix

  if (hasPrefixBefore && hasSuffixAfter) {
    // Toggle off: remove the empty prefix & suffix
    const newPos = pos - prefix.length
    return {
      text: cleanText.substring(0, pos - prefix.length) + cleanText.substring(pos + suffix.length),
      start: newPos,
      end: newPos,
    }
  }

  // 2B: Check if cursor is inside an existing pair of prefix and suffix on the current line
  const lineStart = cleanText.lastIndexOf('\n', pos - 1) + 1
  const rawLineEnd = cleanText.indexOf('\n', pos)
  const lineEnd = rawLineEnd === -1 ? cleanText.length : rawLineEnd
  const line = cleanText.substring(lineStart, lineEnd)
  const posInLine = pos - lineStart

  const delimiters = findFormattingDelimiters(line, prefix)
  let foundPair: { start: number; end: number; contentStart: number; contentEnd: number } | null = null
  for (let i = 0; i < delimiters.length - 1; i += 2) {
    const pStart = delimiters[i]
    const pEnd = delimiters[i + 1] + suffix.length
    if (posInLine >= pStart && posInLine <= pEnd) {
      foundPair = {
        start: lineStart + pStart,
        end: lineStart + pEnd,
        contentStart: lineStart + pStart + prefix.length,
        contentEnd: lineStart + delimiters[i + 1],
      }
      break
    }
  }

  if (foundPair) {
    // Un-format the pair!
    const innerContent = cleanText.substring(foundPair.contentStart, foundPair.contentEnd)
    const newText =
      cleanText.substring(0, foundPair.start) + innerContent + cleanText.substring(foundPair.end)
    let newPos = pos
    if (pos >= foundPair.end) {
      newPos = pos - prefix.length - suffix.length
    } else if (pos > foundPair.start) {
      newPos = Math.max(foundPair.start, pos - prefix.length)
    } else {
      newPos = pos
    }
    return { text: newText, start: newPos, end: newPos }
  }

  // 2C: Check if cursor is on/inside a word (e.g. "bo|ld" or "bold|")
  let wordStart = pos
  while (wordStart > lineStart && /\w/.test(cleanText[wordStart - 1])) {
    wordStart--
  }
  let wordEnd = pos
  while (wordEnd < lineEnd && /\w/.test(cleanText[wordEnd])) {
    wordEnd++
  }

  if (wordEnd > wordStart) {
    // Wrap the word
    const word = cleanText.substring(wordStart, wordEnd)
    const newText =
      cleanText.substring(0, wordStart) + prefix + word + suffix + cleanText.substring(wordEnd)
    const newPos = pos + prefix.length
    return { text: newText, start: newPos, end: newPos }
  }

  // 2D: Empty space / punctuation -> insert empty pair and place cursor between them
  const newText = cleanText.substring(0, pos) + prefix + suffix + cleanText.substring(pos)
  const newPos = pos + prefix.length
  return { text: newText, start: newPos, end: newPos }
}

const FORMATTING_DETECTION_REGEX =
  /#[a-zA-Z0-9_-]+|https?:\/\/|\x60|\[\[|\*\*([^*\n]+)\*\*|~~([^~\n]+)~~|(?<!\*)\*([^*\s][^*\n]*?[^*\s]|\S)\*(?!\*)|(?<!!)\[([^\]]+)\]\(([^)]+)\)/

export function checkHasRichFormatting(text: string): boolean {
  return text.trim().startsWith('```') || FORMATTING_DETECTION_REGEX.test(text)
}
