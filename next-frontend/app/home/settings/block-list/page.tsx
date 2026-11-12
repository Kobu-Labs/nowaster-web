import { BlockList } from "@/components/pages/settings/block-list/BlockList";

export default function BlockListSettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Block list</h1>
      <p className="text-muted-foreground mb-6">
        These domains are blocked in the browser extension while a session is
        active.
      </p>
      <BlockList />
    </div>
  );
}
