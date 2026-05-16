"use client"

import * as React from "react"
import { useMemo } from "react"
import { Download, CheckCircle2, Loader2, Send, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    IconFileSpreadsheet,
    IconFileDescription,
    IconFileCode,
    IconMailFast,
} from "@tabler/icons-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ViewParticipantDialog } from "@/components/view-participant-dialog"
import { IParticipant } from "@/lib/types"
import { toast } from "sonner"

interface DashboardStats {
    totalRegistrations: number
    totalPeople: number
    totalCheckedIn: number
    totalSecondaryCheckedIn: number
    primaryMembers: number
    secondaryMembers: number
    totalSponsors: number
    male: number
    female: number
    other: number
}

interface DashboardRecord {
    _id: string
    type: string
    name: string
    phone: string
    email: string
    gender: string
    checkedIn: boolean
    eventDate: string
    location: string
    primaryMember: string
    primaryPhone: string
    registrationId: string
    approvalStatus?: string
    createdAt?: string
    isSponsor?: boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    originalParticipant?: any
}

interface PaginationData {
    page: number
    limit: number
    total: number
    totalPages: number
}

export default function DashboardPage() {
    const { t } = useTranslation()
    const [stats, setStats] = React.useState<DashboardStats | null>(null)
    const [records, setRecords] = React.useState<DashboardRecord[]>([])
    const [loading, setLoading] = React.useState(true)
    const [filter, setFilter] = React.useState<"all" | "checked-in" | "not-checked-in">("all")
    const [type, setType] = React.useState<"all" | "primary" | "secondary" | "sponsor">("all")
    const [gender, setGender] = React.useState<"all" | "male" | "female" | "other">("all")
    const [search, setSearch] = React.useState("")
    const [regId, setRegId] = React.useState("")
    const [page, setPage] = React.useState(1)
    const [pagination, setPagination] = React.useState<PaginationData | null>(null)
    const [downloading, setDownloading] = React.useState<string | null>(null)
    const [viewingParticipant, setViewingParticipant] = React.useState<IParticipant | null>(null)
    const [showThankYouDialog, setShowThankYouDialog] = React.useState(false)
    const [sendingThankYou, setSendingThankYou] = React.useState(false)
    const [thankYouResult, setThankYouResult] = React.useState<{ successCount: number; failureCount: number } | null>(null)
    const [sendingEmailId, setSendingEmailId] = React.useState<string | null>(null)

    // Bulk alert email state
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
    const [emailDialogOpen, setEmailDialogOpen] = React.useState(false)
    const [emailTargets, setEmailTargets] = React.useState<DashboardRecord[]>([])
    const [sending, setSending] = React.useState(false)
    const [sendProgress, setSendProgress] = React.useState<{ sent: number; failed: number; total: number } | null>(null)
    const [resultDialogOpen, setResultDialogOpen] = React.useState(false)
    const [sendResults, setSendResults] = React.useState<{ successCount: number; failureCount: number } | null>(null)

    const loadStats = React.useCallback(async () => {
        try {
            const res = await fetch("/api/dashboard/stats")
            const data = await res.json()
            setStats(data)
        } catch (error) {
            console.error("Failed to load stats:", error)
        }
    }, [])

    const loadRecords = React.useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                filter,
                type,
                gender,
                page: page.toString(),
                limit: "20",
                search,
                regId
            })
            const res = await fetch(`/api/dashboard/records?${params}`)
            const data = await res.json()
            setRecords(data.records || [])
            setPagination(data.pagination || null)
        } catch (error) {
            console.error("Failed to load records:", error)
        } finally {
            setLoading(false)
        }
    }, [filter, type, gender, page, search, regId])

    React.useEffect(() => {
        loadStats()
    }, [loadStats])

    // Memoize records for performance
    const memoizedRecords = useMemo(() => records, [records])

    React.useEffect(() => {
        loadRecords()
    }, [loadRecords, filter, type, page, search, regId])

    // Reset selection when page/filter changes
    React.useEffect(() => {
        setSelectedIds(new Set())
    }, [page, filter, type, gender, search, regId])

    const allPageSelected = memoizedRecords.length > 0 && memoizedRecords.every(r => selectedIds.has(r.registrationId))
    const somePageSelected = memoizedRecords.some(r => selectedIds.has(r.registrationId))

    const toggleSelectAll = () => {
        if (allPageSelected) {
            setSelectedIds(prev => {
                const next = new Set(prev)
                memoizedRecords.forEach(r => next.delete(r.registrationId))
                return next
            })
        } else {
            setSelectedIds(prev => {
                const next = new Set(prev)
                memoizedRecords.forEach(r => next.add(r.registrationId))
                return next
            })
        }
    }

    const toggleRow = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const openBulkEmailDialog = () => {
        const selected = memoizedRecords.filter(r => selectedIds.has(r.registrationId))
        const withEmail = selected.filter(r => r.email && r.email !== 'N/A' && r.email.includes('@'))
        if (withEmail.length === 0) {
            toast.error(t("None of the selected members have a valid email address"))
            return
        }
        setEmailTargets(withEmail)
        setEmailDialogOpen(true)
    }

    const handleSendAlertEmail = async () => {
        setSending(true)
        const batchSize = 5
        let totalSuccess = 0
        let totalFailed = 0
        const total = emailTargets.length
        setSendProgress({ sent: 0, failed: 0, total })

        for (let i = 0; i < emailTargets.length; i += batchSize) {
            const batch = emailTargets.slice(i, i + batchSize)
            try {
                const res = await fetch('/api/admin/send-alert-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipients: batch.map(r => ({
                            registrationId: r.registrationId,
                            name: r.name,
                            email: r.email,
                        }))
                    })
                })
                const data = await res.json()
                if (res.ok) {
                    totalSuccess += data.details?.successCount || 0
                    totalFailed += data.details?.failureCount || 0
                } else {
                    totalFailed += batch.length
                }
            } catch {
                totalFailed += batch.length
            }
            setSendProgress({ sent: totalSuccess, failed: totalFailed, total })
        }

        setSendResults({ successCount: totalSuccess, failureCount: totalFailed })
        setSending(false)
        setSendProgress(null)
        setEmailDialogOpen(false)
        setResultDialogOpen(true)
        setSelectedIds(new Set())
    }

    const handleSendThankYouEmails = async () => {
        setSendingThankYou(true)
        setThankYouResult(null)
        try {
            const res = await fetch("/api/admin/send-thank-you-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
            })
            const data = await res.json()
            if (res.ok) {
                setThankYouResult(data.details)
            } else {
                toast.error(data.error || t("Failed to send emails"))
                setShowThankYouDialog(false)
            }
        } catch {
            toast.error(t("An error occurred while sending emails."))
            setShowThankYouDialog(false)
        } finally {
            setSendingThankYou(false)
        }
    }

    const handleSendIndividualEmail = async (record: DashboardRecord) => {
        if (!record.email || !record.email.includes("@")) {
            toast.error(t("This participant has no valid email address."))
            return
        }
        setSendingEmailId(record._id)
        try {
            const res = await fetch("/api/admin/send-thank-you-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipients: [{
                        registrationId: record.registrationId || "N/A",
                        name: record.name,
                        email: record.email,
                    }]
                })
            })
            const data = await res.json()
            if (res.ok && data.details?.successCount > 0) {
                toast.success(`${t("Thank you email sent to")} ${record.name} (${record.email})`)
            } else {
                toast.error(data.error || t("Failed to send email."))
            }
        } catch {
            toast.error(t("An error occurred while sending the email."))
        } finally {
            setSendingEmailId(null)
        }
    }

    const download = async (format: "xlsx" | "csv" | "json") => {
        setDownloading(format)
        try {
            const res = await fetch(`/api/dashboard/export?format=${format}`)
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `Dashboard_${new Date().toISOString().split("T")[0]}.${format}`
            a.click()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Failed to download:", error)
        } finally {
            setDownloading(null)
        }
    }

    React.useEffect(() => {
        loadRecords()
    }, [loadRecords, filter, type, page, search, regId])

    return (
        <div className="space-y-6 p-5">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{t("Dashboard")}</h1>
                <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => { setShowThankYouDialog(true); setThankYouResult(null) }}
                >
                    <Send className="h-4 w-4" />
                    {t("Send Thank You")}
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="flex items-center gap-2" disabled={!!downloading}>
                            {downloading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            {downloading ? t("Downloading...") : t("Download")}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => download("xlsx")} disabled={!!downloading}>
                            <IconFileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                            Excel (.xlsx)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => download("csv")} disabled={!!downloading}>
                            <IconFileDescription className="h-4 w-4 mr-2 text-blue-600" />
                            CSV (.csv)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => download("json")} disabled={!!downloading}>
                            <IconFileCode className="h-4 w-4 mr-2 text-orange-600" />
                            JSON (.json)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="text-xs text-muted-foreground uppercase font-semibold">{t("Registrations")}</div>
                    <div className="text-xl font-bold">{stats?.totalRegistrations || 0}</div>
                </div>
                <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="text-xs text-muted-foreground uppercase font-semibold">{t("Primary")}</div>
                    <div className="text-xl font-bold">{stats?.primaryMembers || 0}</div>
                </div>
                <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="text-xs text-muted-foreground uppercase font-semibold">{t("Secondary")}</div>
                    <div className="text-xl font-bold">{stats?.secondaryMembers || 0}</div>
                </div>
                <div className="p-4 rounded-lg border bg-blue-50 border-blue-100 text-blue-900 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-100 shadow-sm">
                    <div className="text-xs uppercase font-semibold opacity-80">{t("Sponsors")}</div>
                    <div className="text-xl font-bold">{stats?.totalSponsors || 0}</div>
                </div>
                <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="text-xs text-muted-foreground uppercase font-semibold">{t("Male")}</div>
                    <div className="text-xl font-bold">{stats?.male || 0}</div>
                </div>
                <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="text-xs text-muted-foreground uppercase font-semibold">{t("Female")}</div>
                    <div className="text-xl font-bold">{stats?.female || 0}</div>
                </div>
                <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm ">
                    <div className="text-xs text-muted-foreground uppercase font-semibold">{t("Other")}</div>
                    <div className="text-xl font-bold">{stats?.other || 0}</div>
                </div>
                <div className="p-4 rounded-lg border bg-green-50 border-green-100 text-green-900 dark:bg-green-950/20 dark:border-green-900 dark:text-green-100 shadow-sm">
                    <div className="text-xs uppercase font-semibold opacity-80">{t("Checked-in")}</div>
                    <div className="text-xl font-bold">{stats?.totalCheckedIn || 0}</div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card">
                <div className="flex flex-wrap items-center justify-between p-4 gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <Tabs value={filter} onValueChange={(v) => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            setFilter(v as any)
                            setPage(1)
                        }}>
                            <TabsList className="bg-muted/50">
                                <TabsTrigger value="all">{t("All Status")}</TabsTrigger>
                                <TabsTrigger value="checked-in">{t("Checked-in")}</TabsTrigger>
                                <TabsTrigger value="not-checked-in">{t("Not Checked-in")}</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <Tabs value={type} onValueChange={(v) => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            setType(v as any)
                            setPage(1)
                        }}>
                            <TabsList className="bg-muted/50">
                                <TabsTrigger value="all">{t("All Types")}</TabsTrigger>
                                <TabsTrigger value="primary">{t("Primary")}</TabsTrigger>
                                <TabsTrigger value="secondary">{t("Secondary")}</TabsTrigger>
                                <TabsTrigger value="sponsor">{t("Sponsor")}</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <Tabs value={gender} onValueChange={(v) => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            setGender(v as any)
                            setPage(1)
                        }}>
                            <TabsList className="bg-muted/50">
                                <TabsTrigger value="all">{t("All Genders")}</TabsTrigger>
                                <TabsTrigger value="male">{t("Male")}</TabsTrigger>
                                <TabsTrigger value="female">{t("Female")}</TabsTrigger>
                                <TabsTrigger value="other">{t("Other")}</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 px-4 pb-4">
                    <Input
                        placeholder={t("Search by name or phone...")}
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                        className="max-w-sm"
                    />
                    <Input
                        placeholder={t("Search by Reg ID...")}
                        value={regId}
                        onChange={(e) => {
                            setRegId(e.target.value)
                            setPage(1)
                        }}
                        className="max-w-[200px] border-blue-200 focus:border-blue-500"
                    />
                    {selectedIds.size > 0 && (
                        <Button
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                            onClick={openBulkEmailDialog}
                        >
                            <IconMailFast className="h-4 w-4" />
                            {t("Send Alert Email")} ({selectedIds.size})
                        </Button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px]">
                                    <Checkbox
                                        checked={allPageSelected}
                                        onCheckedChange={toggleSelectAll}
                                        aria-label="Select all on this page"
                                        data-state={somePageSelected && !allPageSelected ? "indeterminate" : undefined}
                                    />
                                </TableHead>
                                <TableHead className="w-[100px]">{t("Reg ID")}</TableHead>
                                <TableHead className="w-[200px]">{t("Name")}</TableHead>
                                <TableHead>{t("Type")}</TableHead>
                                <TableHead>{t("Phone")}</TableHead>
                                <TableHead>{t("Gender")}</TableHead>
                                <TableHead>{t("Primary Member")}</TableHead>
                                <TableHead>{t("Location")}</TableHead>
                                <TableHead>{t("Status")}</TableHead>
                                <TableHead className="text-center">{t("Checked-in")}</TableHead>
                                <TableHead>{t("Created")}</TableHead>
                                <TableHead className="text-center">{t("Actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={12} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : records.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                                        {t("No records found")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                memoizedRecords.map((record, index) => (
                                    <TableRow key={index} data-selected={selectedIds.has(record.registrationId)}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.has(record.registrationId)}
                                                onCheckedChange={() => toggleRow(record.registrationId)}
                                                aria-label={`Select ${record.name}`}
                                            />
                                        </TableCell>
                                        <TableCell className="font-mono text-xs font-bold text-blue-600">
                                            {record.registrationId || "-"}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {search && (record.name.toLowerCase().includes(search.toLowerCase()) || record.phone?.includes(search)) ? (
                                                <span className="bg-yellow-200 dark:bg-yellow-800">{record.name}</span>
                                            ) : record.name}
                                        </TableCell>
                                        <TableCell>
                                            {record.isSponsor ? (
                                                <Badge className="bg-orange-700 text-white">
                                                    {t("Sponsor")}
                                                </Badge>
                                            ) : (
                                                <Badge variant={record.checkedIn ? "default" : "outline"} className={record.checkedIn ? "bg-green-600" : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}>
                                                    {t(record.type)}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {search && record.phone?.includes(search) ? (
                                                <span className="bg-yellow-200 dark:bg-yellow-800">{record.phone}</span>
                                            ) : record.phone}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {t(record.gender)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {record.type === "Secondary" ? (
                                                <div className="text-xs">
                                                    <div>{record.primaryMember}</div>
                                                    <div className="text-muted-foreground">({record.primaryPhone})</div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">{t("Self")}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{record.location || "-"}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                record.approvalStatus === "approved" ? "default" :
                                                record.approvalStatus === "rejected" ? "destructive" :
                                                "secondary"
                                            } className={
                                                record.approvalStatus === "approved" ? "bg-green-600" :
                                                record.approvalStatus === "rejected" ? "bg-red-600" :
                                                "bg-yellow-600"
                                            }>
                                                {t(record.approvalStatus || "pending")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {record.checkedIn && record.approvalStatus === 'approved' ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                                            ) : (
                                                <span className="text-gray-400">○</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                            {record.createdAt ? (
                                                <>
                                                    <div>{new Date(record.createdAt).toLocaleDateString()}</div>
                                                    <div>{new Date(record.createdAt).toLocaleTimeString()}</div>
                                                </>
                                            ) : "—"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setViewingParticipant(record.originalParticipant)}
                                                >
                                                    {t("View")}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                                                    title={record.email && record.email.includes("@") ? `${t("Send thank you email to")} ${record.email}` : t("No email address")}
                                                    disabled={!record.email || !record.email.includes("@") || sendingEmailId === record._id}
                                                    onClick={() => handleSendIndividualEmail(record)}
                                                >
                                                    {sendingEmailId === record._id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Mail className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            {t("Showing")} {((page - 1) * pagination.limit) + 1} {t("to")} {Math.min(page * pagination.limit, pagination.total)} {t("of")} {pagination.total} {t("records")}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                {t("Previous")}
                            </Button>
                            <span className="text-sm">
                                {t("Page")} {page} {t("of")} {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                            >
                                {t("Next")}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {viewingParticipant && (
                <ViewParticipantDialog
                    participant={viewingParticipant}
                    open={!!viewingParticipant}
                    onOpenChange={(open) => !open && setViewingParticipant(null)}
                />
            )}

            <Dialog open={showThankYouDialog} onOpenChange={(open) => {
                if (!sendingThankYou) {
                    setShowThankYouDialog(open)
                    if (!open) setThankYouResult(null)
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5 text-red-600" />
                            {thankYouResult ? t("Emails Sent") : t("Send Thank You Emails")}
                        </DialogTitle>
                        <DialogDescription>
                            {thankYouResult
                                ? t("The thank you emails have been sent to all approved participants.")
                                : t("This will send a 'Thank You for Attending' email to all approved participants who have a valid email address.")}
                        </DialogDescription>
                    </DialogHeader>

                    {thankYouResult ? (
                        <div className="space-y-3 py-2">
                            <div className="flex items-center justify-between rounded-lg border p-3 bg-green-50">
                                <span className="text-sm font-medium text-green-800">{t("Successfully sent")}</span>
                                <span className="text-lg font-bold text-green-700">{thankYouResult.successCount}</span>
                            </div>
                            {thankYouResult.failureCount > 0 && (
                                <div className="flex items-center justify-between rounded-lg border p-3 bg-red-50">
                                    <span className="text-sm font-medium text-red-800">{t("Failed")}</span>
                                    <span className="text-lg font-bold text-red-700">{thankYouResult.failureCount}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                            {t("Only participants with a valid email address will receive the email. This action cannot be undone.")}
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => { setShowThankYouDialog(false); setThankYouResult(null) }}
                            disabled={sendingThankYou}
                        >
                            {thankYouResult ? t("Close") : t("Cancel")}
                        </Button>
                        {!thankYouResult && (
                            <Button
                                onClick={handleSendThankYouEmails}
                                disabled={sendingThankYou}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {sendingThankYou ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {t("Sending...")}
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        {t("Send Emails")}
                                    </>
                                )}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Alert Email Confirmation Dialog */}
            <Dialog open={emailDialogOpen} onOpenChange={(open) => { if (!sending) setEmailDialogOpen(open) }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <IconMailFast className="h-5 w-5 text-red-600" />
                            {t("Send Alert Email")}
                        </DialogTitle>
                        <DialogDescription>
                            {t("Send the RIFAH Annual Summit alert email to the selected participants.")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        {emailTargets.length} {t("participant(s) with valid email will receive the alert email.")}
                    </div>
                    {sendProgress && (
                        <div className="space-y-2 py-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{t("Sending")}...</span>
                                <span className="font-medium">{sendProgress.sent + sendProgress.failed} / {sendProgress.total}</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500 transition-all"
                                    style={{ width: `${((sendProgress.sent + sendProgress.failed) / sendProgress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setEmailDialogOpen(false)} disabled={sending}>
                            {t("Cancel")}
                        </Button>
                        <Button onClick={handleSendAlertEmail} disabled={sending} className="bg-red-600 hover:bg-red-700 text-white">
                            {sending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t("Sending...")}
                                </>
                            ) : (
                                <>
                                    <IconMailFast className="h-4 w-4 mr-2" />
                                    {t("Send")}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Alert Email Results Dialog */}
            <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <IconMailFast className="h-5 w-5 text-red-600" />
                            {t("Email Results")}
                        </DialogTitle>
                        <DialogDescription>
                            {t("Alert emails have been processed.")}
                        </DialogDescription>
                    </DialogHeader>
                    {sendResults && (
                        <div className="space-y-3 py-2">
                            <div className="flex items-center justify-between rounded-lg border p-3 bg-green-50">
                                <span className="text-sm font-medium text-green-800">{t("Successfully sent")}</span>
                                <span className="text-lg font-bold text-green-700">{sendResults.successCount}</span>
                            </div>
                            {sendResults.failureCount > 0 && (
                                <div className="flex items-center justify-between rounded-lg border p-3 bg-red-50">
                                    <span className="text-sm font-medium text-red-800">{t("Failed")}</span>
                                    <span className="text-lg font-bold text-red-700">{sendResults.failureCount}</span>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => { setResultDialogOpen(false); setSendResults(null) }}>
                            {t("Close")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
