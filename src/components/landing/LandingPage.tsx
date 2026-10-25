import React from 'react'
import {
  Sparkles,
  ArrowRight,
  GitBranch,
  Zap,
  ShieldCheck,
  RotateCcw,
  Download,
  Keyboard,
  Sun,
  Moon,
  CheckCircle2,
} from 'lucide-react'

interface LandingPageProps {
  onOpenApp: () => void
  onOpenShortcuts: () => void
  isDark: boolean
  onToggleTheme: () => void
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenApp,
  onOpenShortcuts,
  isDark,
  onToggleTheme,
}) => {
  const features = [
    {
      icon: GitBranch,
      title: 'Infinite Branching Depth',
      desc: 'Break down complex topics into recursive child points with zero arbitrary depth restrictions.',
    },
    {
      icon: Zap,
      title: 'Bullet Zoom & Hoist',
      desc: 'Click any bullet point to hoist and zoom entirely into that branch, isolating mental clutter.',
    },
    {
      icon: Keyboard,
      title: 'Pure Keyboard Speed',
      desc: 'Tab, Shift+Tab, Enter, and Alt+Arrows let you outline and organize at the speed of thought.',
    },
    {
      icon: ShieldCheck,
      title: 'Local-First & Private',
      desc: 'All data is stored directly in your browser with IndexedDB. No tracking, 100% offline-ready.',
    },
    {
      icon: RotateCcw,
      title: '7-Day Safe Trash',
      desc: 'Deleted nodes retain their full nested structure in the Recycle Bin for 7 days before auto-purge.',
    },
    {
      icon: Download,
      title: 'Universal Markdown Export',
      desc: 'Export your hierarchical thoughts to standard Markdown or JSON backups with a single click.',
    },
  ]

  return (
    <div className="h-screen w-full overflow-y-auto overflow-x-hidden bg-white dark:bg-[#09090B] text-[#0F172A] dark:text-[#F8FAFC] transition-colors selection:bg-emerald-100 dark:selection:bg-emerald-950 flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-[#E2E8F0] dark:border-[#27272A] bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm sm:text-base tracking-tight text-[#0F172A] dark:text-white">
              ZenNotes
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenShortcuts}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Shortcuts</span>
            </button>

            <button
              onClick={onOpenApp}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
            >
              <span>Launch App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative px-4 pt-16 pb-14 sm:pt-24 sm:pb-20 text-center max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-white leading-[1.15]">
            Structure Complex Thoughts with{' '}
            <span className="text-emerald-600 dark:text-emerald-400">Infinite Depth</span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
            A fast, local-first outliner engineered for recursive tree thinking, instant branch zoom,
            and keyboard-driven organization.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenApp}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all active:scale-[0.98]"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenShortcuts}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-[#475569] dark:text-[#CBD5E1] bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-[#E2E8F0] dark:border-[#27272A] rounded-xl transition-colors"
            >
              <Keyboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Keyboard Shortcuts</span>
            </button>
          </div>

          {/* Outliner Preview Mockup Card */}
          <div className="mt-12 text-left bg-slate-50 dark:bg-zinc-900 border border-[#E2E8F0] dark:border-[#27272A] rounded-2xl shadow-xl overflow-hidden p-5 sm:p-7 max-w-2xl mx-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2E8F0] dark:border-[#27272A]">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <GitBranch className="w-4 h-4" />
                <span>Interactive Outliner Preview</span>
              </div>
              <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                Tab: indent • Enter: new
              </span>
            </div>

            <div className="space-y-2 text-xs text-[#0F172A] dark:text-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span className="font-semibold">Project Architecture</span>
              </div>
              <div className="ml-5 pl-2 border-l border-[#CBD5E1] dark:border-[#334155] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#64748B] dark:bg-[#94A3B8]" />
                  <span>Frontend Client (React 19 & Tailwind CSS v4)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#64748B] dark:bg-[#94A3B8]" />
                  <span>Infinite Tree Node Engine with Recursive Descent</span>
                </div>
                <div className="ml-5 pl-2 border-l border-[#CBD5E1] dark:border-[#334155] space-y-1.5">
                  <div className="flex items-center gap-2 text-[#64748B] dark:text-[#94A3B8]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="line-through">Sub-millisecond local state synchronization</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#64748B] dark:text-[#94A3B8]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="line-through">7-day automatic recycle bin retention</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="px-4 py-16 bg-slate-50/50 dark:bg-zinc-950/40 border-t border-[#E2E8F0] dark:border-[#27272A]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-12">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-white">
                Engineered for High-Velocity Thinking
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-2">
                Everything you need to capture, structure, and explore ideas without friction.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feat, idx) => {
                const IconComponent = feat.icon
                return (
                  <div
                    key={idx}
                    className="p-5 bg-white dark:bg-zinc-900 border border-[#E2E8F0] dark:border-[#27272A] rounded-xl hover:border-emerald-500/50 dark:hover:border-emerald-500/40 transition-colors shadow-2xs"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3.5">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white mb-1.5">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] dark:border-[#27272A] py-6 px-4 text-center text-xs text-[#64748B] dark:text-[#94A3B8] bg-white dark:bg-[#09090B]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-[#0F172A] dark:text-white">ZenNotes</span>
            <span>— Infinite Tree Outliner</span>
          </div>
          <p>© {2026} ZenNotes. Offline-first, private & open.</p>
        </div>
      </footer>
    </div>
  )
}
