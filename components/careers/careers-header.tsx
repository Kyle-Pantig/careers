'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/context';
import { cn } from '@/lib/utils';
import { 
  Menu, 
  Briefcase, 
  UserCircle,
  LogOut,
  LayoutDashboard,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Jobs', href: '/jobs' },
];

export function CareersHeader() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('You have been signed out successfully.');
    setMobileMenuOpen(false);
  };

  const getInitials = () => {
    if (!user) return 'U';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('staff');

  // Check if profile is incomplete (only for non-admin/staff users)
  const isProfileIncomplete = user && !isAdmin && (
    !user.firstName?.trim() ||
    !user.lastName?.trim() ||
    !user.contactNumber?.trim() ||
    !user.address?.trim() ||
    !user.resumeUrl
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-zinc-900">
              Careers
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:gap-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href === '/jobs' && pathname.startsWith('/jobs'));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group relative py-1 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-zinc-900'
                    : 'text-zinc-600 hover:text-zinc-900'
                )}
              >
                {item.name}
                {/* Animated underline */}
                <span
                  className={cn(
                    'absolute -bottom-0.5 left-0 h-0.5 bg-zinc-900 transition-all duration-300 ease-out',
                    isActive ? 'w-full' : 'w-0 group-hover:w-full'
                  )}
                />
              </Link>
            );
          })}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex md:items-center md:gap-3">
          {isLoading ? (
            // Show skeleton while loading auth state
            <div className="h-9 w-9 rounded-full bg-zinc-200 animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-zinc-900 text-white">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {isProfileIncomplete && (
                    <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-destructive border-2 border-white" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {!isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/my-applications" className="cursor-pointer">
                      <FileText className="mr-2 h-4 w-4" />
                      My Applications
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Account Center
                    {isProfileIncomplete && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-destructive" />
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild className="rounded-full">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className="rounded-full">
                <Link href="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-sm">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
                    <Briefcase className="h-4 w-4 text-white" />
                  </div>
                  Careers Platform
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-8 flex flex-col gap-4">
                {/* Mobile Navigation */}
                <nav className="flex flex-col gap-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || (item.href === '/jobs' && pathname.startsWith('/jobs'));
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'relative px-3 py-3 text-base font-medium transition-colors',
                          isActive
                            ? 'text-zinc-900'
                            : 'text-zinc-600 hover:text-zinc-900'
                        )}
                      >
                        <span className="relative">
                          {item.name}
                          <span
                            className={cn(
                              'absolute -bottom-1 left-0 h-0.5 bg-zinc-900 transition-all duration-300',
                              isActive ? 'w-full' : 'w-0'
                            )}
                          />
                        </span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="my-4 h-px bg-zinc-200" />

                {/* Mobile User Section */}
                {isLoading ? (
                  <div className="flex items-center gap-3 px-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-200 animate-pulse" />
                    <div className="flex flex-col gap-2">
                      <div className="h-4 w-24 bg-zinc-200 rounded animate-pulse" />
                      <div className="h-3 w-32 bg-zinc-200 rounded animate-pulse" />
                    </div>
                  </div>
                ) : user ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 px-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-zinc-900 text-white">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        {isProfileIncomplete && (
                          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-destructive border-2 border-white" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    
                    <nav className="flex flex-col gap-1">
                      {!isAdmin && (
                        <Link
                          href="/my-applications"
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors',
                            pathname === '/my-applications'
                              ? 'bg-zinc-100 text-zinc-900'
                              : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                          )}
                        >
                          <FileText className="h-5 w-5" />
                          My Applications
                        </Link>
                      )}
                      {isAdmin && (
                        <Link
                          href="/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors',
                            pathname === '/dashboard'
                              ? 'bg-zinc-100 text-zinc-900'
                              : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                          )}
                        >
                          <LayoutDashboard className="h-5 w-5" />
                          Dashboard
                        </Link>
                      )}
                      <Link
                        href="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                      >
                        <UserCircle className="h-5 w-5" />
                        Account Center
                        {isProfileIncomplete && (
                          <span className="ml-auto h-2 w-2 rounded-full bg-destructive" />
                        )}
                      </Link>
                    </nav>

                    <div className="my-2 h-px bg-zinc-200" />
                    
                    <Button 
                      variant="ghost" 
                      className="justify-start gap-3 px-3 py-3 text-base font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-5 w-5" />
                      Log out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 px-3">
                    <Button asChild variant="outline" className="w-full rounded-full">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        Log in
                      </Link>
                    </Button>
                    <Button asChild className="w-full rounded-full">
                      <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                        Get Started
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
