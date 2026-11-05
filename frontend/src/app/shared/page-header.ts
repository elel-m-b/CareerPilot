import { Component, input } from "@angular/core";

/** Consistent page header used by every authenticated screen. */
@Component({
  selector: "app-page-header",
  template: `
    <div
      class="flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-end sm:justify-between"
    >
      <div class="min-w-0">
        @if (eyebrow()) {
          <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {{ eyebrow() }}
          </p>
        }
        <h1 class="mt-2 text-2xl font-medium tracking-[-0.02em] text-foreground">{{ title() }}</h1>
        @if (description()) {
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {{ description() }}
          </p>
        }
      </div>
      <div class="flex shrink-0 items-center gap-2"><ng-content /></div>
    </div>
  `,
})
export class PageHeaderComponent {
  readonly eyebrow = input<string>();
  readonly title = input.required<string>();
  readonly description = input<string>();
}
