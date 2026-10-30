export interface ParsedAttachment {
  name: string
  dataUrl: string
  mimeType: string
  sizeBytes: number
  extension: string
  fullMatch: string
}

/**
 * Checks if a DragEvent contains any file items
 */
export function hasFiles(event: React.DragEvent | DragEvent): boolean {
  if (event.dataTransfer?.types) {
    const types = Array.from(event.dataTransfer.types)
    return types.includes('Files')
  }
  return false
}

/**
 * Extracts all files from DataTransfer (drag & drop or paste)
 */
export function getAllFiles(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer?.files || dataTransfer.files.length === 0) return []
  return Array.from(dataTransfer.files)
}

/**
 * Converts a data URL to a Blob object
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',')
  const header = parts[0]
  const base64 = parts[1] || ''
  const mime = header.match(/:(.*?);/)?.[1] || 'application/octet-stream'
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

/**
 * Parses node content to extract both embedded images and embedded file attachments,
 * leaving only clean human text for the editor. Supports both legacy data URLs and modern decoupled zenblob references.
 */
export function parseNodeMedia(content: string): {
  cleanText: string
  images: Array<{ alt: string; src: string; fullMatch: string }>
  attachments: ParsedAttachment[]
} {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
  const attachmentRegex = /(?<!!)\[([^\]]+)\]\(((?:data:|zenblob:)[^)]+)\)/g

  const images: Array<{ alt: string; src: string; fullMatch: string }> = []
  const attachments: ParsedAttachment[] = []

  let imgMatch: RegExpExecArray | null
  while ((imgMatch = imageRegex.exec(content)) !== null) {
    images.push({
      alt: imgMatch[1],
      src: imgMatch[2],
      fullMatch: imgMatch[0],
    })
  }

  let attMatch: RegExpExecArray | null
  while ((attMatch = attachmentRegex.exec(content)) !== null) {
    const name = attMatch[1]
    const dataUrl = attMatch[2]
    let mimeType = 'application/octet-stream'
    let sizeBytes = 0

    if (dataUrl.startsWith('zenblob:')) {
      try {
        const qIndex = dataUrl.indexOf('?')
        if (qIndex !== -1) {
          const params = new URLSearchParams(dataUrl.substring(qIndex + 1))
          sizeBytes = parseInt(params.get('size') || '0', 10)
          mimeType = params.get('type') || 'application/octet-stream'
        }
      } catch {
        // Fallback
      }
    } else if (dataUrl.startsWith('data:')) {
      const mimeMatch = dataUrl.match(/^data:([^;]+);/)
      if (mimeMatch) {
        mimeType = mimeMatch[1]
      }
      const base64Index = dataUrl.indexOf(',')
      if (base64Index !== -1) {
        sizeBytes = Math.round((dataUrl.length - base64Index - 1) * 0.75)
      }
    }

    const extension = name.includes('.') ? name.split('.').pop()?.toLowerCase() || '' : ''

    attachments.push({
      name,
      dataUrl,
      mimeType,
      sizeBytes,
      extension,
      fullMatch: attMatch[0],
    })
  }

  let cleanText = content
  for (const img of images) {
    cleanText = cleanText
      .replace(`\n${img.fullMatch}`, '')
      .replace(`${img.fullMatch}\n`, '')
      .replace(img.fullMatch, '')
  }
  for (const att of attachments) {
    cleanText = cleanText
      .replace(`\n${att.fullMatch}`, '')
      .replace(`${att.fullMatch}\n`, '')
      .replace(att.fullMatch, '')
  }

  return { cleanText, images, attachments }
}

/**
 * Returns a human-friendly display label for a node's content, stripping image/file markdown tags.
 */
export function getNodeDisplayText(content?: string | null, fallback = '(empty item)'): string {
  if (!content) return fallback
  const { cleanText, images, attachments } = parseNodeMedia(content)
  const trimmed = cleanText.trim()
  if (trimmed) {
    const firstLine = trimmed.split('\n')[0].trim()
    return firstLine || fallback
  }
  if (images.length > 0) return images[0].alt || 'Image'
  if (attachments.length > 0) return attachments[0].name || 'Attachment'
  return fallback
}

/**
 * Extract all zenblob IDs referenced inside a text string
 */
export function extractBlobIdsFromText(text?: string | null): string[] {
  if (!text || !text.includes('zenblob:')) return []
  const matches = text.matchAll(/zenblob:([a-zA-Z0-9_-]+)/g)
  const ids: string[] = []
  for (const m of matches) {
    if (m[1] && !ids.includes(m[1])) {
      ids.push(m[1])
    }
  }
  return ids
}
