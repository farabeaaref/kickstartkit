import { describe, expect, it } from "vitest";

import { friendlyAuthError, loginSchema, signUpSchema } from "@/lib/validation/auth";
import { settingsSchema } from "@/lib/validation/settings";

const validSignUp = {
  fullName: "Alex Rivera",
  workspaceName: "Northwind Studio",
  email: "Alex@Studio.com ",
  password: "kickoff2026",
};

describe("signUpSchema", () => {
  it("accepts valid input and normalises email", () => {
    const result = signUpSchema.parse(validSignUp);
    expect(result.email).toBe("alex@studio.com");
  });

  it("trims names", () => {
    const result = signUpSchema.parse({ ...validSignUp, fullName: "  Alex  " });
    expect(result.fullName).toBe("Alex");
  });

  it.each([
    ["fullName", "   "],
    ["workspaceName", ""],
    ["workspaceName", "x".repeat(121)],
    ["email", "not-an-email"],
    ["password", "short1"],
    ["password", "onlyletters"],
    ["password", "12345678"],
    ["password", "a1".repeat(40)],
  ] as const)("rejects invalid %s (%j)", (field, value) => {
    const result = signUpSchema.safeParse({ ...validSignUp, [field]: value });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path[0]).toBe(field);
  });
});

describe("loginSchema", () => {
  it("requires email and password", () => {
    expect(loginSchema.safeParse({ email: "", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });
});

describe("settingsSchema", () => {
  it("rejects blank names", () => {
    expect(settingsSchema.safeParse({ fullName: " ", workspaceName: "W" }).success).toBe(false);
    expect(settingsSchema.safeParse({ fullName: "A", workspaceName: "W" }).success).toBe(true);
  });
});

describe("friendlyAuthError", () => {
  it("maps known Supabase errors without leaking internals", () => {
    expect(friendlyAuthError({ code: "invalid_credentials" })).toMatch(/don't match/);
    expect(friendlyAuthError({ message: "User already registered" })).toMatch(/already exists/);
    expect(friendlyAuthError({ code: "over_email_send_rate_limit" })).toMatch(/Too many/);
    expect(friendlyAuthError({ message: 'relation "x" does not exist' })).toBe(
      "Something went wrong. Please try again.",
    );
    expect(friendlyAuthError(null)).toBe("Something went wrong. Please try again.");
  });
});
