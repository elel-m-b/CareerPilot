import { Component, input } from "@angular/core";
import { cn } from "../lib/utils";

/** Monogram wordmark: a solid block plus the product name, no artwork needed. */
@Component({
  selector: "app-brand",
  template: `
    <span [class]="cn('inline-flex items-center gap-2.5', className())">
      <span
        aria-hidden
        class="grid size-6 shrink-0 place-items-center rounded-[3px] bg-foreground text-[10px] font-semibold tracking-tight text-background"
      >
        CP
      </span>
      @if (!compact()) {
        <span class="text-[15px] font-medium tracking-[-0.01em] text-foreground">CareerPilot</span>
      }
    </span>
  `,
})
export class BrandComponent {
  readonly compact = input(false);
  readonly className = input("");

  protected readonly cn = cn;
}
