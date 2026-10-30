import { TreeNode, type TreeNodeData } from './TreeNode'
import { TreeOperations } from './TreeOperations'
import { createDefaultNodes } from './defaultDocument'

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
  private wikilinkMapCache: Map<string, string[]> | null = null

  constructor(title: string, rootId: string, nodes: Map<string, TreeNode>) {
    this.title = title
    this.rootId = rootId
    this.nodes = nodes
  }

  /**
   * Fast indexed lookup of all nodes that link to targetTitle via [[WikiLink]] syntax.
   * Built once per TreeDocument instance and cached for O(1) retrieval.
   */
  public getNodesLinkingTo(targetTitle: string, excludeId?: string): TreeNode[] {
    const cleanTarget = targetTitle.trim().toLowerCase()
    if (!cleanTarget) return []

    if (!this.wikilinkMapCache) {
      this.wikilinkMapCache = new Map()
      for (const node of this.nodes.values()) {
        if (node.id === this.rootId) continue
        const text = `${node.content} ${node.note || ''}`.toLowerCase()
        if (!text.includes('[[')) continue

        const matches = text.matchAll(/\[\[(.*?)\]\]/g)
        for (const m of matches) {
          const link = m[1].trim().toLowerCase()
          if (link) {
            const list = this.wikilinkMapCache.get(link) || []
            if (!list.includes(node.id)) {
              list.push(node.id)
              this.wikilinkMapCache.set(link, list)
            }
          }
        }
      }
    }

    const nodeIds = this.wikilinkMapCache.get(cleanTarget) || []
    return nodeIds
      .filter((id) => id !== excludeId)
      .map((id) => this.nodes.get(id))
      .filter((n): n is TreeNode => Boolean(n))
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
    return TreeOperations.indentNode(this.nodes, this.rootId, nodeId)
  }

  public outdentNode(nodeId: string): boolean {
    return TreeOperations.outdentNode(this.nodes, this.rootId, nodeId)
  }

  public moveNode(nodeId: string, direction: 'up' | 'down'): boolean {
    return TreeOperations.moveNode(this.nodes, nodeId, direction)
  }

  public reorderNode(draggedId: string, targetId: string, position: 'before' | 'after'): boolean {
    return TreeOperations.reorderNode(
      this.nodes,
      this.rootId,
      (id) => this.getDescendantIds(id),
      draggedId,
      targetId,
      position
    )
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

  public collapseAll(fromNodeId?: string): void {
    TreeOperations.collapseAll(this.nodes, this.rootId, (id) => this.getDescendantIds(id), fromNodeId)
  }

  public expandAll(fromNodeId?: string): void {
    TreeOperations.expandAll(this.nodes, this.rootId, (id) => this.getDescendantIds(id), fromNodeId)
  }

  /**
   * Fine-grained mutation with structural sharing (O(1) node clone instead of O(N) full tree clone).
   * Creates a shallow copy of the Map and clones only the specified node.
   * Unchanged nodes retain reference identity, eliminating massive GC and CPU overhead in large trees.
   */
  public cloneWithNodeUpdate(nodeId: string, updater: (node: TreeNode) => void): TreeDocument {
    const targetNode = this.nodes.get(nodeId)
    if (!targetNode) return this

    const clonedMap = new Map<string, TreeNode>(this.nodes)
    const clonedTarget = targetNode.clone()
    updater(clonedTarget)
    clonedMap.set(nodeId, clonedTarget)

    const newDoc = new TreeDocument(this.title, this.rootId, clonedMap)
    newDoc.wikilinkMapCache = null
    return newDoc
  }

  /**
   * Fine-grained batch mutation with structural sharing for a specific list of node IDs.
   */
  public cloneWithNodesUpdate(
    nodeIds: string[],
    updater: (node: TreeNode) => void
  ): TreeDocument {
    const clonedMap = new Map<string, TreeNode>(this.nodes)
    for (const id of nodeIds) {
      const node = clonedMap.get(id)
      if (node) {
        const clonedNode = node.clone()
        updater(clonedNode)
        clonedMap.set(id, clonedNode)
      }
    }
    const newDoc = new TreeDocument(this.title, this.rootId, clonedMap)
    newDoc.wikilinkMapCache = null
    return newDoc
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
    const { title, rootId, nodes } = createDefaultNodes()
    return new TreeDocument(title, rootId, nodes)
  }
}
