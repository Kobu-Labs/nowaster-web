import type { Meta, StoryObj } from "@storybook/react";

import { SessionCard } from "@/components/visualizers/categories/SessionCard";

const createMockTags = (tagLabels: string[]) => {
  return tagLabels.map((label, i) => {
    return { label, id: i.toString(), allowedCategories: [] };
  });
};

const meta = {
  title: "SessionCard",
  component: SessionCard,
  tags: ["autodocs"],
} satisfies Meta<typeof SessionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoHours: Story = {
  args: {
    session: {
      tags: createMockTags(["school", "pb138", "pb138/project", "focus"]),
      startTime: new Date(2023, 5, 27, 19, 0),
      endTime: new Date(2023, 5, 27, 21, 0),
      category: {
        name: "pb138",
        id: "pb138",
      },
      description: "Working on the project",
    },
  },
};

export const NinetyMinutes: Story = {
  args: {
    session: {
      startTime: new Date(2023, 5, 27, 19, 0),
      tags: createMockTags(["school", "pb138", "pb138/project", "focus"]),
      endTime: new Date(2023, 5, 27, 20, 30),
      category: { name: "pb138", id: "pb138" },
      description: "Working on the project",
    },
  },
};

export const HalfHour: Story = {
  args: {
    session: {
      startTime: new Date(2023, 5, 27, 20, 0),
      tags: createMockTags(["school", "pb138", "pb138/project", "focus"]),
      endTime: new Date(2023, 5, 27, 20, 30),
      category: { name: "pb138", id: "pb138" },
      description: "Working on the project",
    },
  },
};

export const NineMinutesNineSeconds: Story = {
  args: {
    session: {
      startTime: new Date(2023, 5, 27, 20, 0, 0),
      tags: createMockTags(["school", "pb138", "pb138/project", "focus"]),
      endTime: new Date(2023, 5, 27, 20, 9, 9),
      category: { name: "pb138", id: "pb138" },
      description: "Working on the project",
    },
  },
};
