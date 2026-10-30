import React, { useRef, useCallback } from 'react'
import type { GraphNode } from '../../core/services/GraphService'

interface UseGraphInteractionOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  nodesRef: React.MutableRefObject<GraphNode[]>
  transformRef: React.MutableRefObject<{ x: number; y: number; k: number }>
  setTransform: React.Dispatch<React.SetStateAction<{ x: number; y: number; k: number }>>
  setHoveredNode: (node: GraphNode | null) => void
  onSelectNode?: (nodeId: string) => void
  onSelectTag?: (tag: string) => void
}

export function useGraphInteraction({
  canvasRef,
  nodesRef,
  transformRef,
  setTransform,
  setHoveredNode,
  onSelectNode,
  onSelectTag,
}: UseGraphInteractionOptions) {
  const draggingNodeRef = useRef<GraphNode | null>(null)
  const isPanningRef = useRef(false)
  const lastMousePosRef = useRef({ x: 0, y: 0 })
  const dragStartPosRef = useRef({ x: 0, y: 0 })
  const hasDraggedRef = useRef(false)
  const touchStartDistRef = useRef<number | null>(null)

  // Convert client mouse coordinates to world coordinates
  const getCanvasWorldPos = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      const mouseX = clientX - rect.left
      const mouseY = clientY - rect.top
      const cur = transformRef.current

      const worldX = (mouseX - rect.width / 2 - cur.x) / cur.k
      const worldY = (mouseY - rect.height / 2 - cur.y) / cur.k
      return { x: worldX, y: worldY }
    },
    [canvasRef, transformRef]
  )

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    dragStartPosRef.current = { x: e.clientX, y: e.clientY }
    lastMousePosRef.current = { x: e.clientX, y: e.clientY }
    hasDraggedRef.current = false

    const worldPos = getCanvasWorldPos(e.clientX, e.clientY)
    const nodes = nodesRef.current

    // Check if clicked a node
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i]
      const dx = worldPos.x - node.x
      const dy = worldPos.y - node.y
      if (dx * dx + dy * dy <= (node.radius + 6) * (node.radius + 6)) {
        draggingNodeRef.current = node
        node.isPinned = true
        return
      }
    }

    // Otherwise, start canvas pan
    isPanningRef.current = true
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const dx = e.clientX - lastMousePosRef.current.x
    const dy = e.clientY - lastMousePosRef.current.y
    lastMousePosRef.current = { x: e.clientX, y: e.clientY }

    const totalDist = Math.hypot(
      e.clientX - dragStartPosRef.current.x,
      e.clientY - dragStartPosRef.current.y
    )
    if (totalDist > 5) {
      hasDraggedRef.current = true
    }

    if (draggingNodeRef.current) {
      const worldPos = getCanvasWorldPos(e.clientX, e.clientY)
      draggingNodeRef.current.x = worldPos.x
      draggingNodeRef.current.y = worldPos.y
      draggingNodeRef.current.vx = 0
      draggingNodeRef.current.vy = 0
      return
    }

    if (isPanningRef.current) {
      setTransform((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }))
      return
    }

    // Hover detection
    const worldPos = getCanvasWorldPos(e.clientX, e.clientY)
    const nodes = nodesRef.current
    let foundHover: GraphNode | null = null
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i]
      const distSq = (worldPos.x - node.x) ** 2 + (worldPos.y - node.y) ** 2
      if (distSq <= (node.radius + 4) ** 2) {
        foundHover = node
        break
      }
    }
    setHoveredNode(foundHover)
  }

  const handleMouseUp = () => {
    if (draggingNodeRef.current) {
      draggingNodeRef.current.isPinned = false
      draggingNodeRef.current = null
    }
    isPanningRef.current = false
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If the mouse was dragged, DO NOT open the note or trigger navigation
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false
      return
    }

    const worldPos = getCanvasWorldPos(e.clientX, e.clientY)
    const nodes = nodesRef.current

    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i]
      const distSq = (worldPos.x - node.x) ** 2 + (worldPos.y - node.y) ** 2
      if (distSq <= (node.radius + 4) ** 2) {
        if (node.type === 'note' && node.nodeId && onSelectNode) {
          onSelectNode(node.nodeId)
        } else if (node.type === 'tag' && node.tag && onSelectTag) {
          onSelectTag(node.tag)
        }
        return
      }
    }
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      dragStartPosRef.current = { x: touch.clientX, y: touch.clientY }
      lastMousePosRef.current = { x: touch.clientX, y: touch.clientY }
      hasDraggedRef.current = false

      const worldPos = getCanvasWorldPos(touch.clientX, touch.clientY)
      const nodes = nodesRef.current
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i]
        const dx = worldPos.x - node.x
        const dy = worldPos.y - node.y
        if (dx * dx + dy * dy <= (node.radius + 8) * (node.radius + 8)) {
          draggingNodeRef.current = node
          node.isPinned = true
          return
        }
      }
      isPanningRef.current = true
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      touchStartDistRef.current = Math.hypot(dx, dy)
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      const dx = touch.clientX - lastMousePosRef.current.x
      const dy = touch.clientY - lastMousePosRef.current.y
      lastMousePosRef.current = { x: touch.clientX, y: touch.clientY }

      const totalDist = Math.hypot(
        touch.clientX - dragStartPosRef.current.x,
        touch.clientY - dragStartPosRef.current.y
      )
      if (totalDist > 6) {
        hasDraggedRef.current = true
      }

      if (draggingNodeRef.current) {
        const worldPos = getCanvasWorldPos(touch.clientX, touch.clientY)
        draggingNodeRef.current.x = worldPos.x
        draggingNodeRef.current.y = worldPos.y
        draggingNodeRef.current.vx = 0
        draggingNodeRef.current.vy = 0
        return
      }

      if (isPanningRef.current) {
        setTransform((prev) => ({
          ...prev,
          x: prev.x + dx,
          y: prev.y + dy,
        }))
      }
    } else if (e.touches.length === 2 && touchStartDistRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      const factor = dist / touchStartDistRef.current
      touchStartDistRef.current = dist

      setTransform((prev) => ({
        ...prev,
        k: Math.min(3, Math.max(0.2, prev.k * factor)),
      }))
    }
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (draggingNodeRef.current) {
      draggingNodeRef.current.isPinned = false
      draggingNodeRef.current = null
    }
    isPanningRef.current = false
    touchStartDistRef.current = null

    if (!hasDraggedRef.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0]
      const worldPos = getCanvasWorldPos(touch.clientX, touch.clientY)
      const nodes = nodesRef.current
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i]
        const distSq = (worldPos.x - node.x) ** 2 + (worldPos.y - node.y) ** 2
        if (distSq <= (node.radius + 8) ** 2) {
          if (node.type === 'note' && node.nodeId && onSelectNode) {
            onSelectNode(node.nodeId)
          } else if (node.type === 'tag' && node.tag && onSelectTag) {
            onSelectTag(node.tag)
          }
          return
        }
      }
    }
    hasDraggedRef.current = false
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
    setTransform((prev) => ({
      ...prev,
      k: Math.min(3, Math.max(0.2, prev.k * zoomFactor)),
    }))
  }

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
  }
}
