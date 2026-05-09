import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"


export default async function Layout({ children }: { children: React.ReactNode }) {
    const user = await getCurrentUser()

    // Role-based access control: only admin and super-admin can access admin routes
    if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
        redirect('/?unauthorized=true')
    }

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" user={user} />
            <SidebarInset>
                <SiteHeader />
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}