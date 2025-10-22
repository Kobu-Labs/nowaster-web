import { Feed } from "@/components/visualizers/feed/Feed";

export default function FeedPage() {
  return (
    <div className="space-y-4 p-6 w-full">
      <div className="text-2xl font-bold">Feed</div>
      <Feed />
    </div>
  );
}
