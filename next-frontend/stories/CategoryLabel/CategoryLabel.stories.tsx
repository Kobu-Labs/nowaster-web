import type { Meta, StoryObj } from "@storybook/react";
import { CategoryLabel } from "@/stories/CategoryLabel/CategoryLabel";

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
