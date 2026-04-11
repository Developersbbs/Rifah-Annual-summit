"use client"

import * as React from "react"
import { Search, Loader2, Minus, Plus, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { performCheckIn, getCheckInStats, getParticipantsByStatus } from "@/app/actions/check-in"
import { toast } from "sonner"
import { IParticipant } from "@/lib/types"

type ViewMode = 'search' | 'pending' | 'checked-in'

export function CheckInTable() {
    const [view, setView] = React.useState<ViewMode>('search')
    const [query, setQuery] = React.useState("")
    const [results, setResults] = React.useState<IParticipant[]>([])
    const [loading, setLoading] = React.useState(false)
    const [debouncedQuery, setDebouncedQuery] = React.useState("")
    const [stats, setStats] = React.useState({
        registeredMembers: 0,
        registeredParticipants: 0,
        checkedInMembers: 0,
        checkedInParticipants: 0
    })

    const loadStats = async () => {
        const s = await getCheckInStats()
        setStats(s)
    }

    React.useEffect(() => {
        const loadStatsInit = async () => {
            await loadStats()
        }
        loadStatsInit()
    }, [])

    // Search Logic
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query)
        }, 500)
        return () => clearTimeout(timer)
    }, [query])

    // Fetch Logic based on View
    const fetchData = async () => {
        setLoading(true)
        let data = []
        // Treat 'search' view as 'all' status
        const status = view === 'search' ? 'all' : view
        // Increased limit for better search experience, or implement pagination later
        data = await getParticipantsByStatus(status, 1, 50, debouncedQuery)
        setResults(data)
        setLoading(false)
    }

    React.useEffect(() => {
        const fetchAll = async () => {
            await fetchData()
            await loadStats()
        }
        fetchAll()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedQuery, view])

    const handleRefresh = () => {
        fetchData()
        loadStats()
    }

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="text-sm text-muted-foreground">Registered Members</div>
                    <div className="text-2xl font-bold">{stats.registeredMembers}</div>
                </div>
                <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="text-sm text-muted-foreground">Registered Participants</div>
                    <div className="text-2xl font-bold">{stats.registeredParticipants}</div>
                </div>
                <div className="p-4 rounded-lg border bg-green-50 text-green-900 border-green-100 dark:bg-green-900/20 dark:text-green-100 dark:border-green-900">
                    <div className="text-sm opacity-80">Checked-in Members</div>
                    <div className="text-2xl font-bold">{stats.checkedInMembers}</div>
                </div>
                <div className="p-4 rounded-lg border bg-green-50 text-green-900 border-green-100 dark:bg-green-900/20 dark:text-green-100 dark:border-green-900">
                    <div className="text-sm opacity-80">Checked-in Participants</div>
                    <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-bold">{stats.checkedInParticipants}</div>
                        <div className="text-sm font-medium opacity-80">
                            (Total Headcount: {stats.checkedInMembers + stats.checkedInParticipants})
                        </div>
                    </div>
                </div>
            </div>

            <Tabs value={view} onValueChange={(v) => {
                setView(v as ViewMode)
            }} className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="search">All Participants</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="checked-in">Checked In</TabsTrigger>
                    </TabsList>
                    <Button variant="ghost" size="sm" onClick={handleRefresh}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by Name or Mobile..."
                        className="pl-9 h-12 text-lg"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                {/* Single Table for all views */}
                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[250px]">Participant</TableHead>
                                <TableHead className="text-center">Registered</TableHead>
                                <TableHead className="text-center">Member</TableHead>
                                <TableHead className="text-center">Guest Adults</TableHead>
                                <TableHead className="text-center">Children</TableHead>
                                <TableHead className="text-center">Balance</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.length > 0 ? (
                                results.map((p) => (
                                    <CheckInRow key={p._id} participant={p} onRefresh={handleRefresh} />
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        {loading ? "Loading..." : (
                                            view === 'search'
                                                ? (query.length < 2 ? "Enter search query..." : "No participants found.")
                                                : "No participants in this list."
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                {view !== 'search' && results.length >= 20 && (
                    <div className="text-center text-xs text-muted-foreground mt-2">Showing recent 20 items. Search to find specific users.</div>
                )}
            </Tabs>
        </div>
    )
}

function CheckInRow({ participant, onRefresh }: { participant: IParticipant, onRefresh: () => void }) {
    // Initial State derived from DB
    const isCheckedIn = participant.checkIn?.isCheckedIn

    // Registered Values
    const regAdults = participant.ageGroups?.adults || 1
    const regChildren = participant.ageGroups?.children || 0

    const dbMemberPresent = participant.checkIn?.memberPresent ?? true
    const dbActualAdults = participant.checkIn?.actualAdults ?? 0
    const dbActualChildren = participant.checkIn?.actualChildren ?? 0

    const getInitialGuestAdults = () => {
        if (!isCheckedIn) return 0
        return Math.max(0, dbActualAdults - (dbMemberPresent ? 1 : 0))
    }

    const [memberPresent, setMemberPresent] = React.useState(
        isCheckedIn ? (participant.checkIn?.memberPresent ?? false) : false
    )
    const [guestAdults, setGuestAdults] = React.useState(getInitialGuestAdults())
    const [guestChildren, setGuestChildren] = React.useState(
        isCheckedIn ? dbActualChildren : 0
    )

    const [saving, setSaving] = React.useState(false)

    // Constraints
    const maxGuestAdults = Math.max(0, regAdults - 1)
    const maxGuestChildren = regChildren

    const currentActualAdults = (memberPresent ? 1 : 0) + guestAdults
    const balanceAdults = regAdults - currentActualAdults
    const balanceChildren = regChildren - guestChildren
    const isFullCheckIn = balanceAdults === 0 && balanceChildren === 0

    const handleSave = async () => {
        setSaving(true)
        const res = await performCheckIn(participant._id, {
            memberPresent,
            guestAdults,
            guestChildren
        })
        setSaving(false)
        if (res.success) {
            onRefresh()
            toast.success("Check-in updated")
        } else {
            toast.error(res.error)
        }
    }

    return (
        <TableRow>
            <TableCell>
                <div className="font-semibold">{participant.name}</div>
                <div className="text-xs text-muted-foreground">{participant.mobileNumber}</div>
                <Badge variant="outline" className="mt-1">Group {participant.groupNumber}</Badge>
            </TableCell>
            <TableCell className="text-center">
                <div className="text-sm">
                    <div>A: {regAdults}</div>
                    <div>C: {regChildren}</div>
                </div>
            </TableCell>

            {/* Member Checkbox */}
            <TableCell className="text-center">
                <Checkbox
                    checked={memberPresent}
                    onCheckedChange={(c) => setMemberPresent(!!c)}
                    className="h-5 w-5"
                />
            </TableCell>

            {/* Guest Adults */}
            <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline" size="icon" className="h-6 w-6"
                        onClick={() => setGuestAdults(Math.max(0, guestAdults - 1))}
                    >
                        <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-4 font-mono font-bold">{guestAdults}</span>
                    <Button
                        variant="outline" size="icon" className="h-6 w-6"
                        disabled={guestAdults >= maxGuestAdults}
                        onClick={() => setGuestAdults(guestAdults + 1)}
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">Max: {maxGuestAdults}</div>
            </TableCell>

            {/* Guest Children */}
            <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline" size="icon" className="h-6 w-6"
                        onClick={() => setGuestChildren(Math.max(0, guestChildren - 1))}
                    >
                        <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-4 font-mono font-bold">{guestChildren}</span>
                    <Button
                        variant="outline" size="icon" className="h-6 w-6"
                        disabled={guestChildren >= maxGuestChildren}
                        onClick={() => setGuestChildren(guestChildren + 1)}
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">Max: {maxGuestChildren}</div>
            </TableCell>

            {/* Balance */}
            <TableCell className="text-center text-muted-foreground font-mono text-xs">
                <div>A: {balanceAdults}</div>
                <div>C: {balanceChildren}</div>
            </TableCell>

            <TableCell className="text-right">
                <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    variant={isCheckedIn ? (isFullCheckIn ? "default" : "outline") : "default"}
                    className={isCheckedIn ? (isFullCheckIn ? "bg-green-600 hover:bg-green-700 w-28" : "border-green-500 text-green-600 hover:text-green-700 hover:bg-green-50 w-28") : "w-28"}
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        isCheckedIn ? (isFullCheckIn ? "Checked All" : "Update") : "Check In"
                    )}
                </Button>
            </TableCell>
        </TableRow>
    )
}
