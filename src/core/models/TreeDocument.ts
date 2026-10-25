import { TreeNode, type TreeNodeData } from './TreeNode'

export interface TreeDocumentData {
  title: string
  rootId: string
  nodes: Record<string, TreeNodeData>
  updatedAt: number
}

export class TreeDocument {
  public title: string
  public rootId: string
  private nodes: Map<string, TreeNode>

  constructor(title: string, rootId: string, nodes: Map<string, TreeNode>) {
    this.title = title
    this.rootId = rootId
    this.nodes = nodes
  }

  public getNode(id: string): TreeNode | undefined {
    return this.nodes.get(id)
  }

  public getRootNode(): TreeNode {
    const root = this.nodes.get(this.rootId)
    if (!root) {
      throw new Error(`Root node ${this.rootId} not found`)
    }
    return root
  }

  public getAllNodes(): TreeNode[] {
    return Array.from(this.nodes.values())
  }

  public createChildNode(parentId: string, index?: number, content = ''): TreeNode {
    const parent = this.nodes.get(parentId)
    if (!parent) throw new Error(`Parent node ${parentId} not found`)

    const newId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const newNode = new TreeNode({
      id: newId,
      content,
      parentId,
      childrenIds: [],
    })

    this.nodes.set(newId, newNode)
    parent.addChild(newId, index)
    parent.setCollapsed(false) // Expand parent so child is visible
    return newNode
  }

  public createSiblingNode(referenceNodeId: string, content = ''): TreeNode {
    const refNode = this.nodes.get(referenceNodeId)
    if (!refNode || !refNode.parentId) {
      // If root, create child under root
      return this.createChildNode(this.rootId, undefined, content)
    }

    const parent = this.nodes.get(refNode.parentId)
    if (!parent) throw new Error(`Parent ${refNode.parentId} not found`)

    const refIndex = parent.childrenIds.indexOf(referenceNodeId)
    return this.createChildNode(parent.id, refIndex + 1, content)
  }

  public deleteNode(nodeId: string): { newFocusId: string | null } {
    if (nodeId === this.rootId) return { newFocusId: null }
    const node = this.nodes.get(nodeId)
    if (!node || !node.parentId) return { newFocusId: null }

    const parent = this.nodes.get(node.parentId)
    if (!parent) return { newFocusId: null }

    const index = parent.childrenIds.indexOf(nodeId)
    let newFocusId: string | null = null

    if (index > 0) {
      newFocusId = parent.childrenIds[index - 1]
    } else if (parent.id !== this.rootId) {
      newFocusId = parent.id
    } else if (parent.childrenIds.length > 1) {
      newFocusId = parent.childrenIds[1]
    }

    // Recursively delete all descendant nodes
    const toDelete = [nodeId, ...this.getDescendantIds(nodeId)]
    toDelete.forEach((id) => this.nodes.delete(id))

    parent.removeChild(nodeId)
    return { newFocusId }
  }

  public insertRestoredSubtree(rootNode: TreeNode, descendants: TreeNode[]): void {
    const parentId = rootNode.parentId && this.nodes.has(rootNode.parentId)
      ? rootNode.parentId
      : this.rootId

    rootNode.parentId = parentId
    const parent = this.nodes.get(parentId)
    if (!parent) return

    this.nodes.set(rootNode.id, rootNode)
    parent.addChild(rootNode.id)
    parent.setCollapsed(false)

    descendants.forEach((d) => {
      this.nodes.set(d.id, d)
    })
    parent.touch()
  }

  public indentNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId)
    if (!node || !node.parentId || nodeId === this.rootId) return false

    const parent = this.nodes.get(node.parentId)
    if (!parent) return false

    const index = parent.childrenIds.indexOf(nodeId)
    if (index <= 0) return false // Cannot indent the first sibling

    const prevSiblingId = parent.childrenIds[index - 1]
    const prevSibling = this.nodes.get(prevSiblingId)
    if (!prevSibling) return false

    // Move node to be child of previous sibling
    parent.removeChild(nodeId)
    node.parentId = prevSiblingId
    prevSibling.addChild(nodeId)
    prevSibling.setCollapsed(false)
    return true
  }

  public outdentNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId)
    if (!node || !node.parentId || nodeId === this.rootId) return false

    const parent = this.nodes.get(node.parentId)
    if (!parent || !parent.parentId) return false // Already at top level under root

    const grandParent = this.nodes.get(parent.parentId)
    if (!grandParent) return false

    const parentIndex = grandParent.childrenIds.indexOf(parent.id)
    parent.removeChild(nodeId)
    node.parentId = grandParent.id
    grandParent.addChild(nodeId, parentIndex + 1)
    return true
  }

  public moveNode(nodeId: string, direction: 'up' | 'down'): boolean {
    const node = this.nodes.get(nodeId)
    if (!node || !node.parentId) return false

    const parent = this.nodes.get(node.parentId)
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

  public reorderNode(draggedId: string, targetId: string, position: 'before' | 'after'): boolean {
    if (draggedId === targetId || draggedId === this.rootId) return false
    const draggedNode = this.nodes.get(draggedId)
    const targetNode = this.nodes.get(targetId)
    if (!draggedNode || !targetNode || !draggedNode.parentId || !targetNode.parentId) return false

    // Prevent dragging a node into its own descendants
    const descendants = this.getDescendantIds(draggedId)
    if (descendants.includes(targetId)) return false

    const oldParent = this.nodes.get(draggedNode.parentId)
    const newParent = this.nodes.get(targetNode.parentId)
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

  public getBreadcrumbs(targetId: string): TreeNode[] {
    const trail: TreeNode[] = []
    const visited = new Set<string>()
    let currentId: string | null = targetId

    while (currentId) {
      if (visited.has(currentId)) break // Guard against cyclic loops
      visited.add(currentId)
      const node = this.nodes.get(currentId)
      if (!node) break
      trail.unshift(node)
      currentId = node.parentId
    }
    return trail
  }

  public getDescendantIds(nodeId: string): string[] {
    const descendants: string[] = []
    const node = this.nodes.get(nodeId)
    if (!node) return descendants

    const visited = new Set<string>([nodeId])
    const stack = [...node.childrenIds]
    while (stack.length > 0) {
      const current = stack.pop()!
      if (visited.has(current)) continue // Guard against cyclic loops
      visited.add(current)
      descendants.push(current)
      const currentObj = this.nodes.get(current)
      if (currentObj) {
        stack.push(...currentObj.childrenIds)
      }
    }
    return descendants
  }

  public clone(): TreeDocument {
    const clonedMap = new Map<string, TreeNode>()
    this.nodes.forEach((node, id) => {
      clonedMap.set(id, node.clone())
    })
    return new TreeDocument(this.title, this.rootId, clonedMap)
  }

  public toJSON(): TreeDocumentData {
    const nodesObj: Record<string, TreeNodeData> = {}
    this.nodes.forEach((node, id) => {
      nodesObj[id] = node.toJSON()
    })
    return {
      title: this.title,
      rootId: this.rootId,
      nodes: nodesObj,
      updatedAt: Date.now(),
    }
  }

  public static fromJSON(data: TreeDocumentData): TreeDocument {
    const map = new Map<string, TreeNode>()
    Object.entries(data.nodes).forEach(([id, nodeData]) => {
      map.set(id, TreeNode.fromJSON(nodeData))
    })
    return new TreeDocument(data.title, data.rootId, map)
  }

  public static createDefault(): TreeDocument {
    const root = new TreeNode({ id: 'root', content: 'Main Notes', parentId: null })
    const n1 = new TreeNode({ id: 'n1', content: 'Welcome to ZenNotes', parentId: 'root' })
    const n1_1 = new TreeNode({
      id: 'n1_1',
      content: 'A deep tree outliner for structured thinking without boundaries.',
      parentId: 'n1',
    })
    const n1_1_1 = new TreeNode({
      id: 'n1_1_1',
      content: 'Nest branches as deeply as your thoughts require.',
      parentId: 'n1_1',
    })
    const n2 = new TreeNode({ id: 'n2', content: 'Quick Keyboard Shortcuts:', parentId: 'root' })
    const n2_1 = new TreeNode({ id: 'n2_1', content: 'Enter: Create new item', parentId: 'n2' })
    const n2_2 = new TreeNode({ id: 'n2_2', content: 'Tab: Indent item one level deeper', parentId: 'n2' })
    const n2_3 = new TreeNode({ id: 'n2_3', content: 'Shift + Tab: Outdent item one level back', parentId: 'n2' })
    const n2_4 = new TreeNode({ id: 'n2_4', content: 'Alt + Up / Down: Reorder items', parentId: 'n2' })
    const n3 = new TreeNode({
      id: 'n3',
      content: 'Click the bullet point to zoom in (hoist) into any branch.',
      parentId: 'root',
    })

    root.childrenIds = ['n1', 'n2', 'n3']
    n1.childrenIds = ['n1_1']
    n1_1.childrenIds = ['n1_1_1']
    n2.childrenIds = ['n2_1', 'n2_2', 'n2_3', 'n2_4']

    const map = new Map<string, TreeNode>()
    ;[root, n1, n1_1, n1_1_1, n2, n2_1, n2_2, n2_3, n2_4, n3].forEach((node) => {
      map.set(node.id, node)
    })

    return new TreeDocument('My Workspace', 'root', map)
  }
}
