import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "TagBadge",
  component: TagBadge,
  tags: ["autodocs"],
} satisfies Meta<typeof TagBadge>;


export default meta;
type Story = StoryObj<typeof meta>;


export const SimpleSessionTag: Story = {
  args: {
    value:"testing"
  }
};
