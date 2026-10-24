/**
 * Plan catalogue shown on the landing and billing pages. Stripe price IDs are
 * wired up in Milestone 6. Project limits are placeholders pending sign-off.
 */
export const TRIAL_DAYS = 14;

export const PLANS = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 39,
    description: "For freelancers and small studios onboarding a few clients a month.",
    activeProjectLimit: 5,
    features: [
      "Up to 5 active projects",
      "AI checklist from proposals, briefs & transcripts",
      "Secure client onboarding links",
      "Automatic polite reminders",
      "Project-ready notifications",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    priceMonthly: 99,
    description: "For agencies running several client kickoffs at once.",
    activeProjectLimit: 25,
    features: ["Up to 25 active projects", "Everything in Starter", "Larger client uploads", "Priority email support"],
    highlighted: true,
  },
] as const;

export type PlanId = (typeof PLANS)[number]["id"];
