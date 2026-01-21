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
          <SidebarInset className="min-w-0">
            <AdminHeader />
            <main className="flex flex-1 flex-col gap-4 p-4 pt-0 md:p-6 min-w-0 overflow-x-auto">
              <div className="min-w-0 w-full max-w-full">
                {children}
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </BreadcrumbProvider>
    </AdminGuard>
  );
}
