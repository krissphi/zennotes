import { describe, it, expect } from 'vitest'
import { TreeDocument } from '../../models/TreeDocument'
import { TreeNode } from '../../models/TreeNode'
import { ExportImportService } from '../ExportImportService'

describe('ExportImportService', () => {
  it('exports and imports to/from JSON roundtrip', () => {
    const doc = TreeDocument.createDefault()
    const jsonStr = ExportImportService.exportToJSON(doc)
    expect(jsonStr).toContain('My Workspace')

    const imported = ExportImportService.importFromJSON(jsonStr)
    expect(imported.title).toBe(doc.title)
    expect(imported.rootId).toBe(doc.rootId)
    expect(imported.getAllNodes().length).toBe(doc.getAllNodes().length)
  })

  it('exports to Markdown preserving items and notes', () => {
    const map = new Map<string, TreeNode>()
    const root = new TreeNode({ id: 'root', content: 'Project Alpha', parentId: null })
    const n1 = new TreeNode({ id: 'n1', content: 'Design Architecture', note: 'Draft specifications', parentId: 'root' })
    const n2 = new TreeNode({ id: 'n2', content: 'Implement API', isCompleted: true, parentId: 'root' })
    const n2_1 = new TreeNode({ id: 'n2_1', content: 'Write unit tests', parentId: 'n2' })

    root.childrenIds = ['n1', 'n2']
    n2.childrenIds = ['n2_1']
    map.set('root', root)
    map.set('n1', n1)
    map.set('n2', n2)
    map.set('n2_1', n2_1)

    const doc = new TreeDocument('Project Alpha', 'root', map)
    const md = ExportImportService.exportToMarkdown(doc)

    expect(md).toContain('# Project Alpha')
    expect(md).toContain('- Design Architecture')
    expect(md).toContain('> Draft specifications')
    expect(md).toContain('- [x] Implement API')
    expect(md).toContain('  - Write unit tests')

    // Test import
    const imported = ExportImportService.importFromMarkdown('Imported', md)
    expect(imported.title).toBe('Project Alpha')
    const importedRoot = imported.getRootNode()
    expect(importedRoot.childrenIds.length).toBe(2)

    const impN1 = imported.getNode(importedRoot.childrenIds[0])
    expect(impN1?.content).toBe('Design Architecture')
    expect(impN1?.note).toBe('Draft specifications')

    const impN2 = imported.getNode(importedRoot.childrenIds[1])
    expect(impN2?.content).toBe('Implement API')
    expect(impN2?.isCompleted).toBe(true)
    expect(impN2?.childrenIds.length).toBe(1)
  })

  it('exports to OPML preserving tree hierarchy and attributes', () => {
    const doc = TreeDocument.createDefault()
    const opml = ExportImportService.exportToOPML(doc)

    expect(opml).toContain('<opml version="2.0">')
    expect(opml).toContain('<title>My Workspace</title>')
    expect(opml).toContain('<outline text="Welcome to ZenNotes"')
    expect(opml).toContain('</outline>')

    const imported = ExportImportService.importFromOPML('Imported OPML', opml)
    expect(imported.title).toBe('My Workspace')
    expect(imported.getAllNodes().length).toBeGreaterThan(1)
  })

  it('exports and imports notes containing images correctly', () => {
    const map = new Map<string, TreeNode>()
    const root = new TreeNode({ id: 'root', content: 'Image Workspace', parentId: null })
    const n1 = new TreeNode({
      id: 'n1',
      content: 'Screenshot: ![Diagram](data:image/webp;base64,dGVzdA==)',
      parentId: 'root',
    })
    root.childrenIds = ['n1']
    map.set('root', root)
    map.set('n1', n1)

    const doc = new TreeDocument('Image Workspace', 'root', map)
    const md = ExportImportService.exportToMarkdown(doc)
    expect(md).toContain('![Diagram](data:image/webp;base64,dGVzdA==)')

    const imported = ExportImportService.importFromMarkdown('Imported', md)
    const impRoot = imported.getRootNode()
    const impNode = imported.getNode(impRoot.childrenIds[0])
    expect(impNode?.content).toContain('![Diagram](data:image/webp;base64,dGVzdA==)')
  })

  it('exports a specific branch to Markdown', () => {
    const map = new Map<string, TreeNode>()
    const root = new TreeNode({ id: 'root', content: 'Full Document', parentId: null })
    const n1 = new TreeNode({ id: 'n1', content: 'Sub Branch A', note: 'Context for branch', parentId: 'root' })
    const n1_1 = new TreeNode({ id: 'n1_1', content: 'Task 1', parentId: 'n1' })
    const n2 = new TreeNode({ id: 'n2', content: 'Sub Branch B', parentId: 'root' })

    root.childrenIds = ['n1', 'n2']
    n1.childrenIds = ['n1_1']
    map.set('root', root)
    map.set('n1', n1)
    map.set('n1_1', n1_1)
    map.set('n2', n2)

    const doc = new TreeDocument('Full Document', 'root', map)
    const branchMd = ExportImportService.exportBranchToMarkdown(doc, 'n1')

    expect(branchMd).toContain('# Sub Branch A')
    expect(branchMd).toContain('> Context for branch')
    expect(branchMd).toContain('- Task 1')
    expect(branchMd).not.toContain('Sub Branch B')
  })
})
