import { describe, it, expect } from 'vitest'
import { BlobStorageService } from '../BlobStorageService'

describe('BlobStorageService', () => {
  it('saves and retrieves blob records from memory fallback', async () => {
    const id = 'test_blob_1'
    const blob = new Blob(['sample content'], { type: 'text/plain' })

    await BlobStorageService.saveBlob({
      id,
      name: 'sample.txt',
      mimeType: 'text/plain',
      sizeBytes: 14,
      blob,
    })

    const record = await BlobStorageService.getBlobRecord(id)
    expect(record).not.toBeNull()
    expect(record?.id).toBe(id)
    expect(record?.name).toBe('sample.txt')
    expect(record?.sizeBytes).toBe(14)
  })

  it('resolves blob url or data url correctly', async () => {
    const id = 'test_blob_2'
    await BlobStorageService.saveBlob({
      id,
      name: 'photo.webp',
      mimeType: 'image/webp',
      sizeBytes: 100,
      dataUrl: 'data:image/webp;base64,samplebase64',
    })

    const url = await BlobStorageService.getBlobUrl(`zenblob:${id}?name=photo.webp`)
    expect(url).toBe('data:image/webp;base64,samplebase64')
  })

  it('deletes blob record cleanly', async () => {
    const id = 'test_blob_3'
    await BlobStorageService.saveBlob({
      id,
      name: 'doc.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 50,
    })

    await BlobStorageService.deleteBlob(id)
    const record = await BlobStorageService.getBlobRecord(id)
    expect(record).toBeNull()
  })

  it('runs orphan blob GC and collects unused blobs', async () => {
    const orphanId = 'orphan_blob_999'
    await BlobStorageService.saveBlob({
      id: orphanId,
      name: 'orphan.png',
      mimeType: 'image/png',
      sizeBytes: 120,
    })

    const allBefore = await BlobStorageService.getAllBlobIds()
    expect(allBefore).toContain(orphanId)

    const result = await BlobStorageService.runBlobGC()
    expect(result.deletedOrphans).toBeGreaterThanOrEqual(1)

    const recordAfter = await BlobStorageService.getBlobRecord(orphanId)
    expect(recordAfter).toBeNull()
  })
})
