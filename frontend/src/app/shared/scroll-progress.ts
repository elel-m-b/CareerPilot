import { Component, HostListener, signal } from "@angular/core";

/** Hairline reading-progress bar for the sticky landing header. */
@Component({
  selector: "app-scroll-progress",
  template: `
    <div
      aria-hidden
      class="absolute inset-x-0 bottom-0 h-px origin-left bg-foreground/40"
      [style.transform]="'scaleX(' + progress() + ')'"
    ></div>
  `,
})
export class ScrollProgressComponent {
  protected readonly progress = signal(0);

  constructor() {
    this.update();
  }

  @HostListener("window:scroll")
  protected update(): void {
    if (typeof window === "undefined") return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    this.progress.set(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0);
  }
}
