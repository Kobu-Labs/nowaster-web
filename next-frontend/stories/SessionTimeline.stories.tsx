import { ScheduledSessionWithId } from "@/api/definitions";
import { SessionTimeline } from "@/components/visualizers/SessionTimeline2";
import { randomColor } from "@/lib/utils";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { RecoilRoot } from "recoil";

const sessionTimelineMeta = {
  title: "SessionTimeline",
  component: SessionTimeline,
  tags: ["autodocs"],
} satisfies Meta<typeof SessionTimeline>;

const createMockTags = (tagLabels: string[]) => {
  return tagLabels.map((label, i) => {
    return {
      color: randomColor(),
      label,
      id: i.toString(),
      allowedCategories: [],
    };
  });
};

const sessionsPastTwoDays: ScheduledSessionWithId[] = [
  {
    id: "1",
    session_type: "fixed",
    tags: createMockTags([
      "school",
      "pb138",
      "pb138/project",
      "focus",
      "testing",
    ]),
    startTime: new Date(2023, 5, 26, 19, 0),
    endTime: new Date(2023, 5, 26, 21, 0),
    category: {
      color: randomColor(),
      name: "pb138",
      id: "pb138",
    },
    description: "Working on the project",
  },
  {
    session_type: "fixed",
    id: "2",
    tags: createMockTags([
      "school",
      "pb138",
      "pb138/project",
      "focus",
      "testing",
    ]),
    startTime: new Date(2023, 5, 26, 8, 0),
    endTime: new Date(2023, 5, 26, 9, 30),
    category: {
      color: randomColor(),
      name: "pb138",
      id: "pb138",
    },
    description: "Working on the project",
  },
  {
    id: "3",
    tags: ["school", "pb138", "pb138/project", "focus", "testing"].map(
      (label, i) => {
        return {
          color: randomColor(),
          label,
          id: i.toString(),
          allowedCategories: [],
        };
      },
    ),
    startTime: new Date(2023, 5, 26, 9, 45),
    endTime: new Date(2023, 5, 26, 10, 45),
    category: { name: "pb138", id: "pb138", color: randomColor() },
    description: "Working on the project",
    session_type: "fixed",
  },
  {
    id: "4",
    tags: createMockTags([
      "school",
      "pb138",
      "pb138/project",
      "focus",
      "testing",
    ]),
    startTime: new Date(2023, 5, 26, 21, 0),
    endTime: new Date(2023, 5, 26, 22, 0),
    category: { color: randomColor(), name: "pb138", id: "pb138" },
    description: "Working on the project",
    session_type: "fixed",
  },
  {
    id: "5",
    session_type: "fixed",
    tags: createMockTags([
      "school",
      "pb138",
      "pb138/project",
      "focus",
      "testing",
    ]),

    startTime: new Date(2023, 5, 26, 15, 0),
    endTime: new Date(2023, 5, 26, 16, 0),
    category: { name: "pb138", id: "pb138", color: randomColor() },
    description: "Working on the project",
  },
  {
    id: "6",
    tags: createMockTags([
      "school",
      "pb138",
      "pb138/project",
      "focus",
      "testing",
    ]),
    startTime: new Date(2023, 5, 26, 19, 0),
    endTime: new Date(2023, 5, 26, 21, 0),
    category: { name: "pb138", id: "pb138", color: randomColor() },
    description: "Working on the project",
    session_type: "fixed",
  },
  {
    id: "7",
    tags: createMockTags([
      "school",
      "pb138",
      "pb138/project",
      "focus",
      "testing",
    ]),
    startTime: new Date(2023, 5, 27, 19, 0),
    endTime: new Date(2023, 5, 27, 21, 0),
    category: { name: "pb138", id: "pb138", color: randomColor() },
    description: "Working on the project",
    session_type: "fixed",
  },
  {
    session_type: "fixed",
    id: "8",
    tags: createMockTags([
      "school",
      "pb138",
      "pb138/project",
      "focus",
      "testing",
    ]),
    startTime: new Date(2023, 5, 27, 8, 0),
    endTime: new Date(2023, 5, 27, 9, 30),
    category: {
      color: randomColor(),
      name: "pb138",
      id: "pb138",
    },
    description: "Working on the project",
  },
  {
    id: "9",
    tags: ["school", "pb138", "pb138/project", "focus", "testing"].map(
      (label, i) => {
        return {
          color: randomColor(),
          label,
          id: i.toString(),
          allowedCategories: [],
        };
      },
    ),
    startTime: new Date(2023, 5, 27, 9, 45),
    endTime: new Date(2023, 5, 27, 10, 45),
    category: { name: "pb138", id: "pb138", color: randomColor() },
    description: "Working on the project",
    session_type: "fixed",
  },
  {
    id: "10",
    tags: createMockTags([
      "school",
      "pb138",
      "pb138/project",
      "focus",
      "testing",
    ]),
    startTime: new Date(2023, 5, 27, 21, 0),
    endTime: new Date(2023, 5, 27, 22, 0),
    category: { color: randomColor(), name: "pb138", id: "pb138" },
    description: "Working on the project",
    session_type: "fixed",
  },
  {
    id: "11",
    session_type: "fixed",
    tags: createMockTags([
      "school",
      "pb138",
      "pb138/project",
      "focus",
      "testing",
    ]),

    startTime: new Date(2023, 5, 27, 15, 0),
    endTime: new Date(2023, 5, 27, 16, 0),
    category: { name: "pb138", id: "pb138", color: randomColor() },
    description: "Working on the project",
  },
  {
    id: "12",
    session_type: "fixed",
    tags: createMockTags([
      "school",
      "pb138",
      "pb138/project",
      "focus",
      "testing",
    ]),
    startTime: new Date(2023, 6, 1),
    endTime: new Date(2023, 6, 2),
    category: { name: "pb138", id: "pb138", color: "red" },
    description: "Working on the project",
  },
];

const sessions: ScheduledSessionWithId[] = [
  {
    id: "1",
    session_type: "fixed",
    tags: createMockTags([
      "school",
      "pb138",
      "pb138/project",
      "focus",
      "testing",
    ]),
    startTime: new Date(2023, 5, 28, 19, 0),
    endTime: new Date(2023, 5, 28, 21, 0),
    category: {
      color: randomColor(),
      name: "pb138",
      id: "pb138",
    },
    description: "Working on the project",
  },
  {
    session_type: "fixed",
    id: "2",
    tags: createMockTags([
      "school",
      "pb138",
      "pb138/project",
      "focus",
      "testing",
    ]),
    startTime: new Date(2023, 5, 28, 8, 0),
    endTime: new Date(2023, 5, 28, 9, 30),
    category: {
      color: randomColor(),
      name: "pb138",
      id: "pb138",
    },
    description: "Working on the project",
  },
  {
    id: "3",
    tags: ["school", "pb138", "pb138/project", "focus", "testing"].map(
      (label, i) => {
        return {
          color: randomColor(),
          label,
          id: i.toString(),
          allowedCategories: [],
        };
      },
    ),
    startTime: new Date(2023, 5, 28, 9, 45),
    endTime: new Date(2023, 5, 28, 10, 45),
    category: { name: "pb138", id: "pb138", color: randomColor() },
    description: "Working on the project",
    session_type: "fixed",
  },
  {
    id: "4",
    tags: createMockTags([
      "school",
      "pb138",
      "pb138/project",
      "focus",
      "testing",
    ]),
    startTime: new Date(2023, 5, 28, 21, 0),
    endTime: new Date(2023, 5, 28, 22, 0),
    category: { color: randomColor(), name: "pb138", id: "pb138" },
    description: "Working on the project",
    session_type: "fixed",
  },
  {
    id: "5",
    session_type: "fixed",
    tags: createMockTags([
      "school",
      "pb138",
      "pb138/project",
      "focus",
      "testing",
    ]),

    startTime: new Date(2023, 5, 28, 15, 0),
    endTime: new Date(2023, 5, 28, 16, 0),
    category: { name: "pb138", id: "pb138", color: randomColor() },
    description: "Working on the project",
  },
  {
    id: "6",
    tags: createMockTags([
      "school",
      "pb138",
      "pb138/project",
      "focus",
      "testing",
    ]),
    startTime: new Date(2023, 5, 28, 19, 0),
    endTime: new Date(2023, 5, 28, 21, 0),
    category: { name: "pb138", id: "pb138", color: randomColor() },
    description: "Working on the project",
    session_type: "fixed",
  },
];

export default sessionTimelineMeta;
type Story = StoryObj<typeof sessionTimelineMeta>;

export const Basic: Story = {
  args: {
    startDate: subDays(new Date(), 1),
    endDate: new Date(),
    activities: sessionsPastTwoDays,
    onActivitiesChange: () => {},
  },
  render: (props) => {
    const queryClient = new QueryClient();
    return (
      <QueryClientProvider client={queryClient}>
        <RecoilRoot>
          <SessionTimeline {...props} />
        </RecoilRoot>
      </QueryClientProvider>
    );
  },
};
