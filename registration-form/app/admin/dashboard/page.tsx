"use client"

import * as React from "react"
import { useMemo } from "react"
import { Download, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
}

interface DashboardRecord {
    _id: string
    type: string
    name: string
    phone: string
    email: string
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
    const [stats, setStats] = React.useState<DashboardStats | null>(null)
    const [records, setRecords] = React.useState<DashboardRecord[]>([])
    const [loading, setLoading] = React.useState(true)
    const [filter, setFilter] = React.useState<"all" | "checked-in" | "not-checked-in">("all")
    const [type, setType] = React.useState<"all" | "primary" | "secondary">("all")
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
    }, [filter, type, page, search])

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
                <h1 className="text-2xl font-bold">Dashboard</h1>
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
                    Export Excel
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="text-sm text-muted-foreground">Total Registrations</div>
                    <div className="text-2xl font-bold">{stats?.totalRegistrations || 0}</div>
                </div>
                <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="text-sm text-muted-foreground">Primary Members</div>
                    <div className="text-2xl font-bold">{stats?.primaryMembers || 0}</div>
                </div>
                <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="text-sm text-muted-foreground">Secondary Members</div>
                    <div className="text-2xl font-bold">{stats?.secondaryMembers || 0}</div>
                </div>
                <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="text-sm text-muted-foreground">Checked-in People</div>
                    <div className="text-2xl font-bold">{stats?.totalCheckedIn || 0}</div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card">
                <div className="flex items-center justify-between p-4 gap-4">
                    <Tabs value={filter} onValueChange={(v) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        setFilter(v as any)
                        setPage(1)
                    }}>
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="checked-in">Checked-in</TabsTrigger>
                            <TabsTrigger value="not-checked-in">Not Checked-in</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Tabs value={type} onValueChange={(v) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        setType(v as any)
                        setPage(1)
                    }}>
                        <TabsList>
                            <TabsTrigger value="all">All Types</TabsTrigger>
                            <TabsTrigger value="primary">Primary</TabsTrigger>
                            <TabsTrigger value="secondary">Secondary</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <div className="px-4 pb-4">
                    <Input
                        placeholder="Search by name or phone..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                        className="max-w-sm"
                    />
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Primary Member</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Checked-in</TableHead>
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
                                    No records found
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
                                            {record.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {search && record.phone.includes(search) ? (
                                            <span className="bg-yellow-200 dark:bg-yellow-800">{record.phone}</span>
                                        ) : record.phone}
                                    </TableCell>
                                    <TableCell>{record.email || "-"}</TableCell>
                                    <TableCell>
                                        {record.type === "Secondary" ? (
                                            <div className="text-xs">
                                                <div>{record.primaryMember}</div>
                                                <div className="text-muted-foreground">({record.primaryPhone})</div>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">Self</span>
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
                                            {record.approvalStatus || "pending"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {record.checkedIn && record.approvalStatus === 'approved' ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <span className="text-gray-400">○</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            Showing {((page - 1) * pagination.limit) + 1} to {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} records
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm">
                                Page {page} of {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
