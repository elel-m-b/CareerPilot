import { Injectable, signal } from "@angular/core";

export type ToastType = "success" | "error" | "warning" | "info";

export type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

let nextId = 1;

/** Small replacement for sonner: one stack, auto-dismissing, no dependencies. */
@Injectable({ providedIn: "root" })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(message: string, type: ToastType = "info"): void {
    const toast: Toast = { id: nextId++, message, type };
    this.toasts.update((toasts) => [...toasts, toast]);
    window.setTimeout(() => this.dismiss(toast.id), 5000);
  }

  success(message: string): void {
    this.show(message, "success");
  }

  error(message: string): void {
    this.show(message, "error");
  }

  warning(message: string): void {
    this.show(message, "warning");
  }

  info(message: string): void {
    this.show(message, "info");
  }

  dismiss(id: number): void {
    this.toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }
}
