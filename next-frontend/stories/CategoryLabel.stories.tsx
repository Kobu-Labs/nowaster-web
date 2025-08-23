import type { Meta, StoryObj } from "@storybook/react";

import { CategoryLabel } from "@/components/visualizers/categories/CategoryLabel";

const meta = {
  title: "CategoryLabel",
  component: CategoryLabel,
  tags: ["autodocs"],
} satisfies Meta<typeof CategoryLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    category: {
      last_used_at: new Date(),
      name: "Category",
      id: "123e4567-e89b-12d3-a456-426614174000",
      color: "#0f0f0f",
    },
  },
};
