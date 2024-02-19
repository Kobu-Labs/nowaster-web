import { OverviewAreaChartVisualizer } from "@/components/visualizers/OverviewAreaChartVisualizer";
import type { Meta, StoryObj } from "@storybook/react";
import { RecoilRoot } from "recoil";


const meta = {
  title: "OverviewAreaChartVisualizer",
  component: OverviewAreaChartVisualizer,
  tags: ["autodocs"],
} satisfies Meta<typeof OverviewAreaChartVisualizer>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Weekly: Story = {
  render: data => {
    return (
      <RecoilRoot>
        <OverviewAreaChartVisualizer {...data} />
      </RecoilRoot>
    );
  },
  args: {
    groupingOpts: {
      granularity: "day",
      allKeys: true,
      sessionKey: session => session.tags.map(tag => tag.label)
    },
    data: [
      {
        tags: ["school", "pb138", "pb138/project", "focus", "testing"].map(label => { return { label, id: "" }; }),
        startTime: new Date(2023, 5, 28, 19, 0),
        endTime: new Date(2023, 5, 28, 21, 0),
        category: "pb138",
        description: "Working on the project",
      },
      {
        tags: ["school", "pb138", "pb138/project", "focus"].map(label => { return { label, id: "" }; }),
        startTime: new Date(2023, 5, 29, 19, 0),
        endTime: new Date(2023, 5, 29, 21, 0),
        category: "pb138",
        description: "Working on the project",
      },
      {
        tags: ["school", "pb138", "pb138/project", "focus"].map(label => { return { label, id: "" }; }),
        startTime: new Date(2023, 5, 27, 19, 0),
        endTime: new Date(2023, 5, 27, 21, 0),
        category: "pb138",
        description: "Working on the project",
      },
      {
        tags: ["school", "pb138", "pb138/project", "focus"].map(label => { return { label, id: "" }; }),
        startTime: new Date(2023, 5, 30, 19, 0),
        endTime: new Date(2023, 5, 30, 21, 0),
        category: "pb138",
        description: "Working on the project",
      },
      {
        tags: ["school", "pb138", "pb138/project", "focus"].map(label => { return { label, id: "" }; }),
        startTime: new Date(2023, 5, 4, 19, 0),
        endTime: new Date(2023, 5, 4, 21, 0),
        category: "pb138",
        description: "Working on the project",
      },
      {
        tags: ["school", "pb138", "pb138/project", "focus"].map(label => { return { label, id: "" }; }),
        startTime: new Date(2023, 5, 27, 19, 0),
        endTime: new Date(2023, 5, 27, 21, 0),
        category: "pb138",
        description: "Working on the project",
      },
    ]
  }
};

export const Monthly: Story = {
  render: data => {
    return (
      <RecoilRoot>
        <OverviewAreaChartVisualizer {...data} />
      </RecoilRoot>
    );
  },
  args: {
    groupingOpts: { granularity: "week" },
    data: [
      {
        userId: "19i42894294",
        tags: ["school", "pb138", "pb138/project", "focus"].map(label => { return { label, id: "" }; }),
        startTime: new Date(2023, 5, 28, 19, 0),
        endTime: new Date(2023, 5, 28, 21, 0),
        category: "pb138",
        description: "Working on the project",
      },
      {
        userId: "19i42894294",
        tags: ["school", "pb138", "pb138/project", "focus"].map(label => { return { label, id: "" }; }),
        startTime: new Date(2023, 5, 29, 19, 0),
        endTime: new Date(2023, 5, 29, 21, 0),
        category: "pb138",
        description: "Working on the project",
      },
      {
        userId: "19i42894294",
        tags: ["school", "pb138", "pb138/project", "focus"].map(label => { return { label, id: "" }; }),
        startTime: new Date(2023, 5, 27, 19, 0),
        endTime: new Date(2023, 5, 27, 21, 0),
        category: "pb138",
        description: "Working on the project",
      },
      {
        userId: "19i42894294",
        tags: ["school", "pb138", "pb138/project", "focus"].map(label => { return { label, id: "" }; }),
        startTime: new Date(2023, 5, 30, 19, 0),
        endTime: new Date(2023, 5, 30, 21, 0),
        category: "pb138",
        description: "Working on the project",
      },
      {
        userId: "19i42894294",
        tags: ["school", "pb138", "pb138/project", "focus"].map(label => { return { label, id: "" }; }),
        startTime: new Date(2023, 5, 4, 19, 0),
        endTime: new Date(2023, 5, 4, 21, 0),
        category: "pb138",
        description: "Working on the project",
      },
      {
        userId: "19i42894294",
        tags: ["school", "pb138", "pb138/project", "focus"].map(label => { return { label, id: "" }; }),
        startTime: new Date(2023, 5, 27, 19, 0),
        endTime: new Date(2023, 5, 27, 21, 0),
        category: "pb138",
        description: "Working on the project",
      },
    ]
  }
};

export const Yearly: Story = {
  render: data => {
    return (
      <RecoilRoot>
        <OverviewAreaChartVisualizer {...data} />
      </RecoilRoot>
    );
  },
  args: {
    groupingOpts: {
      granularity: "month",
    },
    data: [
      {
        userId: "19i42894294",
        tags: ["school", "pb138", "pb138/project", "focus"].map(label => { return { label, id: "" }; }),
        startTime: new Date(2023, 6, 28, 19, 0),
        endTime: new Date(2023, 6, 28, 21, 0),
        category: "pb138",
        description: "Working on the project",
      },
      {
        userId: "19i42894294",
        tags: ["school", "pb138", "pb138/project", "focus"].map(label => { return { label, id: "" }; }),
        startTime: new Date(2023, 5, 29, 19, 0),
        endTime: new Date(2023, 5, 29, 21, 0),
        category: "pb138",
        description: "Working on the project",
      },
      {
        userId: "19i42894294",
        tags: ["school", "pb138", "pb138/project", "focus"].map(label => { return { label, id: "" }; }),
        startTime: new Date(2023, 5, 27, 19, 0),
        endTime: new Date(2023, 5, 27, 21, 0),
        category: "pb138",
        description: "Working on the project",
      },
      {
        userId: "19i42894294",
        tags: ["school", "pb138", "pb138/project", "focus"].map(label => { return { label, id: "" }; }),
        startTime: new Date(2023, 5, 30, 19, 0),
        endTime: new Date(2023, 5, 30, 21, 0),
        category: "pb138",
        description: "Working on the project",
      },
      {
        userId: "19i42894294",
        tags: ["school", "pb138", "pb138/project", "focus"].map(label => { return { label, id: "" }; }),
        startTime: new Date(2023, 8, 4, 19, 0),
        endTime: new Date(2023, 8, 4, 21, 0),
        category: "pb138",
        description: "Working on the project",
      },
      {
        userId: "19i42894294",
        tags: ["school", "pb138", "pb138/project", "focus"].map(label => { return { label, id: "" }; }),
        startTime: new Date(2023, 1, 27, 19, 0),
        endTime: new Date(2023, 1, 27, 21, 0),
        category: "pb138",
        description: "Working on the project",
      },
    ]
  }
};;