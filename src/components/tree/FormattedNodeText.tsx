import React from 'react'
import { ExternalLink, Tag } from 'lucide-react'

interface FormattedNodeTextProps {
  content: string
  isCompleted: boolean
  onActivate: () => void
}

function getTagStyle(tag: string): string {
  const lower = tag.toLowerCase()
  if (lower === '#todo' || lower === '#task') {
    return 'bg-blue-100/90 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50'
  }
  if (lower === '#penting' || lower === '#important' || lower === '#urgent') {
    return 'bg-rose-100/90 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50 font-semibold'
  }
  if (lower === '#ide' || lower === '#idea') {
    return 'bg-amber-100/90 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
  }
  if (lower === '#done' || lower === '#selesai') {
    return 'bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
  }
  return 'bg-purple-100/90 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50'
}

export const FormattedNodeText: React.FC<FormattedNodeTextProps> = ({
  content,
  isCompleted,
  onActivate,
}) => {
  if (!content.trim()) {
    return (
      <div
        onClick={onActivate}
        className="w-full text-sm leading-relaxed text-[#94A3B8] dark:text-[#52525B] cursor-text min-h-[24px] py-0.5"
      >
        Type note...
      </div>
    )
  }

  // Regex to match URLs or Hashtags: (https?://\S+) | (#[a-zA-Z0-9_-]+)
  const regex = /(https?:\/\/[^\s]+)|(#[a-zA-Z0-9_-]+)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index))
    }

    if (match[1]) {
      const url = match[1]
      parts.push(
        <a
          key={`url-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 underline underline-offset-2 hover:text-emerald-700 dark:hover:text-emerald-300 mx-0.5"
        >
          <span>{url}</span>
          <ExternalLink className="w-3 h-3 shrink-0 inline opacity-70" />
        </a>
      )
    } else if (match[2]) {
      const tag = match[2]
      parts.push(
        <span
          key={`tag-${match.index}`}
          className={`inline-flex items-center gap-1 px-1.5 py-0.2 mx-0.5 text-xs rounded-md border text-[11px] leading-tight select-none shadow-3xs ${getTagStyle(tag)}`}
        >
          <Tag className="w-2.5 h-2.5 opacity-60 shrink-0" />
          <span>{tag}</span>
        </span>
      )
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex))
  }

  return (
    <div
      onClick={onActivate}
      className={`w-full text-sm leading-relaxed break-words cursor-text min-h-[24px] py-0.5 select-text ${
        isCompleted
          ? 'line-through text-[#64748B]/70 dark:text-[#94A3B8]/60'
          : 'text-[#0F172A] dark:text-[#F8FAFC]'
      }`}
    >
      {parts}
    </div>
  )
}
