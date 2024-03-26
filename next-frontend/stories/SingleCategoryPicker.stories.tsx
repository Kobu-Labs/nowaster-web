import { SingleCategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RecoilRoot } from "recoil";


const multipleCategoryMeta = {
  title: "Category/CategoryPicker/Single",
  component: SingleCategoryPicker,
  tags: ["autodocs"],
} satisfies Meta<typeof SingleCategoryPicker>;

export default multipleCategoryMeta;
type Story = StoryObj<typeof multipleCategoryMeta>

export const Basic: Story = {
  args: {
    onSelectedCategoriesChanged: console.log,
  },
  render: (props) => {
    const queryClient = new QueryClient();
    return (
      <QueryClientProvider client={queryClient}>
        <RecoilRoot>
          <SingleCategoryPicker {...props} />
        </RecoilRoot>
      </QueryClientProvider>
    );
  },
};
