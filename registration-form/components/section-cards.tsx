import { IconUsers, IconCurrencyRupee, IconClock, IconCheck, IconX } from "@tabler/icons-react"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface SectionCardsProps {
  stats: {
    totalRegistrations: number
    totalGuests: number
    totalAmount: number
    pendingApprovals: number
    approvedRegistrations: number
    rejectedRegistrations: number
    cashPayments: number
    onlinePayments: number
    totalMembers?: number
  }
}

export function SectionCards({ stats }: SectionCardsProps) {
  const { t } = useTranslation()
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t("Total Registrations")}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalRegistrations}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <IconUsers className="size-4 text-blue-500" /> {t("Total Members")}: {stats.totalMembers || stats.totalGuests}
          </div>
          <div className="text-muted-foreground text-xs">
            ({stats.totalRegistrations} {t("Primary")} + {(stats.totalMembers || stats.totalGuests) - stats.totalRegistrations} {t("Secondary")})
          </div>
          <div className="text-muted-foreground">
            {t("Total Amount")}: ₹{stats.totalAmount}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t("Payment Methods")}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.cashPayments + stats.onlinePayments}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <IconCurrencyRupee className="size-4 text-green-500" /> {t("Cash")}: {stats.cashPayments}
          </div>
          <div className="line-clamp-1 flex gap-2 font-medium">
            <IconClock className="size-4 text-blue-500" /> {t("Online")}: {stats.onlinePayments}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t("Approval Status")}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.pendingApprovals + stats.approvedRegistrations + stats.rejectedRegistrations}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <IconClock className="size-4 text-orange-500" /> {t("Pending")}: {stats.pendingApprovals}
          </div>
          <div className="line-clamp-1 flex gap-2 font-medium">
            <IconCheck className="size-4 text-green-500" /> {t("Approved")}: {stats.approvedRegistrations}
          </div>
          <div className="line-clamp-1 flex gap-2 font-medium">
            <IconX className="size-4 text-red-500" /> {t("Rejected")}: {stats.rejectedRegistrations}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
