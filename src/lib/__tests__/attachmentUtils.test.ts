import { describe, it, expect } from 'vitest'
import {
  formatFileSize,
  getAttachmentCategory,
  parseNodeMedia,
  getNodeDisplayText,
  extractBlobIdsFromText,
  computeBlobHash,
  processAttachmentFile,
} from '../attachmentUtils'

describe('attachmentUtils', () => {
  it('formats file sizes accurately', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(500)).toBe('500 B')
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB')
    expect(formatFileSize(1024 * 1024 * 1024 * 15.5)).toBe('15.5 GB')
  })

  it('determines correct category and labels for extensions', () => {
    expect(getAttachmentCategory('report.pdf').category).toBe('pdf')
    expect(getAttachmentCategory('report.docx').category).toBe('word')
    expect(getAttachmentCategory('budget.xlsx').category).toBe('excel')
    expect(getAttachmentCategory('slides.pptx').category).toBe('powerpoint')
    expect(getAttachmentCategory('archive.zip').category).toBe('archive')
    expect(getAttachmentCategory('song.mp3').category).toBe('audio')
    expect(getAttachmentCategory('script.ts').category).toBe('code')
    expect(getAttachmentCategory('unknown.xyz').category).toBe('file')
  })

  it('parses media cleanly into cleanText, images, and attachments', () => {
    const rawContent = [
      'My meeting agenda',
      'Here is an external link: [Google](https://google.com)',
      '![Photo](data:image/webp;base64,AAAA)',
      '[AnnualReport.pdf](data:application/pdf;base64,BBBB)',
      '[ProjectArchive.zip](data:application/zip;base64,CCCC)',
    ].join('\n')

    const result = parseNodeMedia(rawContent)

    // Clean text must not have data URLs
    expect(result.cleanText).toContain('My meeting agenda')
    expect(result.cleanText).toContain('[Google](https://google.com)')
    expect(result.cleanText).not.toContain('base64')
    expect(result.cleanText).not.toContain('AnnualReport.pdf')

    // Images
    expect(result.images).toHaveLength(1)
    expect(result.images[0].alt).toBe('Photo')
    expect(result.images[0].src).toBe('data:image/webp;base64,AAAA')

    // Attachments
    expect(result.attachments).toHaveLength(2)
    expect(result.attachments[0].name).toBe('AnnualReport.pdf')
    expect(result.attachments[0].extension).toBe('pdf')
    expect(result.attachments[0].mimeType).toBe('application/pdf')

    expect(result.attachments[1].name).toBe('ProjectArchive.zip')
    expect(result.attachments[1].extension).toBe('zip')
  })

  it('extracts clean display text from nodes containing media without exposing base64', () => {
    // 1. Text only
    expect(getNodeDisplayText('Simple Task')).toBe('Simple Task')
    expect(getNodeDisplayText('Line 1\nLine 2')).toBe('Line 1')

    // 2. Image only with alt
    expect(
      getNodeDisplayText('![App Screenshot](data:image/webp;base64,UklGRm...)')
    ).toBe('App Screenshot')

    // 3. Image without alt
    expect(
      getNodeDisplayText('![](data:image/webp;base64,UklGRm...)')
    ).toBe('Image')

    // 4. Attachment only
    expect(
      getNodeDisplayText('[FinancialReport.pdf](data:application/pdf;base64,JVBERi...)')
    ).toBe('FinancialReport.pdf')

    // 5. Text + image
    expect(
      getNodeDisplayText('Architecture Overview\n![Diagram](data:image/webp;base64,...)')
    ).toBe('Architecture Overview')

    // 6. Empty content with fallback
    expect(getNodeDisplayText('', 'Default Fallback')).toBe('Default Fallback')

    // 7. Decoupled zenblob attachment reference
    expect(
      getNodeDisplayText('[Contract.pdf](zenblob:blob_123?name=Contract.pdf&size=2048&type=application/pdf)')
    ).toBe('Contract.pdf')

    // 8. Decoupled zenblob image reference
    expect(
      getNodeDisplayText('![Wireframe](zenblob:blob_456)')
    ).toBe('Wireframe')
  })

  it('parses decoupled zenblob attachments correctly', () => {
    const content = [
      'Project Documentation',
      '![Diagram](zenblob:blob_img1)',
      '[Specs.docx](zenblob:blob_att1?name=Specs.docx&size=51200&type=application/vnd.openxmlformats-officedocument.wordprocessingml.document)',
    ].join('\n')

    const result = parseNodeMedia(content)
    expect(result.cleanText).toBe('Project Documentation')
    expect(result.images).toHaveLength(1)
    expect(result.images[0].src).toBe('zenblob:blob_img1')
    expect(result.attachments).toHaveLength(1)
    expect(result.attachments[0].name).toBe('Specs.docx')
    expect(result.attachments[0].sizeBytes).toBe(51200)
    expect(result.attachments[0].extension).toBe('docx')
  })

  it('extracts all zenblob IDs from text accurately', () => {
    const text = `
      Some note with ![image](zenblob:blob_12345) and an attachment
      [file.pdf](zenblob:blob_67890?name=file.pdf&size=100) and repeated ![again](zenblob:blob_12345)
    `
    const ids = extractBlobIdsFromText(text)
    expect(ids).toEqual(['blob_12345', 'blob_67890'])
  })

  it('preserves spaces, trailing spaces, and multiline text while typing', () => {
    // 1. Trailing space (the exact bug report: typing spacebar at end of word)
    expect(parseNodeMedia('hello ').cleanText).toBe('hello ')
    expect(parseNodeMedia('hello world ').cleanText).toBe('hello world ')

    // 2. Spaces at start and consecutive spaces
    expect(parseNodeMedia('   indent').cleanText).toBe('   indent')
    expect(parseNodeMedia('multiple   spaces   inside').cleanText).toBe('multiple   spaces   inside')

    // 3. Trailing spaces when media is attached
    const withMedia = 'Caption with space \n![Photo](zenblob:blob_1)'
    expect(parseNodeMedia(withMedia).cleanText).toBe('Caption with space ')
  })

  it('generates identical hash IDs for identical files (deduplication)', async () => {
    const file1 = new File(['Hello World!'], 'document.txt', { type: 'text/plain' })
    const file2 = new File(['Hello World!'], 'document.txt', { type: 'text/plain' })
    const file3 = new File(['Different content'], 'document.txt', { type: 'text/plain' })

    const hash1 = await computeBlobHash(file1)
    const hash2 = await computeBlobHash(file2)
    const hash3 = await computeBlobHash(file3)

    // Identical content must yield identical blob hash IDs
    expect(hash1).toBe(hash2)
    // Different content must yield different blob hash IDs
    expect(hash1).not.toBe(hash3)

    const res1 = await processAttachmentFile(file1)
    const res2 = await processAttachmentFile(file2)
    expect(res1.dataUrl).toBe(res2.dataUrl)
  })
})
