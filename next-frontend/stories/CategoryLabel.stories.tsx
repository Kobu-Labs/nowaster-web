import { CategoryLabel } from "@/components/visualizers/categories/CategoryLabel";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "CategoryLabel",
  component: CategoryLabel,
  tags: ["autodocs"],
} satisfies Meta<typeof CategoryLabel>;

export default meta;
type Story = StoryObj<typeof meta>;


export const Basic: Story = {
  args: {
    label: "algo"
  }
};
