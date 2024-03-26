import type { Meta, StoryObj } from "@storybook/react";

import { LoginForm } from "@/components/visualizers/LoginForm";

const meta = {
  title: "LoginForm",
  component: LoginForm,
  tags: ["autodocs"],
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>

export const MainForm: Story = {};
