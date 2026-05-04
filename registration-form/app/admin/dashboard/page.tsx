"use client"

import * as React from "react"
import { useMemo } from "react"
import { Download, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface DashboardStats {
    totalRegistrations: number
    totalPeople: number
    totalCheckedIn: number
    totalSecondaryCheckedIn: number
    primaryMembers: number
    secondaryMembers: number
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
    approvalStatus?: string
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
    const [type, setType] = React.useState<"all" | "primary" | "secondary">("all")
    const [gender, setGender] = React.useState<"all" | "male" | "female" | "other">("all")
    const [search, setSearch] = React.useState("")
    const [page, setPage] = React.useState(1)
    const [pagination, setPagination] = React.useState<PaginationData | null>(null)
    const [downloading, setDownloading] = React.useState(false)

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
                search
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
    }, [filter, type, gender, page, search])

    React.useEffect(() => {
        loadStats()
    }, [loadStats])

    // Memoize records for performance
    const memoizedRecords = useMemo(() => records, [records])

    React.useEffect(() => {
        loadRecords()
    }, [loadRecords, filter, type, page, search])

    const downloadExcel = async () => {
        setDownloading(true)
        try {
            const res = await fetch("/api/dashboard/export")
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "participants.xlsx"
            a.click()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Failed to download Excel:", error)
        } finally {
            setDownloading(false)
        }
    }

    React.useEffect(() => {
        loadRecords()
    }, [loadRecords, filter, type, page, search])

    return (
        <div className="space-y-6 p-5">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{t("Dashboard")}</h1>
                <Button
                    onClick={downloadExcel}
                    disabled={downloading}
                    className="flex items-center gap-2"
                >
                    {downloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    {t("Export Excel")}
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
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
                <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="text-xs text-muted-foreground uppercase font-semibold">{t("Checked-in")}</div>
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
                <div className="px-4 pb-4">
                    <Input
                        placeholder={t("Search by name or phone...")}
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                        className="max-w-sm"
                    />
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">{t("Name")}</TableHead>
                                <TableHead>{t("Type")}</TableHead>
                                <TableHead>{t("Phone")}</TableHead>
                                <TableHead>{t("Gender")}</TableHead>
                                <TableHead>{t("Primary Member")}</TableHead>
                                <TableHead>{t("Location")}</TableHead>
                                <TableHead>{t("Status")}</TableHead>
                                <TableHead className="text-center">{t("Checked-in")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : records.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        {t("No records found")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                memoizedRecords.map((record, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">
                                            {search && (record.name.toLowerCase().includes(search.toLowerCase()) || record.phone.includes(search)) ? (
                                                <span className="bg-yellow-200 dark:bg-yellow-800">{record.name}</span>
                                            ) : record.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={record.checkedIn ? "default" : "outline"} className={record.checkedIn ? "bg-green-600" : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}>
                                                {t(record.type)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {search && record.phone.includes(search) ? (
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
        </div>
    )
}
