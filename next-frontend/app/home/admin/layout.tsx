"use client";

import { useIsAdmin } from "@/components/hooks/useIsAdmin";
import { AdminSidebar } from "@/components/pages/admin/AdminSidebar";
import { SidebarProvider } from "@/components/shadcn/sidebar";
import { redirect } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    redirect("/home");
  }

  return (
    <SidebarProvider>
      <div className="flex h-full w-full">
        <AdminSidebar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </SidebarProvider>
  );
}
