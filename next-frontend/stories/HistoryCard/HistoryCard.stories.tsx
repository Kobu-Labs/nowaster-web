import type { Meta, StoryObj } from "@storybook/react";
import { HistoryCard } from "@/stories/HistoryCard/HistoryCard";

const meta = {
  title: "HistoryCard",
  component: HistoryCard,
  tags: ["autodocs"],
} satisfies Meta<typeof HistoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;


export const TwoHours: Story = {
  args: {
    session: {
      userId: "19i42894294",
      tags: ["school", "pb138", "pb138/project", "focus"].map(label => { return { label, id: "" }; }),
      startTime: new Date(2023, 5, 27, 19, 0),
      endTime: new Date(2023, 5, 27, 21, 0),
      category: "pb138",
      description: "Working on the project",
    }
  }
};

export const NinetyMinutes: Story = {
  args: {
    session: {
      userId: "19i42894294",
      tags: ["school", "pb138", "pb138/project", "focus"].map(label => { return { label, id: "" }; }),
      startTime: new Date(2023, 5, 27, 19, 0),
      endTime: new Date(2023, 5, 27, 20, 30),
      category: "pb138",
      description: "Working on the project",
    }
  }
};


export const HalfHour: Story = {
  args: {
    session: {
      userId: "19i42894294",
      tags: ["school", "pb138", "pb138/project", "focus"].map(label => { return { label, id: "" }; }),
      startTime: new Date(2023, 5, 27, 20, 0),
      endTime: new Date(2023, 5, 27, 20, 30),
      category: "pb138",
      description: "Working on the project",
    }
  }
};


export const NineMinutesNineSeconds: Story = {
  args: {
    session: {
      userId: "19i42894294",
      tags: ["school", "pb138", "pb138/project", "focus"].map(label => { return { label, id: "" }; }),
      startTime: new Date(2023, 5, 27, 20, 0, 0),
      endTime: new Date(2023, 5, 27, 20, 9, 9),
      category: "pb138",
      description: "Working on the project",
    }
  }
};
