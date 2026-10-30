import type { GraphNode, GraphEdge } from '../../core/services/GraphService'

export function stepGraphPhysics(
  nodes: GraphNode[],
  edges: GraphEdge[],
  nodeMap: Map<string, GraphNode>
) {
  nodeMap.clear()
  nodes.forEach((n) => nodeMap.set(n.id, n))

  // 1. Repulsion between all node pairs
  const repulsionK = 1800
  for (let i = 0; i < nodes.length; i++) {
    const n1 = nodes[i]
    for (let j = i + 1; j < nodes.length; j++) {
      const n2 = nodes[j]
      const dx = n2.x - n1.x
      const dy = n2.y - n1.y
      const distSq = dx * dx + dy * dy + 100 // Prevent division by zero
      const dist = Math.sqrt(distSq)
      const force = repulsionK / distSq

      const fx = (dx / dist) * force
      const fy = (dy / dist) * force

      if (!n1.isPinned) {
        n1.vx -= fx
        n1.vy -= fy
      }
      if (!n2.isPinned) {
        n2.vx += fx
        n2.vy += fy
      }
    }
  }

  // 2. Spring attraction along edges
  const springK = 0.04
  for (const edge of edges) {
    const source = nodeMap.get(edge.source)
    const target = nodeMap.get(edge.target)
    if (!source || !target) continue

    const dx = target.x - source.x
    const dy = target.y - source.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const displacement = dist - edge.length
    const force = displacement * springK

    const fx = (dx / dist) * force
    const fy = (dy / dist) * force

    if (!source.isPinned) {
      source.vx += fx
      source.vy += fy
    }
    if (!target.isPinned) {
      target.vx -= fx
      target.vy -= fy
    }
  }

  // 3. Center gravity (gentle pull toward origin)
  const gravity = 0.015
  for (const n of nodes) {
    if (!n.isPinned) {
      n.vx -= n.x * gravity
      n.vy -= n.y * gravity

      // Apply velocity with friction damping
      n.vx *= 0.88
      n.vy *= 0.88
      n.x += n.vx
      n.y += n.vy
    }
  }
}
