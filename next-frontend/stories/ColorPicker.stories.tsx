import { ColorPicker } from "@/components/visualizers/ColorPicker";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "ColorPicker",
  component: ColorPicker,
  tags: ["autodocs"],
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Green: Story = {
  args: {
    onSelect: console.log,
    initialColor: "#00FF00",
  },
};

export const NoColor: Story = {
  args: {
    onSelect: console.log,
  },
};
