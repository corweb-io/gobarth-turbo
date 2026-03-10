import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./card";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    padding: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    padding: true,
    children: "Card content goes here",
  },
};

export const NoPadding: Story = {
  args: {
    padding: false,
    children: "Card without padding",
  },
};
