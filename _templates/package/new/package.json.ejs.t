---
to: packages/<%= name %>/package.json
---
{
  "name": "@my-app/<%= name %>",
  "version": "0.1.0",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {},
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
