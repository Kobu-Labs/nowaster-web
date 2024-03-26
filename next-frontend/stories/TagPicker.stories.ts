import type { Meta, StoryObj } from "@storybook/react";

import { SimpleTagPicker } from "@/components/visualizers/tags/TagPicker";

const meta = {
  title: "TagPicker",
  component: SimpleTagPicker,
  tags: ["autodocs"],
} satisfies Meta<typeof SimpleTagPicker>;

export default meta;
type Story = StoryObj<typeof meta>

export const TagPickerBase: Story = {
  args: {
    onSelectedTagsChanged: console.log
  }
};
