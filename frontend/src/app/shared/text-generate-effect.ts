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
 * Reveals a block of text word by word.
 *
 * Each word starts transparent and blurred, then fades in with a staggered
 * delay once the block scrolls into view. Visitors who asked for reduced motion
 * get the words immediately, unblurred.
 */
@Component({
  selector: "app-text-generate-effect",
  template: `
    <div [class]="cn(className())" [class.cp-words-visible]="visible()">
      @for (word of words(); track $index) {
        <span
          [class]="cn('cp-word', $index < words().length - 1 ? 'mr-[0.25em]' : '')"
          [style.--cp-word-delay]="$index * 200 + 'ms'"
        >{{ word }}</span>
      }
    </div>
  `,
})
export class TextGenerateEffectComponent implements OnInit, OnDestroy {
  readonly words = input.required<string>();
  readonly className = input("");
  readonly filter = input(true);
  readonly duration = input(0.5);

  protected readonly visible = signal(false);
  protected readonly cn = cn;

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
