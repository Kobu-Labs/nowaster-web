import { ScheduledSessionWithId } from "@/api/definitions";
import { SessionTimelineUiProvider } from "@/components/ui-providers/session/SessionTimelineUiProvider";
import { randomColor } from "@/lib/utils";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { subDays, subHours } from "date-fns";
import { RecoilRoot } from "recoil";

const sessionTimelineMeta = {
  title: "SessionTimeline",
  component: SessionTimelineUiProvider,
  tags: ["autodocs"],
} satisfies Meta<typeof SessionTimelineUiProvider>;

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
    startTime: new Date(2025, 3, 26, 19, 0),
    endTime: new Date(2025, 3, 26, 21, 0),
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
    startTime: new Date(2025, 3, 26, 8, 0),
    endTime: new Date(2025, 3, 26, 9, 30),
    category: {
      color: randomColor(),
      name: "pb138",
      id: "pb138",
    },
    description: "Working on the project",
  },
  {
    id: "33",
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
    startTime: subHours(new Date(), 2),
    endTime: new Date(),
    category: { name: "pb138", id: "pb138", color: randomColor() },
    description: "Working on the project",
    session_type: "fixed",
  },
  {
    id: "3",
    tags: createMockTags([
      "school",
      "pb138",
      "pb138/project",
      "focus",
      "testing",
    ]),
    startTime: new Date(2025, 3, 26, 21, 0),
    endTime: new Date(2025, 3, 26, 22, 0),
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

    startTime: new Date(2025, 3, 26, 15, 0),
    endTime: new Date(2025, 3, 26, 16, 0),
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
    startTime: new Date(2025, 3, 26, 19, 0),
    endTime: new Date(2025, 3, 26, 21, 0),
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
    startTime: new Date(2025, 3, 27, 19, 0),
    endTime: new Date(2025, 3, 27, 21, 0),
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
    startTime: new Date(2025, 3, 27, 8, 0),
    endTime: new Date(2025, 3, 27, 9, 30),
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
    startTime: new Date(2025, 3, 27, 9, 45),
    endTime: new Date(2025, 3, 27, 10, 45),
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
    startTime: new Date(2025, 3, 27, 21, 0),
    endTime: new Date(2025, 3, 27, 22, 0),
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

    startTime: new Date(2025, 3, 27, 15, 0),
    endTime: new Date(2025, 3, 27, 16, 0),
    category: { name: "pb138", id: "pb138", color: randomColor() },
    description: "Working on the project",
  },
];

export default sessionTimelineMeta;
type Story = StoryObj<typeof sessionTimelineMeta>;

export const Basic: Story = {
  args: {
    startDate: subDays(new Date(), 4),
    endDate: new Date(),
    sessions: sessionsPastTwoDays,
    onSessionsChange: console.log,
  },
  render: (props) => {
    const queryClient = new QueryClient();
    return (
      <QueryClientProvider client={queryClient}>
        <RecoilRoot>
          <SessionTimelineUiProvider {...props} />
        </RecoilRoot>
      </QueryClientProvider>
    );
  },
};
