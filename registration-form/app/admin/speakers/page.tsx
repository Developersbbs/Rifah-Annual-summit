"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, RefreshCw, Users, Mic, Download, Pencil } from "lucide-react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    IconFileSpreadsheet,
    IconFileDescription,
    IconFileCode,
} from "@tabler/icons-react"
import { toast } from "sonner"
import {
    CreateSpeakerVolunteerDialog,
    type SpeakerVolunteerRecord,
} from "@/components/create-speaker-volunteer-dialog"

interface SpeakerVolunteer {
    _id: string
    role: "speaker" | "volunteer"
    name: string
    email?: string
    mobileNumber?: string
    organization?: string
    designation?: string
    topic?: string
    bio?: string
    createdAt: string
}

const FILENAME_BASE = `Speakers_Volunteers_${new Date().toISOString().split("T")[0]}`

function toExportRows(data: SpeakerVolunteer[]) {
    return data.map((r) => ({
        Role: r.role,
        Name: r.name,
        Email: r.email || "",
        "Mobile Number": r.mobileNumber || "",
        Organization: r.organization || "",
        Designation: r.designation || "",
        "Topic / Session": r.role === "speaker" ? r.topic || "" : "",
        "Bio / Notes": r.bio || "",
        "Created At": new Date(r.createdAt).toLocaleDateString(),
    }))
}

export default function SpeakersVolunteersPage() {
    const [records, setRecords] = useState<SpeakerVolunteer[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState<"all" | "speaker" | "volunteer">("all")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editRecord, setEditRecord] = useState<SpeakerVolunteerRecord | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)

    const fetchRecords = useCallback(async () => {
        setLoading(true)
        try {
            const url =
                roleFilter === "all"
                    ? "/api/speakers-volunteers"
                    : `/api/speakers-volunteers?role=${roleFilter}`
            const res = await fetch(url)
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            setRecords(data.records)
        } catch (err) {
            console.error(err)
            toast.error("Failed to fetch records")
        } finally {
            setLoading(false)
        }
    }, [roleFilter])

    useEffect(() => {
        fetchRecords()
    }, [fetchRecords])

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this record?")) return
        setDeleting(id)
        try {
            const res = await fetch(`/api/speakers-volunteers/${id}`, { method: "DELETE" })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success("Deleted successfully")
            setRecords((prev) => prev.filter((r) => r._id !== id))
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Delete failed")
        } finally {
            setDeleting(null)
        }
    }

    const handleEdit = (record: SpeakerVolunteer) => {
        setEditRecord(record)
        setDialogOpen(true)
    }

    const handleDialogClose = () => {
        setDialogOpen(false)
        setEditRecord(null)
    }

    const filtered = records.filter((r) => {
        const q = search.toLowerCase()
        return (
            r.name.toLowerCase().includes(q) ||
            (r.email?.toLowerCase().includes(q) ?? false) ||
            (r.organization?.toLowerCase().includes(q) ?? false) ||
            (r.topic?.toLowerCase().includes(q) ?? false)
        )
    })

    // ── Export helpers ──────────────────────────────────────────────────────────

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(toExportRows(filtered))
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Speakers & Volunteers")
        XLSX.writeFile(wb, `${FILENAME_BASE}.xlsx`)
    }

    const exportToCSV = () => {
        const ws = XLSX.utils.json_to_sheet(toExportRows(filtered))
        const csv = XLSX.utils.sheet_to_csv(ws)
        triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${FILENAME_BASE}.csv`)
    }

    const exportToJSON = () => {
        triggerDownload(
            new Blob([JSON.stringify(toExportRows(filtered), null, 2)], { type: "application/json" }),
            `${FILENAME_BASE}.json`
        )
    }

    const triggerDownload = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // ───────────────────────────────────────────────────────────────────────────

    const speakerCount = records.filter((r) => r.role === "speaker").length
    const volunteerCount = records.filter((r) => r.role === "volunteer").length

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Speakers & Volunteers</h1>
                    <p className="text-muted-foreground">Manage event speakers and volunteers</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Download
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={exportToExcel}>
                                <IconFileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                                Excel (.xlsx)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={exportToCSV}>
                                <IconFileDescription className="h-4 w-4 mr-2 text-blue-600" />
                                CSV (.csv)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={exportToJSON}>
                                <IconFileCode className="h-4 w-4 mr-2 text-orange-600" />
                                JSON (.json)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        onClick={() => { setEditRecord(null); setDialogOpen(true) }}
                        className="flex items-center gap-2 flex-1 sm:flex-none"
                    >
                        <Plus className="h-4 w-4" />
                        Create Speaker / Volunteer
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="rounded-full bg-blue-100 p-2">
                            <Mic className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Speakers</p>
                            <p className="text-2xl font-bold">{speakerCount}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="rounded-full bg-green-100 p-2">
                            <Users className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Volunteers</p>
                            <p className="text-2xl font-bold">{volunteerCount}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-2 sm:col-span-1">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="rounded-full bg-purple-100 p-2">
                            <Users className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="text-2xl font-bold">{records.length}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                            <div className="flex gap-2">
                                {(["all", "speaker", "volunteer"] as const).map((r) => (
                                    <Button
                                        key={r}
                                        variant={roleFilter === r ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setRoleFilter(r)}
                                        className="capitalize"
                                    >
                                        {r}
                                    </Button>
                                ))}
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto items-center">
                                <Input
                                    placeholder="Search name, email, org..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="max-w-xs"
                                />
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                                </span>
                                <Button variant="outline" size="icon" onClick={fetchRecords} disabled={loading}>
                                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                                </Button>
                            </div>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Designation</TableHead>
                                    <TableHead>Topic / Notes</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {Array.from({ length: 7 }).map((_, j) => (
                                                <TableCell key={j}>
                                                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                            No records found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((record) => (
                                        <TableRow key={record._id}>
                                            <TableCell className="font-medium">{record.name}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={record.role === "speaker" ? "default" : "secondary"}
                                                    className="capitalize"
                                                >
                                                    {record.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{record.organization || "—"}</TableCell>
                                            <TableCell>{record.designation || "—"}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">
                                                {record.role === "speaker" ? record.topic || "—" : record.bio || "—"}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                <div>{record.email || ""}</div>
                                                <div>{record.mobileNumber || ""}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(record)}
                                                        className="text-muted-foreground hover:text-foreground"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(record._id)}
                                                        disabled={deleting === record._id}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        {deleting === record._id ? (
                                                            <SpinIcon className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
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
                </CardContent>
            </Card>

            <CreateSpeakerVolunteerDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                onCreated={fetchRecords}
                editRecord={editRecord}
            />
        </div>
    )
}

function SpinIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
