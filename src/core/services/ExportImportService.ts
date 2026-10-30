import { TreeDocument, type TreeDocumentData } from '../models/TreeDocument'
import { TreeNode, type TreeNodeData } from '../models/TreeNode'
import { getNodeDisplayText } from '../../lib/attachmentUtils'
import { OpmlService } from './OpmlService'

export class ExportImportService {
  public static exportToMarkdown(doc: TreeDocument): string {
    const root = doc.getRootNode()
    const lines: string[] = [`# ${doc.title || 'Notes'}`, '']

    const traverse = (nodeId: string, level: number) => {
      const node = doc.getNode(nodeId)
      if (!node) return
      const indent = '  '.repeat(level)
      const prefix = node.isCompleted ? '- [x] ' : '- '

      const contentLines = (node.content || '').split('\n')
      if (contentLines.length <= 1) {
        lines.push(`${indent}${prefix}${node.content || '(empty)'}`)
      } else {
        lines.push(`${indent}${prefix}${contentLines[0]}`)
        for (let i = 1; i < contentLines.length; i++) {
          lines.push(`${indent}  ${contentLines[i]}`)
        }
      }

      if (node.note && node.note.trim()) {
        const noteLines = node.note.trim().split('\n')
        noteLines.forEach((nLine) => {
          lines.push(`${indent}  > ${nLine}`)
        })
      }

      node.childrenIds.forEach((childId) => {
        traverse(childId, level + 1)
      })
    }

    root.childrenIds.forEach((childId) => {
      traverse(childId, 0)
    })

    return lines.join('\n')
  }

  public static exportBranchToMarkdown(doc: TreeDocument, startNodeId: string): string {
    const startNode = doc.getNode(startNodeId)
    if (!startNode || startNodeId === doc.rootId) {
      return this.exportToMarkdown(doc)
    }

    const branchTitle = getNodeDisplayText(startNode.content, 'Branch Notes')
    const lines: string[] = [`# ${branchTitle}`, '']

    if (startNode.note && startNode.note.trim()) {
      startNode.note.trim().split('\n').forEach((nLine) => {
        lines.push(`> ${nLine}`)
      })
      lines.push('')
    }

    const traverse = (nodeId: string, level: number) => {
      const node = doc.getNode(nodeId)
      if (!node) return
      const indent = '  '.repeat(level)
      const prefix = node.isCompleted ? '- [x] ' : '- '

      const contentLines = (node.content || '').split('\n')
      if (contentLines.length <= 1) {
        lines.push(`${indent}${prefix}${node.content || '(empty)'}`)
      } else {
        lines.push(`${indent}${prefix}${contentLines[0]}`)
        for (let i = 1; i < contentLines.length; i++) {
          lines.push(`${indent}  ${contentLines[i]}`)
        }
      }

      if (node.note && node.note.trim()) {
        const noteLines = node.note.trim().split('\n')
        noteLines.forEach((nLine) => {
          lines.push(`${indent}  > ${nLine}`)
        })
      }

      node.childrenIds.forEach((childId) => {
        traverse(childId, level + 1)
      })
    }

    startNode.childrenIds.forEach((childId) => {
      traverse(childId, 0)
    })

    return lines.join('\n')
  }

  public static downloadFile(content: string, filename: string, mimeType = 'text/markdown;charset=utf-8') {
    if (typeof window === 'undefined') return
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  public static exportToJSON(doc: TreeDocument): string {
    return JSON.stringify(doc.toJSON(), null, 2)
  }

  public static exportToOPML(doc: TreeDocument): string {
    return OpmlService.exportToOPML(doc)
  }

  public static importFromOPML(title: string, opmlString: string): TreeDocument {
    return OpmlService.importFromOPML(title, opmlString)
  }

  public static importFromJSON(jsonString: string): TreeDocument {
    let data: unknown
    try {
      data = JSON.parse(jsonString)
    } catch {
      throw new Error('Invalid JSON format: Parse error')
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid JSON structure: expected object')
    }

    const docData = data as Partial<TreeDocumentData>
    if (!docData.rootId || typeof docData.rootId !== 'string') {
      throw new Error('Missing or invalid rootId')
    }
    if (!docData.nodes || typeof docData.nodes !== 'object') {
      throw new Error('Missing or invalid nodes mapping')
    }

    if (!docData.nodes[docData.rootId]) {
      throw new Error(`Root node "${docData.rootId}" not found in nodes`)
    }

    // Sanitize and detect cycles
    const sanitizedNodes: Record<string, TreeNodeData> = {}
    const nodeKeys = Object.keys(docData.nodes)

    for (const key of nodeKeys) {
      const raw = docData.nodes[key]
      if (raw && typeof raw === 'object' && typeof raw.id === 'string') {
        sanitizedNodes[raw.id] = {
          id: raw.id,
          content: typeof raw.content === 'string' ? raw.content : '',
          note: typeof raw.note === 'string' ? raw.note : undefined,
          parentId: typeof raw.parentId === 'string' ? raw.parentId : null,
          childrenIds: Array.isArray(raw.childrenIds)
            ? raw.childrenIds.filter((cid): cid is string => typeof cid === 'string')
            : [],
          isCollapsed: Boolean(raw.isCollapsed),
          isCompleted: Boolean(raw.isCompleted),
          createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
          updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
        }
      }
    }

    // Verify root reachability and prevent cyclic graph poison
    const visited = new Set<string>()
    const queue = [docData.rootId]

    while (queue.length > 0) {
      const curr = queue.shift()!
      if (visited.has(curr)) continue // skip cycles
      visited.add(curr)
      const n = sanitizedNodes[curr]
      if (n) {
        // filter out nonexistent child pointers
        n.childrenIds = n.childrenIds.filter((cid: string) => Boolean(sanitizedNodes[cid]))
        queue.push(...n.childrenIds)
      }
    }

    const validData: TreeDocumentData = {
      title: typeof docData.title === 'string' ? docData.title : 'Imported Notes',
      rootId: docData.rootId,
      nodes: sanitizedNodes,
      updatedAt: Date.now(),
    }

    return TreeDocument.fromJSON(validData)
  }

  public static importFromMarkdown(title: string, markdown: string): TreeDocument {
    const rawLines = markdown.split(/\r?\n/)
    const root = new TreeNode({ id: 'root', content: title || 'Imported Notes', parentId: null })
    const map = new Map<string, TreeNode>()
    map.set('root', root)

    const stack: { level: number; node: TreeNode }[] = [{ level: -1, node: root }]

    rawLines.forEach((rawLine) => {
      if (!rawLine.trim()) return
      if (rawLine.startsWith('# ')) {
        const titleMatch = rawLine.match(/^#\s+(.*)$/)
        if (titleMatch && titleMatch[1]) {
          root.content = titleMatch[1].trim()
        }
        return
      }

      // Check for note line (> note)
      const noteMatch = rawLine.match(/^(\s*)>\s?(.*)$/)
      if (noteMatch && stack.length > 1) {
        const currentNode = stack[stack.length - 1].node
        const noteText = noteMatch[2]
        currentNode.note = currentNode.note ? `${currentNode.note}\n${noteText}` : noteText
        return
      }

      // Check for bullet list item
      const listMatch = rawLine.match(/^(\s*)([-*+]|\d+\.)\s+(?:\[([ xX])\]\s+)?(.*)$/)
      if (listMatch) {
        const spaces = listMatch[1].length
        const isCompleted = Boolean(listMatch[3] && listMatch[3].toLowerCase() === 'x')
        const content = listMatch[4] || ''

        const level = Math.floor(spaces / 2)
        while (stack.length > 1 && stack[stack.length - 1].level >= level) {
          stack.pop()
        }

        const parent = stack[stack.length - 1].node
        const newId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        const newNode = new TreeNode({
          id: newId,
          content,
          parentId: parent.id,
          isCompleted,
        })

        map.set(newId, newNode)
        parent.addChild(newId)
        stack.push({ level, node: newNode })
        return
      }

      // Indented continuation line (e.g. multiline text or code block continuation)
      if (stack.length > 1) {
        const currentNode = stack[stack.length - 1].node
        const indentToRemove = Math.max(2, (stack[stack.length - 1].level + 1) * 2)
        const regex = new RegExp(`^\\s{1,${indentToRemove}}`)
        const lineContent = rawLine.replace(regex, '')
        currentNode.content = `${currentNode.content}\n${lineContent}`
      }
    })

    return new TreeDocument(root.content || title || 'Imported Notes', 'root', map)
  }
}
