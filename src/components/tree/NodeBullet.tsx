import React from 'react'
import { ChevronRight, ChevronDown, Check, X, Plus } from 'lucide-react'

interface NodeBulletProps {
  hasChildren: boolean
  isCollapsed: boolean
  isCompleted: boolean
  isEditing?: boolean
  onToggleCollapse: () => void
  onZoomIn: () => void
  onToggleComplete?: () => void
  onAddChild?: () => void
}

export const NodeBullet: React.FC<NodeBulletProps> = ({
  hasChildren,
  isCollapsed,
  isCompleted,
  isEditing,
  onToggleCollapse,
  onZoomIn,
  onToggleComplete,
  onAddChild,
}) => {
  return (
    <div className="flex items-center gap-0.5 shrink-0 select-none group/bullet">
      {/* Collapse/Expand Toggle Arrow (Fixed 20px dimension across all states) */}
      <div className="w-5 h-5 flex items-center justify-center shrink-0">
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleCollapse()
            }}
            className="w-5 h-5 flex items-center justify-center rounded text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0 active:scale-95"
            title={isCollapsed ? 'Expand branch' : 'Collapse branch'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            )}
          </button>
        ) : (
          <span className="w-5 h-5 shrink-0" />
        )}
      </div>

      {/* Bullet & Sub-point Add Container */}
      <div className="relative group/bullet-zone flex items-center justify-center shrink-0">
        {/* Invisible hit-bridge to prevent losing hover when moving down */}
        <div className="absolute -inset-x-2 -top-1 -bottom-4 pointer-events-none group-hover/bullet-zone:pointer-events-auto" />

        {/* Main Bullet Button: Fixed 20px touch zone across all devices */}
        <button
          onClick={isCompleted && onToggleComplete ? onToggleComplete : onZoomIn}
          title={
            isCompleted
              ? 'Click to unmark as completed'
              : 'Click to zoom into this branch'
          }
          className={`relative w-5 h-5 flex items-center justify-center rounded-full shrink-0 transition-colors group/bullet-btn active:scale-90 ${
            isCompleted
              ? 'hover:bg-amber-100/60 dark:hover:bg-amber-950/40 text-emerald-600 dark:text-emerald-400 hover:text-amber-700'
              : 'hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          {isCompleted ? (
            <>
              <Check className="w-3.5 h-3.5 group-hover/bullet-btn:hidden shrink-0" />
              <X className="w-3.5 h-3.5 hidden group-hover/bullet-btn:block shrink-0" />
            </>
          ) : (
            <span
              className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                isEditing
                  ? hasChildren
                    ? 'bg-emerald-600 dark:bg-emerald-400 ring-2 ring-emerald-500/30 dark:ring-emerald-400/40'
                    : 'bg-emerald-600 dark:bg-emerald-400'
                  : hasChildren
                  ? 'bg-[#0F172A] dark:bg-[#F8FAFC] ring-2 ring-slate-400/40 dark:ring-zinc-600'
                  : 'bg-[#64748B] dark:bg-[#94A3B8] hover:bg-[#0F172A] dark:hover:bg-white'
              }`}
            />
          )}

          {/* Center dot indicator if collapsed with hidden children */}
          {hasChildren && isCollapsed && !isCompleted && (
            <span className="absolute w-1 h-1 bg-white dark:bg-[#09090B] rounded-full pointer-events-none" />
          )}
        </button>

        {/* Minimalist icon-only + button on hover */}
        {onAddChild && (
          <div className="absolute top-[18px] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center opacity-0 group-hover/bullet-zone:opacity-100 pointer-events-none group-hover/bullet-zone:pointer-events-auto transition-opacity duration-150">
            <div className="w-[1.5px] h-1.5 bg-emerald-500/40" />
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddChild()
              }}
              title="Add sub-item"
              className="w-[18px] h-[18px] rounded-full bg-white dark:bg-zinc-800 border border-[#CBD5E1] dark:border-[#3F3F46] hover:border-emerald-600 dark:hover:border-emerald-400 text-[#475569] dark:text-[#E2E8F0] hover:text-white hover:bg-emerald-600 dark:hover:bg-emerald-500 shadow-xs flex items-center justify-center transition-colors active:scale-95"
            >
              <Plus className="w-2.5 h-2.5 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
