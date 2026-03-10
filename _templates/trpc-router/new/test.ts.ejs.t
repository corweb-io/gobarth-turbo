---
to: packages/api/src/routers/<%= name %>.test.ts
---
import { describe, it, expect } from "vitest";

describe("<%= h.changeCase.camel(name) %>Router", () => {
  it.todo("list returns items");
  it.todo("byId returns a single item");
  it.todo("create adds a new item");
});
