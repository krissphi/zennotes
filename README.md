# ZenNotes

ZenNotes is a fast, local-first hierarchical tree outliner and note-taking workspace built for structuring complex thoughts with infinite depth.

All notes are stored directly on your device using IndexedDB with the Persistent Storage API. No account is required, no data is sent to external servers, and the application is 100% functional offline as a Progressive Web App (PWA).

---

## Core Concepts

1. **Infinite Tree Hierarchy**: Organize notes in nested parent-child trees without artificial depth limits.
2. **Bullet Zoom Focus (Hoist)**: Click any bullet point to zoom into that single branch and isolate mental clutter.
3. **Keyboard-First Speed**: Indent, outdent, reorder, and navigate between notes entirely via keyboard shortcuts.
4. **Local-First Privacy**: Your data never leaves your browser, ensuring complete privacy, zero telemetry, and offline resilience.
5. **Interconnected Knowledge**: Connect thoughts across branches with bi-directional `[[Wikilinks]]` and color-coded `#tags`.

---

## Key Features

- **Infinite Nested Branches**: Break complex projects and thoughts down into recursive sub-items effortlessly.
- **Bullet Zoom & Breadcrumbs**: Hoist into any node with a single click. Navigate parent levels using clean breadcrumb navigation.
- **Local-First Persistent Storage**: Powered by IndexedDB with automatic requests for persistent browser storage, protecting your notes from browser cache cleanup.
- **Multi-Notebook Workspace**: Create, rename, switch, and delete independent notebooks from the collapsible sidebar. Deletion includes confirmation prompts and cleans up underlying storage completely.
- **7-Day Isolated Recycle Bin**: Deleted items are preserved in a recycle bin per notebook for 7 days before permanent removal, with full recursive sub-tree restore capabilities.
- **Intelligent Undo/Redo (Ctrl+Z / Ctrl+Y)**: Debounced text history prevents character-by-character buffer exhaustion, while structural mutations (indent, outdent, move, delete) are recorded instantly.
- **Tags, URLs & Bi-directional Wikilinks**:
  - `#tags`: Automatic color-coded pill badges for `#todo`, `#important`, `#idea`, `#done`, etc.
  - Web URLs: Clickable hyperlinks without interfering with text editing.
  - `[[Wikilinks]]`: Type `[[Note Title]]` to create interactive internal links. Clicking jumps/zooms directly to the matching note or creates it automatically.
- **Terminal-Style Code Blocks & One-Click Copy**: Type ` ```lang ` to format notes into sleek terminal-style code blocks with syntax highlighting, language badges, and a copy button. Inline `code` is also supported.
- **Instant Live Search (Ctrl+K)**: Instant keyboard-driven search matching note content, sub-notes, and breadcrumb paths with arrow-key navigation.
- **Universal Export & Import**:
  - **Markdown (`.md`)**: Full hierarchical markdown export and import, preserving attached sub-notes (`> note`) and multi-line blocks.
  - **OPML 2.0 (`.opml`)**: Industry-standard outliner format for seamless migration to/from Workflowy, Dynalist, OmniOutliner, etc.
  - **JSON Backup (`.json`)**: Download and restore full snapshot backups.
  - **Safe Import Guard**: Choose between creating imported content as a brand-new notebook or replacing the active notebook.
- **Pure Outliner Keyboard Navigation**: Seamlessly move between notes with `ArrowUp` and `ArrowDown` when at the boundaries of a note, without having to use the mouse.
- **Mobile & Tablet Ergonomics**: Features a responsive slide-out drawer, touch swipe gestures (left/right) for indent/outdent, and a thumb-friendly bottom toolbar with virtual keyboard height compensation via `window.visualViewport`.
- **Progressive Web App (PWA)**: Installable directly to the home screen or desktop on iOS, Android, macOS, and Windows with offline caching.
- **Clean Print & PDF Export**: Press `Ctrl+P` for an ink-friendly print view that automatically hides sidebars, toolbars, and background colors.

---

## Keyboard Shortcuts

### Outlining & Editing

| Shortcut | Description |
| :--- | :--- |
| **Enter** | Create a new sibling note directly below |
| **Shift + Enter** | Insert a newline within the same note |
| **Tab** | Indent note one level deeper (become child of previous sibling) |
| **Shift + Tab** | Outdent note one level higher |
| **Backspace** *(on empty note)* | Outdents the note first, or deletes it if already at top level |
| **Alt + Arrow Up** | Reorder current note position upward |
| **Alt + Arrow Down** | Reorder current note position downward |
| **Arrow Up** *(at start of note)* | Move focus to previous visible note |
| **Arrow Down** *(at end of note)* | Move focus to next visible note |
| **Ctrl + Enter** | Toggle task completion (strikethrough & checkmark) |
| **\`\`\`lang** or **\`code\`** | Code block with syntax highlighting and copy button |
| **\[\[Note Title\]\]** | Bi-directional internal link to jump to or create another note |

### Global Shortcuts

| Shortcut | Description |
| :--- | :--- |
| **Ctrl + K** | Open fast live search modal |
| **Ctrl + Z** | Undo last edit or structural tree change |
| **Ctrl + Y** / **Ctrl + Shift + Z** | Redo action |
| **Ctrl + P** | Open print-optimized document view / PDF export |
| **Escape** | Close open modals, search dropdowns, or active dialogs |

---

## System Requirements

- **Node.js**: version 18 or later (LTS recommended).
- **Package manager**: pnpm (recommended), npm, or yarn.

---

## Getting Started Locally

1. Clone or navigate to the project repository:
   ```bash
   cd mynotes
   ```

2. Install project dependencies:
   ```bash
   pnpm install
   ```

3. Start the local development server:
   ```bash
   pnpm dev
   ```
   Open the displayed URL (usually `http://localhost:5173`) in your browser.

4. Run the automated test suite (Vitest):
   ```bash
   pnpm test
   ```

5. Run code quality checks (oxlint):
   ```bash
   pnpm run lint
   ```

6. Build the optimized production bundle:
   ```bash
   pnpm run build
   ```

7. Preview the production build locally:
   ```bash
   pnpm run preview
   ```

---

## Deployment Guide

ZenNotes builds into a static Single Page Application (SPA) ready to deploy on any hosting provider.

### 1. Vercel
1. Import your Git repository into Vercel.
2. Vercel automatically detects the Vite configuration:
   - Framework Preset: `Vite`
   - Build Command: `pnpm run build`
   - Output Directory: `dist`
3. The included `vercel.json` file handles all client-side URL rewrites automatically.
4. Click **Deploy**.

### 2. Netlify
1. Select **Add new site** > **Import an existing project**.
2. Build settings:
   - Build command: `pnpm run build`
   - Publish directory: `dist`
3. The included `public/_redirects` file is copied to `dist` automatically to ensure SPA routes resolve correctly.
4. Click **Deploy**.

### 3. Cloudflare Pages
1. Go to **Cloudflare Dashboard** > **Workers & Pages** > **Create application** > **Pages**.
2. Connect your Git repository.
3. Select framework preset: `Vite`.
4. Set build command: `pnpm run build` and output directory: `dist`.
5. Click **Save and Deploy**.

### 4. Self-Hosted Static Web Server (NGINX / Apache / Caddy)
Run `pnpm run build` and upload the contents of the `dist/` directory to your web root. Configure your web server to redirect all requests to `index.html`.

---

## Project Structure

```text
mynotes/
├── public/
│   ├── favicon.svg          # Vector application logo
│   ├── icon-192.png         # PWA icon for Android and iOS
│   ├── icon-512.png         # High-resolution PWA icon
│   ├── manifest.json        # Web App Manifest metadata
│   ├── robots.txt           # Search engine crawling rules
│   ├── sitemap.xml          # Sitemap for SEO indexing
│   ├── sw.js                # Service Worker for offline caching
│   └── _redirects           # Fallback routing rules for Netlify and Cloudflare
├── src/
│   ├── components/
│   │   ├── landing/         # Marketing landing page
│   │   ├── layout/          # Top navigation bar
│   │   ├── modals/          # Export/Import (Markdown, OPML, JSON), Trash, and Shortcuts modals
│   │   ├── search/          # Live search component with keyboard navigation
│   │   ├── sidebar/         # Notebook switcher and document tree map
│   │   └── tree/            # Tree view, node items, code blocks, and mobile action toolbar
│   ├── core/
│   │   ├── models/          # TreeDocument, TreeNode, and TrashItem models (+ Vitest tests)
│   │   └── services/        # IndexedDB, TrashStorage, and Export/Import services (+ Vitest tests)
│   ├── hooks/               # React custom hooks for state, history, notebooks, and theme
│   ├── lib/                 # Lightweight syntax highlighter and styling utilities
│   ├── App.tsx              # Root application component
│   ├── index.css            # Tailwind CSS and print stylesheet
│   └── main.tsx             # Application entry and Service Worker registration
├── package.json             # Dependencies, scripts, and Vitest configuration
├── tsconfig.json            # TypeScript configuration
├── vercel.json              # Vercel SPA rewrite configuration
└── vite.config.ts           # Vite configuration
```

---

## Data Privacy & Offline Resilience

- All documents and trash history remain exclusively inside your browser's IndexedDB storage.
- No analytics, tracking scripts, or external telemetry are embedded.
- Data retention is reinforced with the Persistent Storage API to prevent browser storage eviction.
- Download JSON or OPML backups periodically using the **Export / Import** menu for long-term peace of mind.

---

## License

This project is open-source and free to use for personal and commercial note-taking workflows under the MIT License.
