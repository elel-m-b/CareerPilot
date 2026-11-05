import { Component, input } from "@angular/core";
import { SEVERITY_CLASS, SEVERITY_LABEL } from "../../lib/format";
import type { AtsIssue } from "../../lib/types";
import { cn } from "../../lib/utils";
import { CountUpComponent } from "../count-up";

/** Every finding shows severity, explanation and a concrete recommendation. */
@Component({
  selector: "app-issue-list",
  template: `
    @if (issues().length === 0) {
      <p [class]="cn('py-6 text-sm text-muted-foreground', className())">{{ emptyLabel() }}</p>
    } @else {
      <ul [class]="cn('divide-y divide-border/70', className())">
        @for (issue of issues(); track issue.id) {
          <li class="py-5 first:pt-0 last:pb-0">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start">
              <span
                [class]="cn(
                  'inline-flex w-fit shrink-0 items-center rounded-[3px] border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em]',
                  SEVERITY_CLASS[issue.severity]
                )"
              >
                {{ SEVERITY_LABEL[issue.severity] }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-foreground">{{ issue.title }}</p>
                <p class="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {{ issue.explanation }}
                </p>
                @if (issue.recommendation) {
                  <div class="mt-3 border-l-2 border-foreground/25 pl-3">
                    <p class="text-sm leading-relaxed text-foreground">
                      <span class="font-medium">Do this: </span>
                      {{ issue.recommendation }}
                    </p>
                  </div>
                }
                <p class="mt-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  {{ issue.dimension.replaceAll("_", " ") }}
                </p>
              </div>
            </div>
          </li>
        }
      </ul>
    }
  `,
})
export class IssueListComponent {
  readonly issues = input.required<AtsIssue[]>();
  readonly className = input("");
  readonly emptyLabel = input("No findings in this category.");

  protected readonly cn = cn;
  protected readonly SEVERITY_LABEL = SEVERITY_LABEL;
  protected readonly SEVERITY_CLASS = SEVERITY_CLASS;
}

@Component({
  selector: "app-severity-summary",
  imports: [CountUpComponent],
  template: `
    <dl
      class="grid grid-cols-3 divide-x divide-border/70 border-y border-border/70"
      [class]="cn(className())"
    >
      @for (item of items; track item.key) {
        <div class="px-4 py-3">
          <dt class="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {{ item.label }}
          </dt>
          <dd [class]="cn('mt-1 text-xl font-medium tabular-nums', item.className)">
            <span appCountUp [to]="counts()[item.key]" [duration]="0.8"></span>
          </dd>
        </div>
      }
    </dl>
  `,
})
export class SeveritySummaryComponent {
  readonly counts = input.required<{ critical: number; warning: number; info: number }>();
  readonly className = input("");

  protected readonly items = [
    { key: "critical" as const, label: "Critical", className: "text-critical" },
    { key: "warning" as const, label: "Warnings", className: "text-warning" },
    { key: "info" as const, label: "Suggestions", className: "text-muted-foreground" },
  ];

  protected readonly cn = cn;
}
