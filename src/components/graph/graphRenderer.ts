import type { GraphNode, GraphEdge } from '../../core/services/GraphService'

interface RenderContextOptions {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  dpr: number
  transform: { x: number; y: number; k: number }
  nodes: GraphNode[]
  edges: GraphEdge[]
  nodeMap: Map<string, GraphNode>
  hoveredNode: GraphNode | null
  isDark: boolean
}

export function renderGraphCanvas({
  ctx,
  width,
  height,
  dpr,
  transform,
  nodes,
  edges,
  nodeMap,
  hoveredNode,
  isDark,
}: RenderContextOptions) {
  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, width, height)

  // Center origin and apply Pan/Zoom
  ctx.translate(width / 2 + transform.x, height / 2 + transform.y)
  ctx.scale(transform.k, transform.k)

  // 1. Draw subtle grid dots
  ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)'
  const gridSize = 40
  const viewLeft = (-width / 2 - transform.x) / transform.k
  const viewTop = (-height / 2 - transform.y) / transform.k
  const viewRight = (width / 2 - transform.x) / transform.k
  const viewBottom = (height / 2 - transform.y) / transform.k

  const startX = Math.floor(viewLeft / gridSize) * gridSize
  const startY = Math.floor(viewTop / gridSize) * gridSize

  for (let x = startX; x < viewRight; x += gridSize) {
    for (let y = startY; y < viewBottom; y += gridSize) {
      ctx.beginPath()
      ctx.arc(x, y, 1, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // 2. Draw Edges
  for (const edge of edges) {
    const source = nodeMap.get(edge.source)
    const target = nodeMap.get(edge.target)
    if (!source || !target) continue

    const isHighlighted =
      hoveredNode && (hoveredNode.id === source.id || hoveredNode.id === target.id)

    ctx.beginPath()
    ctx.moveTo(source.x, source.y)
    ctx.lineTo(target.x, target.y)

    if (edge.type === 'hierarchy') {
      ctx.strokeStyle = isHighlighted
        ? isDark ? '#38bdf8' : '#0284c7'
        : isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.35)'
      ctx.lineWidth = isHighlighted ? 2 : 1
      ctx.setLineDash(isHighlighted ? [] : [3, 3])
    } else if (edge.type === 'wikilink') {
      ctx.strokeStyle = isHighlighted
        ? '#10b981'
        : isDark ? 'rgba(56, 189, 248, 0.6)' : 'rgba(2, 132, 199, 0.6)'
      ctx.lineWidth = isHighlighted ? 2.5 : 1.5
      ctx.setLineDash([])
    } else {
      // Tag edge
      ctx.strokeStyle = isHighlighted ? edge.color : `${edge.color}44`
      ctx.lineWidth = isHighlighted ? 2 : 1.2
      ctx.setLineDash([])
    }

    ctx.stroke()
    ctx.setLineDash([])
  }

  // 3. Draw Nodes
  for (const node of nodes) {
    const isHovered = hoveredNode?.id === node.id
    const isConnected =
      hoveredNode &&
      edges.some(
        (e) =>
          (e.source === hoveredNode.id && e.target === node.id) ||
          (e.target === hoveredNode.id && e.source === node.id)
      )

    const opacity = !hoveredNode || isHovered || isConnected ? 1 : 0.25

    ctx.save()
    ctx.globalAlpha = opacity

    // Glow ring if hovered or connected
    if (isHovered || isConnected) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius + 5, 0, Math.PI * 2)
      ctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)'
      ctx.fill()
    }

    // Node Circle Body
    ctx.beginPath()
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
    ctx.fillStyle = node.color
    ctx.fill()
    ctx.lineWidth = isHovered ? 2.5 : 1.5
    ctx.strokeStyle = isDark ? '#18181b' : '#ffffff'
    ctx.stroke()

    // Node Label
    ctx.font = node.type === 'tag' ? 'bold 11px sans-serif' : '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    const textY = node.y + node.radius + 4
    // Background text shadow for legibility
    ctx.fillStyle = isDark ? '#09090b' : '#ffffff'
    ctx.fillText(node.label, node.x - 1, textY)
    ctx.fillText(node.label, node.x + 1, textY)
    ctx.fillText(node.label, node.x, textY - 1)
    ctx.fillText(node.label, node.x, textY + 1)

    ctx.fillStyle = isDark ? '#f4f4f5' : '#18181b'
    ctx.fillText(node.label, node.x, textY)

    ctx.restore()
  }

  ctx.restore()
}
