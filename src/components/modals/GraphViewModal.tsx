import React, { useEffect } from 'react'
import { X, Network } from 'lucide-react'
import type { TreeDocument } from '../../core/models/TreeDocument'
import { GraphCanvas } from '../graph/GraphCanvas'

interface GraphViewModalProps {
  isOpen: boolean
  onClose: () => void
  doc: TreeDocument
  isDark?: boolean
  onSelectNode: (nodeId: string) => void
  onSelectTag?: (tag: string) => void
}

export const GraphViewModal: React.FC<GraphViewModalProps> = ({
  isOpen,
  onClose,
  doc,
  isDark = false,
  onSelectNode,
  onSelectTag,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSelectNode = (nodeId: string) => {
    onSelectNode(nodeId)
    onClose()
  }

  const handleSelectTag = (tag: string) => {
    onSelectTag?.(tag)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl h-[88vh] bg-white dark:bg-[#18181b] border border-[#E2E8F0] dark:border-[#27272A] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-[#18181b] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                Interactive Graph View
              </h2>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                Visual 2D knowledge network of notes, #tags, and [[wikilinks]]
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-[#64748B] dark:text-[#94A3B8] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Graph Canvas */}
        <div className="flex-1 w-full h-full min-h-0 relative">
          <GraphCanvas
            doc={doc}
            isDark={isDark}
            onSelectNode={handleSelectNode}
            onSelectTag={handleSelectTag}
          />
        </div>
      </div>
    </div>
  )
}
