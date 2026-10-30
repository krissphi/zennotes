export interface TreeNodeData {
  id: string
  content: string
  note?: string
  parentId: string | null
  childrenIds: string[]
  isCollapsed: boolean
  isCompleted: boolean
  createdAt: number
  updatedAt: number
}

export class TreeNode {
  public id: string
  public content: string
  public note: string
  public parentId: string | null
  public childrenIds: string[]
  public isCollapsed: boolean
  public isCompleted: boolean
  public createdAt: number
  public updatedAt: number

  constructor(data: Partial<TreeNodeData> & { id: string }) {
    this.id = data.id
    this.content = data.content ?? ''
    this.note = data.note ?? ''
    this.parentId = data.parentId ?? null
    this.childrenIds = [...(data.childrenIds ?? [])]
    this.isCollapsed = data.isCollapsed ?? false
    this.isCompleted = data.isCompleted ?? false
    this.createdAt = data.createdAt ?? Date.now()
    this.updatedAt = data.updatedAt ?? Date.now()
  }

  public setContent(newContent: string): void {
    this.content = newContent
    this.touch()
  }

  public setNote(newNote: string): void {
    this.note = newNote
    this.touch()
  }

  public addChild(childId: string, index?: number): void {
    if (!this.childrenIds.includes(childId)) {
      if (typeof index === 'number' && index >= 0 && index <= this.childrenIds.length) {
        this.childrenIds.splice(index, 0, childId)
      } else {
        this.childrenIds.push(childId)
      }
      this.touch()
    }
  }

  public removeChild(childId: string): void {
    const index = this.childrenIds.indexOf(childId)
    if (index !== -1) {
      this.childrenIds.splice(index, 1)
      this.touch()
    }
  }

  public toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed
    this.touch()
  }

  public setCollapsed(collapsed: boolean): void {
    this.isCollapsed = collapsed
    this.touch()
  }

  public hasChildren(): boolean {
    return this.childrenIds.length > 0
  }

  public touch(): void {
    this.updatedAt = Date.now()
  }

  public clone(): TreeNode {
    return new TreeNode({
      id: this.id,
      content: this.content,
      note: this.note,
      parentId: this.parentId,
      childrenIds: [...this.childrenIds],
      isCollapsed: this.isCollapsed,
      isCompleted: this.isCompleted,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    })
  }

  public toJSON(): TreeNodeData {
    return {
      id: this.id,
      content: this.content,
      note: this.note,
      parentId: this.parentId,
      childrenIds: [...this.childrenIds],
      isCollapsed: this.isCollapsed,
      isCompleted: this.isCompleted,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  public static fromJSON(data: TreeNodeData): TreeNode {
    return new TreeNode(data)
  }
}
