import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";
import { PinContainer } from "@/components/PinContainer";
import { TextGenerateEffect } from "@/components/TextGenerateEffect";
import { Tilt3DStage } from "@/components/Tilt3D";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  CountUp,
  EASE,
  Reveal,
  ScrollProgress,
  VIEWPORT,
  fadeUp,
  staggerContainer,
} from "@/lib/motion";
import { cn } from "@/lib/utils";
import { AnimatePresence, MotionConfig, motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  Database,
  ExternalLink,
  FileText,
  GraduationCap,
  PenLine,
  Route,
  Search,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";

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

const FAQ = [
  {
    q: "Which file formats can be analysed?",
    a: "PDF and DOCX up to 10 MB, parsed on the server. The PDF must contain a real text layer: a scan or a screenshot exported to PDF has no text to read, so export the document again from the word processor instead.",
  },
  {
    q: "What happens to my CV file?",
    a: "The file is stored against your account, only readable by you, and the extracted text is kept so that you can re-scan the same version with a different target role without uploading it again. Deleting a version deletes both the file and its analyses.",
  },
  {
    q: "How is the ATS score calculated?",
    a: "Seven dimensions are measured independently, each with a fixed weight that totals 100%. The overall ATS score is the weighted average, so an identical document always produces an identical score, and you can see which dimension lowered it.",
  },
  {
    q: "How does job matching work?",
    a: "Planned. Each posting will be compared with your profile and your current CV across weighted dimensions, and the result will list the skills that matched, the ones still missing, and anything you should be aware of before applying. The Jobs screen currently shows a Coming Soon notice.",
  },
  {
    q: "Will it rewrite my CV with invented content?",
    a: "No. The planned editor will work only on what your document already contains: it removes filler phrasing, restores action verbs and standardises section headings into a parser-friendly layout. It never adds an employer, date, degree, certification or skill. The optimiser is not implemented yet and is labelled Coming Soon.",
  },
  {
    q: "What does the interview preparation plan contain?",
    a: "Planned. Picking a job from your pipeline will turn the posting's requirements and your missing skills into daily technical, coding, system-design, behavioural and company-research tasks, sized to the minutes you have each day. The Interview prep screen currently shows a Coming Soon notice.",
  },
  {
    q: "Is it free?",
    a: "Yes. Create an account with your email, analyse your CV, match it against every posting, track your applications and build preparation plans without paying.",
  },
];

/* --------------------------------------------------- RAG showcase data ---- */

const RAG_STAGES: { step: string; title: string; body: string; icon: LucideIcon }[] = [
  {
    step: "01",
    title: "Your CV",
    body: "Extract skills, projects, education and experience from the document you already have.",
    icon: FileText,
  },
  {
    step: "02",
    title: "Skill gap analysis",
    body: "Compare what your profile demonstrates with what your target role requires.",
    icon: Search,
  },
  {
    step: "03",
    title: "Knowledge retrieval",
    body: "Retrieve relevant learning resources with semantic search over a curated knowledge base.",
    icon: Database,
  },
  {
    step: "04",
    title: "AI generation",
    body: "Generate contextual recommendations using the retrieved information — never invented links.",
    icon: Sparkles,
  },
  {
    step: "05",
    title: "Personalized roadmap",
    body: "Turn the insights into a week-by-week learning plan you can track to completion.",
    icon: Route,
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
    icon: FileText,
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
    icon: Bot,
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
    icon: Route,
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
    icon: Target,
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
    icon: GraduationCap,
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
    icon: PenLine,
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
  { label: "Your profile", icon: FileText },
  { label: "Detected skills", icon: Check },
  { label: "Potential skill gaps", icon: Search },
  { label: "Retrieved resources", icon: Database },
  { label: "AI recommendation", icon: Sparkles },
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

/* ------------------------------------------------- RAG showcase blocks ---- */

/** The five connected cards that explain the RAG workflow. */
function RagWorkflow() {
  return (
    <motion.ol
      variants={staggerContainer(0.07)}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      className="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-5"
    >
      {RAG_STAGES.map((stage) => {
        const Icon = stage.icon;
        return (
          <motion.li
            key={stage.step}
            variants={fadeUp}
            className="group flex flex-col gap-3 bg-background p-6 transition-colors duration-300 hover:bg-secondary"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs tabular-nums text-muted-foreground">{stage.step}</span>
              <Icon className="size-4 text-muted-foreground transition-colors duration-300 group-hover:text-foreground" />
            </div>
            <h3 className="text-sm font-medium text-foreground">{stage.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{stage.body}</p>
          </motion.li>
        );
      })}
    </motion.ol>
  );
}

/** Six feature cards. Only implemented features render a navigation link. */
function FeatureGrid() {
  return (
    <motion.ul
      variants={staggerContainer(0.06)}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      className="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2 lg:grid-cols-3"
    >
      {FEATURES.map((feature) => {
        const Icon = feature.icon;
        return (
          <motion.li
            key={feature.title}
            variants={fadeUp}
            className="group flex flex-col gap-4 bg-background p-8 transition-colors duration-300 hover:bg-secondary"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-[4px] border border-border bg-secondary/60 text-foreground transition-colors duration-300 group-hover:border-foreground/20">
                <Icon className="size-4" />
              </span>
              {feature.status && (
                <span className="rounded-[3px] border border-dashed border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  In development
                </span>
              )}
            </div>
            <h3 className="text-base font-medium text-foreground">{feature.title}</h3>
            <ul className="flex flex-1 flex-col gap-2">
              {feature.points.map((point) => (
                <li
                  key={point}
                  className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
                >
                  <Check className="mt-1 size-3.5 shrink-0 text-foreground/70" />
                  {point}
                </li>
              ))}
            </ul>
            {feature.to && (
              <Link
                to={feature.to}
                className="inline-flex items-center gap-1 text-sm font-medium text-foreground"
              >
                {feature.cta}
                <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            )}
            {feature.status && (
              <p className="text-xs leading-relaxed text-muted-foreground">{feature.status}</p>
            )}
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

/** Clickable walkthrough of one RAG query, built from real catalog links. */
function RagDemo() {
  const [active, setActive] = useState(0);
  const stage = DEMO_STAGES[active];

  return (
    <div className="mt-12 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
      <ol className="relative flex flex-col gap-1 border-l border-border">
        {DEMO_STAGES.map((entry, index) => {
          const Icon = entry.icon;
          const isActive = index === active;
          return (
            <li key={entry.label} className="relative pl-7">
              <span
                aria-hidden
                className={cn(
                  "absolute left-[-5px] top-4 size-2.5 rounded-full border transition-colors",
                  isActive ? "border-foreground bg-foreground" : "border-border bg-background",
                )}
              />
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm transition-colors",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1">{entry.label}</span>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="rounded-md border border-border bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border/80 px-6 py-4">
          <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {stage.label}
          </span>
          <span className="rounded-[3px] border border-dashed border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Demonstration
          </span>
        </div>
        <div className="min-h-[17rem] p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              {active === 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 px-4 py-3">
                    <span className="text-xs text-muted-foreground">Target role</span>
                    <span className="text-sm font-medium text-foreground">
                      Junior Java Backend Developer
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 px-4 py-3">
                    <span className="text-xs text-muted-foreground">CV version</span>
                    <span className="text-sm font-medium text-foreground">Backend CV · v3</span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    The parser reads skills, projects, education and experience from the document
                    you already have — nothing is inferred from outside it.
                  </p>
                </div>
              )}

              {active === 1 && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-muted-foreground">Skills detected in the CV</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {DEMO_SKILLS.map((skill) => (
                      <li
                        key={skill}
                        className="inline-flex items-center gap-1 rounded-[3px] border border-border bg-secondary px-2 py-1 text-xs text-foreground"
                      >
                        <Check className="size-3" />
                        {skill}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Deterministic: the same document always produces the same list.
                  </p>
                </div>
              )}

              {active === 2 && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-muted-foreground">
                    Required by the role, but not demonstrated
                  </p>
                  <ul className="flex flex-col divide-y divide-border/70 rounded-md border border-border">
                    {DEMO_GAPS.map((gap) => (
                      <li key={gap.skill} className="flex flex-col gap-1 px-4 py-3">
                        <span className="text-sm font-medium text-foreground">{gap.skill}</span>
                        <span className="text-xs text-muted-foreground">{gap.note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {active === 3 && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-muted-foreground">
                    Semantic search over a curated, URL-verified knowledge base
                  </p>
                  <ul className="flex flex-col gap-2">
                    {DEMO_RESOURCES.map((resource) => (
                      <li
                        key={resource.url}
                        className="rounded-md border border-border/70 px-3 py-2.5 transition-colors hover:border-foreground/25"
                      >
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-start justify-between gap-3"
                        >
                          <span>
                            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground group-hover:underline">
                              {resource.title}
                              <ExternalLink className="size-3 shrink-0 opacity-60" />
                            </span>
                            <span className="mt-0.5 block text-[11px] text-muted-foreground">
                              {resource.provider}
                            </span>
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {active === 4 && (
                <div className="flex flex-col gap-4">
                  <blockquote className="border-l-2 border-foreground/30 pl-4 text-sm leading-relaxed text-foreground">
                    “Based on your current profile and target role, focus on backend integration
                    testing and deployment fundamentals. Start with practical exercises that extend
                    your existing Spring Boot projects.”
                  </blockquote>
                  <ul className="flex flex-col divide-y divide-border/70 rounded-md border border-border">
                    {DEMO_ROADMAP.map((row) => (
                      <li
                        key={row.week}
                        className="grid gap-1 px-4 py-3 sm:grid-cols-[4rem_1fr] sm:items-baseline sm:gap-3"
                      >
                        <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          Week {row.week}
                        </span>
                        <span>
                          <span className="block text-sm font-medium text-foreground">
                            {row.skill}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                            {row.task}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/** Numbered vertical timeline for the end-to-end journey. */
function JourneyTimeline() {
  return (
    <motion.ol
      variants={staggerContainer(0.08)}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      className="relative mt-12 ml-3 flex flex-col gap-9 border-l border-border"
    >
      {JOURNEY.map((step, index) => (
        <motion.li key={step.title} variants={fadeUp} className="relative pl-9">
          <span className="absolute -left-3 top-0 grid size-6 place-items-center rounded-full border border-border bg-background text-[10px] font-medium tabular-nums text-foreground">
            {index + 1}
          </span>
          <h3 className="text-base font-medium text-foreground">{step.title}</h3>
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {step.body}
          </p>
        </motion.li>
      ))}
    </motion.ol>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{children}</p>
  );
}

/** Nav link with a hairline underline that grows in on hover. */
function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="group relative py-1 transition-colors hover:text-foreground">
      {children}
      <span
        aria-hidden
        className="absolute -bottom-0.5 left-0 h-px w-0 bg-foreground transition-[width] duration-300 ease-out group-hover:w-full"
      />
    </a>
  );
}

/** Section label + heading + intro, revealed in sequence on scroll. */
function SectionHeading({
  label,
  title,
  titleClassName,
  body,
  bodyClassName,
}: {
  label: string;
  title: ReactNode;
  titleClassName?: string;
  body?: string;
  bodyClassName?: string;
}) {
  return (
    <motion.div
      variants={staggerContainer(0.08)}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
    >
      <motion.div variants={fadeUp}>
        <SectionLabel>{label}</SectionLabel>
      </motion.div>
      <motion.h2
        variants={fadeUp}
        className={cn(
          "mt-4 text-3xl font-medium tracking-[-0.02em] text-foreground",
          titleClassName,
        )}
      >
        {title}
      </motion.h2>
      {body && (
        <motion.p
          variants={fadeUp}
          className={cn("mt-4 text-sm leading-relaxed text-muted-foreground", bodyClassName)}
        >
          {body}
        </motion.p>
      )}
    </motion.div>
  );
}

/**
 * A 3D pin card previewing the workspace. The card tilts in perspective on
 * hover and links, in a new tab, straight into the signed-in product.
 */
function ProductPin() {
  const bars = [58, 82, 46, 90, 71];

  return (
    <div className="flex h-[30rem] w-full items-center justify-center">
      <PinContainer title="Open the workspace" href="/auth?returnTo=%2Fdashboard">
        <div className="flex w-[18rem] flex-col gap-5 p-2 sm:w-[20rem]">
          <div>
            <h3 className="text-base font-medium text-foreground">Your search, in one place</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              CV scores, matched roles, application stages and interview preparation — tracked
              together instead of scattered across tabs.
            </p>
          </div>

          <div className="flex h-24 items-end gap-2 rounded-lg border border-border bg-secondary/50 p-4">
            {bars.map((height, index) => (
              <span
                key={index}
                style={{ height: `${height}%` }}
                className="block w-full rounded-[2px] bg-foreground/80"
              />
            ))}
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
            Open the workspace
            <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover/pin:-translate-y-0.5 group-hover/pin:translate-x-0.5" />
          </span>
        </div>
      </PinContainer>
    </div>
  );
}

export default function Landing() {
  const heroRef = useRef<HTMLElement>(null);

  // The hero card drifts up slightly faster than the page, and the grid behind
  // the copy softens as it leaves. Both are transforms only, so they stay cheap.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroCardY = useTransform(scrollYProgress, [0, 1], [0, -44]);
  const heroGridOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.3]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
            <Brand />
            <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
              <NavLink href="#rag">AI &amp; RAG</NavLink>
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#how">How it works</NavLink>
              <NavLink href="#dimensions">Scoring</NavLink>
              <NavLink href="#faq">FAQ</NavLink>
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth?returnTo=%2Fdashboard">Get started</Link>
              </Button>
            </div>
          </div>
          <ScrollProgress />
        </header>

        <main>
          {/* Hero */}
          <section ref={heroRef} className="relative border-b border-border/80">
            <motion.div
              style={{ opacity: heroGridOpacity }}
              className="cp-grid pointer-events-none absolute inset-0"
              aria-hidden
            />
            <div className="relative mx-auto grid w-full max-w-6xl gap-16 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
              <motion.div
                variants={staggerContainer(0.09)}
                initial="hidden"
                animate="visible"
                className="flex flex-col justify-center gap-8"
              >
                <motion.div variants={fadeUp}>
                  <SectionLabel>CV analysis · RAG career guidance · Learning roadmaps</SectionLabel>
                </motion.div>
                <motion.h1
                  variants={fadeUp}
                  className="max-w-[26ch] text-4xl font-medium leading-[1.1] tracking-[-0.03em] text-foreground sm:text-5xl"
                >
                  Your AI Career Copilot. From CV Analysis to Career Growth.
                </motion.h1>
                <motion.p
                  variants={fadeUp}
                  className="max-w-xl text-base leading-relaxed text-muted-foreground"
                >
                  Analyze your CV, discover skill gaps, and use AI-powered insights grounded in
                  trusted learning resources to build your path toward your dream career.
                </motion.p>
                <motion.div
                  variants={fadeUp}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center"
                >
                  <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    className="inline-flex"
                  >
                    <Button asChild size="lg" className="group gap-2">
                      <Link to="/auth?returnTo=%2Fcv">
                        Analyze My CV
                        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                  </motion.div>
                  <Button asChild size="lg" variant="outline">
                    <a href="#rag">Explore AI Career Assistant</a>
                  </Button>
                </motion.div>
                <motion.p variants={fadeUp} className="text-xs text-muted-foreground">
                  PDF · DOCX — max 10 MB · Explainable ATS scoring · Prioritised fix list
                </motion.p>
              </motion.div>

              {/* Example report — the hero's 3D object. */}
              <motion.div style={{ y: heroCardY }}>
                <Tilt3DStage>
                  <motion.div
                    initial={{ opacity: 0, y: 26 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
                    className="rounded-md border border-border bg-card transition-colors duration-300 hover:border-foreground/25"
                    aria-label="Example ATS report"
                  >
                    <div className="flex items-baseline justify-between border-b border-border/80 px-6 py-4">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        Example report
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        7 dimensions
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-6 px-6 py-6">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          ATS compatibility
                        </p>
                        <p className="mt-2 text-5xl font-medium tabular-nums tracking-[-0.03em] text-foreground">
                          <CountUp to={82} />
                          <span className="text-2xl text-muted-foreground">%</span>
                        </p>
                      </div>
                      <p className="max-w-[18ch] text-xs leading-relaxed text-muted-foreground">
                        Weighted average of seven measured dimensions. Identical input always
                        returns the same score.
                      </p>
                    </div>
                    <ul className="divide-y divide-border/80 border-t border-border/80">
                      {EXAMPLE_DIMENSIONS.map((dimension, index) => (
                        <li
                          key={dimension.label}
                          className="flex items-center gap-4 px-6 py-2.5 transition-colors duration-200 hover:bg-secondary/60"
                        >
                          <span className="w-40 shrink-0 truncate text-xs text-muted-foreground">
                            {dimension.label}
                          </span>
                          <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-secondary">
                            <motion.span
                              className="block h-full rounded-full bg-foreground"
                              initial={{ width: 0 }}
                              whileInView={{ width: `${dimension.score}%` }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: 0.8,
                                delay: 0.35 + index * 0.06,
                                ease: EASE,
                              }}
                            />
                          </span>
                          <span className="w-8 shrink-0 text-right text-xs tabular-nums text-foreground">
                            {dimension.score}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-border/80 px-6 py-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        Top finding
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        Missing measurable achievements
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        5 of 19 bullets contain a number. Add measurable results to relevant project
                        or experience descriptions.
                      </p>
                    </div>
                  </motion.div>
                </Tilt3DStage>
              </motion.div>
            </div>
          </section>

          {/* RAG technology */}
          <section id="rag" className="scroll-mt-16 border-b border-border/80">
            <div className="mx-auto w-full max-w-6xl px-6 py-20">
              <SectionHeading
                label="Retrieval-augmented generation"
                title="AI That Understands Your Career"
                titleClassName="max-w-[26ch]"
                body="CareerPilot uses Retrieval-Augmented Generation (RAG) to combine your CV, target job requirements, and trusted learning resources to generate personalized, evidence-based career guidance."
                bodyClassName="max-w-3xl"
              />
              <RagWorkflow />
              <p className="mt-6 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                This workflow is a planned capability of the CareerPilot backend, shown here as an
                illustrative demonstration rather than a live feature. The screens under AI Copilot
                and Learning roadmap report the same status when you open them.
              </p>
            </div>
          </section>

          {/* Feature cards */}
          <section id="features" className="scroll-mt-16 border-b border-border/80">
            <div className="mx-auto w-full max-w-6xl px-6 py-20">
              <SectionHeading
                label="The platform"
                title="One platform for the whole career loop."
                titleClassName="max-w-[30ch]"
                body="Six capabilities that share one source of truth: your CV, your target role and a curated knowledge base. Features that are still in development are marked as previews rather than linked."
                bodyClassName="max-w-2xl"
              />
              <FeatureGrid />
            </div>
          </section>

          {/* Interactive RAG demo */}
          <section id="demo" className="scroll-mt-16 border-b border-border/80">
            <div className="mx-auto w-full max-w-6xl px-6 py-20">
              <SectionHeading
                label="A worked example"
                title="See How CareerPilot AI Works"
                titleClassName="max-w-[26ch]"
                body="Walk through a single query end to end for a candidate targeting a Junior Java Backend Developer role. This is an illustrative demonstration built from real catalog links — it does not call the backend."
                bodyClassName="max-w-3xl"
              />
              <RagDemo />
            </div>
          </section>

          {/* Journey */}
          <section id="journey" className="scroll-mt-16 border-b border-border/80">
            <div className="mx-auto w-full max-w-6xl px-6 py-20">
              <SectionHeading
                label="Your journey"
                title="Your Journey with CareerPilot"
                titleClassName="max-w-[24ch]"
                body="From the CV you are about to send to a plan you can measure — six steps, each one built on the last."
                bodyClassName="max-w-2xl"
              />
              <JourneyTimeline />
            </div>
          </section>

          {/* How it works */}
          <section id="how" className="scroll-mt-16 border-b border-border/80">
            <div className="mx-auto w-full max-w-6xl px-6 py-20">
              <SectionHeading
                label="How it works"
                title="Four steps, from a document you already have to an interview you are ready for."
                titleClassName="max-w-[34ch]"
              />
              {/* The four-step row floats as one 3D slab. Its lean stays gentle
                  (2.5°) because the visitor is here to read the copy. */}
              <Tilt3DStage
                className="mt-12"
                maxTilt={3.5}
                perspective={2000}
                depth={24}
                float={5}
                lift={18}
                hoverScale={1.006}
              >
                <motion.ol
                  variants={staggerContainer(0.08)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={VIEWPORT}
                  className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
                >
                  {STEPS.map((step, index) => (
                    <motion.li
                      key={step.title}
                      variants={fadeUp}
                      className="group flex flex-col gap-3 bg-background p-8 transition-colors duration-300 hover:bg-secondary"
                    >
                      <span className="text-xs tabular-nums text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-base font-medium text-foreground">{step.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                    </motion.li>
                  ))}
                </motion.ol>
              </Tilt3DStage>
            </div>
          </section>

          {/* Matching */}
          <section id="matching" className="scroll-mt-16 border-b border-border/80">
            <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr]">
              <div>
                <SectionHeading
                  label="Job matching — planned"
                  title="A match score you can argue with, not guess at."
                  titleClassName="max-w-[26ch]"
                  body="Planned. Every posting will be compared with your profile and your current CV across weighted dimensions, each reporting its own reasoning, so a low score always names the dimension that caused it. The Jobs screen shows a Coming Soon notice until this API ships."
                  bodyClassName="max-w-md"
                />
                <Tilt3DStage
                  className="mt-8"
                  maxTilt={4}
                  perspective={1700}
                  depth={24}
                  float={5}
                  lift={18}
                  hoverScale={1.008}
                >
                  <motion.ul
                    variants={staggerContainer(0.06, 0.1)}
                    initial="hidden"
                    whileInView="visible"
                    viewport={VIEWPORT}
                    className="flex flex-col gap-px overflow-hidden rounded-md border border-border bg-border"
                  >
                    {MATCH_WEIGHTS.map((weight) => (
                      <motion.li
                        key={weight.name}
                        variants={fadeUp}
                        className="flex items-center justify-between gap-4 bg-background px-6 py-3 transition-colors duration-300 hover:bg-secondary"
                      >
                        <span className="text-sm text-foreground">{weight.name}</span>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {weight.weight}
                        </span>
                      </motion.li>
                    ))}
                  </motion.ul>
                </Tilt3DStage>
              </div>

              <Reveal delay={0.1} className="h-fit">
                <Tilt3DStage
                  maxTilt={5}
                  perspective={1400}
                  depth={28}
                  float={6}
                  lift={18}
                  hoverScale={1.008}
                >
                  <div className="rounded-md border border-border bg-card transition-colors duration-300 hover:border-foreground/25">
                    <div className="flex items-baseline justify-between border-b border-border/80 px-6 py-4">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        Example match
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        Backend developer
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-6 px-6 py-6">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          Compatibility
                        </p>
                        <p className="mt-2 text-5xl font-medium tabular-nums tracking-[-0.03em] text-foreground">
                          <CountUp to={74} />
                          <span className="text-2xl text-muted-foreground">%</span>
                        </p>
                      </div>
                      <p className="max-w-[20ch] text-xs leading-relaxed text-muted-foreground">
                        Compatibility between your profile, your CV and this posting — never a
                        prediction of the hiring decision.
                      </p>
                    </div>
                    <div className="border-t border-border/80 px-6 py-5">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        Skills
                      </p>
                      <motion.ul
                        variants={staggerContainer(0.06, 0.2)}
                        initial="hidden"
                        whileInView="visible"
                        viewport={VIEWPORT}
                        className="mt-3 flex flex-wrap gap-1.5"
                      >
                        {["Java", "Spring Boot", "PostgreSQL"].map((skill) => (
                          <motion.li
                            key={skill}
                            variants={fadeUp}
                            className="inline-flex items-center gap-1 rounded-[3px] border border-border bg-secondary px-2 py-1 text-xs text-foreground"
                          >
                            <Check className="size-3" />
                            {skill}
                          </motion.li>
                        ))}
                        {["Docker", "Kubernetes"].map((skill) => (
                          <motion.li
                            key={skill}
                            variants={fadeUp}
                            className="rounded-[3px] border border-dashed border-border px-2 py-1 text-xs text-muted-foreground"
                          >
                            {skill}
                          </motion.li>
                        ))}
                      </motion.ul>
                      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                        Name Docker and Kubernetes in a project bullet if you have genuinely used
                        them — otherwise the score stays honest and tells you to leave them out.
                      </p>
                    </div>
                  </div>
                </Tilt3DStage>
              </Reveal>
            </div>
          </section>

          {/* Dimensions */}
          <section id="dimensions" className="scroll-mt-16 border-b border-border/80">
            <div className="mx-auto w-full max-w-6xl px-6 py-20">
              <SectionHeading
                label="The scoring model"
                title="Seven weighted dimensions, each with its own findings."
                titleClassName="max-w-[34ch]"
                body="A single opaque percentage is useless. Each dimension below is measured separately, contributes a fixed share of the total, and reports its own deductions so you always know which one to work on next."
                bodyClassName="max-w-2xl"
              />
              <motion.ul
                variants={staggerContainer(0.05)}
                initial="hidden"
                whileInView="visible"
                viewport={VIEWPORT}
                className="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-3"
              >
                {DIMENSIONS.map((dimension) => (
                  <motion.li
                    key={dimension.name}
                    variants={fadeUp}
                    className="group flex flex-col gap-2 bg-background p-6 transition-colors duration-300 hover:bg-secondary"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-sm font-medium text-foreground">{dimension.name}</h3>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {dimension.weight}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {dimension.detail}
                    </p>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </section>

          {/* Interactive workspace showcase */}
          <section id="workspace" className="scroll-mt-16 border-b border-border/80">
            <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr]">
              <SectionHeading
                label="The workspace"
                title="Put every step of the search in one place."
                titleClassName="max-w-[20ch]"
                body="Hover the card to watch it tilt in perspective. It stands in for the workspace where each CV version, matched role, application stage and preparation plan lives alongside the others."
                bodyClassName="max-w-md"
              />
              <Reveal delay={0.1}>
                <ProductPin />
              </Reveal>
            </div>
          </section>

          {/* Guarantees */}
          <section className="border-b border-border/80">
            <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <SectionHeading
                  label="What it will never do"
                  title="Honest scoring, or the score means nothing."
                  titleClassName="max-w-[24ch]"
                  body="Recommendations describe the change. They never write content you cannot defend in an interview, because a fabricated CV fails the moment someone asks about it."
                  bodyClassName="max-w-md"
                />
              </div>
              <motion.ul
                variants={staggerContainer(0.06, 0.05)}
                initial="hidden"
                whileInView="visible"
                viewport={VIEWPORT}
                className="divide-y divide-border/80 border-y border-border/80"
              >
                {GUARANTEES.map((item) => (
                  <motion.li
                    key={item}
                    variants={fadeUp}
                    className="group flex items-start gap-3 py-4 transition-colors duration-300"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-foreground transition-transform duration-300 group-hover:translate-x-0.5" />
                    <span className="text-sm leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                      {item}
                    </span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </section>

          {/* Animated statement */}
          <section className="border-b border-border/80">
            <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-24 text-center">
              <SectionLabel>Our one rule</SectionLabel>
              <TextGenerateEffect
                words="Every score is measured, every finding is explained, and nothing is invented on your behalf."
                duration={0.4}
                className="mt-6 text-2xl font-medium leading-snug tracking-[-0.02em] text-foreground sm:text-3xl"
              />
            </div>
          </section>

          {/* Students */}
          <section id="students" className="scroll-mt-16 border-b border-border/80">
            <div className="mx-auto w-full max-w-6xl px-6 py-20">
              <SectionHeading
                label="Built for students and interns"
                title="Expectations tuned to a first-job profile."
                titleClassName="max-w-[30ch]"
              />
              <motion.div
                variants={staggerContainer(0.06)}
                initial="hidden"
                whileInView="visible"
                viewport={VIEWPORT}
                className="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2 lg:grid-cols-3"
              >
                {STUDENT_POINTS.map((item) => (
                  <motion.div
                    key={item.title}
                    variants={fadeUp}
                    className="flex flex-col gap-3 bg-background p-8 transition-colors duration-300 hover:bg-secondary"
                  >
                    <h3 className="text-base font-medium text-foreground">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="scroll-mt-16 border-b border-border/80">
            <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[0.6fr_1.4fr]">
              <div>
                <SectionHeading label="FAQ" title="Questions worth asking." />
              </div>
              <Reveal delay={0.1}>
                <Accordion type="single" collapsible className="border-t border-border/80">
                  {FAQ.map((item) => (
                    <AccordionItem key={item.q} value={item.q}>
                      <AccordionTrigger className="text-sm font-medium transition-colors hover:text-foreground">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Reveal>
            </div>
          </section>

          {/* Final CTA */}
          <section>
            <Reveal className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-6 py-20 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="max-w-[28ch] text-3xl font-medium tracking-[-0.02em] text-foreground">
                  Start with the CV you are about to send.
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                  Upload once, read a score built from seven measured dimensions, and work through a
                  prioritised list of fixes. Job matching, learning roadmaps and interview preparation
                  are on the roadmap and clearly marked until their APIs ship.
                </p>
              </div>
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="inline-flex"
              >
                <Button asChild size="lg" className="group gap-2">
                  <Link to="/auth?returnTo=%2Fdashboard">
                    Create my account
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </motion.div>
            </Reveal>
          </section>
        </main>

        <footer className="border-t border-border/80">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
            <Brand />
            <p className="text-xs leading-relaxed text-muted-foreground">
              CareerPilot — deterministic CV analysis, RAG-grounded learning roadmaps, job
              matching, application tracking and interview preparation.
            </p>
            <div className="flex gap-6 text-xs text-muted-foreground">
              <Link to="/auth" className="transition-colors hover:text-foreground">
                Sign in
              </Link>
              <Link to="/dashboard" className="transition-colors hover:text-foreground">
                Dashboard
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
