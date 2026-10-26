import React, { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { highlightCode } from '../../lib/syntaxHighlighter'

interface CodeBlockProps {
  code: string
  language?: string
  onActivate: () => void
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'code',
  onActivate,
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = code
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const cleanLang = language.trim().toLowerCase()
  const showLang = cleanLang && cleanLang !== 'code'

  return (
    <div
      onClick={onActivate}
      className="group/code relative my-1 w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/90 dark:bg-[#121214] transition-colors cursor-text"
    >
      {/* Subtle Floating Actions (Top-Right) */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 opacity-80 sm:opacity-0 sm:group-hover/code:opacity-100 transition-opacity">
        {showLang && (
          <span className="text-[10px] font-mono font-medium text-slate-400 dark:text-zinc-500 uppercase select-none px-1">
            {cleanLang}
          </span>
        )}
        <button
          type="button"
          onClick={handleCopy}
          title="Copy code"
          className={`p-1.5 rounded-md transition-all ${
            copied
              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60'
              : 'bg-white/90 dark:bg-zinc-800/90 hover:bg-white dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 border border-slate-200/80 dark:border-zinc-700/80 shadow-3xs active:scale-95'
          }`}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Code Text */}
      <div className="p-3 sm:p-3.5 pr-12 overflow-x-auto">
        <pre className="font-mono text-xs sm:text-[13px] leading-relaxed text-slate-800 dark:text-zinc-200 selection:bg-slate-200 dark:selection:bg-zinc-800 whitespace-pre">
          <code>{highlightCode(code)}</code>
        </pre>
      </div>
    </div>
  )
}
