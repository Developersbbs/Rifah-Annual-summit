"use client"

import * as React from "react"
import Image from "next/image"
import {
  IconChartBar,
  IconDashboard,
  IconUsers,
  IconCalendarEvent,
  IconWorld,
  IconDatabase,
  IconListDetails,
  IconHistory,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: { email: string; role: string } | null
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const navMain = [
    {
      title: "Records",
      url: "/admin",
      icon: IconDatabase,
    },
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: IconDashboard,
    },

    // {
    //   title: "Quick Create",
    //   url: "/admin/quick-create",
    //   icon: IconPlus,
    // },
    {
      title: "Location Stats",
      url: "/admin/locations",
      icon: IconChartBar,
    },
    {
      title: "Events",
      url: "/admin/events",
      icon: IconCalendarEvent,
    },
    {
      title: "Check-in",
      url: "/admin/checkin",
      icon: IconListDetails,
    },
    ...(user?.role === 'super-admin' ? [
      {
        title: "Approval History",
        url: "/admin/approval-history",
        icon: IconHistory,
      },
      {
        title: "Users",
        url: "/admin/users",
        icon: IconUsers,
      }
    ] : []),
  ]

  const userData = {
    name: user?.email?.split('@')[0] || "Admin",
    email: user?.email || undefined,
    avatar: "/avatars/shadcn.jpg", // Placeholder
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <div className="flex items-center gap-2">
                {/* <Earth className="h-6 w-6 text-primary animate-spin-slow" /> */}
                <Image src="/assets/logo.png" alt="RIFAH" width={38} height={38} className="h-7 w-7 sm:h-8 sm:w-8" />
                <span className=" font-bold tracking-tight">RIFAH ANNUAL SUMMIT</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
