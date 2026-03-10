module.exports = [
  {
    type: "input",
    name: "name",
    message: "Package name (without @my-app/ prefix):",
    validate: (value) =>
      /^[a-z][a-z0-9-]*$/.test(value) || "Use lowercase kebab-case",
  },
];
