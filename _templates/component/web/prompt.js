module.exports = [
  {
    type: "input",
    name: "name",
    message: "Component name (PascalCase, e.g. 'Dialog' or 'Tooltip'):",
    validate: (value) => /^[A-Z][a-zA-Z0-9]*$/.test(value) || "Use PascalCase",
  },
];
