import React, { Component, type ReactNode } from 'react'
import { RefreshCw, Download, ShieldAlert } from 'lucide-react'
import { get } from 'idb-keyval'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  isExporting: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      isExporting: false,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      isExporting: false,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ZenNotes Global ErrorBoundary caught error:', error, errorInfo)
  }

  handleReload = (): void => {
    window.location.reload()
  }

  handleEmergencyBackup = async (): Promise<void> => {
    this.setState({ isExporting: true })
    try {
      // Attempt to retrieve active notebook document directly from IndexedDB
      const activeId = localStorage.getItem('zennotes_active_notebook_id') || 'default'
      const key = activeId === 'default' ? 'zennotes_document' : `zennotes_document_${activeId}`
      const backupData = await get(key)

      const payload = backupData || {
        timestamp: Date.now(),
        notice: 'Emergency backup dump from localStorage fallback',
        localStorageDump: { ...localStorage },
      }

      const jsonStr = JSON.stringify(payload, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `zennotes_emergency_backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    } catch (err) {
      console.error('Failed to create emergency backup:', err)
      alert('Could not export automatic backup. Please check your browser storage.')
    } finally {
      this.setState({ isExporting: false })
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#09090B] text-[#0F172A] dark:text-[#F8FAFC]">
          <div className="w-full max-w-lg bg-white dark:bg-[#18181B] border border-red-200 dark:border-red-900/40 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center">
            {/* Header Icon */}
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-4 shadow-sm">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <h1 className="text-lg sm:text-xl font-bold tracking-tight mb-2">
              Something went wrong in ZenNotes
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed max-w-sm mb-6">
              An unexpected render error occurred. Your notes are stored safely in local storage.
            </p>

            {/* Error Message Details */}
            {this.state.error && (
              <div className="w-full text-left mb-6">
                <details className="text-xs bg-slate-100 dark:bg-zinc-900/80 p-3 rounded-xl border border-[#E2E8F0] dark:border-[#27272A] text-red-700 dark:text-red-400 font-mono overflow-auto max-h-36">
                  <summary className="cursor-pointer font-medium select-none mb-1 text-slate-700 dark:text-slate-300">
                    View technical error details
                  </summary>
                  <p className="mt-1 break-words">{this.state.error.message}</p>
                  {this.state.error.stack && (
                    <pre className="mt-2 text-[10px] text-slate-500 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  )}
                </details>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload App</span>
              </button>

              <button
                type="button"
                onClick={this.handleEmergencyBackup}
                disabled={this.state.isExporting}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-[#E2E8F0] dark:border-[#27272A] active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{this.state.isExporting ? 'Exporting...' : 'Emergency Backup'}</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
