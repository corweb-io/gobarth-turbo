import { describe, expect, it } from "vitest";
import { createUserSchema } from "./index";

describe("createUserSchema", () => {
  it("accepts a valid user", () => {
    const result = createUserSchema.safeParse({
      email: "alice@example.com",
      name: "Alice",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("alice@example.com");
      expect(result.data.name).toBe("Alice");
    }
  });

  it("rejects missing email", () => {
    const result = createUserSchema.safeParse({ name: "Alice" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = createUserSchema.safeParse({
      email: "not-an-email",
      name: "Alice",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = createUserSchema.safeParse({
      email: "alice@example.com",
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = createUserSchema.safeParse({
      email: "alice@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("strips unknown properties", () => {
    const result = createUserSchema.safeParse({
      email: "alice@example.com",
      name: "Alice",
      role: "admin",
    });
    expect(result.success).toBe(true);
  });
});
