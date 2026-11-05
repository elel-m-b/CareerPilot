import { Component, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  LucideArrowRight,
  LucideArrowUpRight,
  LucideBot,
  LucideDynamicIcon,
  LucideCheck,
  LucideDatabase,
  LucideExternalLink,
  LucideFileText,
  LucideGraduationCap,
  LucidePenLine,
  LucideRoute,
  LucideSearch,
  LucideSparkles,
  LucideTarget,
  type LucideIcon,
} from "@lucide/angular";
import { cn } from "../lib/utils";
import { AccordionComponent, type AccordionItem } from "../shared/accordion";
import { BrandComponent } from "../shared/brand";
import { buttonClass } from "../shared/button";
import { CountUpComponent } from "../shared/count-up";
import { PinContainerComponent } from "../shared/pin-container";
import { RevealDirective } from "../shared/reveal.directive";
import { ScrollProgressComponent } from "../shared/scroll-progress";
import { TextGenerateEffectComponent } from "../shared/text-generate-effect";
import { ThemeToggleComponent } from "../shared/theme-toggle";
import { Tilt3dComponent } from "../shared/tilt3d";

const EXAMPLE_DIMENSIONS: { label: string; score: number }[] = [
  { label: "ATS compatibility", score: 82 },
  { label: "Content quality", score: 76 },
  { label: "Skills coverage", score: 88 },
  { label: "Experience", score: 71 },
  { label: "Education", score: 95 },
  { label: "Projects", score: 84 },
  { label: "Structure", score: 90 },
];

const STEPS = [
  {
    title: "Analyse the CV you actually send",
    body: "Upload a PDF or DOCX file up to 10 MB. The server extracts the text layer, parses the document into sections, and scores seven weighted ATS dimensions.",
  },
  {
    title: "Fix what moves the score",
    body: "Every finding carries a priority and one concrete action, ordered so the highest-impact fix is always first. The report shows exactly which dimension lowered the total.",
  },
  {
    title: "Find jobs that actually fit",
    body: "Planned: every posting is matched against your profile and CV across weighted dimensions, so you see which skills match and which are missing.",
  },
  {
    title: "Apply, track and prepare",
    body: "Planned: save roles, move them through a pipeline from applied to offer, and turn a target job into a day-by-day interview preparation plan.",
  },
];

const GUARANTEES = [
  "It never invents experience, employers, dates or job titles.",
  "It never invents degrees, certifications or languages.",
  "It never adds a skill that is not written in your document.",
  "It never fabricates numbers or achievements to look impressive.",
  "The ATS score is a weighted average of seven measured dimensions, not a random number.",
  "Every finding shows the rule that triggered it and how to resolve it.",
];

const MATCH_WEIGHTS = [
  { name: "Skill overlap", weight: "45%" },
  { name: "Seniority fit", weight: "18%" },
  { name: "Location & work mode", weight: "15%" },
  { name: "Role direction", weight: "12%" },
  { name: "Job type, languages & education", weight: "10%" },
];

const DIMENSIONS: { name: string; weight: string; detail: string }[] = [
  { name: "ATS compatibility", weight: "20%", detail: "Contact details and the standard headings an applicant tracking system reads first." },
  { name: "Content quality", weight: "20%", detail: "Word count, action verbs and the number of measurable achievements." },
  { name: "Skills coverage", weight: "15%", detail: "Recognised technologies and skills, counted against a curated list." },
  { name: "Experience", weight: "20%", detail: "An experience section, impact verbs and quantified results in it." },
  { name: "Education", weight: "10%", detail: "An education section and recognised degree wording." },
  { name: "Projects", weight: "10%", detail: "A dedicated projects section with links to the work." },
  { name: "Structure", weight: "5%", detail: "Section count plus complete contact information in a machine-readable order." },
];

const STUDENT_POINTS = [
  {
    title: "Projects count as evidence",
    body: "Academic and side projects are scored on stack, description depth and measurable outcomes, so a CV without professional experience is not penalised twice.",
  },
  {
    title: "Education is weighted properly",
    body: "Degree, institution and dates are extracted as structured fields, and coursework or a strong GPA is treated as a real signal.",
  },
  {
    title: "Internships are recognised",
    body: "Intern and trainee roles are detected explicitly and reported as a strength, which matters more than a generic experience block.",
  },
  {
    title: "Junior roles are not buried",
    body: "You choose whether you are looking for an internship, an entry-level job, a junior position or something further on — the match weights seniority accordingly.",
  },
  {
    title: "Gaps become a study plan",
    body: "The skills a posting asks for and your CV does not evidence are turned into preparation tasks, ordered by the ones that matter most.",
  },
  {
    title: "Everything stays readable",
    body: "Preparation tasks are capped at what fits the minutes you actually have each day, so a plan is something you can finish.",
  },
];

const FAQ: AccordionItem[] = [
  {
    question: "Which file formats can be analysed?",
    answer:
      "PDF and DOCX up to 10 MB, parsed on the server. The PDF must contain a real text layer: a scan or a screenshot exported to PDF has no text to read, so export the document again from the word processor instead.",
  },
  {
    question: "What happens to my CV file?",
    answer:
      "The file is stored against your account, only readable by you, and the extracted text is kept so that you can re-scan the same version with a different target role without uploading it again. Deleting a version deletes both the file and its analyses.",
  },
  {
    question: "How is the ATS score calculated?",
    answer:
      "Seven dimensions are measured independently, each with a fixed weight that totals 100%. The overall ATS score is the weighted average, so an identical document always produces an identical score, and you can see which dimension lowered it.",
  },
  {
    question: "How does job matching work?",
    answer:
      "Planned. Each posting will be compared with your profile and your current CV across weighted dimensions, and the result will list the skills that matched, the ones still missing, and anything you should be aware of before applying. The Jobs screen currently shows a Coming Soon notice.",
  },
  {
    question: "Will it rewrite my CV with invented content?",
    answer:
      "No. The planned editor will work only on what your document already contains: it removes filler phrasing, restores action verbs and standardises section headings into a parser-friendly layout. It never adds an employer, date, degree, certification or skill. The optimiser is not implemented yet and is labelled Coming Soon.",
  },
  {
    question: "What does the interview preparation plan contain?",
    answer:
      "Planned. Picking a job from your pipeline will turn the posting's requirements and your missing skills into daily technical, coding, system-design, behavioural and company-research tasks, sized to the minutes you have each day. The Interview prep screen currently shows a Coming Soon notice.",
  },
  {
    question: "Is it free?",
    answer:
      "Yes. Create an account with your email, analyse your CV, match it against every posting, track your applications and build preparation plans without paying.",
  },
];

const RAG_STAGES: { step: string; title: string; body: string; icon: LucideIcon }[] = [
  {
    step: "01",
    title: "Your CV",
    body: "Extract skills, projects, education and experience from the document you already have.",
    icon: LucideFileText,
  },
  {
    step: "02",
    title: "Skill gap analysis",
    body: "Compare what your profile demonstrates with what your target role requires.",
    icon: LucideSearch,
  },
  {
    step: "03",
    title: "Knowledge retrieval",
    body: "Retrieve relevant learning resources with semantic search over a curated knowledge base.",
    icon: LucideDatabase,
  },
  {
    step: "04",
    title: "AI generation",
    body: "Generate contextual recommendations using the retrieved information — never invented links.",
    icon: LucideSparkles,
  },
  {
    step: "05",
    title: "Personalized roadmap",
    body: "Turn the insights into a week-by-week learning plan you can track to completion.",
    icon: LucideRoute,
  },
];

type Feature = {
  title: string;
  icon: LucideIcon;
  points: string[];
  /** A link only exists for features that are actually implemented today. */
  to?: string;
  cta?: string;
  status?: string;
};

const FEATURES: Feature[] = [
  {
    title: "Smart CV Analysis",
    icon: LucideFileText,
    points: [
      "Deterministic ATS scoring across seven weighted dimensions.",
      "CV parsing and structured analysis of every section.",
      "Explainable findings and prioritised recommendations.",
    ],
    to: "/cv",
    cta: "Open CV analysis",
  },
  {
    title: "AI Career Copilot",
    icon: LucideBot,
    points: [
      "Chat with your CV and ask questions about your profile.",
      "Receive evidence-based answers grounded in your documents.",
      "See which part of your CV supports every answer.",
    ],
    to: "/copilot",
    cta: "Open AI Career Copilot",
    status: "Coming Soon — this feature is not implemented yet.",
  },
  {
    title: "Personalized Learning Roadmap",
    icon: LucideRoute,
    points: [
      "Discover the skills your target role needs that you do not yet show.",
      "Retrieve relevant courses and documentation from a curated base.",
      "Generate personalized weekly learning plans with practical tasks.",
    ],
    to: "/roadmap",
    cta: "Open learning roadmap",
    status: "Coming Soon — this feature is not implemented yet.",
  },
  {
    title: "Intelligent Job Matching",
    icon: LucideTarget,
    points: [
      "Compare your CV with real job descriptions.",
      "Identify relevant skills and the requirements you are missing.",
      "Receive contextual recommendations before you apply.",
    ],
    to: "/jobs",
    cta: "Browse matched jobs",
    status: "Coming Soon — this feature is not implemented yet.",
  },
  {
    title: "AI Interview Preparation",
    icon: LucideGraduationCap,
    points: [
      "Generate interview questions based on your target role.",
      "Retrieve relevant technical learning materials.",
      "Practise answers using your CV and the job requirements.",
    ],
    to: "/prep",
    cta: "Open interview prep",
    status: "Coming Soon — this feature is not implemented yet.",
  },
  {
    title: "CV Optimization",
    icon: LucidePenLine,
    points: [
      "Improve CV descriptions without changing their meaning.",
      "Get contextual writing recommendations, item by item.",
      "Preserve factual accuracy — nothing is invented for you.",
    ],
    to: "/cv",
    cta: "Open My CV",
    status: "Editor and ATS export: Coming Soon — this feature is not implemented yet.",
  },
];

const DEMO_SKILLS = ["Java", "Spring Boot", "PostgreSQL", "Docker"];

const DEMO_GAPS = [
  { skill: "Redis", note: "Required by the role, not evidenced in your CV." },
  { skill: "Integration Testing", note: "Weak evidence — mentioned without supporting detail." },
  { skill: "Cloud Deployment", note: "Required by the role, not evidenced in your CV." },
];

const DEMO_RESOURCES = [
  {
    title: "Redis documentation",
    provider: "redis.io",
    url: "https://redis.io/docs/latest/",
  },
  {
    title: "Testing Spring Boot applications",
    provider: "docs.spring.io",
    url: "https://docs.spring.io/spring-boot/reference/testing/index.html",
  },
  {
    title: "Docker get started",
    provider: "docs.docker.com",
    url: "https://docs.docker.com/get-started/",
  },
];

const DEMO_ROADMAP = [
  { week: 1, skill: "Redis", task: "Add Redis caching to a Spring Boot API." },
  {
    week: 2,
    skill: "Integration testing",
    task: "Write integration tests for your REST endpoints.",
  },
  {
    week: 3,
    skill: "Cloud deployment",
    task: "Deploy a Spring Boot application to a cloud environment.",
  },
];

const DEMO_STAGES: { label: string; icon: LucideIcon }[] = [
  { label: "Your profile", icon: LucideFileText },
  { label: "Detected skills", icon: LucideCheck },
  { label: "Potential skill gaps", icon: LucideSearch },
  { label: "Retrieved resources", icon: LucideDatabase },
  { label: "AI recommendation", icon: LucideSparkles },
];

const JOURNEY = [
  {
    title: "Upload your CV",
    body: "Bring an existing PDF or DOCX file — up to 10 MB. The server extracts its text layer.",
  },
  {
    title: "Analyze your profile",
    body: "Seven weighted ATS dimensions are measured and scored with explainable findings.",
  },
  {
    title: "Read the report",
    body: "See each dimension's score, its feedback and the prioritised list of fixes.",
  },
  {
    title: "Choose your target role",
    body: "Planned: pick a role or paste a real job description for a more precise comparison.",
  },
  {
    title: "Generate a personalized learning roadmap",
    body: "Planned: retrieve trusted resources and turn them into a week-by-week plan.",
  },
  {
    title: "Track your career progress",
    body: "Planned: tick off tasks, revisit saved roadmaps and measure improvement over time.",
  },
];

@Component({
  selector: "app-landing-page",
  imports: [
    RouterLink,
    AccordionComponent,
    BrandComponent,
    CountUpComponent,
    PinContainerComponent,
    RevealDirective,
    ScrollProgressComponent,
    TextGenerateEffectComponent,
    ThemeToggleComponent,
    Tilt3dComponent,
    LucideArrowRight,
    LucideArrowUpRight,
    LucideCheck,
    LucideDynamicIcon,
    LucideExternalLink,
  ],
  template: `
    <div class="min-h-screen bg-background">
      <header
        class="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-sm"
      >
        <div class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <app-brand />
          <nav class="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#rag" class="group relative py-1 transition-colors hover:text-foreground">AI &amp; RAG<span aria-hidden class="absolute -bottom-0.5 left-0 h-px w-0 bg-foreground transition-[width] duration-300 ease-out group-hover:w-full"></span></a>
            <a href="#features" class="group relative py-1 transition-colors hover:text-foreground">Features<span aria-hidden class="absolute -bottom-0.5 left-0 h-px w-0 bg-foreground transition-[width] duration-300 ease-out group-hover:w-full"></span></a>
            <a href="#how" class="group relative py-1 transition-colors hover:text-foreground">How it works<span aria-hidden class="absolute -bottom-0.5 left-0 h-px w-0 bg-foreground transition-[width] duration-300 ease-out group-hover:w-full"></span></a>
            <a href="#dimensions" class="group relative py-1 transition-colors hover:text-foreground">Scoring<span aria-hidden class="absolute -bottom-0.5 left-0 h-px w-0 bg-foreground transition-[width] duration-300 ease-out group-hover:w-full"></span></a>
            <a href="#faq" class="group relative py-1 transition-colors hover:text-foreground">FAQ<span aria-hidden class="absolute -bottom-0.5 left-0 h-px w-0 bg-foreground transition-[width] duration-300 ease-out group-hover:w-full"></span></a>
          </nav>
          <div class="flex items-center gap-2">
            <app-theme-toggle />
            <a routerLink="/auth" [class]="buttonClass('ghost', 'sm', 'hidden sm:inline-flex')">Sign in</a>
            <a routerLink="/auth" [queryParams]="{ returnTo: '/dashboard' }" [class]="buttonClass('default', 'sm')">Get started</a>
          </div>
        </div>
        <app-scroll-progress />
      </header>

      <main>
        <!-- Hero -->
        <section class="relative border-b border-border/80">
          <div class="cp-grid pointer-events-none absolute inset-0" aria-hidden="true"></div>
          <div class="relative mx-auto grid w-full max-w-6xl gap-16 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
            <div class="flex flex-col justify-center gap-8">
              <p appReveal class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                CV analysis · RAG career guidance · Learning roadmaps
              </p>
              <h1
                appReveal
                [delay]="90"
                class="max-w-[26ch] text-4xl font-medium leading-[1.1] tracking-[-0.03em] text-foreground sm:text-5xl"
              >
                Your AI Career Copilot. From CV Analysis to Career Growth.
              </h1>
              <p appReveal [delay]="180" class="max-w-xl text-base leading-relaxed text-muted-foreground">
                Analyze your CV, discover skill gaps, and use AI-powered insights grounded in
                trusted learning resources to build your path toward your dream career.
              </p>
              <div appReveal [delay]="270" class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  routerLink="/auth"
                  [queryParams]="{ returnTo: '/cv' }"
                  [class]="buttonClass('default', 'lg', 'group gap-2')"
                >
                  Analyze My CV
                  <svg lucideArrowRight class="size-4 transition-transform duration-200 group-hover:translate-x-0.5"></svg>
                </a>
                <a href="#rag" [class]="buttonClass('outline', 'lg')">Explore AI Career Assistant</a>
              </div>
              <p appReveal [delay]="330" class="text-xs text-muted-foreground">
                PDF · DOCX — max 10 MB · Explainable ATS scoring · Prioritised fix list
              </p>
            </div>

            <!-- Example report — the hero's 3D object. -->
            <app-tilt3d>
              <div
                class="rounded-md border border-border bg-card transition-colors duration-300 hover:border-foreground/25"
                aria-label="Example ATS report"
              >
                <div class="flex items-baseline justify-between border-b border-border/80 px-6 py-4">
                  <span class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Example report</span>
                  <span class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">7 dimensions</span>
                </div>
                <div class="flex items-end justify-between gap-6 px-6 py-6">
                  <div>
                    <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">ATS compatibility</p>
                    <p class="mt-2 text-5xl font-medium tabular-nums tracking-[-0.03em] text-foreground">
                      <span appCountUp [to]="82"></span><span class="text-2xl text-muted-foreground">%</span>
                    </p>
                  </div>
                  <p class="max-w-[18ch] text-xs leading-relaxed text-muted-foreground">
                    Weighted average of seven measured dimensions. Identical input always returns
                    the same score.
                  </p>
                </div>
                <ul class="divide-y divide-border/80 border-t border-border/80">
                  @for (dimension of exampleDimensions; track dimension.label) {
                    <li class="flex items-center gap-4 px-6 py-2.5 transition-colors duration-200 hover:bg-secondary/60">
                      <span class="w-40 shrink-0 truncate text-xs text-muted-foreground">{{ dimension.label }}</span>
                      <span class="h-[3px] flex-1 overflow-hidden rounded-full bg-secondary">
                        <span
                          class="cp-bar-fill block h-full rounded-full bg-foreground"
                          [style.width.%]="dimension.score"
                        ></span>
                      </span>
                      <span class="w-8 shrink-0 text-right text-xs tabular-nums text-foreground">{{ dimension.score }}</span>
                    </li>
                  }
                </ul>
                <div class="border-t border-border/80 px-6 py-4">
                  <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Top finding</p>
                  <p class="mt-2 text-sm font-medium text-foreground">Missing measurable achievements</p>
                  <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
                    5 of 19 bullets contain a number. Add measurable results to relevant project or
                    experience descriptions.
                  </p>
                </div>
              </div>
            </app-tilt3d>
          </div>
        </section>

        <!-- RAG technology -->
        <section id="rag" class="scroll-mt-16 border-b border-border/80">
          <div class="mx-auto w-full max-w-6xl px-6 py-20">
            <div appReveal>
              <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Retrieval-augmented generation</p>
              <h2 class="mt-4 max-w-[26ch] text-3xl font-medium tracking-[-0.02em] text-foreground">
                AI That Understands Your Career
              </h2>
              <p class="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                CareerPilot uses Retrieval-Augmented Generation (RAG) to combine your CV, target job
                requirements, and trusted learning resources to generate personalized,
                evidence-based career guidance.
              </p>
            </div>

            <ol class="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
              @for (stage of ragStages; track stage.step; let index = $index) {
                <li
                  appReveal
                  [delay]="index * 70"
                  class="group flex flex-col gap-3 bg-background p-6 transition-colors duration-300 hover:bg-secondary"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-xs tabular-nums text-muted-foreground">{{ stage.step }}</span>
                    <svg [lucideIcon]="stage.icon" class="size-4 text-muted-foreground transition-colors duration-300 group-hover:text-foreground"></svg>
                  </div>
                  <h3 class="text-sm font-medium text-foreground">{{ stage.title }}</h3>
                  <p class="text-sm leading-relaxed text-muted-foreground">{{ stage.body }}</p>
                </li>
              }
            </ol>

            <p class="mt-6 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              This workflow is a planned capability of the CareerPilot backend, shown here as an
              illustrative demonstration rather than a live feature. The screens under AI Copilot
              and Learning roadmap report the same status when you open them.
            </p>
          </div>
        </section>

        <!-- Feature cards -->
        <section id="features" class="scroll-mt-16 border-b border-border/80">
          <div class="mx-auto w-full max-w-6xl px-6 py-20">
            <div appReveal>
              <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">The platform</p>
              <h2 class="mt-4 max-w-[30ch] text-3xl font-medium tracking-[-0.02em] text-foreground">
                One platform for the whole career loop.
              </h2>
              <p class="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Six capabilities that share one source of truth: your CV, your target role and a
                curated knowledge base. Features that are still in development are marked as
                previews rather than linked.
              </p>
            </div>

            <ul class="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
              @for (feature of features; track feature.title; let index = $index) {
                <li
                  appReveal
                  [delay]="index * 60"
                  class="group flex flex-col gap-4 bg-background p-8 transition-colors duration-300 hover:bg-secondary"
                >
                  <div class="flex items-center justify-between">
                    <span class="grid size-9 place-items-center rounded-[4px] border border-border bg-secondary/60 text-foreground transition-colors duration-300 group-hover:border-foreground/20">
                      <svg [lucideIcon]="feature.icon" class="size-4"></svg>
                    </span>
                    @if (feature.status) {
                      <span class="rounded-[3px] border border-dashed border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        In development
                      </span>
                    }
                  </div>
                  <h3 class="text-base font-medium text-foreground">{{ feature.title }}</h3>
                  <ul class="flex flex-1 flex-col gap-2">
                    @for (point of feature.points; track point) {
                      <li class="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                        <svg lucideCheck class="mt-1 size-3.5 shrink-0 text-foreground/70"></svg>
                        {{ point }}
                      </li>
                    }
                  </ul>
                  @if (feature.to) {
                    <a [routerLink]="feature.to" class="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                      {{ feature.cta }}
                      <svg lucideArrowRight class="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"></svg>
                    </a>
                  }
                  @if (feature.status) {
                    <p class="text-xs leading-relaxed text-muted-foreground">{{ feature.status }}</p>
                  }
                </li>
              }
            </ul>
          </div>
        </section>

        <!-- Interactive RAG demo -->
        <section id="demo" class="scroll-mt-16 border-b border-border/80">
          <div class="mx-auto w-full max-w-6xl px-6 py-20">
            <div appReveal>
              <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">A worked example</p>
              <h2 class="mt-4 max-w-[26ch] text-3xl font-medium tracking-[-0.02em] text-foreground">
                See How CareerPilot AI Works
              </h2>
              <p class="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Walk through a single query end to end for a candidate targeting a Junior Java
                Backend Developer role. This is an illustrative demonstration built from real
                catalog links — it does not call the backend.
              </p>
            </div>

            <div class="mt-12 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
              <ol class="relative flex flex-col gap-1 border-l border-border">
                @for (entry of demoStages; track entry.label; let index = $index) {
                  <li class="relative pl-7">
                    <span
                      aria-hidden="true"
                      [class]="cn(
                        'absolute left-[-5px] top-4 size-2.5 rounded-full border transition-colors',
                        index === activeDemo()
                          ? 'border-foreground bg-foreground'
                          : 'border-border bg-background'
                      )"
                    ></span>
                    <button
                      type="button"
                      (click)="activeDemo.set(index)"
                      [attr.aria-current]="index === activeDemo() ? 'step' : null"
                      [class]="cn(
                        'flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm transition-colors',
                        index === activeDemo()
                          ? 'bg-secondary text-foreground'
                          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                      )"
                    >
                      <svg [lucideIcon]="entry.icon" class="size-4 shrink-0"></svg>
                      <span class="flex-1">{{ entry.label }}</span>
                      <span class="text-[11px] tabular-nums text-muted-foreground">{{ pad(index + 1) }}</span>
                    </button>
                  </li>
                }
              </ol>

              <div class="rounded-md border border-border bg-card">
                <div class="flex items-center justify-between gap-3 border-b border-border/80 px-6 py-4">
                  <span class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    {{ demoStages[activeDemo()].label }}
                  </span>
                  <span class="rounded-[3px] border border-dashed border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Demonstration
                  </span>
                </div>
                <div class="min-h-[17rem] p-6">
                  @switch (activeDemo()) {
                    @case (0) {
                      <div class="flex flex-col gap-3">
                        <div class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 px-4 py-3">
                          <span class="text-xs text-muted-foreground">Target role</span>
                          <span class="text-sm font-medium text-foreground">Junior Java Backend Developer</span>
                        </div>
                        <div class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 px-4 py-3">
                          <span class="text-xs text-muted-foreground">CV version</span>
                          <span class="text-sm font-medium text-foreground">Backend CV · v3</span>
                        </div>
                        <p class="text-xs leading-relaxed text-muted-foreground">
                          The parser reads skills, projects, education and experience from the
                          document you already have — nothing is inferred from outside it.
                        </p>
                      </div>
                    }
                    @case (1) {
                      <div class="flex flex-col gap-3">
                        <p class="text-xs text-muted-foreground">Skills detected in the CV</p>
                        <ul class="flex flex-wrap gap-1.5">
                          @for (skill of demoSkills; track skill) {
                            <li class="inline-flex items-center gap-1 rounded-[3px] border border-border bg-secondary px-2 py-1 text-xs text-foreground">
                              <svg lucideCheck class="size-3"></svg>
                              {{ skill }}
                            </li>
                          }
                        </ul>
                        <p class="text-xs leading-relaxed text-muted-foreground">
                          Deterministic: the same document always produces the same list.
                        </p>
                      </div>
                    }
                    @case (2) {
                      <div class="flex flex-col gap-3">
                        <p class="text-xs text-muted-foreground">Required by the role, but not demonstrated</p>
                        <ul class="flex flex-col divide-y divide-border/70 rounded-md border border-border">
                          @for (gap of demoGaps; track gap.skill) {
                            <li class="flex flex-col gap-1 px-4 py-3">
                              <span class="text-sm font-medium text-foreground">{{ gap.skill }}</span>
                              <span class="text-xs text-muted-foreground">{{ gap.note }}</span>
                            </li>
                          }
                        </ul>
                      </div>
                    }
                    @case (3) {
                      <div class="flex flex-col gap-3">
                        <p class="text-xs text-muted-foreground">
                          Semantic search over a curated, URL-verified knowledge base
                        </p>
                        <ul class="flex flex-col gap-2">
                          @for (resource of demoResources; track resource.url) {
                            <li class="rounded-md border border-border/70 px-3 py-2.5 transition-colors hover:border-foreground/25">
                              <a [href]="resource.url" target="_blank" rel="noreferrer" class="group flex items-start justify-between gap-3">
                                <span>
                                  <span class="flex items-center gap-1.5 text-sm font-medium text-foreground group-hover:underline">
                                    {{ resource.title }}
                                    <svg lucideExternalLink class="size-3 shrink-0 opacity-60"></svg>
                                  </span>
                                  <span class="mt-0.5 block text-[11px] text-muted-foreground">{{ resource.provider }}</span>
                                </span>
                              </a>
                            </li>
                          }
                        </ul>
                      </div>
                    }
                    @case (4) {
                      <div class="flex flex-col gap-4">
                        <blockquote class="border-l-2 border-foreground/30 pl-4 text-sm leading-relaxed text-foreground">
                          “Based on your current profile and target role, focus on backend
                          integration testing and deployment fundamentals. Start with practical
                          exercises that extend your existing Spring Boot projects.”
                        </blockquote>
                        <ul class="flex flex-col divide-y divide-border/70 rounded-md border border-border">
                          @for (row of demoRoadmap; track row.week) {
                            <li class="grid gap-1 px-4 py-3 sm:grid-cols-[4rem_1fr] sm:items-baseline sm:gap-3">
                              <span class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Week {{ row.week }}</span>
                              <span>
                                <span class="block text-sm font-medium text-foreground">{{ row.skill }}</span>
                                <span class="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{{ row.task }}</span>
                              </span>
                            </li>
                          }
                        </ul>
                      </div>
                    }
                  }
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Journey -->
        <section id="journey" class="scroll-mt-16 border-b border-border/80">
          <div class="mx-auto w-full max-w-6xl px-6 py-20">
            <div appReveal>
              <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Your journey</p>
              <h2 class="mt-4 max-w-[24ch] text-3xl font-medium tracking-[-0.02em] text-foreground">
                Your Journey with CareerPilot
              </h2>
              <p class="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                From the CV you are about to send to a plan you can measure — six steps, each one
                built on the last.
              </p>
            </div>

            <ol class="relative mt-12 ml-3 flex flex-col gap-9 border-l border-border">
              @for (step of journey; track step.title; let index = $index) {
                <li appReveal [delay]="index * 80" class="relative pl-9">
                  <span class="absolute -left-3 top-0 grid size-6 place-items-center rounded-full border border-border bg-background text-[10px] font-medium tabular-nums text-foreground">
                    {{ index + 1 }}
                  </span>
                  <h3 class="text-base font-medium text-foreground">{{ step.title }}</h3>
                  <p class="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">{{ step.body }}</p>
                </li>
              }
            </ol>
          </div>
        </section>

        <!-- How it works -->
        <section id="how" class="scroll-mt-16 border-b border-border/80">
          <div class="mx-auto w-full max-w-6xl px-6 py-20">
            <div appReveal>
              <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">How it works</p>
              <h2 class="mt-4 max-w-[34ch] text-3xl font-medium tracking-[-0.02em] text-foreground">
                Four steps, from a document you already have to an interview you are ready for.
              </h2>
            </div>

            <app-tilt3d className="mt-12" [maxTilt]="3.5" [perspective]="2000" [depth]="24" [float]="5" [lift]="18" [hoverScale]="1.006">
              <ol class="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
                @for (step of steps; track step.title; let index = $index) {
                  <li appReveal [delay]="index * 80" class="group flex flex-col gap-3 bg-background p-8 transition-colors duration-300 hover:bg-secondary">
                    <span class="text-xs tabular-nums text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                      {{ pad(index + 1) }}
                    </span>
                    <h3 class="text-base font-medium text-foreground">{{ step.title }}</h3>
                    <p class="text-sm leading-relaxed text-muted-foreground">{{ step.body }}</p>
                  </li>
                }
              </ol>
            </app-tilt3d>
          </div>
        </section>

        <!-- Matching -->
        <section id="matching" class="scroll-mt-16 border-b border-border/80">
          <div class="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <div appReveal>
                <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Job matching — planned</p>
                <h2 class="mt-4 max-w-[26ch] text-3xl font-medium tracking-[-0.02em] text-foreground">
                  A match score you can argue with, not guess at.
                </h2>
                <p class="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Planned. Every posting will be compared with your profile and your current CV
                  across weighted dimensions, each reporting its own reasoning, so a low score
                  always names the dimension that caused it. The Jobs screen shows a Coming Soon
                  notice until this API ships.
                </p>
              </div>
              <app-tilt3d className="mt-8" [maxTilt]="4" [perspective]="1700" [depth]="24" [float]="5" [lift]="18" [hoverScale]="1.008">
                <ul class="flex flex-col gap-px overflow-hidden rounded-md border border-border bg-border">
                  @for (weight of matchWeights; track weight.name; let index = $index) {
                    <li appReveal [delay]="index * 60" class="flex items-center justify-between gap-4 bg-background px-6 py-3 transition-colors duration-300 hover:bg-secondary">
                      <span class="text-sm text-foreground">{{ weight.name }}</span>
                      <span class="text-xs tabular-nums text-muted-foreground">{{ weight.weight }}</span>
                    </li>
                  }
                </ul>
              </app-tilt3d>
            </div>

            <div appReveal [delay]="100" class="h-fit">
              <app-tilt3d [maxTilt]="5" [perspective]="1400" [depth]="28" [float]="6" [lift]="18" [hoverScale]="1.008">
                <div class="rounded-md border border-border bg-card transition-colors duration-300 hover:border-foreground/25">
                  <div class="flex items-baseline justify-between border-b border-border/80 px-6 py-4">
                    <span class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Example match</span>
                    <span class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Backend developer</span>
                  </div>
                  <div class="flex items-end justify-between gap-6 px-6 py-6">
                    <div>
                      <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Compatibility</p>
                      <p class="mt-2 text-5xl font-medium tabular-nums tracking-[-0.03em] text-foreground">
                        <span appCountUp [to]="74"></span><span class="text-2xl text-muted-foreground">%</span>
                      </p>
                    </div>
                    <p class="max-w-[20ch] text-xs leading-relaxed text-muted-foreground">
                      Compatibility between your profile, your CV and this posting — never a
                      prediction of the hiring decision.
                    </p>
                  </div>
                  <div class="border-t border-border/80 px-6 py-5">
                    <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Skills</p>
                    <ul class="mt-3 flex flex-wrap gap-1.5">
                      @for (skill of matchSkills; track skill) {
                        <li class="inline-flex items-center gap-1 rounded-[3px] border border-border bg-secondary px-2 py-1 text-xs text-foreground">
                          <svg lucideCheck class="size-3"></svg>
                          {{ skill }}
                        </li>
                      }
                      @for (skill of missingSkills; track skill) {
                        <li class="rounded-[3px] border border-dashed border-border px-2 py-1 text-xs text-muted-foreground">
                          {{ skill }}
                        </li>
                      }
                    </ul>
                    <p class="mt-4 text-xs leading-relaxed text-muted-foreground">
                      Name Docker and Kubernetes in a project bullet if you have genuinely used
                      them — otherwise the score stays honest and tells you to leave them out.
                    </p>
                  </div>
                </div>
              </app-tilt3d>
            </div>
          </div>
        </section>

        <!-- Dimensions -->
        <section id="dimensions" class="scroll-mt-16 border-b border-border/80">
          <div class="mx-auto w-full max-w-6xl px-6 py-20">
            <div appReveal>
              <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">The scoring model</p>
              <h2 class="mt-4 max-w-[34ch] text-3xl font-medium tracking-[-0.02em] text-foreground">
                Seven weighted dimensions, each with its own findings.
              </h2>
              <p class="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                A single opaque percentage is useless. Each dimension below is measured separately,
                contributes a fixed share of the total, and reports its own deductions so you
                always know which one to work on next.
              </p>
            </div>
            <ul class="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              @for (dimension of scoringDimensions; track dimension.name; let index = $index) {
                <li appReveal [delay]="index * 50" class="group flex flex-col gap-2 bg-background p-6 transition-colors duration-300 hover:bg-secondary">
                  <div class="flex items-baseline justify-between gap-4">
                    <h3 class="text-sm font-medium text-foreground">{{ dimension.name }}</h3>
                    <span class="text-xs tabular-nums text-muted-foreground">{{ dimension.weight }}</span>
                  </div>
                  <p class="text-sm leading-relaxed text-muted-foreground">{{ dimension.detail }}</p>
                </li>
              }
            </ul>
          </div>
        </section>

        <!-- Interactive workspace showcase -->
        <section id="workspace" class="scroll-mt-16 border-b border-border/80">
          <div class="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr]">
            <div appReveal>
              <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">The workspace</p>
              <h2 class="mt-4 max-w-[20ch] text-3xl font-medium tracking-[-0.02em] text-foreground">
                Put every step of the search in one place.
              </h2>
              <p class="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                Hover the card to watch it tilt in perspective. It stands in for the workspace where
                each CV version, matched role, application stage and preparation plan lives
                alongside the others.
              </p>
            </div>
            <div appReveal [delay]="100">
              <div class="flex h-[30rem] w-full items-center justify-center">
                <app-pin-container title="Open the workspace" href="/auth?returnTo=%2Fdashboard">
                  <div class="flex w-[18rem] flex-col gap-5 p-2 sm:w-[20rem]">
                    <div>
                      <h3 class="text-base font-medium text-foreground">Your search, in one place</h3>
                      <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
                        CV scores, matched roles, application stages and interview preparation —
                        tracked together instead of scattered across tabs.
                      </p>
                    </div>
                    <div class="flex h-24 items-end gap-2 rounded-lg border border-border bg-secondary/50 p-4">
                      @for (height of pinBars; track $index) {
                        <span
                          class="block w-full rounded-[2px] bg-foreground/80"
                          [style.height.%]="height"
                        ></span>
                      }
                    </div>
                    <span class="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                      Open the workspace
                      <svg lucideArrowUpRight class="size-3.5 transition-transform duration-200 group-hover/pin:-translate-y-0.5 group-hover/pin:translate-x-0.5"></svg>
                    </span>
                  </div>
                </app-pin-container>
              </div>
            </div>
          </div>
        </section>

        <!-- Guarantees -->
        <section class="border-b border-border/80">
          <div class="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr]">
            <div appReveal>
              <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">What it will never do</p>
              <h2 class="mt-4 max-w-[24ch] text-3xl font-medium tracking-[-0.02em] text-foreground">
                Honest scoring, or the score means nothing.
              </h2>
              <p class="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                Recommendations describe the change. They never write content you cannot defend in
                an interview, because a fabricated CV fails the moment someone asks about it.
              </p>
            </div>
            <ul class="divide-y divide-border/80 border-y border-border/80">
              @for (item of guarantees; track item; let index = $index) {
                <li appReveal [delay]="index * 60" class="group flex items-start gap-3 py-4 transition-colors duration-300">
                  <svg lucideCheck class="mt-0.5 size-4 shrink-0 text-foreground transition-transform duration-300 group-hover:translate-x-0.5"></svg>
                  <span class="text-sm leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-foreground">{{ item }}</span>
                </li>
              }
            </ul>
          </div>
        </section>

        <!-- Animated statement -->
        <section class="border-b border-border/80">
          <div class="mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-24 text-center">
            <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Our one rule</p>
            <app-text-generate-effect
              words="Every score is measured, every finding is explained, and nothing is invented on your behalf."
              [duration]="0.4"
              className="mt-6 text-2xl font-medium leading-snug tracking-[-0.02em] text-foreground sm:text-3xl"
            />
          </div>
        </section>

        <!-- Students -->
        <section id="students" class="scroll-mt-16 border-b border-border/80">
          <div class="mx-auto w-full max-w-6xl px-6 py-20">
            <div appReveal>
              <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Built for students and interns</p>
              <h2 class="mt-4 max-w-[30ch] text-3xl font-medium tracking-[-0.02em] text-foreground">
                Expectations tuned to a first-job profile.
              </h2>
            </div>
            <div class="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
              @for (item of studentPoints; track item.title; let index = $index) {
                <div appReveal [delay]="index * 60" class="flex flex-col gap-3 bg-background p-8 transition-colors duration-300 hover:bg-secondary">
                  <h3 class="text-base font-medium text-foreground">{{ item.title }}</h3>
                  <p class="text-sm leading-relaxed text-muted-foreground">{{ item.body }}</p>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- FAQ -->
        <section id="faq" class="scroll-mt-16 border-b border-border/80">
          <div class="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[0.6fr_1.4fr]">
            <div appReveal>
              <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">FAQ</p>
              <h2 class="mt-4 text-3xl font-medium tracking-[-0.02em] text-foreground">
                Questions worth asking.
              </h2>
            </div>
            <div appReveal [delay]="100">
              <app-accordion [items]="faq" />
            </div>
          </div>
        </section>

        <!-- Final CTA -->
        <section>
          <div appReveal class="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-6 py-20 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="max-w-[28ch] text-3xl font-medium tracking-[-0.02em] text-foreground">
                Start with the CV you are about to send.
              </h2>
              <p class="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                Upload once, read a score built from seven measured dimensions, and work through a
                prioritised list of fixes. Job matching, learning roadmaps and interview
                preparation are on the roadmap and clearly marked until their APIs ship.
              </p>
            </div>
            <a
              routerLink="/auth"
              [queryParams]="{ returnTo: '/dashboard' }"
              [class]="buttonClass('default', 'lg', 'group gap-2')"
            >
              Create my account
              <svg lucideArrowRight class="size-4 transition-transform duration-200 group-hover:translate-x-0.5"></svg>
            </a>
          </div>
        </section>
      </main>

      <footer class="border-t border-border/80">
        <div class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <app-brand />
          <p class="text-xs leading-relaxed text-muted-foreground">
            CareerPilot — deterministic CV analysis, RAG-grounded learning roadmaps, job matching,
            application tracking and interview preparation.
          </p>
          <div class="flex gap-6 text-xs text-muted-foreground">
            <a routerLink="/auth" class="transition-colors hover:text-foreground">Sign in</a>
            <a routerLink="/dashboard" class="transition-colors hover:text-foreground">Dashboard</a>
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class LandingPage {
  protected readonly buttonClass = buttonClass;
  protected readonly cn = cn;

  protected readonly exampleDimensions = EXAMPLE_DIMENSIONS;
  protected readonly steps = STEPS;
  protected readonly guarantees = GUARANTEES;
  protected readonly matchWeights = MATCH_WEIGHTS;
  protected readonly scoringDimensions = DIMENSIONS;
  protected readonly studentPoints = STUDENT_POINTS;
  protected readonly faq = FAQ;
  protected readonly ragStages = RAG_STAGES;
  protected readonly features = FEATURES;
  protected readonly demoStages = DEMO_STAGES;
  protected readonly demoGaps = DEMO_GAPS;
  protected readonly demoResources = DEMO_RESOURCES;
  protected readonly demoRoadmap = DEMO_ROADMAP;
  protected readonly journey = JOURNEY;

  protected readonly demoSkills = DEMO_SKILLS;
  protected readonly matchSkills = ["Java", "Spring Boot", "PostgreSQL"];
  protected readonly missingSkills = ["Docker", "Kubernetes"];
  protected readonly pinBars = [58, 82, 46, 90, 71];

  protected readonly activeDemo = signal(0);

  protected pad(value: number): string {
    return String(value).padStart(2, "0");
  }
}
