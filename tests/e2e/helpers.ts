import path from "node:path";

import { expect, type Page } from "@playwright/test";

export const fixturePath = (name: string) => path.join(__dirname, "..", "fixtures", name);

export function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@kickstartkit.test`;
}

/** Signs up a brand-new agency user and waits for the dashboard. */
export async function signUp(page: Page, opts: { name?: string; workspace?: string } = {}) {
  const email = uniqueEmail();
  await page.goto("/signup");
  await page.getByLabel("Your name").fill(opts.name ?? "Alex Rivera");
  await page.getByLabel("Agency or studio name").fill(opts.workspace ?? "Northwind Studio");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill("kickoff2026");
  await page.getByRole("button", { name: "Start free trial" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return { email };
}

/** Creates a project through the UI and returns its URL. */
export async function createProject(
  page: Page,
  { projectName = "Brand refresh", clientName = "Acme Coffee Co.", dueDate = "" } = {},
) {
  await page.goto("/projects/new");
  await page.getByLabel("Project name").fill(projectName);
  await page.getByLabel("Client name").fill(clientName);
  if (dueDate) await page.getByLabel("Due date (optional)").fill(dueDate);
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
  return page.url();
}

export async function uploadDocument(page: Page, fixture: string) {
  await page.getByTestId("document-file-input").setInputFiles(fixturePath(fixture));
}

export function documentRow(page: Page, fileName: string) {
  return page.getByTestId("document-row").filter({ hasText: fileName });
}
