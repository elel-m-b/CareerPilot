import { Component, input } from "@angular/core";
import { cn } from "../lib/utils";

@Component({
  selector: "app-skeleton",
  template: `<div data-slot="skeleton" [class]="cn('bg-accent animate-pulse rounded-md', className())"></div>`,
})
export class SkeletonComponent {
  readonly className = input("");
  protected readonly cn = cn;
}
