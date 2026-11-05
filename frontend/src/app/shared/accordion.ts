import { Component, input, signal } from "@angular/core";
import { LucideChevronDown } from "@lucide/angular";

export type AccordionItem = { question: string; answer: string };

/**
 * Single-open accordion used by the landing FAQ.
 *
 * A plain list of buttons with `aria-expanded`/`aria-controls` keeps the
 * behaviour of the Radix accordion (one panel at a time, keyboard reachable)
 * without a primitive library.
 */
@Component({
  selector: "app-accordion",
  imports: [LucideChevronDown],
  template: `
    <div class="border-t border-border/80">
      @for (item of items(); track item.question; let index = $index) {
        <div class="border-b border-border/80">
          <h3 class="flex">
            <button
              type="button"
              [id]="'faq-trigger-' + index"
              [attr.aria-expanded]="openIndex() === index"
              [attr.aria-controls]="'faq-panel-' + index"
              (click)="toggle(index)"
              class="flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {{ item.question }}
              <svg
                lucideChevronDown
                [class]="
                  'pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200' +
                  (openIndex() === index ? ' rotate-180' : '')
                "
              ></svg>
            </button>
          </h3>
          @if (openIndex() === index) {
            <div
              [id]="'faq-panel-' + index"
              role="region"
              [attr.aria-labelledby]="'faq-trigger-' + index"
              class="overflow-hidden text-sm"
            >
              <div class="max-w-2xl pt-0 pb-4 text-sm leading-relaxed text-muted-foreground">
                {{ item.answer }}
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AccordionComponent {
  readonly items = input.required<AccordionItem[]>();

  protected readonly openIndex = signal<number | null>(null);

  protected toggle(index: number): void {
    this.openIndex.update((current) => (current === index ? null : index));
  }
}
