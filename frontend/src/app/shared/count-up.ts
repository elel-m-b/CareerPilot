import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";

const EASE = (progress: number) => 1 - Math.pow(1 - progress, 3);

/**
 * Counts a number up the first time it scrolls into view, then animates from the
 * value already on screen whenever the number changes — so a live statistic
 * ticks to its new value instead of resetting to zero. Visitors who asked for
 * reduced motion see the final value immediately.
 */
@Component({
  selector: "span[appCountUp]",
  template: `{{ display() }}`,
})
export class CountUpComponent {
  readonly to = input.required<number>();
  readonly duration = input(1.2);

  protected readonly display = signal(0);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reduced =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  private started = false;
  private current = 0;
  private frame = 0;

  constructor() {
    effect(() => {
      const target = this.to();
      if (this.started) this.animateTo(target);
    });

    afterNextRender(() => {
      if (typeof IntersectionObserver === "undefined") {
        this.jumpTo(this.to());
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer.disconnect();
          this.animateTo(this.to());
        },
        { rootMargin: "0px 0px -60px 0px" },
      );
      observer.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });

    this.destroyRef.onDestroy(() => cancelAnimationFrame(this.frame));
  }

  private jumpTo(target: number): void {
    this.started = true;
    this.current = target;
    this.display.set(Math.round(target));
  }

  private animateTo(target: number): void {
    if (this.reduced) {
      this.jumpTo(target);
      return;
    }
    cancelAnimationFrame(this.frame);
    const from = this.current;
    const start = performance.now();
    const durationMs = Math.max(0, this.duration()) * 1000;
    this.started = true;

    const step = (now: number) => {
      const progress = durationMs === 0 ? 1 : Math.min(1, (now - start) / durationMs);
      const value = from + (target - from) * EASE(progress);
      this.current = value;
      this.display.set(Math.round(value));
      if (progress < 1) this.frame = requestAnimationFrame(step);
      else this.current = target;
    };

    this.frame = requestAnimationFrame(step);
  }
}
