import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  show(toast: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id, duration: toast.duration || 4000 };
    const currentToasts = this.toastsSubject.getValue();
    this.toastsSubject.next([...currentToasts, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => this.remove(id), newToast.duration);
    }
  }

  success(message: string, title: string = 'Success') {
    this.show({ type: 'success', title, message });
  }

  error(message: string, title: string = 'Error') {
    this.show({ type: 'error', title, message });
  }

  info(message: string, title: string = 'Information') {
    this.show({ type: 'info', title, message });
  }

  warning(message: string, title: string = 'Warning') {
    this.show({ type: 'warning', title, message });
  }

  remove(id: string) {
    const current = this.toastsSubject.getValue();
    this.toastsSubject.next(current.filter(t => t.id !== id));
  }
}
