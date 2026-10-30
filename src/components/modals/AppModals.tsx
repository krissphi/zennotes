import React, { lazy, Suspense } from 'react'
import type { TreeDocument } from '../../core/models/TreeDocument'
import type { TrashItem } from '../../core/models/TrashItem'
import type { useModals } from '../../hooks/useModals'
import type { useLocalVault } from '../../hooks/useLocalVault'

// Code splitting: Heavy modals loaded asynchronously on demand
const ExportImportModal = lazy(() =>
  import('./ExportImportModal').then((m) => ({ default: m.ExportImportModal }))
)
const ShortcutsModal = lazy(() =>
  import('./ShortcutsModal').then((m) => ({ default: m.ShortcutsModal }))
)
const ConfirmDeleteModal = lazy(() =>
  import('./ConfirmDeleteModal').then((m) => ({ default: m.ConfirmDeleteModal }))
)
const TrashModal = lazy(() =>
  import('./TrashModal').then((m) => ({ default: m.TrashModal }))
)
const LocalVaultModal = lazy(() =>
  import('./LocalVaultModal').then((m) => ({ default: m.LocalVaultModal }))
)
const GraphViewModal = lazy(() =>
  import('./GraphViewModal').then((m) => ({ default: m.GraphViewModal }))
)

export interface AppModalsProps {
  modals: ReturnType<typeof useModals>
  doc: TreeDocument
  isDark: boolean
  trashItems: TrashItem[]
  deleteNode: (nodeId: string, permanent?: boolean) => void
  restoreFromTrash: (item: TrashItem) => void
  permanentlyDeleteTrash: (id: string) => Promise<void>
  emptyTrash: () => Promise<void>
  replaceDocument: (doc: TreeDocument) => void
  createNotebookWithDoc: (doc: TreeDocument) => Promise<unknown>
  vault: ReturnType<typeof useLocalVault>
  handleSelectNode: (nodeId: string) => void
  setTagSearchQuery: (tag: string) => void
}

export const AppModals: React.FC<AppModalsProps> = ({
  modals,
  doc,
  isDark,
  trashItems,
  deleteNode,
  restoreFromTrash,
  permanentlyDeleteTrash,
  emptyTrash,
  replaceDocument,
  createNotebookWithDoc,
  vault,
  handleSelectNode,
  setTagSearchQuery,
}) => {
  return (
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
      {modals.isGraphOpen && (
        <GraphViewModal
          isOpen={modals.isGraphOpen}
          onClose={() => modals.setIsGraphOpen(false)}
          doc={doc}
          isDark={isDark}
          onSelectNode={handleSelectNode}
          onSelectTag={(tag) => setTagSearchQuery(tag)}
        />
      )}
    </Suspense>
  )
}
