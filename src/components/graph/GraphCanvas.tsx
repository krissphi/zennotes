import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { GraphService, type GraphNode, type GraphEdge } from '../../core/services/GraphService'
import type { TreeDocument } from '../../core/models/TreeDocument'
import { GraphToolbar } from './GraphToolbar'
import { stepGraphPhysics } from './graphPhysics'
import { renderGraphCanvas } from './graphRenderer'
import { useGraphInteraction } from './useGraphInteraction'

interface GraphCanvasProps {
  doc: TreeDocument
  isDark?: boolean
  onSelectNode?: (nodeId: string) => void
  onSelectTag?: (tag: string) => void
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  doc,
  isDark = false,
  onSelectNode,
  onSelectTag,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Filter & view options
  const [searchQuery, setSearchQuery] = useState('')
  const [showHierarchy, setShowHierarchy] = useState(true)
  const [showTags, setShowTags] = useState(true)
  const [showWikilinks, setShowWikilinks] = useState(true)

  // Camera transform (Pan & Zoom)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const transformRef = useRef(transform)
  useEffect(() => {
    transformRef.current = transform
  }, [transform])

  // Dragging and hover states
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)

  // Extract graph data
  const rawGraphData = useMemo(() => {
    return GraphService.extractGraphData(doc, {
      showHierarchy,
      showTags,
      showWikilinks,
      isDark,
      searchQuery,
    })
  }, [doc, showHierarchy, showTags, showWikilinks, isDark, searchQuery])

  // Mutable nodes and edges refs for 60fps physics simulation
  const nodesRef = useRef<GraphNode[]>([])
  const edgesRef = useRef<GraphEdge[]>([])

  // Keep positions stable across re-renders
  useEffect(() => {
    const existingMap = new Map<string, { x: number; y: number; vx: number; vy: number }>()
    nodesRef.current.forEach((n) => {
      existingMap.set(n.id, { x: n.x, y: n.y, vx: n.vx, vy: n.vy })
    })

    const newNodes = rawGraphData.nodes.map((n) => {
      const prev = existingMap.get(n.id)
      if (prev) {
        return { ...n, x: prev.x, y: prev.y, vx: prev.vx, vy: prev.vy }
      }
      return n
    })

    nodesRef.current = newNodes
    edgesRef.current = rawGraphData.edges
  }, [rawGraphData])

  // Reset view to center
  const handleResetView = useCallback(() => {
    setTransform({ x: 0, y: 0, k: 1 })
  }, [])

  const handleZoom = (deltaK: number) => {
    setTransform((prev) => ({
      ...prev,
      k: Math.min(3, Math.max(0.2, prev.k + deltaK)),
    }))
  }

  // Mouse & Touch interaction hook
  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
  } = useGraphInteraction({
    canvasRef,
    nodesRef,
    transformRef,
    setTransform,
    setHoveredNode,
    onSelectNode,
    onSelectTag,
  })

  // Physics simulation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let isRunning = true
    const nodeMap = new Map<string, GraphNode>()

    const tick = () => {
      if (!isRunning) return
      const nodes = nodesRef.current
      const edges = edgesRef.current

      // 1. Advance physics simulation
      stepGraphPhysics(nodes, edges, nodeMap)

      // 2. Render to Canvas
      const dpr = window.devicePixelRatio || 1
      const width = canvas.clientWidth
      const height = canvas.clientHeight

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr
        canvas.height = height * dpr
      }

      renderGraphCanvas({
        ctx,
        width,
        height,
        dpr,
        transform: transformRef.current,
        nodes,
        edges,
        nodeMap,
        hoveredNode,
        isDark,
      })

      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => {
      isRunning = false
      cancelAnimationFrame(animId)
    }
  }, [isDark, hoveredNode])

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-50 dark:bg-[#121214] select-none overflow-hidden">
      {/* Top Header & Toolbar */}
      <GraphToolbar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        showHierarchy={showHierarchy}
        onToggleHierarchy={() => setShowHierarchy(!showHierarchy)}
        showTags={showTags}
        onToggleTags={() => setShowTags(!showTags)}
        showWikilinks={showWikilinks}
        onToggleWikilinks={() => setShowWikilinks(!showWikilinks)}
        onZoom={handleZoom}
        onResetView={handleResetView}
      />

      {/* Main Graph Canvas Area */}
      <div className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full h-full block touch-none"
        />

        {/* Hover / Info Tooltip */}
        {hoveredNode && (
          <div className="absolute top-4 left-4 z-20 pointer-events-none p-2.5 rounded-xl bg-white/95 dark:bg-[#18181b]/95 border border-[#E2E8F0] dark:border-[#27272A] shadow-xl text-xs max-w-xs animate-in fade-in duration-100">
            <div className="flex items-center gap-1.5 font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: hoveredNode.color }}
              />
              <span className="truncate">{hoveredNode.label}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
              <span>Type: <strong className="capitalize">{hoveredNode.type}</strong></span>
              <span>•</span>
              <span>Connections: <strong>{hoveredNode.degree}</strong></span>
            </div>
            {hoveredNode.type === 'note' && (
              <p className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                Click node to jump directly to this note
              </p>
            )}
          </div>
        )}

        {/* Stats footer pill */}
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 dark:bg-[#18181b]/90 border border-[#E2E8F0] dark:border-[#27272A] shadow-xs text-[11px] text-[#64748B] dark:text-[#94A3B8]">
          <span><strong>{rawGraphData.stats.notesCount}</strong> Notes</span>
          <span>•</span>
          <span><strong>{rawGraphData.stats.tagsCount}</strong> Tags</span>
          <span>•</span>
          <span><strong>{rawGraphData.stats.linksCount}</strong> Connections</span>
        </div>
      </div>
    </div>
  )
}
