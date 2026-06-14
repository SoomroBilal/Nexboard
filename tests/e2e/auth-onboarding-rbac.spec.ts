import { expect, test } from "@playwright/test";

test("anonymous user is redirected from dashboard to sign in", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth\/signin/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("signup page supports workspace onboarding step", async ({ page }) => {
  await page.goto("/auth/signup");
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();

  await page.getByLabel("Your Full Name").fill("E2E Candidate");
  await page.getByLabel("Work Email").fill("candidate.nexboard@example.com");
  await page.getByLabel("Password").fill("pass1234");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Name your company" })).toBeVisible();
  await expect(page.getByLabel("Company Name")).toBeVisible();
});
