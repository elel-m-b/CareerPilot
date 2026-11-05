import { Component, input } from "@angular/core";
import { cn } from "../lib/utils";

export type AlertVariant = "default" | "destructive";

const ALERT_BASE =
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current";

const ALERT_VARIANTS: Record<AlertVariant, string> = {
  default: "bg-card text-card-foreground",
  destructive:
    "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
};

@Component({
  selector: "app-alert",
  template: `
    <div role="alert" data-slot="alert" [class]="classes()">
      <ng-content />
    </div>
  `,
})
export class AlertComponent {
  readonly variant = input<AlertVariant>("default");
  readonly className = input("");

  protected classes(): string {
    return cn(ALERT_BASE, ALERT_VARIANTS[this.variant()], this.className());
  }
}

@Component({
  selector: "app-alert-title",
  template: `<div data-slot="alert-title" [class]="classes()"><ng-content /></div>`,
})
export class AlertTitleComponent {
  readonly className = input("");
  protected classes(): string {
    return cn("col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight", this.className());
  }
}

@Component({
  selector: "app-alert-description",
  template: `<div data-slot="alert-description" [class]="classes()"><ng-content /></div>`,
})
export class AlertDescriptionComponent {
  readonly className = input("");
  protected classes(): string {
    return cn(
      "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
      this.className(),
    );
  }
}
