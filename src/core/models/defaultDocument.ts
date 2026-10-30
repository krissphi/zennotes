import { TreeNode } from './TreeNode'

export function createDefaultNodes(): { title: string; rootId: string; nodes: Map<string, TreeNode> } {
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
  const n4 = new TreeNode({
    id: 'n4',
    content: '```bash\n# Code snippet with copy button\npnpm dev\n```',
    parentId: 'root',
  })

  root.childrenIds = ['n1', 'n2', 'n3', 'n4']
  n1.childrenIds = ['n1_1']
  n1_1.childrenIds = ['n1_1_1']
  n2.childrenIds = ['n2_1', 'n2_2', 'n2_3', 'n2_4']

  const map = new Map<string, TreeNode>()
  ;[root, n1, n1_1, n1_1_1, n2, n2_1, n2_2, n2_3, n2_4, n3, n4].forEach((node) => {
    map.set(node.id, node)
  })

  return { title: 'My Workspace', rootId: 'root', nodes: map }
}
