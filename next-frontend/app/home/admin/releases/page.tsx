import { AdminReleaseManagement } from "@/components/pages/admin/releases/AdminReleaseManagement";

export default function AdminReleasesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Release Management</h1>
      <p className="text-muted-foreground mb-6">
        Create, edit, and publish releases. Once published, users will be notified.
      </p>
      <AdminReleaseManagement />
    </div>
  );
}
