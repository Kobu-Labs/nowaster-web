import type { Meta, StoryObj } from '@storybook/react';

import { TimerComponent } from './Timer';

const meta = {
  title: 'Example/Timer',
  component: TimerComponent,
  tags: ['autodocs'],
} satisfies Meta<typeof TimerComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Timer: Story = {};

