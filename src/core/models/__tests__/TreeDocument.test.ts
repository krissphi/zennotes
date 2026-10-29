import { describe, it, expect, beforeEach } from 'vitest'
import { TreeDocument } from '../TreeDocument'

describe('TreeDocument', () => {
  let doc: TreeDocument

  beforeEach(() => {
    doc = TreeDocument.createDefault()
  })

  it('initializes with default nodes and root', () => {
    expect(doc.title).toBe('My Workspace')
    expect(doc.rootId).toBe('root')
    const root = doc.getRootNode()
    expect(root).toBeDefined()
    expect(root.childrenIds.length).toBeGreaterThan(0)
  })

  it('creates child nodes under a parent', () => {
    const root = doc.getRootNode()
    const initialCount = root.childrenIds.length
    const newNode = doc.createChildNode(doc.rootId, undefined, 'New Child Note')

    expect(newNode.parentId).toBe(doc.rootId)
    expect(newNode.content).toBe('New Child Note')
    expect(root.childrenIds.length).toBe(initialCount + 1)
    expect(root.childrenIds).toContain(newNode.id)
  })

  it('creates sibling nodes directly after the reference node', () => {
    const root = doc.getRootNode()
    const firstChildId = root.childrenIds[0]
    const siblingNode = doc.createSiblingNode(firstChildId, 'Sibling Note')

    expect(siblingNode.parentId).toBe(doc.rootId)
    const newIdx = root.childrenIds.indexOf(siblingNode.id)
    const firstIdx = root.childrenIds.indexOf(firstChildId)
    expect(newIdx).toBe(firstIdx + 1)
  })

  it('indents a node to become the child of its previous sibling', () => {
    const root = doc.getRootNode()
    const firstId = root.childrenIds[0]
    const secondId = root.childrenIds[1]

    const success = doc.indentNode(secondId)
    expect(success).toBe(true)

    const secondNode = doc.getNode(secondId)
    expect(secondNode?.parentId).toBe(firstId)
    const firstNode = doc.getNode(firstId)
    expect(firstNode?.childrenIds).toContain(secondId)
  })

  it('cannot indent the first sibling', () => {
    const root = doc.getRootNode()
    const firstId = root.childrenIds[0]
    const success = doc.indentNode(firstId)
    expect(success).toBe(false)
  })

  it('outdents a nested node to become sibling of its parent', () => {
    // n1 has child n1_1
    const n1 = doc.getNode('n1')
    expect(n1?.childrenIds).toContain('n1_1')

    const success = doc.outdentNode('n1_1')
    expect(success).toBe(true)

    const child = doc.getNode('n1_1')
    expect(child?.parentId).toBe('root')
    const root = doc.getRootNode()
    const n1Index = root.childrenIds.indexOf('n1')
    const childIndex = root.childrenIds.indexOf('n1_1')
    expect(childIndex).toBe(n1Index + 1)
  })

  it('reorders nodes up and down', () => {
    const root = doc.getRootNode()
    const firstId = root.childrenIds[0]
    const secondId = root.childrenIds[1]

    expect(doc.moveNode(secondId, 'up')).toBe(true)
    expect(root.childrenIds[0]).toBe(secondId)
    expect(root.childrenIds[1]).toBe(firstId)

    expect(doc.moveNode(secondId, 'down')).toBe(true)
    expect(root.childrenIds[0]).toBe(firstId)
    expect(root.childrenIds[1]).toBe(secondId)
  })

  it('prevents cyclic graph during reorder', () => {
    // Cannot drag n1 into its own descendant n1_1
    const success = doc.reorderNode('n1', 'n1_1_1', 'after')
    expect(success).toBe(false)
  })

  it('deletes a node and all its descendants recursively', () => {
    const descendants = doc.getDescendantIds('n1')
    expect(descendants.length).toBeGreaterThan(0)

    doc.deleteNode('n1')
    expect(doc.getNode('n1')).toBeUndefined()
    descendants.forEach((dId) => {
      expect(doc.getNode(dId)).toBeUndefined()
    })
  })

  it('restores subtree from trash correctly', () => {
    const node = doc.getNode('n1')!
    const descendants = doc.getDescendantIds('n1').map((id) => doc.getNode(id)!)

    doc.deleteNode('n1')
    expect(doc.getNode('n1')).toBeUndefined()

    doc.insertRestoredSubtree(node, descendants)
    expect(doc.getNode('n1')).toBeDefined()
    descendants.forEach((d) => {
      expect(doc.getNode(d.id)).toBeDefined()
    })
  })

  it('collapses and expands all nodes properly', () => {
    // n1 has children (n1_1)
    expect(doc.getNode('n1')?.hasChildren()).toBe(true)

    // Collapse all
    doc.collapseAll()
    expect(doc.getNode('n1')?.isCollapsed).toBe(true)

    // Expand all
    doc.expandAll()
    expect(doc.getNode('n1')?.isCollapsed).toBe(false)
  })

  it('accurately indexes and finds backlinks for wikilinks', () => {
    const target = doc.createChildNode(doc.rootId, undefined, 'Project Roadmap')
    const linker1 = doc.createChildNode(doc.rootId, undefined, 'Check out [[Project Roadmap]] for details')
    const linker2 = doc.createChildNode(doc.rootId, undefined, 'Unrelated item')
    linker2.setNote('See also [[Project Roadmap]] in roadmap notes')

    const backlinks = doc.getNodesLinkingTo('Project Roadmap', target.id)
    const backlinkIds = backlinks.map((b) => b.id)
    expect(backlinkIds).toContain(linker1.id)
    expect(backlinkIds).toContain(linker2.id)
    expect(backlinkIds).not.toContain(target.id)

    // Lookup for non-existent target
    expect(doc.getNodesLinkingTo('Non Existent')).toEqual([])
  })

  it('computes breadcrumbs hierarchy up to root', () => {
    // n1_1_1 -> n1_1 -> n1 -> root
    const crumbs = doc.getBreadcrumbs('n1_1_1')
    expect(crumbs.length).toBe(4)
    expect(crumbs[0].id).toBe('root')
    expect(crumbs[1].id).toBe('n1')
    expect(crumbs[2].id).toBe('n1_1')
    expect(crumbs[3].id).toBe('n1_1_1')
  })
})
