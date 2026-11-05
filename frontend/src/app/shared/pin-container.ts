import { Component, input, signal } from "@angular/core";
import { cn } from "../lib/utils";

/**
 * An interactive 3D "pin" card.
 *
 * The card sits inside a perspective plane and tilts back when the pointer
 * enters, springing flat again on leave. Perspective rings and light beams
 * animate behind it. The whole surface is a single link.
 */
@Component({
  selector: "app-pin-container",
  template: `
    <a
      [href]="href()"
      target="_blank"
      rel="noreferrer"
      [class]="cn('group/pin relative z-50 cursor-pointer', containerClassName())"
      (mouseenter)="transform.set('translate(-50%,-50%) rotateX(40deg) scale(0.8)')"
      (mouseleave)="transform.set('translate(-50%,-50%) rotateX(0deg) scale(1)')"
    >
      <div
        style="perspective: 1000px; transform: rotateX(70deg) translateZ(0deg)"
        class="absolute left-1/2 top-1/2 ml-[0.09375rem] mt-4 -translate-x-1/2 -translate-y-1/2"
      >
        <div
          [style.transform]="transform()"
          class="absolute left-1/2 top-1/2 flex items-start justify-start overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-[0_8px_16px_rgb(0_0_0/0.15)] transition duration-700 ease-out group-hover/pin:border-foreground/25 dark:shadow-[0_8px_16px_rgb(0_0_0/0.5)]"
        >
          <div [class]="cn('relative z-50', className())"><ng-content /></div>
        </div>
      </div>

      <!-- Decorative layer: label pill, pulsing rings and light beams. -->
      <div
        aria-hidden
        class="pointer-events-none z-[60] flex h-80 w-96 items-center justify-center opacity-0 transition duration-500 group-hover/pin:opacity-100"
      >
        <div class="inset-0 -mt-7 h-full w-full flex-none">
          <div class="absolute inset-x-0 top-0 flex justify-center">
            <span
              class="relative z-10 flex items-center space-x-2 rounded-full bg-foreground px-4 py-0.5 ring-1 ring-border"
            >
              <span class="relative z-20 inline-block py-0.5 text-xs font-bold text-background">
                {{ title() }}
              </span>
              <span
                class="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-linear-to-r from-success/0 via-success to-success/0 transition-opacity duration-500"
              ></span>
            </span>
          </div>

          <div
            style="perspective: 1000px; transform: rotateX(70deg) translateZ(0)"
            class="absolute left-1/2 top-1/2 ml-[0.09375rem] mt-4 -translate-x-1/2 -translate-y-1/2"
          >
            @for (delay of ringDelays; track delay) {
              <div
                class="cp-pin-ring absolute left-1/2 top-1/2 h-[11.25rem] w-[11.25rem] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-foreground/[0.06] shadow-[0_8px_16px_rgb(0_0_0/0.2)]"
                [style.animation-delay]="delay + 's'"
              ></div>
            }
          </div>

          <div
            class="absolute bottom-1/2 right-1/2 h-20 w-px translate-y-[14px] bg-linear-to-b from-transparent to-success/60 blur-[2px] transition-all duration-500 group-hover/pin:h-40"
          ></div>
          <div
            class="absolute bottom-1/2 right-1/2 h-20 w-px translate-y-[14px] bg-linear-to-b from-transparent to-success/60 transition-all duration-500 group-hover/pin:h-40"
          ></div>
          <div
            class="absolute bottom-1/2 right-1/2 h-[4px] w-[4px] translate-x-[1.5px] translate-y-[14px] rounded-full bg-success/80 blur-[3px]"
          ></div>
          <div
            class="absolute bottom-1/2 right-1/2 h-[2px] w-[2px] translate-x-[0.5px] translate-y-[14px] rounded-full bg-success"
          ></div>
        </div>
      </div>
    </a>
  `,
})
export class PinContainerComponent {
  readonly title = input<string>();
  readonly href = input("/");
  readonly className = input("");
  readonly containerClassName = input("");

  protected readonly transform = signal("translate(-50%,-50%) rotateX(0deg) scale(1)");
  protected readonly ringDelays = [0, 2, 4];
  protected readonly cn = cn;
}
