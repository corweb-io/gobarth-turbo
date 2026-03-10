import { defineConfig } from "checkly";
import { EmailAlertChannel, Frequency } from "checkly/constructs";

const emailAlert = new EmailAlertChannel("email-alert", {
  address: "your@email.com",
  sendRecovery: true,
  sendFailure: true,
  sendDegraded: true,
});

export default defineConfig({
  projectName: "my-app",
  logicalId: "my-app-monitoring",
  repoUrl: "https://github.com/yourorg/my-app",
  checks: {
    frequency: Frequency.EVERY_1M,
    locations: ["eu-west-1", "us-east-1"],
    tags: ["production"],
    alertChannels: [emailAlert],
    checkMatch: "**/__checks__/**/*.check.ts",
    browserChecks: {
      testMatch: "**/__checks__/**/*.spec.ts",
    },
  },
  cli: {
    runLocation: "eu-west-1",
  },
});
