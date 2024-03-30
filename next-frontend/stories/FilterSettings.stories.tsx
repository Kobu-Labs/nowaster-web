import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RecoilRoot } from "recoil";

import { ChartFilter } from "@/components/visualizers/charts/ChartFilter";

const meta = {
  title: "ChartFilter",
  component: ChartFilter,
  tags: ["autodocs"],
} satisfies Meta<typeof ChartFilter>;

export default meta;
type Story = StoryObj<typeof meta>

export const FilterSettingsBase: Story = {
  render: () => {
    const queryClient = new QueryClient();
    return (
      <QueryClientProvider client={queryClient}>
        <RecoilRoot>
          <ChartFilter />
        </RecoilRoot>
      </QueryClientProvider>
    );
  },
};
