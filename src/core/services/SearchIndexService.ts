import MiniSearch, { type SearchResult } from 'minisearch'
import type { TreeDocument } from '../models/TreeDocument'
import type { TreeNode } from '../models/TreeNode'
import { parseNodeMedia, getNodeDisplayText } from '../../lib/attachmentUtils'

export interface IndexedNodeDocument {
  id: string
  cleanContent: string
  note: string
  tags: string
  path: string
}

export class SearchIndexService {
  private miniSearch: MiniSearch<IndexedNodeDocument>

  constructor() {
    this.miniSearch = new MiniSearch<IndexedNodeDocument>({
      fields: ['cleanContent', 'tags', 'note', 'path'],
      storeFields: ['id', 'cleanContent', 'tags', 'note', 'path'],
      searchOptions: {
        boost: { tags: 3, cleanContent: 2, note: 1.2, path: 0.8 },
        fuzzy: (term) => (term.length > 3 ? 0.2 : false), // fuzzy for words > 3 chars
        prefix: true, // auto prefix search
      },
    })
  }

  /**
   * Builds the search index from all active nodes in the TreeDocument.
   * Strips all media/base64 blobs to ensure indexing is lightning fast.
   */
  public indexDocument(doc: TreeDocument): void {
    this.miniSearch.removeAll()

    const allNodes = doc.getAllNodes().filter((n) => n.id !== doc.rootId)
    const docsToIndex: IndexedNodeDocument[] = []

    for (const node of allNodes) {
      const { cleanText } = parseNodeMedia(node.content)
      const tags = (node.content.match(/#[a-zA-Z0-9_-]+/g) || []).join(' ')
      const breadcrumbs = doc.getBreadcrumbs(node.id)
      const path = breadcrumbs
        .slice(0, -1)
        .map((c) => (c.id === doc.rootId ? 'Root' : getNodeDisplayText(c.content) || '...'))
        .join(' > ')

      docsToIndex.push({
        id: node.id,
        cleanContent: cleanText,
        note: node.note || '',
        tags,
        path,
      })
    }

    if (docsToIndex.length > 0) {
      this.miniSearch.addAll(docsToIndex)
    }
  }

  /**
   * Incrementally updates or adds a single node in the MiniSearch index
   * without rebuilding the entire document index.
   */
  public updateNode(node: TreeNode, doc: TreeDocument): void {
    if (node.id === doc.rootId) return

    const { cleanText } = parseNodeMedia(node.content)
    const tags = (node.content.match(/#[a-zA-Z0-9_-]+/g) || []).join(' ')
    const breadcrumbs = doc.getBreadcrumbs(node.id)
    const path = breadcrumbs
      .slice(0, -1)
      .map((c) => (c.id === doc.rootId ? 'Root' : getNodeDisplayText(c.content) || '...'))
      .join(' > ')

    const indexedDoc: IndexedNodeDocument = {
      id: node.id,
      cleanContent: cleanText,
      note: node.note || '',
      tags,
      path,
    }

    if (this.miniSearch.has(node.id)) {
      this.miniSearch.replace(indexedDoc)
    } else {
      this.miniSearch.add(indexedDoc)
    }
  }

  /**
   * Incrementally removes a single node from the index.
   */
  public removeNode(nodeId: string): void {
    if (this.miniSearch.has(nodeId)) {
      this.miniSearch.discard(nodeId)
    }
  }

  /**
   * Performs fuzzy, prefix-aware full text search across content, tags, notes, and paths.
   */
  public search(query: string, maxResults = 15): Array<{ id: string; score: number; match: SearchResult['match'] }> {
    const trimmed = query.trim()
    if (!trimmed) return []

    // 1. Run MiniSearch fuzzy full-text search
    const results = this.miniSearch.search(trimmed, {
      fuzzy: (term) => (term.length >= 3 ? 0.2 : false),
      prefix: true,
      combineWith: 'AND',
    })

    if (results.length > 0) {
      return results.slice(0, maxResults).map((r) => ({
        id: r.id,
        score: r.score,
        match: r.match,
      }))
    }

    // 2. Fallback: if user types partial terms or special chars like # or [[
    const fallbackResults = this.miniSearch.search(trimmed, {
      fuzzy: 0.25,
      prefix: true,
      combineWith: 'OR',
    })

    return fallbackResults.slice(0, maxResults).map((r) => ({
      id: r.id,
      score: r.score,
      match: r.match,
    }))
  }
}
