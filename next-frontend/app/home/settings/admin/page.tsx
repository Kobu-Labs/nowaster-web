import { AdminImpersonation } from "@/components/pages/settings/admin/AdminImpersonation";

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Admin Tools</h1>
      <p className="text-muted-foreground mb-6">
        Manage users and perform administrative actions.
      </p>
      <AdminImpersonation />
    </div>
  );
}
