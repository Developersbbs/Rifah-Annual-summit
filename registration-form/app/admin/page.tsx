import { getCurrentUser } from "@/lib/auth"
import { getAdminData } from "@/app/actions/get-admin-data"
import { AdminContent } from "@/components/admin-content"

export default async function Page() {
  const user = await getCurrentUser()

  const { participants, stats } = await getAdminData()

  // Fallback for null stats if fetch fails (though generic error handling is better)
  const safeStats = stats || {
    totalRegistrations: 0,
    totalGuests: 0,
    totalAmount: 0,
    pendingApprovals: 0,
    approvedRegistrations: 0,
    rejectedRegistrations: 0,
    cashPayments: 0,
    onlinePayments: 0,
    totalMembers: 0,
  }

  return (
    <AdminContent 
      participants={participants || []} 
      stats={safeStats} 
      userRole={user?.role as string} 
    />
  )
}
