import type { Meta, StoryObj } from "@storybook/react";
import { subDays } from "date-fns";

import { SessionStreakCalendar } from "@/components/visualizers/charts/SessionStreakCalendar";

const meta = {
  title: "SessionStreakCalendar",
  component: SessionStreakCalendar,
  tags: ["autodocs"],
} satisfies Meta<typeof SessionStreakCalendar>;

export default meta;
type Story = StoryObj<typeof meta>

function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

export const GuaranteedStreaks: Story = {
  args: {
    sessionsDates: [
      new Date(2023, 6, 20, 11, 30),
      new Date(2023, 6, 20, 15, 30),
      new Date(2023, 6, 20, 20, 45),
      new Date(2023, 6, 22, 11, 30),
      new Date(2023, 6, 25, 11, 30),
      new Date(2023, 6, 29, 15, 17),
      new Date(2023, 7, 2, 11, 30),
      new Date(2023, 7, 2, 14, 30),
      new Date(2023, 7, 3, 20, 30),
      new Date(2023, 7, 1, 20, 30),
      new Date(2023, 7, 6, 20, 30),
      new Date(2023, 7, 5, 0, 30),
    ],
  },
};

export const RandomDates: Story = {
  args: {
    sessionsDates: new Array(70)
      .fill(0)
      .map((_x) => randomDate(subDays(new Date(), 100), new Date())),
  },
};
