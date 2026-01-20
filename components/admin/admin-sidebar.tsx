'use client';

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Users, 
  Plus,
  FolderOpen,
  Mail,
  GalleryVerticalEnd,
  UserCircle,
  Archive,
} from "lucide-react"
import { usePendingApplicationsCount } from "@/hooks"
import { Badge } from "@/components/ui/badge"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navigation = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Jobs",
    items: [
      {
        title: "All Jobs",
        url: "/dashboard/jobs",
        icon: Briefcase,
      },
      {
        title: "Add Job",
        url: "/dashboard/jobs/new",
        icon: Plus,
      },
      {
        title: "Industries",
        url: "/dashboard/industries",
        icon: FolderOpen,
      },
    ],
  },
  {
    title: "Applications",
    items: [
      {
        title: "All Applications",
        url: "/dashboard/applications",
        icon: FileText,
      },
      {
        title: "Archived",
        url: "/dashboard/applications/archived",
        icon: Archive,
      },
    ],
  },
  {
    title: "Users",
    items: [
      {
        title: "All Users",
        url: "/dashboard/users",
        icon: Users,
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        title: "Email Templates",
        url: "/dashboard/settings/email",
        icon: Mail,
      },
      {
        title: "Account Center",
        url: "/dashboard/settings/account",
        icon: UserCircle,
      },
    ],
  },
]

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { data: pendingData } = usePendingApplicationsCount()
  const pendingCount = pendingData?.count || 0

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Careers Platform</span>
                  <span className="text-xs text-muted-foreground">Admin Panel</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url} className="flex items-center justify-between w-full">
                      <span className="flex items-center gap-2">
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </span>
                      {item.url === '/dashboard/applications' && pendingCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="h-5 min-w-5 px-1.5 text-xs font-medium"
                        >
                          {pendingCount > 99 ? '99+' : pendingCount}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
