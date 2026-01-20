'use client';

import { useRouter } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from 'next/link';
import { ChevronDown, LogOut, UserCircle } from "lucide-react"
import { useAuth, useBreadcrumbs } from "@/context"
import { toast } from 'sonner'

export function AdminHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { breadcrumbs } = useBreadcrumbs();

  const handleLogout = async () => {
    await logout();
    toast.success('You have been signed out successfully.');
    router.push('/login');
  };

  // Get initials from first and last name
  const getInitials = () => {
    if (!user) return 'U';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  const fullName = user ? `${user.firstName} ${user.lastName}` : 'User';

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border bg-sidebar text-sidebar-foreground px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 h-4" />
        {breadcrumbs.length > 0 ? (
          <Breadcrumb>
            <BreadcrumbList className="text-white">
              {breadcrumbs.map((crumb, index) => (
                <span key={index} className="contents">
                  {index > 0 && <BreadcrumbSeparator className="hidden md:block text-white/60" />}
                  <BreadcrumbItem className={index < breadcrumbs.length - 1 ? "hidden md:block" : ""}>
                    {index === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage className="text-white">{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href || "#"} className="text-white/80 hover:text-white">{crumb.label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        ) : (
          <span className="font-semibold text-white">Admin Panel</span>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 bg-sidebar-accent hover:bg-sidebar-accent/80 focus:outline-none cursor-pointer">
          <Avatar className="h-8 w-8 text-black">
            <AvatarImage src="" alt={fullName} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium md:block">{fullName}</span>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{fullName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings/account">
              <UserCircle className="mr-2 h-4 w-4" />
              Account Center
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
