import type { Meta, StoryObj } from "@storybook/react";

import { TagBadge } from "@/components/visualizers/tags/TagBadge";

const meta = {
  title: "TagBadge",
  component: TagBadge,
  tags: ["autodocs"],
} satisfies Meta<typeof TagBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SimpleSessionTag: Story = {
  args: {
    value: "testing",
    variant: "manual",
  },
};
