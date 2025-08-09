import { VisibilitySettings } from "@/components/pages/settings/visibility/VisibilitySettings";

export default function VisibilitySettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Privacy Settings</h1>
      <p className="text-muted-foreground mb-6">
        Control who can see your activity and time tracking sessions.
      </p>

      <VisibilitySettings />
    </div>
  );
}