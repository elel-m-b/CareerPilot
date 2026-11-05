import { Injectable, signal } from "@angular/core";

export type ComingSoonState = {
  open: boolean;
  /** What the user just clicked, when the caller knows it. */
  label: string | null;
};

/**
 * One consistent, explicit message for every feature the backend does not
 * implement yet, rendered by a single dialog at the app root.
 */
@Injectable({ providedIn: "root" })
export class ComingSoonService {
  readonly state = signal<ComingSoonState>({ open: false, label: null });

  show(label?: string): void {
    this.state.set({ open: true, label: label ?? null });
  }

  close(): void {
    this.state.update((state) => ({ ...state, open: false }));
  }
}
