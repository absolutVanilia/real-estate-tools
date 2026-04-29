import { Injectable, signal } from '@angular/core';
import { Toast, ToastType, ToastOptions } from './toast.types';

@Injectable({ providedIn: 'root' })
export class ToastService {

  // ─── Config ───
  private readonly MAX_TOASTS = 5;
  private readonly EXIT_MS = 300;
  private readonly DEFAULT_DURATIONS: Record<ToastType, number> = {
    success: 4000,
    error: 5000,
    warning: 4500,
    info: 4000,
  };

  // ─── State ───
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  // ─── Public API ───
  success(message: string, options?: ToastOptions): string {
    return this.show(message, 'success', options);
  }

  error(message: string, options?: ToastOptions): string {
    return this.show(message, 'error', options);
  }

  warning(message: string, options?: ToastOptions): string {
    return this.show(message, 'warning', options);
  }

  info(message: string, options?: ToastOptions): string {
    return this.show(message, 'info', options);
  }

  dismiss(id: string): void {
    const toast = this._toasts().find(t => t.id === id);
    if (!toast || toast.leaving) return;

    // Limpiar timer
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    // Marcar como "saliendo" → activa animación de salida
    this._toasts.update(list =>
      list.map(t => (t.id === id ? { ...t, leaving: true } : t))
    );

    // Eliminar del DOM tras animación
    setTimeout(() => {
      this._toasts.update(list => list.filter(t => t.id !== id));
    }, this.EXIT_MS);
  }

  clear(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this._toasts.set([]);
  }

  // ─── Internals ───
  private show(message: string, type: ToastType, options?: ToastOptions): string {
    const id = this.generateId();
    const duration = options?.duration ?? this.DEFAULT_DURATIONS[type];
    const toast: Toast = { id, message, type, duration, leaving: false };

    // Si estamos al máximo, descartar el más antiguo
    const current = this._toasts();
    if (current.length >= this.MAX_TOASTS) {
      const oldest = current.find(t => !t.leaving);
      if (oldest) this.dismiss(oldest.id);
    }

    this._toasts.update(list => [...list, toast]);

    // Auto-dismiss
    const timer = setTimeout(() => {
      this.timers.delete(id);
      this.dismiss(id);
    }, duration);
    this.timers.set(id, timer);

    return id;
  }

  private generateId(): string {
    return `t-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}