import {
  Directive,
  ElementRef,
  type OnDestroy,
  type OnInit,
  inject,
  input,
  signal,
} from "@angular/core";

/**
 * Fades and lifts a block into view the first time it is scrolled to.
 *
 * Replaces framer-motion's `Reveal`/`whileInView`: an IntersectionObserver adds
 * one class, and CSS in `styles.css` owns the transition. Everything is opacity
 * and transform only, and reduced-motion visitors see the final state.
 */
@Directive({
  selector: "[appReveal]",
  host: {
    class: "cp-reveal",
    "[class.cp-reveal-visible]": "visible()",
    "[style.--cp-reveal-delay]": "delay() + 'ms'",
    "[style.--cp-reveal-distance]": "distance() + 'px'",
  },
})
export class RevealDirective implements OnInit, OnDestroy {
  /** Delay before the transition starts, in milliseconds. */
  readonly delay = input(0);
  /** Distance to travel, in pixels. */
  readonly distance = input(18);

  protected readonly visible = signal(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    if (typeof IntersectionObserver === "undefined") {
      this.visible.set(true);
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        this.visible.set(true);
        this.observer?.disconnect();
      },
      { rootMargin: "-80px" },
    );
    this.observer.observe(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
