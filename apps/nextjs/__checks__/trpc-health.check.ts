import { ApiCheck, AssertionBuilder } from "checkly/constructs";

new ApiCheck("trpc-health-check", {
  name: "tRPC Endpoint",
  activated: true,
  request: {
    url: "https://yourdomain.com/api/trpc/user.me",
    method: "GET",
    assertions: [
      AssertionBuilder.statusCode().notEquals(500),
      AssertionBuilder.responseTime().lessThan(5000),
    ],
  },
});
