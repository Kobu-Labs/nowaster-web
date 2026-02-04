import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Shield } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Portal</h1>
        <p className="text-muted-foreground">
          Manage system settings and perform administrative actions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Welcome to the Admin Portal</CardTitle>
          </div>
          <CardDescription>
            Use the sidebar to navigate through available administrative tools.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This portal provides access to administrative features such as user
            impersonation, system monitoring, and user management.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
