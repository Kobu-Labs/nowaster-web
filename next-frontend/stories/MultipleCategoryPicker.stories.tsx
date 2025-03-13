import { MultipleCategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RecoilRoot } from "recoil";

const multipleCategoryMeta = {
  title: "Category/CategoryPicker/Multiple",
  component: MultipleCategoryPicker,
  tags: ["autodocs"],
} satisfies Meta<typeof MultipleCategoryPicker>;

export default multipleCategoryMeta;
type Story = StoryObj<typeof multipleCategoryMeta>;

export const Basic: Story = {
  args: {
    onSelectCategory: console.log,
    selectedCategories: [
      {
        name: "pb138",
        id: "pb138",
        color: "#0f0f0f",
      },
      {
        name: "testing",
        id: "testing",
        color: "#ff0fbf",
      },
    ],
  },
  render: (props) => {
    const queryClient = new QueryClient();
    return (
      <QueryClientProvider client={queryClient}>
        <RecoilRoot>
          <MultipleCategoryPicker {...props} />
        </RecoilRoot>
      </QueryClientProvider>
    );
  },
};
