import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import { useTreeDocument } from './hooks/useTreeDocument'
import { useNotebooks } from './hooks/useNotebooks'
import { useTheme } from './hooks/useTheme'
import { useLocalVault } from './hooks/useLocalVault'
import { useModals } from './hooks/useModals'
import { useGlobalKeyboard } from './hooks/useGlobalKeyboard'
import { useGlobalPaste } from './hooks/useGlobalPaste'
import { Navbar } from './components/layout/Navbar'
import { Sidebar } from './components/sidebar/Sidebar'
import { TreeView } from './components/tree/TreeView'
import { MobileToolbar } from './components/tree/MobileToolbar'
import { LandingPage } from './components/landing/LandingPage'
import { ToastContainer } from './components/ui/Toast'
import { Loader2, PanelLeft } from 'lucide-react'

// Code splitting: Heavy modals loaded asynchronously on demand
const ExportImportModal = lazy(() =>
  import('./components/modals/ExportImportModal').then((m) => ({ default: m.ExportImportModal }))
)
const ShortcutsModal = lazy(() =>
  import('./components/modals/ShortcutsModal').then((m) => ({ default: m.ShortcutsModal }))
)
const ConfirmDeleteModal = lazy(() =>
  import('./components/modals/ConfirmDeleteModal').then((m) => ({ default: m.ConfirmDeleteModal }))
)
const TrashModal = lazy(() =>
  import('./components/modals/TrashModal').then((m) => ({ default: m.TrashModal }))
)
const LocalVaultModal = lazy(() =>
  import('./components/modals/LocalVaultModal').then((m) => ({ default: m.LocalVaultModal }))
)

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
    moveNode, toggleCollapse, collapseAll, expandAll, toggleComplete, zoomToNode,
    zoomOut, replaceDocument,
  } = useTreeDocument(activeNotebookId)

  const vault = useLocalVault(doc)
  const { isDark, toggleTheme } = useTheme()
  const modals = useModals()

  const [tagSearchQuery, setTagSearchQuery] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 1024
  })

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

  // Responsive sidebar viewport listener
  useEffect(() => {
    let prevWidth = window.innerWidth
    const handleResize = () => {
      const curWidth = window.innerWidth
      if (prevWidth >= 1024 && curWidth < 1024) setIsSidebarOpen(false)
      else if (prevWidth < 1024 && curWidth >= 1024) setIsSidebarOpen(true)
      prevWidth = curWidth
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Stable callback memoization
  const handleMoveUp = useCallback((id: string) => moveNode(id, 'up'), [moveNode])
  const handleMoveDown = useCallback((id: string) => moveNode(id, 'down'), [moveNode])
  const handleCollapseAll = useCallback((fromId?: string) => collapseAll(fromId), [collapseAll])
  const handleExpandAll = useCallback((fromId?: string) => expandAll(fromId), [expandAll])

  const handleSelectNode = useCallback((nodeId: string) => {
    zoomToNode(nodeId)
    setActiveEditingId(nodeId)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false)
    }
  }, [zoomToNode, setActiveEditingId])

  const handleNavigateToWikilink = useCallback((targetTitle: string) => {
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
  }, [doc, focusedNodeId, addChild, updateContent, setActiveEditingId, handleSelectNode])

  const handleRequestDeleteNode = useCallback((nodeId: string, forceConfirm = false) => {
    const node = doc.getNode(nodeId)
    const childCount = doc.getDescendantIds(nodeId).length
    modals.requestDeleteNode(nodeId, node, childCount, forceConfirm, deleteNode)
  }, [doc, modals, deleteNode])

  // Wire decoupled global keyboard & paste hooks
  useGlobalKeyboard({
    onEscape: () => {
      modals.closeAllModals()
      setTagSearchQuery(null)
    },
    onCollapseAll: handleCollapseAll,
    onExpandAll: handleExpandAll,
    onUndo: undo,
    onRedo: redo,
    focusedNodeId,
  })

  useGlobalPaste({
    focusedNodeId,
    onAddChild: addChild,
  })

  if (!isPwa && view === 'landing') {
    return (
      <>
        <LandingPage
          onOpenApp={() => { setView('app'); window.location.hash = '#app' }}
          onOpenShortcuts={() => modals.setIsShortcutsOpen(true)}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
        <Suspense fallback={null}>
          <ShortcutsModal isOpen={modals.isShortcutsOpen} onClose={() => modals.setIsShortcutsOpen(false)} />
        </Suspense>
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
        onOpenTrash={() => modals.setIsTrashOpen(true)}
        onSelectNode={handleSelectNode}
        onOpenExportImport={() => modals.setIsExportOpen(true)}
        onOpenShortcuts={() => modals.setIsShortcutsOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onGoToLanding={!isPwa ? () => { setView('landing'); window.location.hash = '' } : undefined}
        searchQuery={tagSearchQuery}
        onClearSearchQuery={() => setTagSearchQuery(null)}
        onCollapseAll={() => handleCollapseAll(focusedNodeId)}
        onExpandAll={() => handleExpandAll(focusedNodeId)}
        onOpenVault={() => modals.setIsVaultOpen(true)}
        isVaultConnected={vault.isConnected}
        vaultFolderName={vault.folderName}
      />

      <div className="relative flex-1 h-[calc(100vh-52px)] flex overflow-hidden">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

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
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onToggleCollapse={toggleCollapse}
              onToggleComplete={toggleComplete}
              onZoomIn={zoomToNode}
              onZoomOut={zoomOut}
              onSetActiveId={setActiveEditingId}
              onNavigateToWikilink={handleNavigateToWikilink}
              onSelectTag={(tag) => setTagSearchQuery(tag)}
              onCollapseAll={handleCollapseAll}
              onExpandAll={handleExpandAll}
            />
          </main>
        </div>
      </div>

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
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        onAddChild={addChild}
        onAddSibling={addSibling}
        onToggleComplete={toggleComplete}
        onDelete={(id) => handleRequestDeleteNode(id, true)}
        onClose={() => setActiveEditingId(null)}
      />

      {/* Lazy Modals with Suspense */}
      <Suspense fallback={null}>
        {modals.nodeToDelete && (
          <ConfirmDeleteModal
            isOpen={Boolean(modals.nodeToDelete)}
            onClose={() => modals.setNodeToDelete(null)}
            onConfirm={(dontAskToday) => modals.confirmDelete(dontAskToday, deleteNode)}
            nodeContent={modals.nodeToDelete.content}
            childCount={modals.nodeToDelete.childCount}
          />
        )}
        {modals.isTrashOpen && (
          <TrashModal
            isOpen={modals.isTrashOpen}
            onClose={() => modals.setIsTrashOpen(false)}
            items={trashItems}
            onRestore={restoreFromTrash}
            onPermanentDelete={permanentlyDeleteTrash}
            onEmptyTrash={emptyTrash}
          />
        )}
        {modals.isExportOpen && (
          <ExportImportModal
            isOpen={modals.isExportOpen}
            onClose={() => modals.setIsExportOpen(false)}
            doc={doc}
            onImportDocument={replaceDocument}
            onImportAsNewNotebook={createNotebookWithDoc}
          />
        )}
        {modals.isVaultOpen && (
          <LocalVaultModal
            isOpen={modals.isVaultOpen}
            onClose={() => modals.setIsVaultOpen(false)}
            isSupported={vault.isSupported}
            isConnected={vault.isConnected}
            folderName={vault.folderName}
            autoSync={vault.autoSync}
            isSyncing={vault.isSyncing}
            lastSyncedAt={vault.lastSyncedAt}
            onConnect={vault.connectVault}
            onDisconnect={vault.disconnectVault}
            onSyncNow={vault.syncNow}
            onToggleAutoSync={vault.toggleAutoSync}
          />
        )}
        {modals.isShortcutsOpen && (
          <ShortcutsModal
            isOpen={modals.isShortcutsOpen}
            onClose={() => modals.setIsShortcutsOpen(false)}
          />
        )}
      </Suspense>

      {/* Global Toast Notification Container */}
      <ToastContainer />
    </div>
  )
}

export default App
