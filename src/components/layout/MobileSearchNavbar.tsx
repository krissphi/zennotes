import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { LiveSearch } from '../search/LiveSearch'
import type { TreeDocument } from '../../core/models/TreeDocument'

interface MobileSearchNavbarProps {
  doc: TreeDocument
  searchQuery?: string | null
  onSelectNode: (nodeId: string) => void
  onClose: () => void
  onClearSearchQuery?: () => void
}

export const MobileSearchNavbar: React.FC<MobileSearchNavbarProps> = ({
  doc,
  searchQuery,
  onSelectNode,
  onClose,
  onClearSearchQuery,
}) => {
  return (
    <header className="h-[52px] shrink-0 z-30 flex items-center px-2.5 sm:px-4 bg-white/95 dark:bg-[#09090B]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#27272A] gap-2">
      <button
        onClick={() => {
          onClose()
          onClearSearchQuery?.()
        }}
        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        title="Back"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="flex-1">
        <LiveSearch
          doc={doc}
          onSelectNode={(nodeId) => {
            onSelectNode(nodeId)
            onClose()
          }}
          autoFocus
          onClose={() => {
            onClose()
            onClearSearchQuery?.()
          }}
          externalQuery={searchQuery}
          onClearExternalQuery={onClearSearchQuery}
        />
      </div>
    </header>
  )
}
