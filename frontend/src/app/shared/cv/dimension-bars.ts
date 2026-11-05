import { Component, type AfterViewInit, input, signal } from "@angular/core";
import { TONE_BG, formatDelta, scoreTone } from "../../lib/format";
import type { AtsDimension } from "../../lib/types";
import { cn } from "../../lib/utils";

/** One row per ATS dimension: label, weight, bar and score. */
@Component({
  selector: "app-dimension-bars",
  template: `
    <ul [class]="cn('divide-y divide-border/70', className())">
      @for (dimension of dimensions(); track dimension.key; let index = $index) {
        <li
          class="rounded-[3px] py-3.5 transition-colors duration-300 first:pt-0 last:pb-0 hover:bg-secondary/50"
        >
          <div class="flex items-baseline justify-between gap-4">
            <p class="min-w-0 truncate text-sm font-medium text-foreground">{{ dimension.label }}</p>
            <p class="shrink-0 text-sm tabular-nums text-foreground">
              {{ dimension.score }}%
              @if (delta(dimension.key); as change) {
                @if (change !== 0) {
                  <span [class]="cn('ml-2 text-xs', change > 0 ? 'text-success' : 'text-critical')">
                    {{ change > 0 ? "▲" : "▼" }} {{ change < 0 ? -change : change }}
                  </span>
                }
              }
            </p>
          </div>
          <div class="mt-2.5 flex items-center gap-3">
            <div class="h-[3px] flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                [class]="cn('cp-bar-fill h-full rounded-full', TONE_BG[scoreTone(dimension.score)])"
                [style.width.%]="animated() ? dimension.score : 0"
                [style.transition-delay.ms]="150 + index * 50"
              ></div>
            </div>
            <span class="w-10 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
              {{ dimension.weight }}%
            </span>
          </div>
          <p class="mt-2 text-xs leading-relaxed text-muted-foreground">{{ dimension.summary }}</p>
          @if (delta(dimension.key); as change) {
            @if (change !== 0) {
              <p class="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {{ formatDelta(change) }} since the previous scan
              </p>
            }
          }
        </li>
      }
    </ul>
  `,
})
export class DimensionBarsComponent implements AfterViewInit {
  readonly dimensions = input.required<AtsDimension[]>();
  readonly deltas = input<Record<string, number>>();
  readonly className = input("");

  protected readonly animated = signal(false);
  protected readonly cn = cn;
  protected readonly scoreTone = scoreTone;
  protected readonly formatDelta = formatDelta;
  protected readonly TONE_BG = TONE_BG;

  ngAfterViewInit(): void {
    window.setTimeout(() => this.animated.set(true), 30);
  }

  protected delta(key: string): number | undefined {
    return this.deltas()?.[key];
  }
}
