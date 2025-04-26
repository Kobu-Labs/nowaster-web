import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RecoilRoot } from "recoil";

import { SimpleTagPicker } from "@/components/visualizers/tags/TagPicker";

const meta = {
  title: "SimpleTagPicker",
  component: SimpleTagPicker,
  tags: ["autodocs"],
} satisfies Meta<typeof SimpleTagPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SimpleTagPickerBase: Story = {
  args: {
    onNewTagsSelected: (tag) => console.log(tag),
  },

  render: (props) => {
    const queryClient = new QueryClient();

    return (
      <QueryClientProvider client={queryClient}>
        <RecoilRoot>
          <SimpleTagPicker onNewTagsSelected={props.onNewTagsSelected} />
        </RecoilRoot>
      </QueryClientProvider>
    );
  },
};
