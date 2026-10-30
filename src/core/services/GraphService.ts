import type { TreeDocument } from '../models/TreeDocument'

export interface GraphNode {
  id: string
  label: string
  type: 'note' | 'tag' | 'wikilink'
  nodeId?: string
  tag?: string
  radius: number
  color: string
  degree: number
  x: number
  y: number
  vx: number
  vy: number
  isPinned?: boolean
}

export interface GraphEdge {
  source: string
  target: string
  type: 'hierarchy' | 'tag' | 'wikilink'
  color: string
  length: number
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  stats: {
    notesCount: number
    tagsCount: number
    linksCount: number
  }
}

function getTagColor(tag: string, isDark: boolean): string {
  const lower = tag.toLowerCase()
  if (lower === '#todo' || lower === '#task') return isDark ? '#60a5fa' : '#3b82f6'
  if (lower === '#important' || lower === '#penting' || lower === '#urgent') return isDark ? '#fb7185' : '#f43f5e'
  if (lower === '#idea' || lower === '#ide') return isDark ? '#fbbf24' : '#f59e0b'
  if (lower === '#done' || lower === '#selesai') return isDark ? '#34d399' : '#10b981'
  return isDark ? '#c084fc' : '#a855f7'
}

export class GraphService {
  /**
   * Extract 2D network graph (Nodes, Edges, Tags, Wikilinks) from a TreeDocument
   */
  public static extractGraphData(
    doc: TreeDocument,
    options: {
      showHierarchy?: boolean
      showTags?: boolean
      showWikilinks?: boolean
      isDark?: boolean
      searchQuery?: string
    } = {}
  ): GraphData {
    const {
      showHierarchy = true,
      showTags = true,
      showWikilinks = true,
      isDark = false,
      searchQuery = '',
    } = options

    const nodesMap = new Map<string, GraphNode>()
    const edges: GraphEdge[] = []
    const tagSet = new Set<string>()

    const allTreeNodes = doc.getAllNodes ? doc.getAllNodes() : Object.values(doc.toJSON().nodes)
    const titleToNodeId = new Map<string, string>()

    // First pass: index notes and build title lookup
    for (const treeNode of allTreeNodes) {
      if (treeNode.id === doc.rootId) continue
      const firstLine = treeNode.content.split('\n')[0].trim()
      if (!firstLine) continue

      // Clean title for wikilink matching
      const cleanTitle = firstLine.replace(/^[#*-]\s+/, '').replace(/\[\[.*?\]\]/g, '').trim().toLowerCase()
      if (cleanTitle) {
        titleToNodeId.set(cleanTitle, treeNode.id)
      }

      const displayLabel = firstLine.length > 32 ? `${firstLine.substring(0, 30)}...` : firstLine

      nodesMap.set(treeNode.id, {
        id: treeNode.id,
        label: displayLabel,
        type: 'note',
        nodeId: treeNode.id,
        radius: 12,
        color: isDark ? '#10b981' : '#059669', // Emerald
        degree: 0,
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 600,
        vx: 0,
        vy: 0,
      })
    }

    // Second pass: extract relationships (Hierarchy, Tags, Wikilinks)
    for (const treeNode of allTreeNodes) {
      if (treeNode.id === doc.rootId || !nodesMap.has(treeNode.id)) continue
      const sourceNode = nodesMap.get(treeNode.id)!
      const text = `${treeNode.content} ${treeNode.note || ''}`

      // 1. Hierarchy edges (Parent -> Child)
      if (showHierarchy && treeNode.parentId && treeNode.parentId !== doc.rootId && nodesMap.has(treeNode.parentId)) {
        edges.push({
          source: treeNode.parentId,
          target: treeNode.id,
          type: 'hierarchy',
          color: isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.4)',
          length: 50,
        })
        sourceNode.degree++
        nodesMap.get(treeNode.parentId)!.degree++
      }

      // 2. Hashtags (#tag)
      if (showTags) {
        const tagMatches = text.matchAll(/#[a-zA-Z0-9_-]+/g)
        for (const tm of tagMatches) {
          const rawTag = tm[0]
          const tagId = `tag-${rawTag.toLowerCase()}`
          tagSet.add(rawTag)

          if (!nodesMap.has(tagId)) {
            nodesMap.set(tagId, {
              id: tagId,
              label: rawTag,
              type: 'tag',
              tag: rawTag,
              radius: 14,
              color: getTagColor(rawTag, isDark),
              degree: 0,
              x: (Math.random() - 0.5) * 600,
              y: (Math.random() - 0.5) * 600,
              vx: 0,
              vy: 0,
            })
          }

          edges.push({
            source: treeNode.id,
            target: tagId,
            type: 'tag',
            color: getTagColor(rawTag, isDark),
            length: 70,
          })
          sourceNode.degree++
          nodesMap.get(tagId)!.degree++
        }
      }

      // 3. Wikilinks ([[Target]])
      if (showWikilinks) {
        const wikiMatches = text.matchAll(/\[\[(.*?)\]\]/g)
        for (const wm of wikiMatches) {
          const targetTitle = wm[1].trim()
          if (!targetTitle) continue

          const cleanTarget = targetTitle.toLowerCase()
          const matchedNodeId = titleToNodeId.get(cleanTarget)

          let targetNodeId: string
          if (matchedNodeId && nodesMap.has(matchedNodeId)) {
            targetNodeId = matchedNodeId
          } else {
            // Target is an external / unborn note
            targetNodeId = `wiki-${cleanTarget}`
            if (!nodesMap.has(targetNodeId)) {
              nodesMap.set(targetNodeId, {
                id: targetNodeId,
                label: targetTitle,
                type: 'wikilink',
                radius: 10,
                color: isDark ? '#38bdf8' : '#0284c7', // Sky blue
                degree: 0,
                x: (Math.random() - 0.5) * 600,
                y: (Math.random() - 0.5) * 600,
                vx: 0,
                vy: 0,
              })
            }
          }

          edges.push({
            source: treeNode.id,
            target: targetNodeId,
            type: 'wikilink',
            color: isDark ? '#38bdf8' : '#0284c7',
            length: 80,
          })
          sourceNode.degree++
          nodesMap.get(targetNodeId)!.degree++
        }
      }
    }

    // Dynamic radius based on degree
    for (const node of nodesMap.values()) {
      node.radius = Math.min(26, Math.max(9, 9 + node.degree * 2))
    }

    // Filter by search query if present
    let nodesList = Array.from(nodesMap.values())
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchingIds = new Set<string>()

      for (const node of nodesList) {
        if (node.label.toLowerCase().includes(q) || (node.tag && node.tag.toLowerCase().includes(q))) {
          matchingIds.add(node.id)
        }
      }

      // Keep matching nodes + their 1st-degree connected neighbors
      for (const edge of edges) {
        if (matchingIds.has(edge.source)) matchingIds.add(edge.target)
        if (matchingIds.has(edge.target)) matchingIds.add(edge.source)
      }

      nodesList = nodesList.filter((n) => matchingIds.has(n.id))
    }

    const activeNodeIds = new Set(nodesList.map((n) => n.id))
    const filteredEdges = edges.filter((e) => activeNodeIds.has(e.source) && activeNodeIds.has(e.target))

    return {
      nodes: nodesList,
      edges: filteredEdges,
      stats: {
        notesCount: nodesList.filter((n) => n.type === 'note').length,
        tagsCount: tagSet.size,
        linksCount: filteredEdges.length,
      },
    }
  }
}
