'use client';

import { AdminSidebar, AdminHeader } from "@/components/admin";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminGuard } from "@/components/auth";
import { BreadcrumbProvider } from "@/context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <BreadcrumbProvider>
        <SidebarProvider>
          <AdminSidebar />
          <SidebarInset>
            <AdminHeader />
            <main className="flex-1 p-6">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </BreadcrumbProvider>
    </AdminGuard>
  );
}
