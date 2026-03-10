import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // new feature
        "fix", // bug fix
        "chore", // maintenance, deps
        "docs", // documentation only
        "style", // formatting, no logic change
        "refactor", // neither fix nor feat
        "test", // adding or updating tests
        "ci", // CI/CD changes
        "perf", // performance improvement
        "revert", // revert a previous commit
      ],
    ],
    "subject-case": [2, "always", "lower-case"],
    "subject-max-length": [2, "always", 100],
    "body-max-line-length": [2, "always", 200],
  },
};

export default config;
