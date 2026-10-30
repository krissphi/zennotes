import { TreeDocument } from '../models/TreeDocument'
import { TreeNode } from '../models/TreeNode'

export class OpmlService {
  public static exportToOPML(doc: TreeDocument): string {
    const escapeXml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')

    const root = doc.getRootNode()
    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<opml version="2.0">',
      '  <head>',
      `    <title>${escapeXml(doc.title || 'Notes')}</title>`,
      '  </head>',
      '  <body>',
    ]

    const traverse = (nodeId: string, indentLevel: number) => {
      const node = doc.getNode(nodeId)
      if (!node) return
      const indent = '  '.repeat(indentLevel)
      const textAttr = `text="${escapeXml(node.content || '')}"`
      const noteAttr = node.note?.trim() ? ` _note="${escapeXml(node.note)}"` : ''
      const statusAttr = node.isCompleted ? ' _status="checked"' : ''

      if (node.childrenIds.length === 0) {
        lines.push(`${indent}<outline ${textAttr}${noteAttr}${statusAttr} />`)
      } else {
        lines.push(`${indent}<outline ${textAttr}${noteAttr}${statusAttr}>`)
        node.childrenIds.forEach((childId) => traverse(childId, indentLevel + 1))
        lines.push(`${indent}</outline>`)
      }
    }

    root.childrenIds.forEach((childId) => traverse(childId, 2))

    lines.push('  </body>', '</opml>')
    return lines.join('\n')
  }

  public static importFromOPML(title: string, opmlString: string): TreeDocument {
    const unescapeXml = (str: string) =>
      str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")

    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(opmlString, 'text/xml')
      const parseError = xmlDoc.getElementsByTagName('parsererror')
      if (parseError.length > 0) {
        throw new Error(`Invalid OPML XML format: ${parseError[0].textContent}`)
      }

      const titleEl = xmlDoc.querySelector('head > title')
      const extractedTitle = titleEl?.textContent?.trim() || title || 'Imported Outlines'

      const root = new TreeNode({ id: 'root', content: extractedTitle, parentId: null })
      const map = new Map<string, TreeNode>()
      map.set('root', root)

      const parseOutlineElement = (element: Element, parentId: string) => {
        const text = element.getAttribute('text') || element.getAttribute('title') || ''
        const note = element.getAttribute('_note') || element.getAttribute('note') || ''
        const status = element.getAttribute('_status') || element.getAttribute('status') || ''
        const isCompleted = status.toLowerCase() === 'checked' || status.toLowerCase() === 'completed'

        const newId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        const newNode = new TreeNode({
          id: newId,
          content: text,
          note: note || undefined,
          parentId,
          isCompleted,
        })

        map.set(newId, newNode)
        const parent = map.get(parentId)
        if (parent) parent.addChild(newId)

        // Traverse children outline tags
        const childOutlines = Array.from(element.children).filter(
          (el) => el.tagName.toLowerCase() === 'outline'
        )
        childOutlines.forEach((childEl) => parseOutlineElement(childEl, newId))
      }

      const bodyEl = xmlDoc.querySelector('body')
      if (bodyEl) {
        const topOutlines = Array.from(bodyEl.children).filter(
          (el) => el.tagName.toLowerCase() === 'outline'
        )
        topOutlines.forEach((el) => parseOutlineElement(el, 'root'))
      }

      return new TreeDocument(extractedTitle, 'root', map)
    }

    // Fallback regex parser for Node / non-browser test environments
    const titleMatch = opmlString.match(/<title>([^<]*)<\/title>/i)
    const extractedTitle = titleMatch ? unescapeXml(titleMatch[1].trim()) : title || 'Imported Outlines'
    const root = new TreeNode({ id: 'root', content: extractedTitle, parentId: null })
    const map = new Map<string, TreeNode>()
    map.set('root', root)

    const outlineRegex = /<outline\s+([^>]*?)(\/?>)|(<\/outline>)/gi
    const stack: { parentId: string }[] = [{ parentId: 'root' }]
    let match: RegExpExecArray | null

    while ((match = outlineRegex.exec(opmlString)) !== null) {
      if (match[3]) {
        // Closing tag </outline>
        if (stack.length > 1) {
          stack.pop()
        }
        continue
      }

      const attrs = match[1]
      const isSelfClosing = match[2] === '/>'

      const textM = attrs.match(/text="([^"]*)"/i) || attrs.match(/title="([^"]*)"/i)
      const noteM = attrs.match(/_note="([^"]*)"/i) || attrs.match(/note="([^"]*)"/i)
      const statusM = attrs.match(/_status="([^"]*)"/i)

      const text = textM ? unescapeXml(textM[1]) : ''
      const note = noteM ? unescapeXml(noteM[1]) : undefined
      const isCompleted = statusM ? statusM[1].toLowerCase() === 'checked' : false

      const currentParent = stack[stack.length - 1].parentId
      const newId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      const node = new TreeNode({ id: newId, content: text, note, parentId: currentParent, isCompleted })

      map.set(newId, node)
      map.get(currentParent)?.addChild(newId)

      if (!isSelfClosing) {
        stack.push({ parentId: newId })
      }
    }

    return new TreeDocument(extractedTitle, 'root', map)
  }
}
