import { BlobStorageService } from '../core/services/BlobStorageService'
import { computeBlobHash } from './attachmentUtils'

export interface ProcessedImage {
  dataUrl: string
  name: string
  markdown: string
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  if (!canvas.toBlob) return Promise.resolve(null)
  return new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), 'image/webp', quality)
    } catch {
      resolve(null)
    }
  })
}

/**
 * Resizes and compresses an image file into an optimized decoupled blob (WebP/JPEG)
 * stored safely in BlobStorageService to maintain zero IndexedDB document bloat and ultra-fast rendering.
 */
export async function processImageFile(
  file: File | Blob,
  maxWidth = 1440,
  maxHeight = 1440,
  quality = 0.82
): Promise<ProcessedImage> {
  const fileName = (file as File).name
    ? (file as File).name.replace(/\.[^/.]+$/, '').trim() || 'image'
    : 'image'

  const id = await computeBlobHash(file)

  if (typeof FileReader === 'undefined' && typeof (file as Blob).text === 'function') {
    const text = await (file as Blob).text()
    await BlobStorageService.saveBlob({
      id,
      name: fileName,
      mimeType: file.type || 'image/svg+xml',
      sizeBytes: file.size || text.length,
      blob: file instanceof Blob ? file : undefined,
      dataUrl: `data:${file.type || 'image/svg+xml'};utf8,${encodeURIComponent(text)}`,
    })
    const blobRef = `zenblob:${id}`
    return {
      dataUrl: blobRef,
      name: fileName,
      markdown: `![${fileName}](${blobRef})`,
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.onload = async (e) => {
      const src = e.target?.result as string
      if (!src) {
        reject(new Error('Empty image file'))
        return
      }

      // SVG images can be stored directly
      if (file.type === 'image/svg+xml' || src.startsWith('data:image/svg+xml')) {
        await BlobStorageService.saveBlob({
          id,
          name: fileName,
          mimeType: 'image/svg+xml',
          sizeBytes: file.size || src.length,
          blob: file instanceof Blob ? file : undefined,
          dataUrl: src,
        })
        const blobRef = `zenblob:${id}`
        resolve({
          dataUrl: blobRef,
          name: fileName,
          markdown: `![${fileName}](${blobRef})`,
        })
        return
      }

      const img = new Image()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.onload = async () => {
        let width = img.naturalWidth || img.width
        let height = img.naturalHeight || img.height

        // Calculate scaling ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.max(1, Math.round(width * ratio))
          height = Math.max(1, Math.round(height * ratio))
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          await BlobStorageService.saveBlob({
            id,
            name: fileName,
            mimeType: file.type || 'image/jpeg',
            sizeBytes: file.size || src.length,
            blob: file instanceof Blob ? file : undefined,
            dataUrl: src,
          })
          const blobRef = `zenblob:${id}`
          resolve({
            dataUrl: blobRef,
            name: fileName,
            markdown: `![${fileName}](${blobRef})`,
          })
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Try WebP first, fallback to JPEG or PNG
        let outputDataUrl = ''
        try {
          outputDataUrl = canvas.toDataURL('image/webp', quality)
          if (!outputDataUrl.startsWith('data:image/webp')) {
            const isPng = file.type === 'image/png'
            outputDataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality)
          }
        } catch {
          outputDataUrl = src
        }

        const finalBlob = await canvasToBlob(canvas, quality)
        const finalId = await computeBlobHash(finalBlob || file)

        await BlobStorageService.saveBlob({
          id: finalId,
          name: fileName,
          mimeType: finalBlob ? finalBlob.type : 'image/webp',
          sizeBytes: finalBlob ? finalBlob.size : outputDataUrl.length,
          blob: finalBlob || undefined,
          dataUrl: outputDataUrl,
        })

        const blobRef = `zenblob:${finalId}`
        resolve({
          dataUrl: blobRef,
          name: fileName,
          markdown: `![${fileName}](${blobRef})`,
        })
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  })
}
