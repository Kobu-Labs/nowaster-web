import type { Meta, StoryObj } from '@storybook/react';

import { TimerRecorded } from './Timer';

const meta = {
  title: 'Timers/Timer',
  component: TimerRecorded,
  tags: ['autodocs'],
} satisfies Meta<typeof TimerRecorded>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Timer: Story = {};

