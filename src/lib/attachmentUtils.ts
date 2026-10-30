/**
 * Utility functions for handling file attachments (PDF, DOCX, XLSX, ZIP, audio, etc.)
 * in notes with offline-first IndexedDB persistence and decoupled blob storage.
 */

import { BlobStorageService } from '../core/services/BlobStorageService'
import { dataUrlToBlob } from './mediaParsing'

export const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB

export interface ProcessedAttachment {
  name: string
  size: number
  mimeType: string
  dataUrl: string
  markdown: string
}

export {
  type ParsedAttachment,
  hasFiles,
  getAllFiles,
  dataUrlToBlob,
  parseNodeMedia,
  getNodeDisplayText,
  extractBlobIdsFromText,
} from './mediaParsing'

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
 * Generates a deterministic content-addressable hash ID for a blob/file using SHA-256.
 * Identical files will always produce the exact same ID, preventing duplicate storage in IndexedDB.
 */
export async function computeBlobHash(blob: Blob | File): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof blob.arrayBuffer === 'function') {
    try {
      const buffer = await blob.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
      return `blob_${hashHex.substring(0, 16)}`
    } catch {
      // Fallback below
    }
  }
  const name = (blob as File).name || ''
  return `blob_${Date.now()}_${name}_${blob.size}`
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
  const id = await computeBlobHash(file)

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
