
import type { Meta, StoryObj } from "@storybook/react";
import { RegisterForm } from "@/stories/RegisterForm/RegisterForm";

const meta = {
  title: "RegisterForm",
  component: RegisterForm,
  tags: ["autodocs"],
} satisfies Meta<typeof RegisterForm>;

export default meta;
type Story = StoryObj<typeof meta>;


export const MainRegisterForm: Story = {
};
