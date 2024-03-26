import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RecoilRoot } from "recoil";

import { FilterSettings } from "@/components/visualizers/charts/FilterSettings";

const meta = {
  title: "FilterSettings",
  component: FilterSettings,
  tags: ["autodocs"],
} satisfies Meta<typeof FilterSettings>;

export default meta;
type Story = StoryObj<typeof meta>

export const FilterSettingsBase: Story = {
  render: () => {
    const queryClient = new QueryClient();
    return (
      <QueryClientProvider client={queryClient}>
        <RecoilRoot>
          <FilterSettings />
        </RecoilRoot>
      </QueryClientProvider>
    );
  },
};
