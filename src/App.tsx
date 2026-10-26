import { useState, useEffect, useMemo } from 'react'
import { useTreeDocument } from './hooks/useTreeDocument'
import { useNotebooks } from './hooks/useNotebooks'
import { useTheme } from './hooks/useTheme'
import { Navbar } from './components/layout/Navbar'
import { Sidebar } from './components/sidebar/Sidebar'
import { TreeView } from './components/tree/TreeView'
import { MobileToolbar } from './components/tree/MobileToolbar'
import { LandingPage } from './components/landing/LandingPage'
import { ExportImportModal } from './components/modals/ExportImportModal'
import { ShortcutsModal } from './components/modals/ShortcutsModal'
import { ConfirmDeleteModal } from './components/modals/ConfirmDeleteModal'
import { TrashModal } from './components/modals/TrashModal'
import { Loader2, PanelLeft } from 'lucide-react'

const SUPPRESS_KEY = 'zennotes_suppress_delete_date'

export function App() {
  const {
    notebooks, activeNotebookId, switchNotebook,
    createNotebook, createNotebookWithDoc, renameNotebook, deleteNotebook,
  } = useNotebooks()

  const {
    doc, isLoaded, focusedNodeId, activeEditingId, saveStatus,
    trashItems, canUndo, canRedo, undo, redo,
    setActiveEditingId, updateTitle, updateContent, updateNote,
    addSibling, addChild, deleteNode, restoreFromTrash,
    permanentlyDeleteTrash, emptyTrash, indentNode, outdentNode,
    moveNode, toggleCollapse, toggleComplete, zoomToNode,
    zoomOut, replaceDocument,
  } = useTreeDocument(activeNotebookId)

  const { isDark, toggleTheme } = useTheme()

  const isPwa = useMemo(() => {
    if (typeof window === 'undefined') return false
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      new URLSearchParams(window.location.search).get('source') === 'pwa'
    )
  }, [])

  const [view, setView] = useState<'landing' | 'app'>(() => {
    if (typeof window === 'undefined' || isPwa) return 'app'
    return window.location.hash === '#app' ? 'app' : 'landing'
  })

  useEffect(() => {
    const handleHashChange = () => {
      if (!isPwa) setView(window.location.hash === '#app' ? 'app' : 'landing')
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [isPwa])

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 1024
  })

  // Sync sidebar state dynamically when switching viewports in DevTools or on device orientation change
  useEffect(() => {
    let prevWidth = window.innerWidth
    const handleResize = () => {
      const curWidth = window.innerWidth
      if (prevWidth >= 1024 && curWidth < 1024) {
        setIsSidebarOpen(false)
      } else if (prevWidth < 1024 && curWidth >= 1024) {
        setIsSidebarOpen(true)
      }
      prevWidth = curWidth
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [isTrashOpen, setIsTrashOpen] = useState(false)
  const [nodeToDelete, setNodeToDelete] = useState<{
    id: string; content: string; childCount: number
  } | null>(null)

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExportOpen(false)
        setIsShortcutsOpen(false)
        setIsTrashOpen(false)
        setNodeToDelete(null)
        return
      }
      const target = e.target as HTMLElement | null
      if (target?.closest('[role="dialog"]') || target?.closest('.fixed')) return

      const isCtrl = e.ctrlKey || e.metaKey
      if (isCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if (isCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [undo, redo])

  const handleSelectNode = (nodeId: string) => {
    zoomToNode(nodeId)
    setActiveEditingId(nodeId)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false)
    }
  }

  const handleNavigateToWikilink = (targetTitle: string) => {
    const cleanTarget = targetTitle.trim().toLowerCase()
    if (!cleanTarget) return

    const all = doc.getAllNodes()
    const target =
      all.find((n) => n.id !== doc.rootId && n.content.trim().toLowerCase() === cleanTarget) ||
      all.find((n) => n.id !== doc.rootId && n.content.toLowerCase().includes(cleanTarget))

    if (target) {
      handleSelectNode(target.id)
    } else {
      const newChild = addChild(focusedNodeId)
      if (newChild) {
        updateContent(newChild, targetTitle)
        setActiveEditingId(newChild)
      }
    }
  }

  const handleRequestDeleteNode = (nodeId: string, forceConfirm = false) => {
    const node = doc.getNode(nodeId)
    if (!node) return
    const childCount = doc.getDescendantIds(nodeId).length
    const suppressed = localStorage.getItem(SUPPRESS_KEY) === new Date().toISOString().split('T')[0]
    if ((!forceConfirm && !node.content.trim() && childCount === 0) || suppressed) {
      deleteNode(nodeId)
      return
    }
    setNodeToDelete({ id: node.id, content: node.content, childCount })
  }

  const handleConfirmDelete = (dontAskToday: boolean) => {
    if (nodeToDelete) {
      deleteNode(nodeToDelete.id)
      if (dontAskToday) {
        localStorage.setItem(SUPPRESS_KEY, new Date().toISOString().split('T')[0])
      }
      setNodeToDelete(null)
    }
  }

  if (!isPwa && view === 'landing') {
    return (
      <>
        <LandingPage
          onOpenApp={() => { setView('app'); window.location.hash = '#app' }}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
        <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      </>
    )
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#09090B] text-[#64748B] dark:text-[#94A3B8]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-medium">Loading workspace...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-white dark:bg-[#09090B] text-[#0F172A] dark:text-[#F8FAFC] transition-colors">
      <Navbar
        title={doc.title}
        onTitleChange={updateTitle}
        saveStatus={saveStatus}
        doc={doc}
        isDark={isDark}
        trashCount={trashItems.length}
        canUndo={canUndo}
        canRedo={canRedo}
        focusedNodeId={focusedNodeId}
        onUndo={undo}
        onRedo={redo}
        onZoomOut={zoomOut}
        onToggleTheme={toggleTheme}
        onOpenTrash={() => setIsTrashOpen(true)}
        onSelectNode={handleSelectNode}
        onOpenExportImport={() => setIsExportOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onGoToLanding={!isPwa ? () => { setView('landing'); window.location.hash = '' } : undefined}
      />

      <div className="relative flex-1 h-[calc(100vh-52px)] flex overflow-hidden">
        {/* Mobile & Tablet Drawer Backdrop (no duplicate blur filter) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Responsive Sidebar (Full overlay drawer on mobile & tablet, side-by-side dock on desktop) */}
        <div
          className={`fixed top-0 bottom-0 left-0 z-50 lg:relative lg:z-auto transition-all duration-300 ease-in-out h-full overflow-hidden shrink-0 flex flex-col shadow-2xl lg:shadow-none ${
            isSidebarOpen
              ? 'w-72 sm:w-80 max-w-[85vw] lg:w-64 xl:w-72 translate-x-0 opacity-100'
              : '-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:pointer-events-none'
          }`}
        >
          <Sidebar
            onClose={() => setIsSidebarOpen(false)}
            doc={doc}
            focusedNodeId={focusedNodeId}
            onSelectNode={handleSelectNode}
            notebooks={notebooks}
            activeNotebookId={activeNotebookId}
            onSelectNotebook={switchNotebook}
            onCreateNotebook={createNotebook}
            onRenameNotebook={renameNotebook}
            onDeleteNotebook={deleteNotebook}
          />
        </div>

        {/* Center / Main Canvas Area (Always full width on mobile/tablet) */}
        <div className="relative flex-1 h-full flex flex-col min-w-0 overflow-y-auto bg-white dark:bg-[#09090B]">
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              title="Open Tree Map"
              className="hidden lg:flex absolute top-4 left-4 z-20 w-8 h-8 items-center justify-center rounded-lg bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-[#27272A] text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-2xs transition-all duration-200"
            >
              <PanelLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          )}

          <main className="flex-1 pb-28 sm:pb-24 flex flex-col">
            <TreeView
              doc={doc}
              focusedNodeId={focusedNodeId}
              activeEditingId={activeEditingId}
              onUpdateContent={updateContent}
              onUpdateNote={updateNote}
              onAddSibling={addSibling}
              onAddChild={addChild}
              onRequestDeleteNode={handleRequestDeleteNode}
              onIndent={indentNode}
              onOutdent={outdentNode}
              onMoveUp={(id) => moveNode(id, 'up')}
              onMoveDown={(id) => moveNode(id, 'down')}
              onToggleCollapse={toggleCollapse}
              onToggleComplete={toggleComplete}
              onZoomIn={zoomToNode}
              onZoomOut={zoomOut}
              onSetActiveId={setActiveEditingId}
              onNavigateToWikilink={handleNavigateToWikilink}
            />
          </main>
        </div>
      </div>

      {/* Mobile Floating Action Toolbar */}
      <MobileToolbar
        activeNodeId={activeEditingId}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onAddNote={() => {
          const id = addChild(focusedNodeId)
          if (id) setActiveEditingId(id)
        }}
        onIndent={indentNode}
        onOutdent={outdentNode}
        onMoveUp={(id) => moveNode(id, 'up')}
        onMoveDown={(id) => moveNode(id, 'down')}
        onAddChild={addChild}
        onAddSibling={addSibling}
        onToggleComplete={toggleComplete}
        onDelete={(id) => handleRequestDeleteNode(id, true)}
        onClose={() => setActiveEditingId(null)}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(nodeToDelete)}
        onClose={() => setNodeToDelete(null)}
        onConfirm={handleConfirmDelete}
        nodeContent={nodeToDelete?.content || ''}
        childCount={nodeToDelete?.childCount || 0}
      />
      <TrashModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        items={trashItems}
        onRestore={restoreFromTrash}
        onPermanentDelete={permanentlyDeleteTrash}
        onEmptyTrash={emptyTrash}
      />
      <ExportImportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        doc={doc}
        onImportDocument={replaceDocument}
        onImportAsNewNotebook={createNotebookWithDoc}
      />
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  )
}

export default App
