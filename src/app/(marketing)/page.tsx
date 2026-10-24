import {
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  FileText,
  Link2,
  ListChecks,
  Lock,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLANS, TRIAL_DAYS } from "@/lib/plans";

const STEPS = [
  {
    icon: FileText,
    title: "Drop in the deal",
    body: "Upload the proposal, brief, contract, email thread, or call transcript. PDF, DOCX, TXT — or just paste it.",
  },
  {
    icon: Sparkles,
    title: "Review the AI checklist",
    body: "KickstartKit pulls out every asset, login, approval, and decision you need. You edit it before anything is sent.",
  },
  {
    icon: Link2,
    title: "Send one secure link",
    body: "Your client uploads files and answers questions — no account needed. You get an email the moment it's ready.",
  },
];

const FAQS = [
  {
    q: "Does my client need to create an account?",
    a: "No. Clients get a secure, private link that expires after 30 days. They open it on any device, upload what's needed, and they're done.",
  },
  {
    q: "Will the AI send anything to my client without me seeing it?",
    a: "Never. The AI drafts a checklist from your documents, and you review, edit, add, or remove items before you publish the link.",
  },
  {
    q: "How do you handle passwords and account access?",
    a: "We never ask clients for raw passwords. Access items collect sharing instructions, invite links, or confirmation that access was granted through the platform's own sharing tools.",
  },
  {
    q: "What kinds of documents work best?",
    a: "Anything that describes the project: proposals, briefs, contracts, email threads, and discovery-call transcripts. Messy is fine — if something's missing, we flag it instead of guessing.",
  },
  {
    q: "What happens when my free trial ends?",
    a: `Your ${TRIAL_DAYS}-day trial includes every feature. Choose a plan to keep creating projects — your existing projects and client submissions stay safe either way.`,
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
            <a
              href="#how-it-works"
              className="hidden px-3 text-sm text-muted-foreground hover:text-foreground md:block"
            >
              How it works
            </a>
            <a href="#pricing" className="hidden px-3 text-sm text-muted-foreground hover:text-foreground md:block">
              Pricing
            </a>
            <a href="#faq" className="hidden px-3 text-sm text-muted-foreground hover:text-foreground md:block">
              FAQ
            </a>
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Start free trial</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 h-[520px] bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_65%)]"
          />
          <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-14 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-24 lg:pb-28">
            <div>
              <Badge variant="info" className="mb-6">
                <Sparkles /> Client onboarding for creative agencies
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Turn a signed deal into a fully prepared project.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground">
                Send one secure link. Collect briefs, assets, approvals, and access—then start work.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row [&>*]:min-w-0">
                <Button asChild size="lg">
                  <Link href="/signup">
                    Start free trial <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {TRIAL_DAYS}-day free trial · No credit card required
              </p>
            </div>
            <HeroPreview />
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 border-y bg-muted/40">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <SectionHeading
              eyebrow="How it works"
              title="From “we're signed!” to “we're ready” in three steps"
              description="Stop chasing logos, logins, and sign-offs across email threads. KickstartKit does the follow-up for you."
            />
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="rounded-xl border bg-card p-6 shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                      <step.icon className="size-5" aria-hidden />
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Bell, text: "Polite automatic reminders every 3 days" },
                { icon: Lock, text: "Private, expiring links — never raw passwords" },
                { icon: CheckCircle2, text: "Instant “Project ready” email" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Icon className="size-4 shrink-0 text-primary" aria-hidden />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-20">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <SectionHeading
              eyebrow="Pricing"
              title="Simple pricing that pays for itself on the first project"
              description={`Every plan starts with a ${TRIAL_DAYS}-day free trial. Cancel anytime.`}
            />
            <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
              {PLANS.map((plan) => {
                const highlighted = "highlighted" in plan && plan.highlighted;
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative flex flex-col rounded-2xl border bg-card p-8 shadow-xs",
                      highlighted && "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary",
                    )}
                  >
                    {highlighted ? <Badge className="absolute -top-3 left-8">Most popular</Badge> : null}
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                    <p className="mt-6 flex items-baseline gap-1">
                      <span className="text-4xl font-semibold tracking-tight">${plan.priceMonthly}</span>
                      <span className="text-muted-foreground">/month</span>
                    </p>
                    <ul className="mt-6 grid gap-3 text-sm">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex gap-2.5">
                          <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="mt-8" variant={highlighted ? "default" : "outline"} size="lg">
                      <Link href="/signup">Start free trial</Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-t bg-muted/40">
          <div className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6">
            <SectionHeading eyebrow="FAQ" title="Questions agencies ask us" />
            <div className="mt-10 divide-y rounded-xl border bg-card">
              {FAQS.map((faq) => (
                <details key={faq.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                    {faq.q}
                    <span
                      aria-hidden
                      className="text-xl leading-none text-muted-foreground transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-muted-foreground">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              Your next kickoff can start on day one.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
              Upload your next proposal and send your client one link. We&apos;ll handle the chasing.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8">
              <Link href="/signup">
                Start free trial <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
            <a href="#pricing" className="hover:text-foreground">
              Pricing
            </a>
            <a href="#faq" className="hover:text-foreground">
              FAQ
            </a>
            <Link href="/login" className="hover:text-foreground">
              Log in
            </Link>
          </nav>
          <p>© {COPYRIGHT_YEAR} KickstartKit</p>
        </div>
      </footer>
    </div>
  );
}

// Static at build time; the landing page is fully prerendered.
const COPYRIGHT_YEAR = 2026;

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-lg text-muted-foreground">{description}</p> : null}
    </div>
  );
}

function HeroPreview() {
  const items = [
    { label: "Logo files (SVG/AI)", type: "Asset", done: true },
    { label: "Brand guidelines PDF", type: "File", done: true },
    { label: "Instagram account access", type: "Access", done: true },
    { label: "Approve homepage copy direction", type: "Approval", done: false },
    { label: "Primary contact for sign-off", type: "Info", done: false },
  ];
  const done = items.filter((item) => item.done).length;
  const pct = Math.round((done / items.length) * 100);

  return (
    <div aria-hidden className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="absolute -inset-4 rotate-2 rounded-3xl bg-primary/10" />
      <div className="relative rounded-2xl border bg-card p-6 shadow-xl shadow-primary/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Northwind Studio</p>
            <p className="mt-1 font-semibold">Acme Coffee — Brand refresh</p>
          </div>
          <Badge variant="warning">In progress</Badge>
        </div>
        <div className="mt-5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ready to start</span>
            <span className="font-medium">{pct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary/15">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <ul className="mt-5 grid gap-2">
          {items.map((item) => (
            <li
              key={item.label}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm",
                item.done ? "bg-muted/50 text-muted-foreground" : "bg-background",
              )}
            >
              {item.done ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              ) : (
                <span className="size-4 shrink-0 rounded-full border-2 border-muted-foreground/30" />
              )}
              <span className={cn("flex-1 truncate", item.done && "line-through decoration-muted-foreground/40")}>
                {item.label}
              </span>
              <span className="text-xs text-muted-foreground">{item.type}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm text-accent-foreground">
          <Upload className="size-4" />
          <span className="flex-1">Client uploaded 3 files today</span>
          <ListChecks className="size-4" />
        </div>
      </div>
    </div>
  );
}
