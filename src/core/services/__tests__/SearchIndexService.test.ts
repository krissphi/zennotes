import { describe, it, expect } from 'vitest'
import { SearchIndexService } from '../SearchIndexService'
import { TreeDocument } from '../../models/TreeDocument'
import { TreeNode } from '../../models/TreeNode'

describe('SearchIndexService', () => {
  it('indexes document and performs fuzzy full-text search', () => {
    const root = new TreeNode({ id: 'root', content: 'Root Doc', parentId: null })
    const n1 = new TreeNode({ id: 'n1', content: 'Design architecture overview #important', parentId: 'root' })
    const n2 = new TreeNode({ id: 'n2', content: 'Implement fuzzy search algorithm #todo', parentId: 'root' })
    const n3 = new TreeNode({ id: 'n3', content: 'Quarterly financial budget review', parentId: 'root' })

    root.childrenIds = ['n1', 'n2', 'n3']
    const map = new Map<string, TreeNode>()
    ;[root, n1, n2, n3].forEach((n) => map.set(n.id, n))

    const doc = new TreeDocument('Workspace', 'root', map)
    const indexService = new SearchIndexService()
    indexService.indexDocument(doc)

    // 1. Exact term search
    const r1 = indexService.search('architecture')
    expect(r1.length).toBeGreaterThan(0)
    expect(r1[0].id).toBe('n1')

    // 2. Fuzzy term search with typo ("algoritm" instead of "algorithm")
    const r2 = indexService.search('algoritm')
    expect(r2.length).toBeGreaterThan(0)
    expect(r2[0].id).toBe('n2')

    // 3. Tag search
    const r3 = indexService.search('#important')
    expect(r3.length).toBeGreaterThan(0)
    expect(r3[0].id).toBe('n1')
  })

  it('supports incremental updates and removals without full document reindexing', () => {
    const root = new TreeNode({ id: 'root', content: 'Root', parentId: null })
    const n1 = new TreeNode({ id: 'n1', content: 'Original title', parentId: 'root' })
    root.childrenIds = ['n1']
    const map = new Map<string, TreeNode>()
    ;[root, n1].forEach((n) => map.set(n.id, n))
    const doc = new TreeDocument('Workspace', 'root', map)

    const indexService = new SearchIndexService()
    indexService.indexDocument(doc)

    expect(indexService.search('Original').length).toBe(1)

    // Incremental update
    n1.setContent('Updated rocket science notes')
    indexService.updateNode(n1, doc)

    expect(indexService.search('Original').length).toBe(0)
    expect(indexService.search('rocket').length).toBe(1)

    // Incremental remove
    indexService.removeNode('n1')
    expect(indexService.search('rocket').length).toBe(0)
  })
})
