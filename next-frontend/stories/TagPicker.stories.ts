import { TagPicker } from "@/components/visualizers/tags/TagPicker";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "TagPicker",
  component: TagPicker,
  tags: ["autodocs"],
} satisfies Meta<typeof TagPicker>;


export default meta;
type Story = StoryObj<typeof meta>;


export const TagPickerBase: Story = {
};
