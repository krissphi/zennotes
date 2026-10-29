export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
  duration?: number
}

type ToastListener = (toasts: ToastMessage[]) => void

class ToastManager {
  private toasts: ToastMessage[] = []
  private listeners: Set<ToastListener> = new Set()

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener)
    listener(this.toasts)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    this.listeners.forEach((fn) => fn([...this.toasts]))
  }

  public show(message: string, type: ToastType = 'info', duration = 3500): string {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    const toastItem: ToastMessage = { id, type, message, duration }
    this.toasts = [...this.toasts, toastItem]
    this.notify()

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id)
      }, duration)
    }

    return id
  }

  public dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id)
    this.notify()
  }

  public success(message: string, duration?: number) {
    return this.show(message, 'success', duration)
  }

  public error(message: string, duration?: number) {
    return this.show(message, 'error', duration)
  }

  public info(message: string, duration?: number) {
    return this.show(message, 'info', duration)
  }

  public warning(message: string, duration?: number) {
    return this.show(message, 'warning', duration)
  }
}

export const toast = new ToastManager()
