# ZenNotes

ZenNotes is a fast, local-first hierarchical tree outliner and personal knowledge workspace built for structuring thoughts with infinite depth.

All notes are stored directly on your device using IndexedDB with the Persistent Storage API. No account or registration is required, no data is transmitted to external servers, and the application is 100% functional offline as an installable Progressive Web App (PWA).

---

## Core Philosophy

1. **Infinite Hierarchical Outliner**: Organize notes into recursive parent-child trees without artificial depth constraints.
2. **Bullet Zoom Focus (Hoist)**: Click any node bullet to zoom in and isolate a single branch, eliminating mental clutter.
3. **Keyboard-First Ergonomics**: Indent, outdent, reorder, and navigate notes entirely via keyboard shortcuts.
4. **Local Sovereignty & Privacy**: Your data never leaves your browser, ensuring zero telemetry, full privacy, and offline resilience.
5. **Interconnected Knowledge Graph**: Connect thoughts across branches with bi-directional `[[Wikilinks]]` and color-coded `#tags`, visualized through an interactive 2D graph.

---

## Key Features

### 1. Outlining & Knowledge Structuring
- **Infinite Nested Trees**: Break down complex thoughts, projects, and outlines into recursive sub-items effortlessly.
- **Bullet Hoisting (Zoom)**: Click any node's bullet to zoom into that sub-tree. Navigate back up using clear, clickable breadcrumbs.
- **Pure Outliner Navigation**: Seamlessly navigate between nodes using `ArrowUp` and `ArrowDown` at text boundaries without touching the mouse.
- **Collapse All & Expand All (`Ctrl+Shift+C` / `Ctrl+Shift+E`)**: Instantly fold or unfold deep document branches from the navigation bar or via keyboard shortcuts.

### 2. Interactive Graph View (2D Idea Map)
- **Force-Directed Network Visualization**: Explore relationships between thoughts across your notebook via `#tags` and `[[wikilinks]]`.
- **Direct Navigation**: Click any node in the graph to instantly jump to and focus that note in your outliner.
- **Interactive Controls**: Smooth drag-and-drop node physics, zoom, pan, and real-time node count statistics without external heavyweight canvas dependencies.

### 3. Smart Formatting & Code Blocks
- **Inline Formatting Shortcuts**:
  - `Ctrl + B`: Bold text (`**bold**`)
  - `Ctrl + I`: Italic text (`*italic*`)
  - `Ctrl + E`: Inline code (`` `code` ``)
  - `Ctrl + T` / `Ctrl + Shift + S`: Strikethrough (`~~strike~~`)
  - `Ctrl + K` (inside note): Insert markdown link (`[text](url)`)
  - Smart wrapping detects selection or current word boundaries automatically without corrupting markdown asterisks.
- **Terminal-Style Code Blocks**: Type ` ```lang ` to format notes into syntax-highlighted code blocks with language indicators and a one-click copy button.

### 4. Search & Interconnected Links
- **Fast Fuzzy Full-Text Search (MiniSearch)**: Built-in local search engine featuring prefix searching, typo tolerance, and keyword highlighting (`<mark>`) across titles, content, and sub-notes.
- **Color-Coded `#tags`**: Automatic pill badges (`#todo`, `#idea`, `#important`, `#dev`, etc.). Clicking any tag instantly filters and highlights all matching notes.
- **Bi-directional `[[Wikilinks]]` & Backlinks**: Connect related notes using `[[Note Title]]`. Zooming into any branch reveals a Linked References panel showing every other note referencing it.

### 5. Attachments & Decoupled Blob Storage
- **Dedicated Blob Storage (`BlobStorageService`)**: Images, documents, PDFs, and media are stored in a dedicated IndexedDB blob store. Notes retain only lightweight references (`zenblob:...`), slashing RAM usage by >95% and preserving instant Undo/Redo performance.
- **Automatic Image Optimization**: Screenshots pasted (`Ctrl+V`) or dropped are compressed to client-side WebP with an integrated fullscreen Lightbox viewer.
- **Multi-Format Attachment Support**: Attach PDFs, Word (`.docx`), Excel (`.xlsx`), archives (`.zip`), audio, and text files up to 25 MB per file.
- **Integrated Previews**: Built-in modal viewer for code, text, and PDF documents, plus native inline audio playback.

### 6. Storage, Backups & Local Folder Vault
- **Multi-Notebook Workspace**: Create, rename, switch, and delete multiple independent notebooks with isolated storage instances.
- **Local Folder Vault (File System Access API)**: Connect a local directory on your disk to automatically mirror and synchronize your notes as plain `.md` files for direct interoperability with Obsidian and VS Code.
- **7-Day Trash Recovery**: Deleted items are preserved in a notebook-specific recycle bin for 7 days before permanent purge, with recursive restore capabilities.
- **Universal Export & Import**:
  - **Markdown (`.md`)**: Full hierarchical markdown with nested indentations and sub-notes (`> note`).
  - **OPML 2.0 (`.opml`)**: Industry-standard outliner format for seamless migration with Workflowy, Dynalist, and OmniOutliner.
  - **JSON (`.json`)**: Raw snapshot backups with safe import guards (import as new notebook or replace current).
- **Single-Branch Export**: Download just the currently hoisted branch as a standalone `.md` file directly from the branch toolbar.
- **Storage Quota Meter**: Real-time storage consumption meter in the sidebar displaying disk usage and remaining browser quota.

### 7. Modern PWA & Multi-Tab Sync
- **Progressive Web App (PWA)**: Installable on Windows, macOS, Linux, iOS, and Android with complete offline caching (`sw.js`).
- **Web Share Target API**: Share text, links, and content directly from your operating system into ZenNotes.
- **Native Cross-Tab Sync**: Edits made in one browser tab automatically update other open tabs in real-time via `BroadcastChannel` with zero network overhead.

---

## Keyboard Shortcuts

### Outlining & Editing

| Shortcut | Description |
| :--- | :--- |
| **Enter** | Create a new sibling note directly below |
| **Shift + Enter** | Insert a newline within the same note |
| **Tab** | Indent note one level deeper (child of previous sibling) |
| **Shift + Tab** | Outdent note one level outward |
| **Backspace** *(on empty note)* | Outdents the note first, or deletes it if already at top level |
| **Alt + Arrow Up** | Move current note upward |
| **Alt + Arrow Down** | Move current note downward |
| **Arrow Up** *(at start of note)* | Move focus to previous visible note |
| **Arrow Down** *(at end of note)* | Move focus to next visible note |
| **Ctrl + B** | Toggle bold formatting (`**bold**`) |
| **Ctrl + I** | Toggle italic formatting (`*italic*`) |
| **Ctrl + E** / **\`** | Toggle inline code (`` `code` ``) |
| **Ctrl + T** / **Ctrl + Shift + S** | Toggle strikethrough (`~~strike~~`) |
| **Ctrl + K** *(inside note)* | Insert markdown link `[text](url)` |
| **Ctrl + V** | Paste clipboard screenshot or image directly into note |
| **Escape** | Exit note editing mode to view formatted rendered text |
| **Click Bullet** | Zoom in (hoist) into branch |

### Global Shortcuts

| Shortcut | Description |
| :--- | :--- |
| **Ctrl + K** | Open global quick search modal |
| **Ctrl + Z** | Undo last text edit or tree restructuring |
| **Ctrl + Y** / **Ctrl + Shift + Z** | Redo last action |
| **Ctrl + Shift + C** | Collapse all sub-branches |
| **Ctrl + Shift + E** | Expand all sub-branches |
| **Ctrl + P** | Open print-optimized view / PDF export |
| **Escape** | Close active modals, search overlay, or dropdowns |

---

## Technology Stack

- **Framework**: React 19 + TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4
- **Search Engine**: MiniSearch (Offline In-Memory Full-Text Index)
- **Persistence**: IndexedDB (`idb-keyval`) + File System Access API
- **Icons**: Lucide React
- **Build Tool**: Vite 8 + Vitest + Oxlint

---

## Getting Started Locally

### Prerequisites
- **Node.js**: v18 or later (LTS recommended)
- **Package Manager**: `pnpm` (recommended), `npm`, or `yarn`

### Installation & Run

1. Clone or navigate into the workspace:
   ```bash
   cd mynotes
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Launch development server:
   ```bash
   pnpm dev
   ```
   Open `http://localhost:5173` in your browser.

4. Run automated tests (Vitest):
   ```bash
   pnpm test
   ```

5. Run linter checks (Oxlint):
   ```bash
   pnpm run lint
   ```

6. Build optimized production bundle:
   ```bash
   pnpm run build
   ```

7. Preview production build locally:
   ```bash
   pnpm run preview
   ```

---

## Deployment

ZenNotes is a static Single Page Application (SPA) compatible with any static hosting platform.

### Vercel
1. Import repository into Vercel.
2. Build Command: `pnpm run build`, Output Directory: `dist`.
3. SPA routing is automatically handled via `vercel.json`.

### Netlify
1. Connect repository in Netlify dashboard.
2. Build Command: `pnpm run build`, Publish Directory: `dist`.
3. Fallback redirects are provided by `public/_redirects`.

### Cloudflare Pages
1. Select **Pages** > **Create application** > **Connect to Git**.
2. Build preset: `Vite`, Build Command: `pnpm run build`, Output Directory: `dist`.

### Self-Hosted (NGINX / Caddy / Docker)
Run `pnpm run build` and serve the static files in `dist/`. Ensure all route fallbacks redirect to `index.html`.

---

## Project Structure

```text
mynotes/
├── public/
│   ├── favicon.svg          # Application icon
│   ├── icon-192.png         # PWA icon (192px)
│   ├── icon-512.png         # PWA icon (512px)
│   ├── manifest.json        # Web App Manifest & Share Target configuration
│   ├── robots.txt           # Search engine crawling rules
│   ├── sitemap.xml          # Sitemap for SEO
│   ├── sw.js                # Service Worker for offline PWA caching
│   └── _redirects           # SPA routing fallback for Netlify & Cloudflare
├── src/
│   ├── components/
│   │   ├── common/          # Error boundary and fallback handlers
│   │   ├── graph/           # 2D interactive force-directed graph canvas
│   │   ├── landing/         # Welcome & marketing landing page
│   │   ├── layout/          # Navigation bar with action controls
│   │   ├── modals/          # Modals (Vault, Trash, Graph, Shortcuts, Export/Import, Lightbox)
│   │   ├── search/          # MiniSearch live modal with keyword highlighting
│   │   ├── sidebar/         # Notebook switcher, tree overview, and storage meter
│   │   ├── tree/            # Virtualized tree view, node items, code blocks, attachments
│   │   └── ui/              # Toast notifications
│   ├── core/
│   │   ├── models/          # TreeDocument, TreeNode, and TrashItem models (+ unit tests)
│   │   └── services/        # IndexedDB, BlobStorage, LocalVault, SearchIndex, Graph (+ unit tests)
│   ├── hooks/               # React hooks (history, virtual list, notebooks, vault, keyboard)
│   ├── lib/                 # Attachment, formatting, image compression, and syntax utilities
│   ├── App.tsx              # Root container with code-split lazy modals
│   ├── index.css            # Tailwind CSS and print stylesheet
│   └── main.tsx             # Application bootstrap & Service Worker registration
├── package.json             # Project dependencies and script commands
├── tsconfig.json            # TypeScript configuration
├── vercel.json              # Vercel deployment configuration
└── vite.config.ts           # Vite bundler configuration
```

---

## Data Privacy & Local Sovereignty

- **Zero Cloud Leakage**: All notes, attachments, and recycle bin history remain exclusively on your device in IndexedDB.
- **No Telemetry**: No third-party trackers, analytics, or third-party cookies are used.
- **Durable Local Storage**: Browser storage persistence requests prevent unexpected data eviction.
- **Open Formats**: You own your data. Export at any time to standard Markdown (`.md`), OPML 2.0, or JSON.

---

## License

This project is open-source and free to use under the [MIT License](LICENSE).
