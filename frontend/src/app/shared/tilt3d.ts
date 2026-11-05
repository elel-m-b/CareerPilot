import {
  Component,
  ElementRef,
  type OnDestroy,
  type OnInit,
  inject,
  input,
  signal,
} from "@angular/core";
import { cn } from "../lib/utils";

/**
 * Turns a flat panel into a softly-lit 3D object.
 *
 * The panel sits in its own perspective context and leans toward the pointer.
 * Depth is sold by stacked planes behind the face, a sheen that trails the
 * pointer, a contact shadow that slides the opposite way, and an optional idle
 * float. Only transform and opacity animate, and the effect is disabled for
 * touch-only devices and reduced-motion visitors.
 */
@Component({
  selector: "app-tilt3d",
  template: `
    <div
      [class]="cn('cp-tilt-stage relative', className())"
      [style.--cp-tilt-perspective]="perspective() + 'px'"
      [style.--cp-tilt-float]="float() + 'px'"
      [style.--cp-tilt-hover-lift]="lift() + 'px'"
      [style.--cp-tilt-hover-scale]="hoverScale()"
      (pointermove)="onPointerMove($event)"
      (pointerleave)="reset()"
    >
      <div
        aria-hidden
        class="pointer-events-none absolute inset-x-10 -bottom-7 h-10 rounded-[50%] bg-foreground/[0.05] blur-2xl"
        [style.transform]="'translateX(' + shadowX() + 'px)'"
      ></div>
      <div
        aria-hidden
        class="pointer-events-none absolute inset-x-16 -bottom-4 h-6 rounded-[50%] bg-black/25 blur-xl dark:bg-black/60"
        [style.transform]="'translateX(' + shadowX() + 'px)'"
      ></div>

      <div class="cp-tilt-float relative">
        <div
          class="cp-tilt-card relative [transform-style:preserve-3d]"
          [style.--cp-tilt-x]="rotateX() + 'deg'"
          [style.--cp-tilt-y]="rotateY() + 'deg'"
        >
          @if (depth() > 0) {
            <div
              aria-hidden
              class="absolute inset-0 rounded-md border border-border bg-card/80"
              [style.transform]="
                'translate3d(' + depth() * 0.28 + 'px, ' + depth() * 0.28 + 'px, ' + -depth() / 2 + 'px)'
              "
            ></div>
            <div
              aria-hidden
              class="absolute inset-0 rounded-md border border-border/60 bg-card/45"
              [style.transform]="
                'translate3d(' + depth() * 0.56 + 'px, ' + depth() * 0.56 + 'px, ' + -depth() + 'px)'
              "
            ></div>
          }

          <div class="relative overflow-hidden rounded-md [transform:translateZ(0px)]">
            <ng-content />

            <div
              aria-hidden
              class="pointer-events-none absolute -left-10 -top-12 h-44 w-44 rounded-full bg-foreground/[0.06] blur-3xl"
              [style.transform]="'translate(' + sheenX() + 'px, ' + sheenY() + 'px)'"
            ></div>
            <div
              aria-hidden
              class="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-foreground/25 to-transparent"
            ></div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class Tilt3dComponent implements OnInit, OnDestroy {
  readonly className = input("");
  /** Peak lean, in degrees, at the edge of the panel. */
  readonly maxTilt = input(7);
  /** CSS perspective distance in px. Larger is flatter and less distorted. */
  readonly perspective = input(1200);
  /** Farthest thickness plane, in px. `0` drops the stacked planes entirely. */
  readonly depth = input(36);
  /** Idle float amplitude in px. `0` keeps the panel still. */
  readonly float = input(6);
  /** Forward travel on hover, in px. */
  readonly lift = input(28);
  readonly hoverScale = input(1.012);

  protected readonly rotateX = signal(0);
  protected readonly rotateY = signal(0);
  protected readonly sheenX = signal(0);
  protected readonly sheenY = signal(0);
  protected readonly shadowX = signal(0);
  protected readonly cn = cn;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private query?: MediaQueryList;
  private reduceQuery?: MediaQueryList;
  private reduced = false;

  private readonly syncReduced = () => {
    this.reduced = this.reduceQuery?.matches ?? false;
  };

  ngOnInit(): void {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    this.query = window.matchMedia("(hover: hover) and (pointer: fine)");
    this.reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.syncReduced();
    this.reduceQuery.addEventListener("change", this.syncReduced);
  }

  ngOnDestroy(): void {
    this.reduceQuery?.removeEventListener("change", this.syncReduced);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (this.reduced || !this.query?.matches) return;
    const rect = this.host.nativeElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const px = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const py = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    this.rotateY.set(px * this.maxTilt());
    this.rotateX.set(py * -this.maxTilt());
    this.sheenX.set(px * 34);
    this.sheenY.set(py * 26);
    this.shadowX.set(px * -18);
  }

  protected reset(): void {
    this.rotateX.set(0);
    this.rotateY.set(0);
    this.sheenX.set(0);
    this.sheenY.set(0);
    this.shadowX.set(0);
  }
}
