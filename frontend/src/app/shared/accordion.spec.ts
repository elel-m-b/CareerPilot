import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { AccordionComponent } from "./accordion";

describe("AccordionComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AccordionComponent] }).compileComponents();
  });

  it("opens one panel at a time and reports its state through aria attributes", () => {
    const fixture = TestBed.createComponent(AccordionComponent);
    fixture.componentRef.setInput("items", [
      { question: "First?", answer: "First answer." },
      { question: "Second?", answer: "Second answer." },
    ]);
    fixture.detectChanges();

    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0].getAttribute("aria-expanded")).toBe("false");

    buttons[0].click();
    fixture.detectChanges();
    expect(buttons[0].getAttribute("aria-expanded")).toBe("true");
    expect((fixture.nativeElement as HTMLElement).textContent).toContain("First answer.");

    buttons[1].click();
    fixture.detectChanges();
    expect(buttons[0].getAttribute("aria-expanded")).toBe("false");
    expect(buttons[1].getAttribute("aria-expanded")).toBe("true");
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain("First answer.");
    expect((fixture.nativeElement as HTMLElement).textContent).toContain("Second answer.");
  });
});
