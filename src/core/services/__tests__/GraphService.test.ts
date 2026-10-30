import { describe, it, expect } from 'vitest'
import { GraphService } from '../GraphService'
import { TreeDocument } from '../../models/TreeDocument'

describe('GraphService', () => {
  it('extracts nodes, tags, and wikilinks correctly', () => {
    const doc = TreeDocument.createDefault()
    const n1 = doc.createChildNode(
      doc.rootId,
      undefined,
      'Brainstorming AI project #idea #important [[Design System]]'
    )
    doc.createChildNode(n1.id, undefined, 'Design System implementation details')

    const graph = GraphService.extractGraphData(doc, {
      showHierarchy: true,
      showTags: true,
      showWikilinks: true,
    })

    expect(graph.nodes.length).toBeGreaterThan(0)
    expect(graph.edges.length).toBeGreaterThan(0)

    // Tag nodes generated
    const tagIdea = graph.nodes.find((n) => n.label === '#idea')
    const tagImportant = graph.nodes.find((n) => n.label === '#important')
    expect(tagIdea).toBeDefined()
    expect(tagImportant).toBeDefined()

    // Wikilink edge connected
    const wikiEdge = graph.edges.find((e) => e.type === 'wikilink')
    expect(wikiEdge).toBeDefined()

    expect(graph.stats.tagsCount).toBeGreaterThanOrEqual(2)
  })

  it('filters nodes properly with searchQuery', () => {
    const doc = TreeDocument.createDefault()
    const graphAll = GraphService.extractGraphData(doc)
    const graphFiltered = GraphService.extractGraphData(doc, { searchQuery: 'Shortcuts' })

    expect(graphFiltered.nodes.length).toBeLessThan(graphAll.nodes.length)
    expect(graphFiltered.nodes.some((n) => n.label.toLowerCase().includes('shortcut'))).toBe(true)
  })
})
