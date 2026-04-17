"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconUsers,
  IconCalendarEvent,
  IconWorld,
  IconDatabase,
  IconListDetails,
  IconHistory,
  IconQrcode,
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
      url: "/admin/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Records",
      url: "/admin",
      icon: IconDatabase,
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
    {
      title: "QR Scanner",
      url: "/admin/checkin/qr-scanner",
      icon: IconQrcode,
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
                <IconWorld className="!size-5" />
                <span className="text-base font-semibold">RIFAH ANNUAL SUMMIT</span>
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
