"use client"

import { SectionCards } from "@/components/section-cards"
import { ParticipantsTable } from "@/components/participants-table"
import { columns } from "@/app/admin/columns"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"
import { Participant } from "@/app/admin/columns"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { generateRegisterIds } from "@/app/actions/generate-ids"
import { toast } from "sonner"
import { useState } from "react"
import { Fingerprint } from "lucide-react"

interface AdminStats {
  totalRegistrations: number
  totalGuests: number
  totalAmount: number
  pendingApprovals: number
  approvedRegistrations: number
  rejectedRegistrations: number
  cashPayments: number
  onlinePayments: number
  totalMembers?: number
  approvedMembers?: number
  approvedPrimary?: number
  approvedSecondary?: number
  totalSponsors?: number
}

interface AdminContentProps {
  participants: Participant[]
  stats: AdminStats
  userRole: string
}

export function AdminContent({ participants, stats, userRole }: AdminContentProps) {
  const { t } = useTranslation()
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateIds = async () => {
    try {
      setIsGenerating(true)
      const result = await generateRegisterIds()
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex justify-between items-center px-4 lg:px-6">
            <h2 className="text-2xl font-bold">{t("Dashboard")}</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleGenerateIds} 
                disabled={isGenerating}
              >
                <Fingerprint className="w-4 h-4 mr-2" />
                {isGenerating ? "Generating..." : "Create the Register ID"}
              </Button>
              <Link href="/admin/quick-create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Register Participant
                </Button>
              </Link>
            </div>
          </div>
          <SectionCards stats={stats} />
          <div className="px-4 lg:px-6">
            <h2 className="text-xl font-semibold mb-4">{t("Participants")}</h2>
            <ParticipantsTable columns={columns} data={participants || []} userRole={userRole} />
          </div>
        </div>
      </div>
    </div>
  )
}
