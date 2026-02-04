import { AdminImpersonation } from "@/components/pages/settings/admin/AdminImpersonation";

export default function AdminImpersonationPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">User Impersonation</h1>
      <p className="text-muted-foreground mb-6">
        Search and impersonate users to troubleshoot issues or provide support.
      </p>
      <AdminImpersonation />
    </div>
  );
}
