import type { Meta, StoryObj } from '@storybook/react';
import { ScheduledSessionCreationForm } from './ScheduledSessionCreationForm';

const meta = {
  title: 'ScheduledSessionCreationForm',
  component: ScheduledSessionCreationForm,
  tags: ['autodocs'],
} satisfies Meta<typeof ScheduledSessionCreationForm>;

export default meta;
type Story = StoryObj<typeof meta>;


export const MainForm: Story = {
}
