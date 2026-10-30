import React from 'react'

export function highlightMatches(text: string, query: string): React.ReactNode {
  if (!text || !query.trim()) return text
  const terms = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

  if (terms.length === 0) return text

  const regex = new RegExp(`(${terms.join('|')})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, i) => {
    if (terms.some((term) => new RegExp(`^${term}$`, 'i').test(part))) {
      return (
        <mark
          key={i}
          className="bg-amber-200/90 dark:bg-amber-500/35 text-amber-950 dark:text-amber-100 rounded-[2px] px-0.5 font-semibold not-italic"
        >
          {part}
        </mark>
      )
    }
    return part
  })
}
