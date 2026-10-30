import React from 'react'
import { Search, ZoomIn, ZoomOut, RotateCcw, Tag, GitBranch, Link2 } from 'lucide-react'

interface GraphToolbarProps {
  searchQuery: string
  onSearchQueryChange: (q: string) => void
  showHierarchy: boolean
  onToggleHierarchy: () => void
  showTags: boolean
  onToggleTags: () => void
  showWikilinks: boolean
  onToggleWikilinks: () => void
  onZoom: (deltaK: number) => void
  onResetView: () => void
}

export const GraphToolbar: React.FC<GraphToolbarProps> = ({
  searchQuery,
  onSearchQueryChange,
  showHierarchy,
  onToggleHierarchy,
  showTags,
  onToggleTags,
  showWikilinks,
  onToggleWikilinks,
  onZoom,
  onResetView,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4 bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#27272A] z-10">
      <div className="flex items-center gap-2 flex-1 max-w-xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search graph..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-lg text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Filter toggles */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={onToggleHierarchy}
          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
            showHierarchy
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-[#64748B] dark:text-[#94A3B8]'
          }`}
        >
          <GitBranch className="w-3 h-3" />
          <span>Hierarchy</span>
        </button>

        <button
          onClick={onToggleTags}
          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
            showTags
              ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300'
              : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-[#64748B] dark:text-[#94A3B8]'
          }`}
        >
          <Tag className="w-3 h-3" />
          <span>Tags</span>
        </button>

        <button
          onClick={onToggleWikilinks}
          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
            showWikilinks
              ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300'
              : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-[#64748B] dark:text-[#94A3B8]'
          }`}
        >
          <Link2 className="w-3 h-3" />
          <span>Wikilinks</span>
        </button>
      </div>

      {/* Zoom & View Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onZoom(0.2)}
          title="Zoom In"
          className="p-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#27272A] hover:bg-slate-100 dark:hover:bg-zinc-800 text-[#64748B] dark:text-[#94A3B8] transition-colors cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onZoom(-0.2)}
          title="Zoom Out"
          className="p-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#27272A] hover:bg-slate-100 dark:hover:bg-zinc-800 text-[#64748B] dark:text-[#94A3B8] transition-colors cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onResetView}
          title="Reset View"
          className="p-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#27272A] hover:bg-slate-100 dark:hover:bg-zinc-800 text-[#64748B] dark:text-[#94A3B8] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
