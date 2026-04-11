import { SectionCards } from "@/components/section-cards"
import { ParticipantsTable } from "@/components/participants-table"
import { columns } from "./columns"
import { getCurrentUser } from "@/lib/auth"
import { getAdminData } from "@/app/actions/get-admin-data"

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
    vegCount: 0,
    nonVegCount: 0,
    morningFoodCount: 0,
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex justify-between items-center px-4 lg:px-6">
            <h2 className="text-2xl font-bold">Dashboard</h2>
          </div>
          <SectionCards stats={safeStats} />
          <div className="px-4 lg:px-6">
            <h2 className="text-xl font-semibold mb-4">Participants</h2>
            <ParticipantsTable columns={columns} data={participants || []} userRole={user?.role as string} />
          </div>
        </div>
      </div>
    </div>
  )
}
