'use client';

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Users, 
  Settings,
  Plus,
  FolderOpen,
  Clock,
  CheckCircle,
  UserCog,
  Shield,
  Mail,
  Sliders,
  GalleryVerticalEnd
} from "lucide-react"

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
      {
        title: "Roles",
        url: "/dashboard/users/roles",
        icon: Shield,
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        title: "General",
        url: "/dashboard/settings",
        icon: Sliders,
      },
      {
        title: "Email",
        url: "/dashboard/settings/email",
        icon: Mail,
      },
    ],
  },
]

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

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
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
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
