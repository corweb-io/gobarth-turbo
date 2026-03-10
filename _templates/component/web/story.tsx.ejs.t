---
to: packages/ui-web/src/<%= h.changeCase.kebab(name) %>.stories.tsx
---
import type { Meta, StoryObj } from "@storybook/react";
import { <%= name %> } from "./<%= h.changeCase.kebab(name) %>";

const meta: Meta<typeof <%= name %>> = {
  title: "Components/<%= name %>",
  component: <%= name %>,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof <%= name %>>;

export const Default: Story = {
  args: {
    children: "<%= name %> content",
  },
};
