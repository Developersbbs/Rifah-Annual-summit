"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconInnerShadowTop,
  IconListDetails,
  IconUsers,
  IconCalendarEvent,
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
      title: "Dashboard",
      url: "/admin",
      icon: IconDashboard,
    },
    {
      title: "Group Stats",
      url: "/admin/groups",
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
    ...(user?.role === 'super-admin' ? [{
      title: "Users",
      url: "/admin/users",
      icon: IconUsers,
    }] : []),
  ]

  const userData = {
    name: user?.email?.split('@')[0] || "Admin",
    email: user?.email || "admin@example.com",
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
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">பொங்கல் விழா</span>
              </a>
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
