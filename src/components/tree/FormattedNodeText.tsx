import React from 'react'
import { ExternalLink, Tag, Link2 } from 'lucide-react'
import { CodeBlock } from './CodeBlock'
import { NodeImage } from './NodeImage'
import { NodeAttachment } from './NodeAttachment'

interface FormattedNodeTextProps {
  content: string
  onActivate: () => void
  onNavigateToWikilink?: (title: string) => void
  onSelectTag?: (tag: string) => void
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
  onActivate,
  onNavigateToWikilink,
  onSelectTag,
}) => {
  const trimmed = content.trim()
  if (!trimmed) {
    return (
      <div
        onClick={onActivate}
        className="w-full text-sm leading-relaxed text-[#94A3B8] dark:text-[#52525B] cursor-text min-h-[24px] py-0.5"
      >
        Type note...
      </div>
    )
  }

  // 1. Full Fenced Code Block Detection (```lang ... ``` or ``` ...)
  if (trimmed.startsWith('```')) {
    const raw = trimmed
    const firstLineEnd = raw.indexOf('\n')
    let language = 'code'
    let code = ''

    if (firstLineEnd !== -1) {
      language = raw.substring(3, firstLineEnd).trim() || 'code'
      let body = raw.substring(firstLineEnd + 1)
      if (body.endsWith('```')) {
        body = body.substring(0, body.length - 3).trimEnd()
      }
      code = body
    } else {
      // Single line ```code``` or ```lang code```
      const rest = raw.substring(3)
      code = rest.endsWith('```') ? rest.substring(0, rest.length - 3).trim() : rest.trim()
      // If starts with lang word like `js console.log(1)`
      const spaceIdx = code.indexOf(' ')
      if (spaceIdx !== -1 && !code.substring(0, spaceIdx).includes('(')) {
        language = code.substring(0, spaceIdx)
        code = code.substring(spaceIdx + 1)
      }
    }

    return (
      <CodeBlock
        code={code}
        language={language}
        onActivate={onActivate}
      />
    )
  }

  // 2. Rich Text with Images, Attachments, Links, Bold, Strikethrough, Italic, URLs, Hashtags, Inline Code, and Wikilinks
  const regex =
    /(!\[([^\]]*)\]\(([^)]+)\))|((?<!!)\[([^\]]+)\]\(((?:data:|zenblob:)[^)]+)\))|((?<!!)\[([^\]]+)\]\((https?:\/\/[^)]+)\))|(\[\[([^\]\n]+)\]\])|(\*\*([^*\n]+)\*\*)|(~~([^~\n]+)~~)|(`([^`\n]+)`)|((?<!\*)\*([^*\s][^*\n]*?[^*\s]|\S)\*(?!\*))|(https?:\/\/[^\s]+)|(#[a-zA-Z0-9_-]+)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index))
    }

    if (match[1]) {
      // 1. Markdown Image (![alt](src))
      const alt = match[2] || ''
      const src = match[3] || ''
      parts.push(
        <div key={`img-${match.index}`} onClick={(e) => e.stopPropagation()}>
          <NodeImage src={src} alt={alt} />
        </div>
      )
    } else if (match[4]) {
      // 2. File Attachment ([filename](data:... or zenblob:...))
      const fileName = match[5]
      const dataUrl = match[6]
      let mimeType = 'application/octet-stream'
      let sizeBytes = 0

      if (dataUrl.startsWith('zenblob:')) {
        try {
          const qIndex = dataUrl.indexOf('?')
          if (qIndex !== -1) {
            const params = new URLSearchParams(dataUrl.substring(qIndex + 1))
            sizeBytes = parseInt(params.get('size') || '0', 10)
            mimeType = params.get('type') || 'application/octet-stream'
          }
        } catch {
          // Fallback
        }
      } else {
        const mimeMatch = dataUrl.match(/^data:([^;,]+)/)
        mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
        const base64 = dataUrl.split(',')[1] || ''
        sizeBytes = Math.floor((base64.length * 3) / 4)
      }

      parts.push(
        <div key={`att-${match.index}`} className="my-1" onClick={(e) => e.stopPropagation()}>
          <NodeAttachment
            name={fileName}
            dataUrl={dataUrl}
            sizeBytes={sizeBytes}
            mimeType={mimeType}
          />
        </div>
      )
    } else if (match[7]) {
      // 3. Markdown Link [text](url)
      const linkText = match[8]
      const linkUrl = match[9]
      parts.push(
        <a
          key={`mdlink-${match.index}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 underline underline-offset-2 hover:text-emerald-700 dark:hover:text-emerald-300 mx-0.5 font-medium"
        >
          <span>{linkText}</span>
          <ExternalLink className="w-3 h-3 shrink-0 inline opacity-70" />
        </a>
      )
    } else if (match[10]) {
      // 4. Wikilink / Internal Reference ([[Note Title]])
      const linkTarget = match[11]
      parts.push(
        <button
          type="button"
          key={`wikilink-${match.index}`}
          onClick={(e) => {
            e.stopPropagation()
            onNavigateToWikilink?.(linkTarget)
          }}
          title={`Jump to "${linkTarget}"`}
          className="inline-flex items-center gap-1 px-1.5 py-0.2 mx-0.5 font-medium text-[11px] rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer select-none"
        >
          <Link2 className="w-2.5 h-2.5 shrink-0 opacity-80" />
          <span>{linkTarget}</span>
        </button>
      )
    } else if (match[12]) {
      // 5. Bold (**bold**)
      const boldText = match[13]
      parts.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
          {boldText}
        </strong>
      )
    } else if (match[14]) {
      // 6. Strikethrough (~~strike~~)
      const strikeText = match[15]
      parts.push(
        <del key={`strike-${match.index}`} className="line-through opacity-75">
          {strikeText}
        </del>
      )
    } else if (match[16]) {
      // 7. Inline Code Snippet (`code`)
      const inlineCode = match[17]
      parts.push(
        <code
          key={`code-${match.index}`}
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 font-mono text-[12px] rounded-md bg-slate-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 border border-slate-200/80 dark:border-zinc-700/80 font-medium select-text"
        >
          {inlineCode}
        </code>
      )
    } else if (match[18]) {
      // 8. Italic (*italic*)
      const italicText = match[19]
      parts.push(
        <em key={`italic-${match.index}`} className="italic">
          {italicText}
        </em>
      )
    } else if (match[20]) {
      // 9. URL Linkify
      const url = match[20]
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
    } else if (match[21]) {
      // 10. Tag Badge (Interactive click to filter / search)
      const tag = match[21]
      parts.push(
        <button
          type="button"
          key={`tag-${match.index}`}
          onClick={(e) => {
            e.stopPropagation()
            onSelectTag?.(tag)
          }}
          title={`Filter by tag "${tag}"`}
          className={`inline-flex items-center gap-1 px-1.5 py-0.2 mx-0.5 text-xs rounded-md border text-[11px] leading-tight select-none shadow-3xs cursor-pointer hover:opacity-85 hover:scale-105 active:scale-95 transition-all ${getTagStyle(tag)}`}
        >
          <Tag className="w-2.5 h-2.5 opacity-60 shrink-0" />
          <span>{tag}</span>
        </button>
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
      className="w-full text-sm leading-relaxed break-words cursor-text min-h-[24px] py-0.5 select-text text-[#0F172A] dark:text-[#F8FAFC]"
    >
      {parts}
    </div>
  )
}
