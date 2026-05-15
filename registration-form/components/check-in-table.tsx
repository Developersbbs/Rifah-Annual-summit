"use client"

import * as React from "react"
import { Search, Loader2, Eye, RefreshCw, Users, CheckCircle2, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { performCheckIn, performSecondaryMemberCheckIn, getCheckInStats, getParticipantsByStatus, resyncAllCheckInStatus } from "@/app/actions/check-in"
import { toast } from "sonner"
import { IParticipant, ISecondaryMember } from "@/lib/types"

type ViewMode = 'search' | 'pending' | 'checked-in'

interface MembersDialogProps {
    participant: IParticipant
    open: boolean
    onOpenChange: (open: boolean) => void
    onRefresh: () => void
    onOptimisticCheckIn: (id: string, type: 'primary' | 'secondary', memberId?: string) => void
}

function MembersDialog({ participant, open, onOpenChange, onRefresh, onOptimisticCheckIn }: MembersDialogProps) {
    const [checkingIn, setCheckingIn] = React.useState<string | null>(null)
    const [searchQuery, setSearchQuery] = React.useState("")

    const handlePrimaryCheckIn = async () => {
        setCheckingIn("primary")
        onOptimisticCheckIn(participant._id, 'primary')

        const res = await performCheckIn(participant._id, { memberPresent: true })
        setCheckingIn(null)

        if (res.success) {
            onRefresh()
            toast.success("Primary member checked in")
        } else {
            onRefresh()
            toast.error(res.error)
        }
    }

    const handleSecondaryMemberCheckIn = async (member: ISecondaryMember, index: number) => {
        setCheckingIn(member.mobileNumber || `index-${index}`)
        onOptimisticCheckIn(participant._id, 'secondary', member.mobileNumber)

        const res = await performSecondaryMemberCheckIn({
            participantId: participant._id,
            memberMobileNumber: member.mobileNumber,
            memberIndex: index
        })
        setCheckingIn(null)

        if (res.success) {
            toast.success(`${res.memberName} checked in`)
            onRefresh()
        } else {
            onRefresh()
            toast.error(res.error)
        }
    }

    const filteredSecondaryMembers = participant.secondaryMembers?.filter((member) => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return (
            member.name.toLowerCase().includes(q) ||
            (member.mobileNumber && member.mobileNumber.toLowerCase().includes(q)) ||
            (member.registrationId && member.registrationId.toLowerCase().includes(q))
        )
    }) || []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalIndex = (member: ISecondaryMember) => participant.secondaryMembers?.findIndex((m: any) => m === member) ?? 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Members — {participant.name}
                    </DialogTitle>
                    <DialogDescription>
                        Check in each member individually
                    </DialogDescription>
                </DialogHeader>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, mobile or register ID..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="space-y-4 mt-2">
                    {/* Primary Member */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className={`h-5 w-5 ${participant.checkIn?.memberPresent ? 'text-green-600' : 'text-muted-foreground'}`} />
                                <span className="font-semibold">{participant.isSponsor ? "Sponsor" : "Primary Member"}</span>
                            </div>
                            <Badge variant={participant.checkIn?.memberPresent ? "default" : "outline"}>
                                {participant.checkIn?.memberPresent ? "Checked In" : "Pending"}
                            </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                            <p className="font-mono text-xs font-bold text-blue-600">{participant.registrationId || "—"}</p>
                            <p><span className="font-medium">Name:</span> {participant.name}</p>
                            <p><span className="font-medium">Mobile:</span> {participant.mobileNumber}</p>
                        </div>
                        {!participant.checkIn?.memberPresent && (
                            <Button
                                className="w-full mt-3"
                                onClick={handlePrimaryCheckIn}
                                disabled={checkingIn === "primary"}
                            >
                                {checkingIn === "primary" ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Checking In...</>
                                ) : (
                                    <><CheckCircle2 className="h-4 w-4 mr-2" />Check In Primary Member</>
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Secondary Members */}
                    {participant.secondaryMembers && participant.secondaryMembers.length > 0 ? (
                        <div className="space-y-3">
                            <h4 className="font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Secondary Members ({participant.secondaryMembers.length})
                            </h4>
                            {filteredSecondaryMembers.map((member, filteredIdx) => {
                                const idx = originalIndex(member)
                                const isLoading = checkingIn === member.mobileNumber || checkingIn === `index-${idx}`
                                return (
                                    <div key={member._id ?? filteredIdx} className="border rounded-lg p-4 bg-muted/30">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className={`h-5 w-5 ${member.isCheckedIn ? 'text-green-600' : 'text-muted-foreground'}`} />
                                                <span className="font-semibold">Member {idx + 1}</span>
                                            </div>
                                            <Badge variant={member.isCheckedIn ? "default" : "outline"}>
                                                {member.isCheckedIn ? "Checked In" : "Pending"}
                                            </Badge>
                                        </div>
                                        <div className="text-sm space-y-1">
                                            <p className="font-mono text-xs font-bold text-orange-600">{member.registrationId || "—"}</p>
                                            <p><span className="font-medium">Name:</span> {member.name}</p>
                                            {member.mobileNumber && <p><span className="font-medium">Mobile:</span> {member.mobileNumber}</p>}
                                            <p><span className="font-medium">Primary:</span> {participant.name} ({participant.mobileNumber})</p>
                                        </div>
                                        {!member.isCheckedIn && (
                                            <Button
                                                className="w-full mt-3"
                                                onClick={() => handleSecondaryMemberCheckIn(member, idx)}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Checking In...</>
                                                ) : (
                                                    <><CheckCircle2 className="h-4 w-4 mr-2" />Check In Member {idx + 1}</>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                )
                            })}
                            {filteredSecondaryMembers.length === 0 && searchQuery && (
                                <div className="text-center text-muted-foreground py-4 text-sm">
                                    No members match your search
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-4 text-sm">
                            No secondary members registered
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function CheckInTable() {
    const [view, setView] = React.useState<ViewMode>('search')
    const [query, setQuery] = React.useState("")
    const [results, setResults] = React.useState<IParticipant[]>([])
    const [loading, setLoading] = React.useState(false)
    const [syncing, setSyncing] = React.useState(false)
    const [debouncedQuery, setDebouncedQuery] = React.useState("")
    const [stats, setStats] = React.useState({
        registeredMembers: 0,
        registeredParticipants: 0,
        checkedInMembers: 0,
        checkedInParticipants: 0,
        totalSponsors: 0,
        checkedInSponsors: 0
    })
    const [page, setPage] = React.useState(1)
    const [pagination, setPagination] = React.useState({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
    })
    const [regId, setRegId] = React.useState("")
    const [debouncedRegId, setDebouncedRegId] = React.useState("")

    // Optimistic update — keeps UI responsive before server confirms
    const handleOptimisticCheckIn = (participantId: string, type: 'primary' | 'secondary', memberId?: string) => {
        setResults(prev =>
            prev.map(p => {
                if (p._id !== participantId) return p

                if (type === 'primary') {
                    return {
                        ...p,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        checkIn: { ...p.checkIn, memberPresent: true } as any
                    }
                }

                if (type === 'secondary' && memberId) {
                    return {
                        ...p,
                        secondaryMembers: p.secondaryMembers?.map(m =>
                            m.mobileNumber === memberId ? { ...m, isCheckedIn: true } : m
                        )
                    }
                }

                return p
            })
        )
    }

    const loadStats = async () => {
        const s = await getCheckInStats()
        setStats(s)
    }

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const status = view === 'search' ? 'all' : view
        const data = await getParticipantsByStatus(status, page, 20, debouncedQuery, debouncedRegId)
        setResults(data.records)
        setPagination(data.pagination)
        setLoading(false)
    }, [view, page, debouncedQuery, debouncedRegId])

    // Initial load — re-sync stale DB data on first render
    React.useEffect(() => {
        const init = async () => {
            await resyncAllCheckInStatus()
            await Promise.all([fetchData(), loadStats()])
        }
        init()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 500)
        return () => clearTimeout(timer)
    }, [query])

    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedRegId(regId), 500)
        return () => clearTimeout(timer)
    }, [regId])

    React.useEffect(() => {
        fetchData()
        loadStats()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedQuery, debouncedRegId, view, page])

    const handleRefresh = async () => {
        await fetchData()
        await loadStats()
    }

    const handleResync = async () => {
        setSyncing(true)
        const res = await resyncAllCheckInStatus()
        if (res.success) {
            toast.success(`Re-synced ${res.synced} participant records`)
            await Promise.all([fetchData(), loadStats()])
        } else {
            toast.error(res.error ?? "Re-sync failed")
        }
        setSyncing(false)
    }

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="text-xs sm:text-sm text-muted-foreground">Total Primary</div>
                    <div className="text-xl sm:text-2xl font-bold">{stats.registeredMembers}</div>
                </div>
                <div className="p-3 sm:p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="text-xs sm:text-sm text-muted-foreground">Total Secondary</div>
                    <div className="text-xl sm:text-2xl font-bold">{stats.registeredParticipants}</div>
                </div>
                <div className="p-3 sm:p-4 rounded-lg border bg-blue-50 text-blue-900 border-blue-100 dark:bg-blue-900/20 dark:text-blue-100 dark:border-blue-900">
                    <div className="text-xs sm:text-sm opacity-80">Total Sponsors</div>
                    <div className="text-xl sm:text-2xl font-bold">{stats.totalSponsors}</div>
                </div>
                <div className="p-3 sm:p-4 rounded-lg border bg-green-50 text-green-900 border-green-100 dark:bg-green-900/20 dark:text-green-100 dark:border-green-900">
                    <div className="text-xs sm:text-sm opacity-80">Checked-in Pri</div>
                    <div className="text-xl sm:text-2xl font-bold">{stats.checkedInMembers}</div>
                </div>
                <div className="p-3 sm:p-4 rounded-lg border bg-green-50 text-green-900 border-green-100 dark:bg-green-900/20 dark:text-green-100 dark:border-green-900">
                    <div className="text-xs sm:text-sm opacity-80">Checked-in Sec</div>
                    <div className="text-xl sm:text-2xl font-bold">{stats.checkedInParticipants}</div>
                </div>
                <div className="p-3 sm:p-4 rounded-lg border bg-green-100 text-green-900 border-green-200 dark:bg-green-900/40 dark:text-green-100 dark:border-green-800">
                    <div className="text-xs sm:text-sm opacity-80">Total Checked</div>
                    <div className="text-xl sm:text-2xl font-bold">{stats.checkedInMembers + stats.checkedInParticipants}</div>
                </div>
                <div className="p-3 sm:p-4 rounded-lg border bg-green-50 text-green-900 border-green-100 dark:bg-green-900/20 dark:text-green-100 dark:border-green-900">
                    <div className="text-xs sm:text-sm opacity-80">Checked-in Spo</div>
                    <div className="text-xl sm:text-2xl font-bold">{stats.checkedInSponsors}</div>
                </div>
            </div>

            <Tabs value={view} onValueChange={(v) => {
                setView(v as ViewMode)
                setPage(1)
            }} className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="search">All Participants</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="checked-in">Checked In</TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResync}
                            disabled={syncing}
                            title="Fix stale check-in data"
                        >
                            <RotateCcw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by Name or Mobile..."
                            className="pl-9 h-11"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value)
                                setPage(1)
                            }}
                        />
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by Register ID..."
                            className="pl-9 h-11 border-blue-200 focus:border-blue-500"
                            value={regId}
                            onChange={(e) => {
                                setRegId(e.target.value)
                                setPage(1)
                            }}
                        />
                    </div>
                </div>

                <div className="rounded-md border bg-card overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[250px]">Participant</TableHead>
                                <TableHead className="text-center">Registered</TableHead>
                                <TableHead className="text-center">Member</TableHead>
                                <TableHead className="text-center">Check In</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.length > 0 ? (
                                results.map((p) => (
                                    <CheckInRow
                                        key={p._id}
                                        participant={p}
                                        onRefresh={handleRefresh}
                                        onOptimisticCheckIn={handleOptimisticCheckIn}
                                    />
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        {loading ? "Loading..." : (
                                            view === 'search'
                                                ? "No participants found."
                                                : "No participants in this list."
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            Showing {((page - 1) * pagination.limit) + 1}–{Math.min(page * pagination.limit, pagination.total)} of {pagination.total} records
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
                            <span className="text-sm">Page {page} of {pagination.totalPages}</span>
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
            </Tabs>
        </div>
    )
}

function CheckInRow({ participant, onRefresh, onOptimisticCheckIn }: {
    participant: IParticipant
    onRefresh: () => void
    onOptimisticCheckIn: (id: string, type: 'primary' | 'secondary', memberId?: string) => void
}) {
    const [showMembersDialog, setShowMembersDialog] = React.useState(false)

    // Derive all state from actual individual check-in flags — never trust checkIn.isCheckedIn from DB
    const primaryCheckedIn = participant.checkIn?.memberPresent || false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const secondaryCheckedIn = participant.secondaryMembers?.filter((m: any) => m.isCheckedIn).length || 0
    const totalSecondary = participant.secondaryMembers?.length || 0
    const totalCheckedIn = (primaryCheckedIn ? 1 : 0) + secondaryCheckedIn
    const totalRegistered = 1 + totalSecondary
    const isAllChecked = totalCheckedIn === totalRegistered
    const balanceSecondary = totalSecondary - secondaryCheckedIn
    const isSecondaryComplete = totalSecondary > 0 && secondaryCheckedIn === totalSecondary

    return (
        <>
            <TableRow>
                <TableCell>
                    <div className="font-mono text-xs font-bold text-orange-600 mb-1">{participant.registrationId || "—"}</div>
                    <div className="font-semibold">{participant.name}</div>
                    <div className="text-xs text-muted-foreground">{participant.mobileNumber}</div>
                    <Badge variant="outline" className="mt-1">{participant.location || "Unassigned"}</Badge>
                    <div className="mt-2 text-xs">
                        <span className="text-muted-foreground">Checked In:</span>{" "}
                        <span className={`font-bold ${isAllChecked ? 'text-green-600' : totalCheckedIn > 0 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                            {totalCheckedIn}/{totalRegistered}
                        </span>
                    </div>
                </TableCell>

                <TableCell className="text-center">
                    <div className="space-y-1">
                        <div className="text-sm font-medium">
                            {primaryCheckedIn ? "✓" : "○"} {participant.isSponsor ? "Sponsor" : "Primary"}
                        </div>
                        {totalSecondary > 0 && (
                            <div className="text-xs text-muted-foreground">
                                {isSecondaryComplete ? "✓" : "○"} Secondary
                            </div>
                        )}
                        {totalSecondary > 0 && balanceSecondary > 0 && (
                            <div className="text-[10px] text-orange-600 font-medium">
                                Balance: {balanceSecondary}
                            </div>
                        )}
                    </div>
                </TableCell>

                <TableCell className="text-center">
                    <div className="text-sm font-medium">{participant.memberCount || totalRegistered}</div>
                    {participant.secondaryMembers && participant.secondaryMembers.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs mt-1"
                            onClick={() => setShowMembersDialog(true)}
                        >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                        </Button>
                    )}
                </TableCell>

                <TableCell className="text-center">
                    {isAllChecked ? (
                        <Badge variant="default" className="bg-green-600">
                            Checked In All
                        </Badge>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowMembersDialog(true)}
                        >
                            Update
                        </Button>
                    )}
                </TableCell>
            </TableRow>

            <MembersDialog
                participant={participant}
                open={showMembersDialog}
                onOpenChange={setShowMembersDialog}
                onRefresh={onRefresh}
                onOptimisticCheckIn={onOptimisticCheckIn}
            />
        </>
    )
}
