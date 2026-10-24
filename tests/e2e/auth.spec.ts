import { expect, test } from "@playwright/test";

/**
 * Requires local Supabase (`npm run db:start`) with email confirmations
 * disabled (the default in supabase/config.toml).
 */
function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@kickstartkit.test`;
}

test.describe("authentication", () => {
  test("landing page shows the core promise and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Turn a signed deal into a fully prepared project.",
    );
    await page.getByRole("link", { name: "Start free trial" }).first().click();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("protected routes redirect to login and preserve next", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login\?next=%2Fsettings$/);
  });

  test("signup creates a workspace, then sign out and log back in", async ({ page }) => {
    const email = uniqueEmail();
    const password = "kickoff2026";

    await page.goto("/signup");
    await page.getByLabel("Your name").fill("Alex Rivera");
    await page.getByLabel("Agency or studio name").fill("Northwind Studio");
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Start free trial" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Welcome, Alex" })).toBeVisible();
    await expect(page.getByText("Northwind Studio ·")).toBeVisible();

    // Workspace + profile were created by the signup trigger.
    await page.goto("/settings");
    await expect(page.getByLabel("Workspace name")).toHaveValue("Northwind Studio");
    await expect(page.getByTestId("account-email")).toHaveText(email);

    // Signed-in users skip the auth pages.
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("shows validation and credential errors", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: "Start free trial" }).click();
    await expect(page.getByText("Enter your name.")).toBeVisible();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();

    await page.goto("/login");
    await page.getByLabel("Email").fill(uniqueEmail());
    await page.getByLabel("Password").fill("wrongpass1");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("That email and password don't match.", { exact: false })).toBeVisible();
  });

  test("settings updates profile and workspace name", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Your name").fill("Sam Lee");
    await page.getByLabel("Agency or studio name").fill("Old Name Co");
    await page.getByLabel("Work email").fill(uniqueEmail());
    await page.getByLabel("Password").fill("kickoff2026");
    await page.getByRole("button", { name: "Start free trial" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/settings");
    await page.getByLabel("Workspace name").fill("New Name Studio");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Changes saved.")).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Workspace name")).toHaveValue("New Name Studio");
  });
});
