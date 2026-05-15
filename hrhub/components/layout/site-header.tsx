"use client"

import * as React from "react"
import { IconBell, IconSearch, IconSettings, IconAlertTriangle, IconCircleCheck, IconInfoCircle, IconUser, IconShield, IconKey, IconLifebuoy, IconMessage, IconCreditCard, IconUsers, IconKeyboard, IconTerminal2 } from "@tabler/icons-react"
import { useRouter, usePathname } from "next/navigation"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ModeToggle } from "@/components/mode-toggle"
import Link from "next/link"
import { useSearch } from "@/components/search-context"
import { authService } from "@/lib/services/auth"
import { sidebarData } from "./data/sidebar-data"

export function SiteHeader() {
  const { setOpen } = useSearch()
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = React.useState<{ fullName: string; username: string; email?: string } | null>(null)

  // Detect current module based on URL
  const currentModuleName = React.useMemo(() => {
    const firstSegment = pathname.split('/')[1]
    const found = sidebarData.modules.find(m =>
      m.name.toLowerCase() === firstSegment ||
      m.navMain.some(n => n.url.startsWith(`/${firstSegment}`))
    )
    return found?.name || "Global"
  }, [pathname])

  const loadUser = React.useCallback(() => {
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
    }
  }, [])

  React.useEffect(() => {
    loadUser()
    
    // Listen for profile updates
    window.addEventListener('profile-updated', loadUser)
    return () => window.removeEventListener('profile-updated', loadUser)
  }, [loadUser])

  const handleLogout = () => {
    authService.logout()
    router.push("/login")
  }

  const notifications = [
    {
      id: 1,
      title: "New Leave Request",
      description: "John Doe has requested 2 days of sick leave.",
      time: "5m ago",
      unread: true,
      type: "alert"
    },
    {
      id: 2,
      title: "Payroll Processed",
      description: "January 2026 payroll has been successfully processed.",
      time: "2h ago",
      unread: false,
      type: "success"
    },
    {
      id: 3,
      title: "System Update",
      description: "New features have been added to the dashboard.",
      time: "1d ago",
      unread: false,
      type: "info"
    },
  ]

  // Default values if no user is logged in (should ideally redirect, but for header safety)
  const displayName = user?.fullName || "Guest User"
  const displayEmail = user?.email || user?.username || "guest@hrhub.com"
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />

        {/* Search Bar */}
        <div className="ml-4 flex flex-1 items-center max-w-md relative group/search">
          <Button
            variant="outline"
            className="relative h-10 w-full justify-start rounded-xl bg-muted/30 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-64 lg:w-80 hover:bg-muted/60 transition-all border-muted-foreground/10 hover:border-primary/50 hover:ring-2 hover:ring-primary/10"
            onClick={() => setOpen(true)}
          >
            <div className="flex items-center gap-2 w-full overflow-hidden">
              <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 shrink-0">
                <IconTerminal2 className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-tight">{currentModuleName}</span>
              </div>
              <IconSearch className="h-4 w-4 text-muted-foreground/50 group-hover/search:text-primary transition-colors shrink-0" />
              <span className="hidden lg:inline-flex truncate text-muted-foreground/70">Search {currentModuleName}...</span>
              <span className="inline-flex lg:hidden truncate text-muted-foreground/70">Search...</span>
            </div>
            <kbd className="pointer-events-none absolute right-[0.4rem] top-[0.4rem] hidden h-6 select-none items-center gap-1 rounded-lg border bg-background px-1.5 font-mono text-[10px] font-bold opacity-100 sm:flex shadow-sm">
              <span className="text-xs opacity-50">⌘</span>K
            </kbd>
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2 lg:gap-4">
          <div className="hidden items-center gap-1 sm:flex">
            {/* Notifications Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="size-9 relative">
                  <IconBell className="size-5" />
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="sr-only">Notifications</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary hover:bg-transparent">
                    Mark all as read
                  </Button>
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex gap-3 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer ${notif.unread ? "bg-primary/5" : ""
                        }`}
                    >
                      <div className={`mt-0.5 h-8 w-8 shrink-0 rounded-full flex items-center justify-center border ${notif.type === 'alert' ? 'bg-amber-100 text-amber-600 border-amber-200' :
                        notif.type === 'success' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' :
                          'bg-blue-100 text-blue-600 border-blue-200'
                        }`}>
                        {notif.type === 'alert' ? <IconAlertTriangle className="size-4" /> :
                          notif.type === 'success' ? <IconCircleCheck className="size-4" /> :
                            <IconInfoCircle className="size-4" />}
                      </div>
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-semibold text-sm truncate">{notif.title}</span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{notif.time}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{notif.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/notifications" className="block p-2 border-t">
                  <Button variant="ghost" className="w-full text-xs h-8">
                    View all notifications
                  </Button>
                </Link>
              </PopoverContent>
            </Popover>

            {/* Theme Toggle */}
            <ModeToggle />

            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-9 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
                  <IconSettings className="size-5 transition-all duration-300 ease-in-out data-[state=open]:rotate-90" />
                  <span className="sr-only">Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <IconUser className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                      <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/billing">
                      <IconCreditCard className="mr-2 h-4 w-4" />
                      <span>Billing</span>
                      <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/team">
                      <IconUsers className="mr-2 h-4 w-4" />
                      <span>Team</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">System</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/permissions">
                      <IconShield className="mr-2 h-4 w-4" />
                      <span>Permissions</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/api">
                      <IconKey className="mr-2 h-4 w-4" />
                      <span>API Keys</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Support</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/help">
                      <IconLifebuoy className="mr-2 h-4 w-4" />
                      <span>Help Center</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/contact">
                      <IconMessage className="mr-2 h-4 w-4" />
                      <span>Contact Support</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/keyboard-shortcuts">
                      <IconKeyboard className="mr-2 h-4 w-4" />
                      <span>Keyboard Shortcuts</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator
            orientation="vertical"
            className="h-6 mx-1 hidden sm:block"
          />

          {/* User Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 text-left rounded-full p-0 flex items-center gap-2 lg:w-auto lg:px-2 lg:h-12 hover:bg-transparent">
                <div className="relative">
                  <Avatar className="h-9 w-9 border cursor-pointer">
                    <AvatarImage src="" alt="User" />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background"></span>
                </div>
                <div className="hidden flex-col items-start lg:flex">
                  <span className="text-sm font-semibold max-w-[120px] truncate">{displayName}</span>
                  <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[120px]">{displayEmail}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {displayEmail}
                  </p>
                  <div className="mt-1">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-500/15 text-green-700 dark:text-green-400">
                      Active
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/billing" className="cursor-pointer">Billing</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  New Team
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                onClick={handleLogout}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
