import { AdminAvatarPanel } from "@/components/ui-providers/avatar/AdminAvatarPanel";

export default function AdminAvatarsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Avatars</h1>
      <p className="text-muted-foreground mb-6">
        Manage default avatars and trigger manual regeneration for users.
      </p>
      <AdminAvatarPanel />
    </div>
  );
}
