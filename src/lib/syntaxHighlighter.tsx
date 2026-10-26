import React from 'react'

const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'import', 'export', 'from', 'default', 'class', 'extends', 'async', 'await',
  'try', 'catch', 'finally', 'throw', 'new', 'typeof', 'instanceof', 'in',
  'def', 'self', 'elif', 'with', 'as', 'lambda', 'yield',
  'select', 'from', 'where', 'insert', 'into', 'update', 'delete', 'join',
  'left', 'right', 'inner', 'group', 'by', 'order', 'having', 'limit',
  'table', 'create', 'drop', 'alter',
])

const BOOLEANS_NULL = new Set([
  'true', 'false', 'null', 'undefined', 'nan', 'none', 'nil',
])

const SHELL_COMMANDS = new Set([
  'git', 'npm', 'pnpm', 'yarn', 'bun', 'npx', 'node', 'deno', 'docker',
  'curl', 'wget', 'cd', 'ls', 'rm', 'mkdir', 'cat', 'sudo', 'echo',
])

const TOKEN_REGEX = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[\s\S]*?`)|(--?[a-zA-Z0-9_-]+)|(\b\d+(?:\.\d+)?\b)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*\b)/g

export function highlightCode(code: string): React.ReactNode[] {
  const elements: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  // Reset regex internal state
  TOKEN_REGEX.lastIndex = 0

  while ((match = TOKEN_REGEX.exec(code)) !== null) {
    if (match.index > lastIndex) {
      elements.push(code.substring(lastIndex, match.index))
    }

    const key = `tok-${match.index}`

    if (match[1]) {
      // 1. Comments (//, /*...*/, #...)
      elements.push(
        <span key={key} className="text-slate-400 dark:text-zinc-500 italic select-text">
          {match[1]}
        </span>
      )
    } else if (match[2]) {
      // 2. Strings ("...", '...', `...`)
      elements.push(
        <span key={key} className="text-emerald-700 dark:text-emerald-400 select-text">
          {match[2]}
        </span>
      )
    } else if (match[3]) {
      // 3. CLI Flags (--save, -m, -X)
      elements.push(
        <span key={key} className="text-amber-600 dark:text-amber-400 font-medium select-text">
          {match[3]}
        </span>
      )
    } else if (match[4]) {
      // 4. Numbers (42, 3.14)
      elements.push(
        <span key={key} className="text-blue-600 dark:text-blue-400 select-text">
          {match[4]}
        </span>
      )
    } else if (match[5]) {
      // 5. Words (Keywords, Booleans, Shell commands, Functions, or Identifiers)
      const word = match[5]
      const lower = word.toLowerCase()

      if (BOOLEANS_NULL.has(lower)) {
        elements.push(
          <span key={key} className="text-rose-600 dark:text-rose-400 font-medium select-text">
            {word}
          </span>
        )
      } else if (KEYWORDS.has(lower)) {
        elements.push(
          <span key={key} className="text-purple-600 dark:text-purple-400 font-semibold select-text">
            {word}
          </span>
        )
      } else if (SHELL_COMMANDS.has(lower)) {
        elements.push(
          <span key={key} className="text-sky-600 dark:text-sky-400 font-semibold select-text">
            {word}
          </span>
        )
      } else {
        // Check if next non-whitespace character is '(' for function calls
        const rest = code.substring(TOKEN_REGEX.lastIndex)
        const isFunction = /^\s*\(/.test(rest)

        if (isFunction) {
          elements.push(
            <span key={key} className="text-sky-600 dark:text-sky-300 font-medium select-text">
              {word}
            </span>
          )
        } else {
          elements.push(word)
        }
      }
    }

    lastIndex = TOKEN_REGEX.lastIndex
  }

  if (lastIndex < code.length) {
    elements.push(code.substring(lastIndex))
  }

  return elements
}
