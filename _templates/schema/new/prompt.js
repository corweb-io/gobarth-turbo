module.exports = [
  {
    type: "input",
    name: "name",
    message:
      "Table/model name (kebab-case, e.g. 'billing-plan' or 'notification'):",
    validate: (value) =>
      /^[a-z][a-z0-9-]*$/.test(value) || "Use lowercase kebab-case",
  },
];
