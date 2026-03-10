import { createUserSchema } from "@my-app/validators";
import { describe, expect, it } from "vitest";

describe("createUserSchema", () => {
  it("validates a correct user", () => {
    const result = createUserSchema.safeParse({
      email: "test@example.com",
      name: "Test User",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = createUserSchema.safeParse({
      email: "not-an-email",
      name: "Test User",
    });
    expect(result.success).toBe(false);
  });
});
