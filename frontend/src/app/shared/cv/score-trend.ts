import { Component, computed, input } from "@angular/core";
import { formatDate } from "../../lib/format";
import { cn } from "../../lib/utils";
import { CountUpComponent } from "../count-up";

export type TrendPoint = { id: string; score: number; createdAt: number };

@Component({
  selector: "app-score-trend",
  imports: [CountUpComponent],
  template: `
    @if (points().length === 0) {
      <p [class]="cn('py-6 text-sm text-muted-foreground', className())">
        No scans yet. Run a scan to start tracking your score.
      </p>
    } @else if (points().length === 1) {
      <div [class]="cn('flex flex-col gap-2', className())">
        <p class="text-3xl font-medium tabular-nums text-foreground">
          <span appCountUp [to]="points()[0].score" [duration]="1.1"></span>%
        </p>
        <p class="text-xs text-muted-foreground">
          First scan recorded {{ formatDate(points()[0].createdAt) }}. Rescan after editing your CV
          to follow the progression.
        </p>
      </div>
    } @else {
      <div [class]="cn('flex flex-col gap-3', className())">
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-medium tabular-nums text-foreground">
            <span appCountUp [to]="current()" [duration]="1.1"></span>%
          </span>
          <span [class]="cn('text-xs', delta() >= 0 ? 'text-success' : 'text-critical')">
            {{ delta() >= 0 ? "+" : "" }}{{ delta() }} since first scan
          </span>
        </div>
        <svg
          [attr.viewBox]="viewBox()"
          class="h-24 w-full text-foreground"
          preserveAspectRatio="none"
          role="img"
          [attr.aria-label]="'ATS score history across ' + points().length + ' scans'"
        >
          <line
            [attr.x1]="padding"
            [attr.y1]="height() - padding"
            [attr.x2]="width - padding"
            [attr.y2]="height() - padding"
            class="stroke-border"
            strokeWidth="1"
          />
          <polyline
            class="cp-trend-line"
            [attr.points]="path()"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle [attr.cx]="last().x" [attr.cy]="last().y" r="3" fill="currentColor" />
        </svg>
        <p class="text-xs text-muted-foreground">
          {{ points().length }} scans · last on {{ formatDate(lastPoint().createdAt) }}
        </p>
      </div>
    }
  `,
})
export class ScoreTrendComponent {
  readonly points = input.required<TrendPoint[]>();
  readonly className = input("");
  readonly height = input(96);

  protected readonly padding = 6;
  protected readonly width = 320;
  protected readonly cn = cn;
  protected readonly formatDate = formatDate;

  protected readonly viewBox = computed(() => `0 0 ${this.width} ${this.height()}`);

  private readonly scores = computed(() => this.points().map((point) => point.score));
  private readonly min = computed(() => Math.max(0, Math.min(...this.scores()) - 6));
  private readonly max = computed(() => Math.min(100, Math.max(...this.scores()) + 6));
  private readonly span = computed(() => Math.max(1, this.max() - this.min()));

  protected readonly coordinates = computed(() => {
    const points = this.points();
    return points.map((point, index) => {
      const x = this.padding + (index / Math.max(1, points.length - 1)) * (this.width - this.padding * 2);
      const y =
        this.height() -
        this.padding -
        ((point.score - this.min()) / this.span()) * (this.height() - this.padding * 2);
      return { x, y, point };
    });
  });

  protected readonly path = computed(() =>
    this.coordinates()
      .map(({ x, y }) => `${x},${y}`)
      .join(" "),
  );

  protected readonly last = computed(() => {
    const coordinates = this.coordinates();
    return coordinates[coordinates.length - 1] ?? { x: 0, y: 0 };
  });

  protected readonly lastPoint = computed(() => this.points()[this.points().length - 1]);

  protected readonly current = computed(() => this.scores()[this.scores().length - 1] ?? 0);
  protected readonly delta = computed(() => this.current() - (this.scores()[0] ?? 0));
}
