

import type { Meta, StoryObj } from '@storybook/react';
import { CategoryPicker } from './CategoryPicker';

const meta = {
  title: "CategoryPicker",
  component: CategoryPicker,
  tags: ["autodocs"],
} satisfies Meta<typeof CategoryPicker>;

export default meta;
type Story = StoryObj<typeof meta>;


export const Basic: Story = {
  args: {
    categories: [
      "school",
      "gym",
      "life",
      "soccer",
    ]
  }
}
export const NoCategories: Story = {
  args: {
    categories: [
    ]
  }
}
