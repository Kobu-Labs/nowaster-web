import type { Meta, StoryObj } from "@storybook/react";
import { RecoilRoot } from "recoil";

import { SessionBaseAreaChartUiProvider } from "@/components/ui-providers/SessionBaseAreaChartUiProvider";

const meta = {
  title: "OverviewAreaChartVisualizer",
  component: SessionBaseAreaChartUiProvider,
  tags: ["autodocs"],
} satisfies Meta<typeof SessionBaseAreaChartUiProvider>;

const createMockTags = (tagLabels: string[]) => {
  return tagLabels.map((label, i) => {
    return { label, id: i.toString(), allowedCategories: [] };
  });
};

export default meta;
type Story = StoryObj<typeof meta>
export const Weekly: Story = {
  render: (data) => {
    return (
      <RecoilRoot>
        <SessionBaseAreaChartUiProvider {...data} />
      </RecoilRoot>
    );
  },
  args: {
    groupingOpts: {
      granularity: "days-in-month",
      allKeys: true,
      sessionKey: (session) => session.tags.map((tag) => tag.label),
    },
    data: [
      {
        tags: createMockTags(["school", "pb138", "pb138/project", "focus", "testing"]),
        startTime: new Date(2023, 5, 28, 19, 0),
        endTime: new Date(2023, 5, 28, 21, 0),
        category: { name: "pb138" },
        description: "Working on the project",
      },
      {
        tags: createMockTags(["school", "pb138", "pb138/project", "focus", "testing"]),
        startTime: new Date(2023, 5, 29, 19, 0),
        endTime: new Date(2023, 5, 29, 21, 0),
        category: { name: "pb138" },
        description: "Working on the project",
      },
      {
        tags: ["school", "pb138", "pb138/project", "focus", "testing"].map(
          (label, i) => {
            return { label, id: i.toString(), allowedCategories: [] };
          }
        ),
        startTime: new Date(2023, 5, 27, 19, 0),
        endTime: new Date(2023, 5, 27, 21, 0),
        category: { name: "pb138" },
        description: "Working on the project",
      },
      {
        tags: createMockTags(["school", "pb138", "pb138/project", "focus", "testing"]),
        startTime: new Date(2023, 5, 30, 19, 0),
        endTime: new Date(2023, 5, 30, 21, 0),
        category: { name: "pb138" },
        description: "Working on the project",
      },
      {
        tags: createMockTags(["school", "pb138", "pb138/project", "focus", "testing"]),
        startTime: new Date(2023, 5, 4, 19, 0),
        endTime: new Date(2023, 5, 4, 21, 0),
        category: { name: "pb138" },
        description: "Working on the project",
      },
      {
        tags: createMockTags(["school", "pb138", "pb138/project", "focus", "testing"]),
        startTime: new Date(2023, 5, 27, 19, 0),
        endTime: new Date(2023, 5, 27, 21, 0),
        category: { name: "pb138" },
        description: "Working on the project",
      },
    ],
  },
};

export const Monthly: Story = {
  render: (data) => {
    return (
      <RecoilRoot>
        <SessionBaseAreaChartUiProvider {...data} />
      </RecoilRoot>
    );
  },
  args: {
    groupingOpts: { granularity: "days-in-month" },
    data: [
      {
        tags: createMockTags(["school", "pb138", "pb138/project", "focus", "testing"]),
        startTime: new Date(2023, 5, 28, 19, 0),
        endTime: new Date(2023, 5, 28, 21, 0),
        category: { name: "pb138" },
        description: "Working on the project",
      },
      {
        startTime: new Date(2023, 5, 29, 19, 0),
        tags: createMockTags(["school", "pb138", "pb138/project", "focus", "testing"]),
        endTime: new Date(2023, 5, 29, 21, 0),
        category: { name: "pb138" },
        description: "Working on the project",
      },
      {
        startTime: new Date(2023, 5, 27, 19, 0),
        tags: createMockTags(["school", "pb138", "pb138/project", "focus", "testing"]),
        endTime: new Date(2023, 5, 27, 21, 0),
        category: { name: "pb138" },
        description: "Working on the project",
      },
      {
        startTime: new Date(2023, 5, 30, 19, 0),
        tags: createMockTags(["school", "pb138", "pb138/project", "focus", "testing"]),
        endTime: new Date(2023, 5, 30, 21, 0),
        category: { name: "pb138" },
        description: "Working on the project",
      },
      {
        startTime: new Date(2023, 5, 4, 19, 0),
        tags: createMockTags(["school", "pb138", "pb138/project", "focus", "testing"]),
        endTime: new Date(2023, 5, 4, 21, 0),
        category: { name: "pb138" },
        description: "Working on the project",
      },
      {
        startTime: new Date(2023, 5, 27, 19, 0),
        tags: createMockTags(["school", "pb138", "pb138/project", "focus", "testing"]),
        endTime: new Date(2023, 5, 27, 21, 0),
        category: { name: "pb138" },
        description: "Working on the project",
      },
    ],
  },
};

export const Yearly: Story = {
  render: (data) => {
    return (
      <RecoilRoot>
        <SessionBaseAreaChartUiProvider {...data} />
      </RecoilRoot>
    );
  },
  args: {
    groupingOpts: {
      granularity: "days-in-month",
    },
    data: [
      {
        startTime: new Date(2023, 6, 28, 19, 0),
        tags: createMockTags(["school", "pb138", "pb138/project", "focus", "testing"]),
        endTime: new Date(2023, 6, 28, 21, 0),
        category: { name: "pb138" },
        description: "Working on the project",
      },
      {
        startTime: new Date(2023, 5, 29, 19, 0),
        tags: createMockTags(["school", "pb138", "pb138/project", "focus", "testing"]),
        endTime: new Date(2023, 5, 29, 21, 0),
        category: { name: "pb138" },
        description: "Working on the project",
      },
      {
        startTime: new Date(2023, 5, 27, 19, 0),
        tags: createMockTags(["school", "pb138", "pb138/project", "focus", "testing"]),
        endTime: new Date(2023, 5, 27, 21, 0),
        category: { name: "pb138" },
        description: "Working on the project",
      },
      {
        startTime: new Date(2023, 5, 30, 19, 0),
        tags: createMockTags(["school", "pb138", "pb138/project", "focus", "testing"]),
        endTime: new Date(2023, 5, 30, 21, 0),
        category: { name: "pb138" },
        description: "Working on the project",
      },
      {
        startTime: new Date(2023, 8, 4, 19, 0),
        tags: createMockTags(["school", "pb138", "pb138/project", "focus", "testing"]),
        endTime: new Date(2023, 8, 4, 21, 0),
        category: { name: "pb138" },
        description: "Working on the project",
      },
      {
        startTime: new Date(2023, 1, 27, 19, 0),
        tags: createMockTags(["school", "pb138", "pb138/project", "focus", "testing"]),
        endTime: new Date(2023, 1, 27, 21, 0),
        category: { name: "pb138" },
        description: "Working on the project",
      },
    ],
  },
};
