"use client"

import * as React from "react"
import Image from "next/image"
import {
  IconChartBar,
  IconDashboard,
  IconUsers,
  IconCalendarEvent,
  IconDatabase,
  IconListDetails,
  IconHistory,
  IconMicrophone,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"
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
  const { t } = useTranslation()
  const navMain = [
    {
      title: t("Records"),
      url: "/admin",
      icon: IconDatabase,
    },
    {
      title: t("Dashboard"),
      url: "/admin/dashboard",
      icon: IconDashboard,
    },
    {
      title: t("Members"),
      url: "/admin/members",
      icon: IconUsers,
    },

    // {
    //   title: "Quick Create",
    //   url: "/admin/quick-create",
    //   icon: IconPlus,
    // },
    {
      title: t("Location Stats"),
      url: "/admin/locations",
      icon: IconChartBar,
    },
    {
      title: t("Events"),
      url: "/admin/events",
      icon: IconCalendarEvent,
    },
    {
      title: t("Check-in"),
      url: "/admin/checkin",
      icon: IconListDetails,
    },
    {
      title: t("Speakers & Volunteers"),
      url: "/admin/speakers",
      icon: IconMicrophone,
    },
    ...(user?.role === 'super-admin' ? [
      {
        title: t("Approval History"),
        url: "/admin/approval-history",
        icon: IconHistory,
      },
      {
        title: t("Users"),
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
                <span className=" font-bold tracking-tight">{t("RIFAH ANNUAL SUMMIT")}</span>
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
