import { Component, input } from "@angular/core";
import { cn } from "../lib/utils";
import { CountUpComponent } from "./count-up";

/**
 * Card-like surface: hairline border, small-caps header, generous padding.
 * The `[panelAction]` slot renders on the right of the header.
 */
@Component({
  selector: "app-panel",
  template: `
    <section [id]="id()" [class]="cn('rounded-md border border-border bg-card transition-colors duration-300 hover:border-foreground/20', className())">
      <header class="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-border/80 px-6 py-3">
        <h2 class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{{ title() }}</h2>
        <ng-content select="[panelAction]" />
      </header>
      <div [class]="cn('px-6 py-5', bodyClassName())"><ng-content /></div>
    </section>
  `,
})
export class PanelComponent {
  readonly title = input.required<string>();
  readonly className = input("");
  readonly bodyClassName = input("");
  /** Anchor for in-page navigation, e.g. scrolling the user to a field. */
  readonly id = input<string | null>(null);

  protected readonly cn = cn;
}

/**
 * Compact metric tile used in dashboard stat rows. Numeric values count up, so
 * the dashboard reads as live data rather than a static screenshot.
 */
@Component({
  selector: "app-stat-tile",
  imports: [CountUpComponent],
  template: `
    <div
      [class]="cn(
        'flex flex-col gap-2 rounded-md border border-border bg-card px-6 py-5 transition-colors duration-300 hover:border-foreground/25',
        className()
      )"
    >
      <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{{ label() }}</p>
      <p [class]="cn('text-3xl font-medium tabular-nums tracking-[-0.02em] text-foreground', tone())">
        @if (isNumber()) {
          <span appCountUp [to]="numberValue()"></span>
        } @else {
          {{ value() }}
        }
        @if (unit()) {
          <span class="text-base text-muted-foreground">{{ unit() }}</span>
        }
      </p>
      @if (hint()) {
        <p class="text-xs leading-relaxed text-muted-foreground">{{ hint() }}</p>
      }
    </div>
  `,
})
export class StatTileComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly unit = input<string>();
  readonly hint = input<string>();
  readonly tone = input<string>();
  readonly className = input("");

  protected readonly cn = cn;

  protected isNumber(): boolean {
    return typeof this.value() === "number";
  }

  protected numberValue(): number {
    const value = this.value();
    return typeof value === "number" ? value : 0;
  }
}
