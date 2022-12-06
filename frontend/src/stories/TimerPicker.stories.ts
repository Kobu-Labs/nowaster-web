import type { Meta, StoryObj } from '@storybook/react';

import { TimerScheduled } from './TimerPicker';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta = {
  title: 'Timers/TimerPicker',
  component: TimerScheduled,
  tags: ['autodocs'],
} satisfies Meta<typeof TimerScheduled>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const Primary: Story = {};
