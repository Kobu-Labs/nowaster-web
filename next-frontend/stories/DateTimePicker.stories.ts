import type { Meta, StoryObj } from "@storybook/react";

import { DateTimePicker } from "@/components/visualizers/DateTimePicker";

const meta = {
  title: "DateTimePicker",
  component: DateTimePicker,
  tags: ["autodocs"],
} satisfies Meta<typeof DateTimePicker>;

export default meta;
type Story = StoryObj<typeof meta>

export const MainForm: Story = {
  args: {
    selected: new Date(),
    onSelect: console.log,
  },
};
