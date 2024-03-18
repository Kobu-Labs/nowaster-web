import type { Meta, StoryObj } from "@storybook/react"

import { TagPicker } from "@/components/visualizers/tags/TagPicker"

const meta = {
  title: "TagPicker",
  component: TagPicker,
  tags: ["autodocs"],
} satisfies Meta<typeof TagPicker>

export default meta
type Story = StoryObj<typeof meta>

export const TagPickerBase: Story = {}
