import { Component, ElementRef, effect, inject, viewChild } from "@angular/core";
import { ComingSoonService } from "../core/coming-soon/coming-soon.service";
import { COMING_SOON_MESSAGE } from "../lib/features";
import { buttonClass } from "./button";

@Component({
  selector: "app-coming-soon-dialog",
  template: `
    <dialog #dialog class="cp-modal max-w-md" (close)="service.close()">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2 text-center sm:text-left">
          <h2 class="text-base font-medium tracking-tight">
            {{ title() }}
          </h2>
          <p class="text-sm leading-relaxed text-muted-foreground">{{ message }}.</p>
        </div>
        <div class="flex justify-end">
          <button type="button" [class]="primaryButtonClass" (click)="close()">Got it</button>
        </div>
      </div>
    </dialog>
  `,
})
export class ComingSoonDialogComponent {
  readonly service = inject(ComingSoonService);
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>("dialog");

  protected readonly message = COMING_SOON_MESSAGE;
  protected readonly primaryButtonClass = buttonClass("default");

  constructor() {
    effect(() => {
      const state = this.service.state();
      const element = this.dialog()?.nativeElement;
      if (!element) return;
      if (state.open && !element.open) element.showModal();
      if (!state.open && element.open) element.close();
    });
  }

  protected title(): string {
    const label = this.service.state().label;
    return label ? `${label} is coming soon` : "Coming Soon";
  }

  protected close(): void {
    this.service.close();
  }
}
