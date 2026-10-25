# ZenNotes

ZenNotes is a fast, local-first hierarchical tree outliner and note-taking workspace built for structuring complex thoughts with infinite depth.

All notes are stored directly on your device using IndexedDB with the Persistent Storage API. No account is required, no data is sent to external servers, and the application is 100% functional offline as a Progressive Web App (PWA).

---

## Core Concepts

1. Infinite Tree Hierarchy: Organize notes in nested parent-child trees without artificial depth limits.
2. Bullet Zoom Focus (Hoist): Click any bullet point to zoom into that single branch and hide all unrelated noise.
3. Keyboard-First Speed: Indent, outdent, reorder, and navigate entirely through keyboard shortcuts.
4. Local-First Privacy: Your data never leaves your browser, ensuring complete privacy and offline resilience.

---

## Key Features

- Infinite Nested Branches: Break complex projects and thoughts down into recursive sub-items effortlessly.
- Bullet Zoom & Breadcrumbs: Hoist into any node with a single click. Navigate parent levels using clean breadcrumb navigation.
- Local-First Persistent Storage: Powered by IndexedDB with automatic requests for persistent browser storage, protecting your data from automatic browser cache eviction.
- Multi-Notebook Workspace: Create, rename, switch, and delete independent notebooks from the collapsible sidebar.
- 7-Day Isolated Recycle Bin: Deleted items are preserved in a recycle bin per notebook for 7 days before permanent removal, with full sub-tree restore capabilities.
- History & Undo/Redo: Seamless Ctrl+Z and Ctrl+Y support across tree mutations to safeguard against accidental changes.
- Tag & Link Detection: Automatic recognition for tags like #todo, #important, #ideas, as well as clickable web URLs when not actively typing.
- Instant Live Search: Press Ctrl+K to search across all notes instantly with keyboard arrow-key navigation and path breadcrumbs.
- Flexible Export & Import: Export to standard Markdown or download full JSON backup snapshots. Import from JSON or structured Markdown files at any time.
- Mobile & Tablet Ergonomics: Features an overlay slide-out drawer on smaller screens and a thumb-friendly bottom toolbar with quick actions for indentation, moving items, adding notes, and marking completion.
- Progressive Web App (PWA): Installable directly to the home screen or desktop on iOS, Android, macOS, and Windows. Pre-caches core assets for offline launch.
- Clean Print & PDF Export: Press Ctrl+P for a print-optimized document view that hides sidebars, toolbars, and background colors.

---

## Keyboard Shortcuts

### Outlining & Editing
- Enter: Create a new sibling note directly below.
- Tab: Indent note one level deeper.
- Shift + Tab: Outdent note one level higher.
- Backspace (on empty note): Outdents the note first if indented, or deletes it if already at the top level.
- Alt + Arrow Up: Move current note up.
- Alt + Arrow Down: Move current note down.
- Ctrl + Enter: Toggle task completion (strikethrough).

### Global Shortcuts
- Ctrl + K: Open fast search modal.
- Ctrl + Z: Undo last action.
- Ctrl + Y or Ctrl + Shift + Z: Redo action.
- Escape: Close open modals, search dropdowns, or active dialogs.

---

## System Requirements

- Node.js version 18 or later (LTS recommended).
- Package manager: pnpm (recommended), npm, or yarn.

---

## Getting Started Locally

1. Clone or navigate to the project directory:
   ```bash
   cd zennotes
   ```

2. Install project dependencies:
   ```bash
   pnpm install
   ```

3. Start the local development server:
   ```bash
   pnpm dev
   ```
   Open the displayed URL (usually http://localhost:5173) in your browser.

4. Run code quality checks (linter):
   ```bash
   pnpm run lint
   ```

5. Build the optimized production bundle:
   ```bash
   pnpm run build
   ```

6. Preview the production build locally:
   ```bash
   pnpm run preview
   ```

---

## Deployment Guide

ZenNotes produces a standard static Single Page Application (SPA) ready to deploy on any hosting provider.

### 1. Vercel
1. Import your Git repository into Vercel.
2. Vercel automatically detects the Vite configuration:
   - Framework Preset: Vite
   - Build Command: pnpm run build
   - Output Directory: dist
3. The included `vercel.json` file handles all client-side URL rewrites automatically.
4. Click Deploy.

### 2. Netlify
1. Select Add new site > Import an existing project from your Git provider.
2. Use the default build settings:
   - Build command: pnpm run build
   - Publish directory: dist
3. The included `public/_redirects` file is copied to dist automatically to ensure SPA routes resolve correctly.
4. Click Deploy.

### 3. Cloudflare Pages
1. Go to Cloudflare Dashboard > Workers & Pages > Create application > Pages.
2. Connect your Git repository.
3. Select framework preset: Vite.
4. Set build command: `pnpm run build` and output directory: `dist`.
5. Click Save and Deploy.

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
│   │   ├── modals/          # Export/Import, Trash, and Shortcuts modals
│   │   ├── search/          # Live search component with keyboard navigation
│   │   ├── sidebar/         # Notebook switcher and document tree map
│   │   └── tree/            # Tree view, node items, and mobile action toolbar
│   ├── core/
│   │   ├── models/          # TreeDocument, TreeNode, and TrashItem models
│   │   └── services/        # IndexedDB, TrashStorage, and Export services
│   ├── hooks/               # React custom hooks for state, history, and theme
│   ├── lib/                 # Styling utilities
│   ├── App.tsx              # Root application component
│   ├── index.css            # Tailwind CSS and print stylesheet
│   └── main.tsx             # Application entry and Service Worker registration
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vercel.json              # Vercel SPA rewrite configuration
└── vite.config.ts           # Vite configuration
```

---

## Data Privacy & Offline Resilience

- All documents and trash history remain exclusively inside your browser's IndexedDB storage.
- No analytics, tracking scripts, or external telemetry are embedded.
- For long-term peace of mind, download JSON backups periodically using the Export / Import menu.

---

## License

This project is open-source and free to use for personal and commercial note-taking workflows.
