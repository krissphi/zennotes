import type { TreeNode } from './TreeNode'

export class TreeOperations {
  public static indentNode(
    nodes: Map<string, TreeNode>,
    rootId: string,
    nodeId: string
  ): boolean {
    const node = nodes.get(nodeId)
    if (!node || !node.parentId || nodeId === rootId) return false

    const parent = nodes.get(node.parentId)
    if (!parent) return false

    const index = parent.childrenIds.indexOf(nodeId)
    if (index <= 0) return false // Cannot indent the first sibling

    const prevSiblingId = parent.childrenIds[index - 1]
    const prevSibling = nodes.get(prevSiblingId)
    if (!prevSibling) return false

    // Move node to be child of previous sibling
    parent.removeChild(nodeId)
    node.parentId = prevSiblingId
    prevSibling.addChild(nodeId)
    prevSibling.setCollapsed(false)
    return true
  }

  public static outdentNode(
    nodes: Map<string, TreeNode>,
    rootId: string,
    nodeId: string
  ): boolean {
    const node = nodes.get(nodeId)
    if (!node || !node.parentId || nodeId === rootId) return false

    const parent = nodes.get(node.parentId)
    if (!parent || !parent.parentId) return false // Already at top level under root

    const grandParent = nodes.get(parent.parentId)
    if (!grandParent) return false

    const parentIndex = grandParent.childrenIds.indexOf(parent.id)
    parent.removeChild(nodeId)
    node.parentId = grandParent.id
    grandParent.addChild(nodeId, parentIndex + 1)
    return true
  }

  public static moveNode(
    nodes: Map<string, TreeNode>,
    nodeId: string,
    direction: 'up' | 'down'
  ): boolean {
    const node = nodes.get(nodeId)
    if (!node || !node.parentId) return false

    const parent = nodes.get(node.parentId)
    if (!parent) return false

    const index = parent.childrenIds.indexOf(nodeId)
    if (index === -1) return false

    if (direction === 'up' && index > 0) {
      const temp = parent.childrenIds[index - 1]
      parent.childrenIds[index - 1] = nodeId
      parent.childrenIds[index] = temp
      parent.touch()
      return true
    } else if (direction === 'down' && index < parent.childrenIds.length - 1) {
      const temp = parent.childrenIds[index + 1]
      parent.childrenIds[index + 1] = nodeId
      parent.childrenIds[index] = temp
      parent.touch()
      return true
    }
    return false
  }

  public static reorderNode(
    nodes: Map<string, TreeNode>,
    rootId: string,
    getDescendantIds: (id: string) => string[],
    draggedId: string,
    targetId: string,
    position: 'before' | 'after'
  ): boolean {
    if (draggedId === targetId || draggedId === rootId) return false
    const draggedNode = nodes.get(draggedId)
    const targetNode = nodes.get(targetId)
    if (!draggedNode || !targetNode || !draggedNode.parentId || !targetNode.parentId) return false

    // Prevent dragging a node into its own descendants
    const descendants = getDescendantIds(draggedId)
    if (descendants.includes(targetId)) return false

    const oldParent = nodes.get(draggedNode.parentId)
    const newParent = nodes.get(targetNode.parentId)
    if (!oldParent || !newParent) return false

    // Remove from old parent
    oldParent.removeChild(draggedId)

    // Calculate insertion index in new parent
    const targetIndex = newParent.childrenIds.indexOf(targetId)
    const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex

    draggedNode.parentId = newParent.id
    newParent.addChild(draggedId, insertIndex)

    oldParent.touch()
    newParent.touch()
    return true
  }

  public static collapseAll(
    nodes: Map<string, TreeNode>,
    rootId: string,
    getDescendantIds: (id: string) => string[],
    fromNodeId?: string
  ): void {
    const targetNodeId = fromNodeId || rootId
    const nodeIds = targetNodeId === rootId
      ? Array.from(nodes.keys())
      : [targetNodeId, ...getDescendantIds(targetNodeId)]

    nodeIds.forEach((id) => {
      if (id !== rootId) {
        const node = nodes.get(id)
        if (node && node.hasChildren()) {
          node.isCollapsed = true
          node.touch()
        }
      }
    })
  }

  public static expandAll(
    nodes: Map<string, TreeNode>,
    rootId: string,
    getDescendantIds: (id: string) => string[],
    fromNodeId?: string
  ): void {
    const targetNodeId = fromNodeId || rootId
    const nodeIds = targetNodeId === rootId
      ? Array.from(nodes.keys())
      : [targetNodeId, ...getDescendantIds(targetNodeId)]

    nodeIds.forEach((id) => {
      const node = nodes.get(id)
      if (node && node.hasChildren()) {
        node.isCollapsed = false
        node.touch()
      }
    })
  }
}
