import { CategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "CategoryPicker",
  component: CategoryPicker,
  tags: ["autodocs"],
} satisfies Meta<typeof CategoryPicker>;

export default meta;
type Story = StoryObj<typeof meta>;


export const Basic: Story = {
  args: {
  }
};
export const NoCategories: Story = {
  args: {
  }
};
