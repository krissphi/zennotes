/**
 * Utility functions for handling file attachments (PDF, DOCX, XLSX, ZIP, audio, etc.)
 * in notes with offline-first IndexedDB persistence and decoupled blob storage.
 */

import { BlobStorageService } from '../core/services/BlobStorageService'

export const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB

export interface ProcessedAttachment {
  name: string
  size: number
  mimeType: string
  dataUrl: string
  markdown: string
}

export interface ParsedAttachment {
  name: string
  dataUrl: string
  mimeType: string
  sizeBytes: number
  extension: string
  fullMatch: string
}

export interface AttachmentCategoryInfo {
  category: 'pdf' | 'word' | 'excel' | 'powerpoint' | 'archive' | 'audio' | 'code' | 'text' | 'file'
  colorClass: string
  bgClass: string
  borderClass: string
  badgeLabel: string
}

/**
 * Formats a byte number to human-readable size (e.g. 15.6 GB, 2.4 MB, 450 KB, 120 B)
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

/**
 * Determines file category, styling, and badge based on file extension and MIME type
 */
export function getAttachmentCategory(fileName: string, mimeType = ''): AttachmentCategoryInfo {
  const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() || '' : ''
  const mime = mimeType.toLowerCase()

  if (ext === 'pdf' || mime.includes('pdf')) {
    return {
      category: 'pdf',
      colorClass: 'text-rose-600 dark:text-rose-400',
      bgClass: 'bg-rose-50 dark:bg-rose-950/40',
      borderClass: 'border-rose-200 dark:border-rose-900/60',
      badgeLabel: 'PDF',
    }
  }

  if (
    ['doc', 'docx', 'rtf', 'odt'].includes(ext) ||
    mime.includes('word') ||
    mime.includes('officedocument.wordprocessingml')
  ) {
    return {
      category: 'word',
      colorClass: 'text-blue-600 dark:text-blue-400',
      bgClass: 'bg-blue-50 dark:bg-blue-950/40',
      borderClass: 'border-blue-200 dark:border-blue-900/60',
      badgeLabel: 'DOC',
    }
  }

  if (
    ['xls', 'xlsx', 'csv', 'ods'].includes(ext) ||
    mime.includes('spreadsheet') ||
    mime.includes('excel')
  ) {
    return {
      category: 'excel',
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
      borderClass: 'border-emerald-200 dark:border-emerald-900/60',
      badgeLabel: 'SHEET',
    }
  }

  if (
    ['ppt', 'pptx', 'odp'].includes(ext) ||
    mime.includes('presentation') ||
    mime.includes('powerpoint')
  ) {
    return {
      category: 'powerpoint',
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40',
      borderClass: 'border-amber-200 dark:border-amber-900/60',
      badgeLabel: 'PPT',
    }
  }

  if (
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext) ||
    mime.includes('zip') ||
    mime.includes('compressed') ||
    mime.includes('tar')
  ) {
    return {
      category: 'archive',
      colorClass: 'text-amber-700 dark:text-amber-300',
      bgClass: 'bg-amber-50 dark:bg-amber-950/30',
      borderClass: 'border-amber-200 dark:border-amber-900/60',
      badgeLabel: ext.toUpperCase() || 'ZIP',
    }
  }

  if (
    ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext) ||
    mime.startsWith('audio/')
  ) {
    return {
      category: 'audio',
      colorClass: 'text-purple-600 dark:text-purple-400',
      bgClass: 'bg-purple-50 dark:bg-purple-950/40',
      borderClass: 'border-purple-200 dark:border-purple-900/60',
      badgeLabel: ext.toUpperCase() || 'AUDIO',
    }
  }

  if (
    ['js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json', 'yaml', 'yml', 'rs', 'go', 'java', 'c', 'cpp', 'sh', 'sql'].includes(ext)
  ) {
    return {
      category: 'code',
      colorClass: 'text-cyan-600 dark:text-cyan-400',
      bgClass: 'bg-cyan-50 dark:bg-cyan-950/40',
      borderClass: 'border-cyan-200 dark:border-cyan-900/60',
      badgeLabel: ext.toUpperCase() || 'CODE',
    }
  }

  if (['txt', 'log', 'md'].includes(ext) || mime.startsWith('text/')) {
    return {
      category: 'text',
      colorClass: 'text-slate-600 dark:text-slate-400',
      bgClass: 'bg-slate-100 dark:bg-zinc-800/80',
      borderClass: 'border-slate-200 dark:border-zinc-700',
      badgeLabel: ext.toUpperCase() || 'TXT',
    }
  }

  return {
    category: 'file',
    colorClass: 'text-slate-600 dark:text-slate-400',
    bgClass: 'bg-slate-100 dark:bg-zinc-800/80',
    borderClass: 'border-slate-200 dark:border-zinc-700',
    badgeLabel: ext ? ext.toUpperCase().slice(0, 4) : 'FILE',
  }
}

/**
 * Reads any File and converts it to a decoupled Markdown file attachment
 * stored safely in BlobStorageService rather than polluting document history with base64.
 */
export async function processAttachmentFile(
  file: File,
  maxSizeBytes = MAX_ATTACHMENT_SIZE_BYTES
): Promise<ProcessedAttachment> {
  if (file.size > maxSizeBytes) {
    throw new Error(
      `File "${file.name}" (${formatFileSize(file.size)}) exceeds the maximum limit of ${formatFileSize(maxSizeBytes)}.`
    )
  }

  const fileName = file.name ? file.name.trim() : 'attachment'
  const mimeType = file.type || 'application/octet-stream'
  const id = `blob_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

  // Store actual binary blob in isolated BlobStorageService
  await BlobStorageService.saveBlob({
    id,
    name: fileName,
    mimeType,
    sizeBytes: file.size,
    blob: file,
  })

  // Reference in markdown with query parameters for synchronous metadata parsing
  const blobRef = `zenblob:${id}?name=${encodeURIComponent(fileName)}&size=${file.size}&type=${encodeURIComponent(mimeType)}`

  return {
    name: fileName,
    size: file.size,
    mimeType,
    dataUrl: blobRef,
    markdown: `[${fileName}](${blobRef})`,
  }
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
 * Downloads an attachment (supporting both zenblob references and legacy data URLs) with proper filename
 */
export async function downloadAttachment(dataUrlOrRef: string, fileName: string) {
  try {
    let url = dataUrlOrRef
    let isTempBlobUrl = false

    if (dataUrlOrRef.startsWith('zenblob:')) {
      url = await BlobStorageService.getBlobUrl(dataUrlOrRef)
    } else if (dataUrlOrRef.startsWith('data:')) {
      const blob = dataUrlToBlob(dataUrlOrRef)
      url = URL.createObjectURL(blob)
      isTempBlobUrl = true
    }

    if (!url) return

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    if (isTempBlobUrl) {
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    }
  } catch (err) {
    console.error('Failed to download attachment:', err)
  }
}

/**
 * Previews an attachment (e.g. PDF or text file) in a new browser tab
 */
export async function previewAttachment(dataUrlOrRef: string) {
  try {
    let url = dataUrlOrRef
    if (dataUrlOrRef.startsWith('zenblob:')) {
      url = await BlobStorageService.getBlobUrl(dataUrlOrRef)
    } else if (dataUrlOrRef.startsWith('data:')) {
      const blob = dataUrlToBlob(dataUrlOrRef)
      url = URL.createObjectURL(blob)
    }

    if (!url) return
    window.open(url, '_blank')
  } catch (err) {
    console.error('Failed to preview attachment:', err)
  }
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
    } else {
      const mimeMatch = dataUrl.match(/^data:([^;,]+)/)
      mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
      const base64 = dataUrl.split(',')[1] || ''
      sizeBytes = Math.floor((base64.length * 3) / 4)
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
    cleanText = cleanText.replace(img.fullMatch, '')
  }
  for (const att of attachments) {
    cleanText = cleanText.replace(att.fullMatch, '')
  }

  cleanText = cleanText
    .split('\n')
    .filter((line, idx, arr) => line.trim() !== '' || (idx > 0 && idx < arr.length - 1))
    .join('\n')
    .trim()

  return { cleanText, images, attachments }
}

/**
 * Returns a clean, human-friendly display title for a node's content.
 * Automatically eliminates raw base64 data URLs from images and attachments, returning:
 * 1. The clean text / caption (if present)
 * 2. Or the image name / alt text (e.g. "screenshot")
 * 3. Or the file attachment name (e.g. "Proposal.pdf")
 * 4. Fallback string if empty
 */
export function getNodeDisplayText(content: string, fallback = ''): string {
  if (!content) return fallback

  const { cleanText, images, attachments } = parseNodeMedia(content)
  const trimmedClean = cleanText.trim()
  if (trimmedClean) {
    const firstLine = trimmedClean.split('\n')[0].trim()
    return firstLine || fallback
  }

  if (images.length > 0) {
    const alt = images[0].alt.trim()
    return alt || 'Image'
  }

  if (attachments.length > 0) {
    const name = attachments[0].name.trim()
    return name || 'Attachment'
  }

  return fallback
}

/**
 * Extracts all unique zenblob ID references (e.g. "zenblob:blob_123?name=...") from text
 */
export function extractBlobIdsFromText(text: string): string[] {
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
