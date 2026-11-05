import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  signal,
} from "@angular/core";
import { cn } from "../lib/utils";

export type DropdownPlacement = "bottom-end" | "bottom-start" | "right-start";

/** Shared item recipe for the menu rows. */
export function dropdownItemClass(extra = ""): string {
  return cn(
    "relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-hidden select-none transition-colors focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
    extra,
  );
}

/**
 * A small dropdown menu.
 *
 * The trigger and the panel are content-projected, so each caller keeps its own
 * button styling and item list. The component owns open/close state, Escape,
 * outside clicks and the popover surface; items close the menu when clicked.
 */
@Component({
  selector: "app-dropdown",
  template: `
    <div class="relative">
      <ng-content select="[dropdownTrigger]" />
      @if (open()) {
        <div
          role="menu"
          [class]="panelClasses()"
          (click)="close()"
          (keydown.escape)="close()"
        >
          <ng-content select="[dropdownPanel]" />
        </div>
      }
    </div>
  `,
})
export class DropdownComponent {
  readonly align = input<DropdownPlacement>("bottom-end");
  readonly panelClassName = input("");

  protected readonly open = signal(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly panelClasses = computed(() =>
    cn(
      "absolute z-50 min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
      this.align() === "bottom-end" && "right-0 top-[calc(100%+4px)]",
      this.align() === "bottom-start" && "left-0 top-[calc(100%+4px)]",
      this.align() === "right-start" && "bottom-0 left-[calc(100%+4px)]",
      this.panelClassName(),
    ),
  );

  @HostListener("click", ["$event"])
  protected onHostClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest("[dropdownTrigger]")) {
      this.open.update((value) => !value);
      return;
    }
    if (target.closest("[role='menu']")) {
      // Item clicks bubble here after their own handler runs.
      this.close();
    }
  }

  @HostListener("document:click", ["$event"])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  @HostListener("document:keydown.escape")
  protected onEscape(): void {
    if (this.open()) this.close();
  }

  close(): void {
    this.open.set(false);
  }
}
