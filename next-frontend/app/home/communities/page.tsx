import { CommunityList } from "@/components/visualizers/communities/CommunityList";

export const metadata = {
  description: "Track time together with people learning or working on the same things",
  title: "Communities",
};

export default function Page() {
  return <CommunityList />;
}
