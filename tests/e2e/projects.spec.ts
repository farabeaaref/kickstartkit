import { expect, test } from "@playwright/test";

import { createProject, documentRow, signUp, uploadDocument } from "./helpers";

test.describe("projects and documents", () => {
  test("create a project and see it on the dashboard", async ({ page }) => {
    await signUp(page);
    await expect(page.getByText("No projects yet")).toBeVisible();

    await page.getByRole("link", { name: "New project" }).first().click();
    await expect(page).toHaveURL(/\/projects\/new$/);

    // Validation errors
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page.getByText("Enter a project name.")).toBeVisible();
    await expect(page.getByText("Enter the client's name.")).toBeVisible();

    await createProject(page, { projectName: "Launch video", clientName: "Globex Inc.", dueDate: "2026-12-15" });
    await expect(page.getByText("Due Dec 15, 2026")).toBeVisible();
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();

    await page.goto("/dashboard");
    const card = page.getByTestId("project-card").filter({ hasText: "Launch video" });
    await expect(card).toContainText("Globex Inc.");
    await expect(card).toContainText("0%");
    await card.click();
    await expect(page.getByRole("heading", { name: "Launch video" })).toBeVisible();
  });

  test("upload PDF, DOCX and TXT documents and extract their text", async ({ page }) => {
    await signUp(page);
    await createProject(page);

    await uploadDocument(page, "short-proposal.pdf");
    await expect(page.getByText("short-proposal.pdf is ready.")).toBeVisible();
    const pdfRow = documentRow(page, "short-proposal.pdf");
    await expect(pdfRow.getByTestId("extraction-status")).toHaveText("Extracted");
    await pdfRow.getByText("View extracted text").click();
    await expect(pdfRow).toContainText("access to the Instagram account");

    await uploadDocument(page, "project-brief.docx");
    await expect(documentRow(page, "project-brief.docx").getByTestId("extraction-status")).toHaveText("Extracted");

    await uploadDocument(page, "discovery-call.txt");
    await expect(documentRow(page, "discovery-call.txt").getByTestId("extraction-status")).toHaveText("Extracted");

    await expect(page.getByText("3 documents ready for the checklist.")).toBeVisible();
  });

  test("paste raw text", async ({ page }) => {
    await signUp(page);
    await createProject(page);

    await page.getByRole("tab", { name: "Paste text" }).click();
    await page.getByRole("button", { name: "Save text" }).click();
    // Native validation blocks empty submit; short text is rejected by the server.
    await page.getByLabel("Paste the document text").fill("Too short");
    await page.getByLabel("Paste the document text").evaluate((el) => el.removeAttribute("minlength"));
    await page.getByRole("button", { name: "Save text" }).click();
    await expect(page.getByText("Paste a bit more")).toBeVisible();

    await page
      .getByLabel("Paste the document text")
      .fill("Hi team — we need the logo files, brand fonts, and an invite to our Shopify store before kickoff.");
    await page.getByRole("button", { name: "Save text" }).click();
    await expect(page.getByText("Text saved.")).toBeVisible();
    await expect(documentRow(page, "Pasted text").getByTestId("extraction-status")).toHaveText("Extracted");
    await expect(page.getByLabel("Paste the document text")).toHaveValue("");
  });

  test("rejects malicious and unreadable uploads", async ({ page }) => {
    await signUp(page);
    await createProject(page);

    // Executable renamed to .pdf: rejected by content check, file removed, no retry.
    await uploadDocument(page, "malicious-renamed.pdf");
    const bad = documentRow(page, "malicious-renamed.pdf");
    await expect(bad.getByTestId("extraction-status")).toHaveText("Failed");
    await expect(bad).toContainText("isn't a valid PDF");
    await expect(bad.getByRole("button", { name: "Try again" })).toHaveCount(0);

    // Wrong extension is refused before upload.
    await page.getByTestId("document-file-input").setInputFiles({
      name: "invoice.exe",
      mimeType: "application/x-msdownload",
      buffer: Buffer.from("MZ"),
    });
    await expect(page.getByText("Upload a PDF, DOCX, or TXT file.")).toBeVisible();

    // Scanned PDF without text: failed with guidance.
    await uploadDocument(page, "scanned-no-text.pdf");
    await expect(documentRow(page, "scanned-no-text.pdf")).toContainText("may be a scanned image");

    // Delete a failed document.
    page.once("dialog", (dialog) => dialog.accept());
    await bad.getByRole("button", { name: "Delete malicious-renamed.pdf" }).click();
    await expect(documentRow(page, "malicious-renamed.pdf")).toHaveCount(0);
  });

  test("projects are private to their workspace", async ({ browser }) => {
    const alice = await browser.newPage();
    await signUp(alice, { name: "Alice", workspace: "Alice Studio" });
    const projectUrl = await createProject(alice, { projectName: "Secret project" });

    const bob = await browser.newPage();
    await signUp(bob, { name: "Bob", workspace: "Bob Films" });
    await bob.goto(projectUrl);
    await expect(bob.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await bob.goto("/dashboard");
    await expect(bob.getByText("Secret project")).toHaveCount(0);

    await bob.goto("/projects/not-a-uuid");
    await expect(bob.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });
});
