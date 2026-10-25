import type { TreeNodeData } from './TreeNode'

export interface TrashItem {
  id: string
  title: string
  note?: string
  notebookId?: string
  originalParentId: string | null
  deletedAt: number // Timestamp when deleted
  nodeData: TreeNodeData
  descendants: TreeNodeData[]
}

export class TrashUtils {
  public static SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

  public static isExpired(item: TrashItem, maxAgeMs = TrashUtils.SEVEN_DAYS_MS): boolean {
    return Date.now() - item.deletedAt > maxAgeMs
  }

  public static getRemainingDays(item: TrashItem): number {
    const elapsed = Date.now() - item.deletedAt
    const remainingMs = Math.max(0, TrashUtils.SEVEN_DAYS_MS - elapsed)
    return Math.ceil(remainingMs / (24 * 60 * 60 * 1000))
  }
}
