module.exports = [
  {
    type: "input",
    name: "name",
    message: "Router name (kebab-case, e.g. 'billing' or 'notification'):",
    validate: (value) =>
      /^[a-z][a-z0-9-]*$/.test(value) || "Use lowercase kebab-case",
  },
];
