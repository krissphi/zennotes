import React, { useRef, useLayoutEffect, useMemo, useState } from 'react'
import type { TreeNode } from '../../core/models/TreeNode'
import type { TreeDocument } from '../../core/models/TreeDocument'
import { NodeImage } from './NodeImage'
import { NodeAttachment } from './NodeAttachment'
import { FormattedNodeText } from './FormattedNodeText'
import { BranchBacklinks } from './BranchBacklinks'
import { BranchToolbar } from './BranchToolbar'
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

  // Parse node content so images and attachments never display as raw base64 code
  const { cleanText, images, attachments } = useMemo(
    () => parseNodeMedia(node.content),
    [node.content]
  )
  const hasImages = images.length > 0
  const hasAttachments = attachments.length > 0
  const hasMedia = hasImages || hasAttachments

  // Default display title: clean text if present, or image/file name if media-only
  const defaultTitle = cleanText
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

  if (prevNodeId !== node.id || (!isTitleFocused && prevDefaultTitle !== defaultTitle)) {
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

    const mediaParts: string[] = []
    if (hasImages) {
      mediaParts.push(images.map((i) => i.fullMatch).join('\n'))
    }
    if (hasAttachments) {
      mediaParts.push(attachments.map((a) => a.fullMatch).join('\n'))
    }
    const mediaStr = mediaParts.join('\n')
    onUpdateContent(newVal ? `${newVal}\n${mediaStr}` : mediaStr)
  }

  const handleRemoveImage = (fullMatch: string) => {
    const remainingImages = images.filter((i) => i.fullMatch !== fullMatch)
    const parts: string[] = []
    if (titleValue) parts.push(titleValue)
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
    if (titleValue) parts.push(titleValue)
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
      <BranchToolbar
        breadcrumbs={breadcrumbs}
        onZoomOut={onZoomOut}
        onSelectNode={onSelectNode}
        onCollapseAll={onCollapseAll}
        onExpandAll={onExpandAll}
        onExportBranch={handleExportBranch}
        hasDoc={Boolean(doc)}
      />

      {/* Editable Clean Branch Title (rendered as syntax-highlighted CodeBlock if code, or rich text, or textarea) */}
      {!isTitleFocused && (isTitleCodeBlock || (hasTitleFormatting && titleValue.trim())) ? (
        isTitleCodeBlock ? (
          <div className="w-full my-2">
            <FormattedNodeText
              content={titleValue}
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
      <BranchBacklinks
        backlinks={backlinks}
        doc={doc}
        onSelectNode={onSelectNode}
      />
    </div>
  )
}
