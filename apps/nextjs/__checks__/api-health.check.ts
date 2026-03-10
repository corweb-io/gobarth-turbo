import { ApiCheck, AssertionBuilder } from "checkly/constructs";

new ApiCheck("api-health-check", {
  name: "API Health",
  activated: true,
  request: {
    url: "https://yourdomain.com/api/health",
    method: "GET",
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.jsonBody("$.status").equals("ok"),
      AssertionBuilder.responseTime().lessThan(3000),
    ],
  },
});
