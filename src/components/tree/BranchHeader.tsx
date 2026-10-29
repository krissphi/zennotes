import React, { useRef, useLayoutEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Home,
  FileDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Link2,
} from 'lucide-react'
import type { TreeNode } from '../../core/models/TreeNode'
import type { TreeDocument } from '../../core/models/TreeDocument'
import { NodeImage } from './NodeImage'
import { NodeAttachment } from './NodeAttachment'
import { FormattedNodeText } from './FormattedNodeText'
import { parseNodeMedia, getNodeDisplayText } from '../../lib/attachmentUtils'
import { ExportImportService } from '../../core/services/ExportImportService'

interface BranchHeaderProps {
  node: TreeNode
  doc?: TreeDocument
  breadcrumbs?: TreeNode[]
  onUpdateContent: (content: string) => void
  onUpdateNote: (note: string) => void
  onZoomOut?: () => void
  onSelectNode?: (id: string) => void
  onCollapseAll?: () => void
  onExpandAll?: () => void
}

export const BranchHeader: React.FC<BranchHeaderProps> = ({
  node,
  doc,
  breadcrumbs,
  onUpdateContent,
  onUpdateNote,
  onZoomOut,
  onSelectNode,
  onCollapseAll,
  onExpandAll,
}) => {
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null)
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [isBacklinksExpanded, setIsBacklinksExpanded] = useState(true)

  // Parse node content so images and attachments never display as raw base64 code
  const { cleanText, images, attachments } = useMemo(
    () => parseNodeMedia(node.content),
    [node.content]
  )
  const hasImages = images.length > 0
  const hasAttachments = attachments.length > 0
  const hasMedia = hasImages || hasAttachments

  // Default display title: clean text if present, or image/file name if media-only
  const defaultTitle = cleanText.trim()
    ? cleanText
    : images[0]?.alt || attachments[0]?.name || ''

  const [prevNodeId, setPrevNodeId] = useState(node.id)
  const [prevDefaultTitle, setPrevDefaultTitle] = useState(defaultTitle)
  const [titleValue, setTitleValue] = useState(defaultTitle)
  const [isTitleFocused, setIsTitleFocused] = useState(false)
  const [isNoteFocused, setIsNoteFocused] = useState(false)

  const isTitleCodeBlock = titleValue.trim().startsWith('```')
  const hasTitleFormatting = /#[a-zA-Z0-9_-]+|https?:\/\/|`|\[\[/.test(titleValue)

  const noteContent = node.note || ''
  const isNoteCodeBlock = noteContent.trim().startsWith('```')
  const hasNoteFormatting = /#[a-zA-Z0-9_-]+|https?:\/\/|`|\[\[/.test(noteContent)

  if (prevNodeId !== node.id || prevDefaultTitle !== defaultTitle) {
    setPrevNodeId(node.id)
    setPrevDefaultTitle(defaultTitle)
    setTitleValue(defaultTitle)
  }

  useLayoutEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = 'inherit'
      titleTextareaRef.current.style.height = `${Math.max(36, titleTextareaRef.current.scrollHeight)}px`
    }
  }, [titleValue, isTitleFocused])

  useLayoutEffect(() => {
    if (noteTextareaRef.current) {
      noteTextareaRef.current.style.height = 'inherit'
      noteTextareaRef.current.style.height = `${Math.max(20, noteTextareaRef.current.scrollHeight)}px`
    }
  }, [node.note, isNoteFocused])

  // Backlinks: Detect any other node linking to this branch with [[Title]] using fast indexed lookup
  const backlinks = useMemo(() => {
    if (!doc || !cleanText.trim()) return []
    return doc.getNodesLinkingTo(cleanText, node.id)
  }, [doc, node.id, cleanText])

  const handleTitleChange = (newVal: string) => {
    setTitleValue(newVal)
    if (!hasMedia) {
      onUpdateContent(newVal)
      return
    }

    const trimmed = newVal.trim()
    const mediaParts: string[] = []
    if (hasImages) {
      mediaParts.push(images.map((i) => i.fullMatch).join('\n'))
    }
    if (hasAttachments) {
      mediaParts.push(attachments.map((a) => a.fullMatch).join('\n'))
    }
    const mediaStr = mediaParts.join('\n')
    onUpdateContent(trimmed ? `${trimmed}\n${mediaStr}` : mediaStr)
  }

  const handleRemoveImage = (fullMatch: string) => {
    const remainingImages = images.filter((i) => i.fullMatch !== fullMatch)
    const parts: string[] = []
    if (titleValue.trim()) parts.push(titleValue.trim())
    if (remainingImages.length > 0) {
      parts.push(remainingImages.map((i) => i.fullMatch).join('\n'))
    }
    if (attachments.length > 0) {
      parts.push(attachments.map((a) => a.fullMatch).join('\n'))
    }
    onUpdateContent(parts.join('\n'))
  }

  const handleRemoveAttachment = (fullMatch: string) => {
    const remainingAttachments = attachments.filter((a) => a.fullMatch !== fullMatch)
    const parts: string[] = []
    if (titleValue.trim()) parts.push(titleValue.trim())
    if (images.length > 0) {
      parts.push(images.map((i) => i.fullMatch).join('\n'))
    }
    if (remainingAttachments.length > 0) {
      parts.push(remainingAttachments.map((a) => a.fullMatch).join('\n'))
    }
    onUpdateContent(parts.join('\n'))
  }

  const handleExportBranch = () => {
    if (!doc) return
    const md = ExportImportService.exportBranchToMarkdown(doc, node.id)
    const cleanTitle = getNodeDisplayText(node.content, 'branch')
    const safeTitle = cleanTitle.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'branch'
    ExportImportService.downloadFile(md, `${safeTitle}.md`)
  }

  return (
    <div className="mb-6 pb-4 border-b border-[#E2E8F0] dark:border-[#27272A]">
      {/* Breadcrumb Trail & Back Navigation & Branch Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
        <div className="flex items-center flex-wrap gap-1.5">
          {onZoomOut && (
            <button
              onClick={onZoomOut}
              className="inline-flex items-center gap-1 px-2 py-1 mr-1 text-xs font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
              title="Back to parent branch"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          {breadcrumbs &&
            breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1
              const isFirst = idx === 0
              const crumbLabel = isFirst ? 'Root' : getNodeDisplayText(crumb.content, 'Untitled')

              return (
                <React.Fragment key={crumb.id}>
                  {idx > 0 && (
                    <ChevronRight className="w-3 h-3 text-[#94A3B8] dark:text-[#52525B] shrink-0" />
                  )}
                  <button
                    onClick={() => onSelectNode && onSelectNode(crumb.id)}
                    disabled={isLast}
                    className={`flex items-center gap-1 rounded px-1.5 py-0.5 truncate max-w-[150px] transition-colors ${
                      isLast
                        ? 'font-semibold text-emerald-600 dark:text-emerald-400 cursor-default'
                        : 'hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer'
                    }`}
                  >
                    {isFirst && <Home className="w-3 h-3 shrink-0" />}
                    <span className="truncate">{crumbLabel}</span>
                  </button>
                </React.Fragment>
              )
            })}
        </div>

        {/* Branch Quick Tools: Collapse All, Expand All, Export Branch as Markdown */}
        <div className="flex items-center gap-1">
          {onCollapseAll && (
            <button
              type="button"
              onClick={onCollapseAll}
              title="Collapse all sub-branches (Ctrl+Shift+C)"
              className="p-1.5 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ChevronsDownUp className="w-3.5 h-3.5" />
            </button>
          )}
          {onExpandAll && (
            <button
              type="button"
              onClick={onExpandAll}
              title="Expand all sub-branches (Ctrl+Shift+E)"
              className="p-1.5 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
            </button>
          )}
          {doc && (
            <button
              type="button"
              onClick={handleExportBranch}
              title="Export this branch as Markdown (.md)"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#475569] dark:text-[#CBD5E1] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer border border-[#E2E8F0] dark:border-[#27272A]"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export .md</span>
            </button>
          )}
        </div>
      </div>

      {/* Editable Clean Branch Title (rendered as syntax-highlighted CodeBlock if code, or rich text, or textarea) */}
      {!isTitleFocused && (isTitleCodeBlock || (hasTitleFormatting && titleValue.trim())) ? (
        isTitleCodeBlock ? (
          <div className="w-full my-2">
            <FormattedNodeText
              content={titleValue}
              isCompleted={false}
              onActivate={() => {
                setIsTitleFocused(true)
                setTimeout(() => titleTextareaRef.current?.focus(), 10)
              }}
              onNavigateToWikilink={onSelectNode}
            />
          </div>
        ) : (
          <div
            onClick={() => {
              setIsTitleFocused(true)
              setTimeout(() => titleTextareaRef.current?.focus(), 10)
            }}
            className="w-full text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight cursor-text rounded px-1 -mx-1 py-0.5 leading-snug"
          >
            <FormattedNodeText
              content={titleValue}
              isCompleted={false}
              onActivate={() => {
                setIsTitleFocused(true)
                setTimeout(() => titleTextareaRef.current?.focus(), 10)
              }}
              onNavigateToWikilink={onSelectNode}
            />
          </div>
        )
      ) : (
        <textarea
          ref={titleTextareaRef}
          rows={1}
          value={titleValue}
          onFocus={() => setIsTitleFocused(true)}
          onBlur={() => setIsTitleFocused(false)}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder={images[0]?.alt || attachments[0]?.name || 'Branch name / topic...'}
          className={
            isTitleCodeBlock
              ? 'w-full font-mono text-xs sm:text-sm bg-slate-50 dark:bg-zinc-900 border border-emerald-500/40 rounded-lg p-3 text-[#0F172A] dark:text-[#F8FAFC] outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none leading-relaxed overflow-hidden my-1'
              : 'w-full text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight bg-transparent border-none outline-none focus:ring-1 focus:ring-emerald-500/40 rounded px-1 -mx-1 transition-all placeholder:text-[#94A3B8] dark:placeholder:text-[#52525B] resize-none overflow-hidden'
          }
        />
      )}

      {/* Visual Images Rendered in Hoisted Branch Header */}
      {hasImages && (
        <div className="flex flex-wrap gap-2 my-2.5">
          {images.map((img, idx) => (
            <NodeImage
              key={`header-img-${idx}`}
              src={img.src}
              alt={img.alt}
              onRemove={() => handleRemoveImage(img.fullMatch)}
            />
          ))}
        </div>
      )}

      {/* Visual Attachments Rendered in Hoisted Branch Header */}
      {hasAttachments && (
        <div className="flex flex-wrap gap-2 my-2">
          {attachments.map((att, idx) => (
            <NodeAttachment
              key={`header-att-${idx}-${att.name}`}
              name={att.name}
              dataUrl={att.dataUrl}
              sizeBytes={att.sizeBytes}
              mimeType={att.mimeType}
              onRemove={() => handleRemoveAttachment(att.fullMatch)}
            />
          ))}
        </div>
      )}

      {/* Editable Subheader / Note (supports code blocks and formatting) */}
      {!isNoteFocused && (isNoteCodeBlock || hasNoteFormatting) && noteContent.trim() ? (
        <div className="w-full text-xs text-[#64748B] dark:text-[#94A3B8] cursor-text rounded px-1 -mx-1 mt-1 leading-relaxed">
          <FormattedNodeText
            content={noteContent}
            isCompleted={false}
            onActivate={() => {
              setIsNoteFocused(true)
              setTimeout(() => noteTextareaRef.current?.focus(), 10)
            }}
            onNavigateToWikilink={onSelectNode}
          />
        </div>
      ) : (
        <textarea
          ref={noteTextareaRef}
          rows={1}
          value={noteContent}
          onFocus={() => setIsNoteFocused(true)}
          onBlur={() => setIsNoteFocused(false)}
          onChange={(e) => onUpdateNote(e.target.value)}
          placeholder="Add a subheader or note for this branch..."
          className={
            isNoteCodeBlock
              ? 'w-full font-mono text-xs bg-slate-50 dark:bg-zinc-900 border border-emerald-500/40 rounded-lg p-2.5 text-[#0F172A] dark:text-[#F8FAFC] outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none leading-relaxed overflow-hidden mt-1'
              : 'w-full text-xs text-[#64748B] dark:text-[#94A3B8] bg-transparent border-none outline-none focus:ring-1 focus:ring-emerald-500/40 rounded px-1 -mx-1 mt-1 transition-all placeholder:text-[#94A3B8] dark:placeholder:text-[#52525B] resize-none overflow-hidden leading-relaxed'
          }
        />
      )}

      {/* Backlinks / Linked References Section */}
      {backlinks.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#E2E8F0]/70 dark:border-[#27272A]">
          <button
            type="button"
            onClick={() => setIsBacklinksExpanded((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors cursor-pointer select-none"
          >
            {isBacklinksExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <Link2 className="w-3.5 h-3.5" />
            <span>Linked References ({backlinks.length})</span>
          </button>

          {isBacklinksExpanded && (
            <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-emerald-500/40 animate-in fade-in duration-100">
              {backlinks.map((refNode) => {
                const crumbs = doc?.getBreadcrumbs(refNode.id) || []
                const pathStr = crumbs
                  .slice(0, -1)
                  .map((c) => (c.id === doc?.rootId ? 'Root' : getNodeDisplayText(c.content) || '...'))
                  .join(' > ')

                return (
                  <div
                    key={refNode.id}
                    onClick={() => onSelectNode?.(refNode.id)}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 border border-[#E2E8F0] dark:border-[#27272A] cursor-pointer transition-all group"
                  >
                    {pathStr && (
                      <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mb-0.5 truncate">
                        {pathStr}
                      </p>
                    )}
                    <p className="text-xs text-[#0F172A] dark:text-[#F8FAFC] font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {getNodeDisplayText(refNode.content)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
