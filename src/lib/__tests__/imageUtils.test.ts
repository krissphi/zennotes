import { describe, it, expect } from 'vitest'
import { processImageFile } from '../imageUtils'

describe('imageUtils', () => {
  it('processes SVG image and stores decoupled zenblob reference', async () => {
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>'
    const file = new File([svgContent], 'diagram.svg', { type: 'image/svg+xml' })

    const result = await processImageFile(file)
    expect(result.name).toBe('diagram')
    expect(result.dataUrl).toMatch(/^zenblob:blob_/)
    expect(result.markdown).toContain('![diagram](zenblob:')
  })
})
