import { Component, type AfterViewInit, computed, input, signal } from "@angular/core";
import { TONE_TEXT, scoreTone } from "../../lib/format";
import { cn } from "../../lib/utils";
import { CountUpComponent } from "../count-up";

const RADIUS = 54;

/** Minimal ring gauge: one stroke, tabular numerals, no gradients. */
@Component({
  selector: "app-score-dial",
  imports: [CountUpComponent],
  template: `
    <div [class]="cn('flex items-center gap-5', className())">
      <div class="relative shrink-0" [style.width.px]="size()" [style.height.px]="size()">
        <svg
          viewBox="0 0 128 128"
          [class]="cn('size-full -rotate-90', TONE_TEXT[tone()])"
          aria-hidden="true"
        >
          <circle cx="64" cy="64" [attr.r]="radius" fill="none" strokeWidth="5" class="stroke-border" />
          <circle
            class="cp-dial-ring"
            cx="64"
            cy="64"
            [attr.r]="radius"
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            stroke="currentColor"
            [attr.stroke-dasharray]="circumference"
            [attr.stroke-dashoffset]="drawn() ? offset() : circumference"
          />
        </svg>
        <div class="absolute inset-0 grid place-items-center">
          <span class="text-3xl font-medium tabular-nums tracking-tight text-foreground">
            <span appCountUp [to]="clampedScore()" [duration]="1.1"></span>
            <span class="text-base text-muted-foreground">%</span>
          </span>
        </div>
      </div>
      @if (grade() || band() || caption()) {
        <div class="min-w-0">
          @if (grade()) {
            <p
              class="flex items-baseline gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
            >
              Grade
              <span class="text-lg font-medium tracking-normal text-foreground">{{ grade() }}</span>
            </p>
          }
          @if (band()) {
            <p class="mt-1 text-sm font-medium text-foreground">{{ band() }}</p>
          }
          @if (caption()) {
            <p class="mt-1 max-w-[22ch] text-xs leading-relaxed text-muted-foreground">
              {{ caption() }}
            </p>
          }
        </div>
      }
    </div>
  `,
})
export class ScoreDialComponent implements AfterViewInit {
  readonly score = input.required<number>();
  readonly grade = input<string>();
  readonly band = input<string>();
  readonly caption = input<string>();
  readonly size = input(132);
  readonly className = input("");

  protected readonly radius = RADIUS;
  protected readonly circumference = 2 * Math.PI * RADIUS;
  protected readonly drawn = signal(false);
  protected readonly clampedScore = computed(() => Math.max(0, Math.min(100, this.score())));
  protected readonly tone = computed(() => scoreTone(this.clampedScore()));
  protected readonly offset = computed(
    () => this.circumference * (1 - this.clampedScore() / 100),
  );
  protected readonly cn = cn;
  protected readonly TONE_TEXT = TONE_TEXT;

  ngAfterViewInit(): void {
    window.setTimeout(() => this.drawn.set(true), 30);
  }
}
