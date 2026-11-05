import { Component, inject } from "@angular/core";
import {
  LucideCircleCheck,
  LucideInfo,
  LucideOctagonX,
  LucideTriangleAlert,
  LucideX,
} from "@lucide/angular";
import { ToastService, type ToastType } from "../core/toast/toast.service";
import { cn } from "../lib/utils";

const TONE: Record<ToastType, string> = {
  success: "text-success",
  error: "text-critical",
  warning: "text-warning",
  info: "text-muted-foreground",
};

/** Fixed toast stack, bottom-right, one card per notification. */
@Component({
  selector: "app-toast-container",
  imports: [LucideCircleCheck, LucideInfo, LucideOctagonX, LucideTriangleAlert, LucideX],
  template: `
    <div
      class="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:w-96"
      role="status"
      aria-live="polite"
    >
      @for (toast of toasts(); track toast.id) {
        <div
          class="cp-toast pointer-events-auto flex w-full items-start gap-3 rounded-md border bg-popover px-4 py-3 text-popover-foreground shadow-lg"
        >
          @switch (toast.type) {
            @case ("success") {
              <svg lucideCircleCheck class="mt-0.5 size-4 shrink-0 text-success"></svg>
            }
            @case ("error") {
              <svg lucideOctagonX class="mt-0.5 size-4 shrink-0 text-critical"></svg>
            }
            @case ("warning") {
              <svg lucideTriangleAlert class="mt-0.5 size-4 shrink-0 text-warning"></svg>
            }
            @default {
              <svg lucideInfo class="mt-0.5 size-4 shrink-0 text-muted-foreground"></svg>
            }
          }
          <p class="flex-1 text-sm leading-relaxed">{{ toast.message }}</p>
          <button
            type="button"
            class="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Dismiss notification"
            (click)="toastService.dismiss(toast.id)"
          >
            <svg lucideX class="size-3.5"></svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
  protected readonly toasts = this.toastService.toasts;
  protected readonly cn = cn;
  protected readonly TONE = TONE;
}
