import { FeedSubscriptions } from "@/components/pages/settings/feed/FeedSubscriptions";

export default function FeedSettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Feed Settings</h1>
      <p className="text-muted-foreground mb-6">
        Manage your feed subscriptions. Control which content you see in your feed.
      </p>

      <FeedSubscriptions />
    </div>
  );
}
