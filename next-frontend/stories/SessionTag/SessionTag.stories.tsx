import type { Meta, StoryObj } from '@storybook/react';
import { SessionTag } from './SessionTag';

const meta = {
  title: 'SessionTag',
  component: SessionTag,
  tags: ['autodocs'],
} satisfies Meta<typeof SessionTag>;


export default meta;
type Story = StoryObj<typeof meta>;


export const SimpleSessionTag: Story = {
  args: {
    color:"blue",
    value:"testing"
  }
}
