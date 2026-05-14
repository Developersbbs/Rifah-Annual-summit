"use client"

import { useState, useEffect, useCallback } from "react"
import {
    IconDownload,
    IconSearch,
    IconFileSpreadsheet,
    IconFileDescription,
    IconFileCode,
    IconRefresh,
    IconMail,
    IconMailFast,
    IconSend
} from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
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
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import * as XLSX from "xlsx"

interface Member {
    registrationId: string
    name: string
    mobileNumber: string
    email: string
    location: string
    type: string
    isSponsor: boolean
    gender: string
    businessName: string
    businessCategory: string
    paymentStatus: string
    approvalStatus: string
    createdAt: string
}

export default function MembersPage() {
    const { t } = useTranslation()
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // Email send state
    const [emailDialogOpen, setEmailDialogOpen] = useState(false)
    const [emailTargets, setEmailTargets] = useState<Member[]>([])
    const [sending, setSending] = useState(false)

    const fetchMembers = useCallback(async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/admin/members')
            const data = await response.json()
            if (data.error) throw new Error(data.error)
            setMembers(data.members)
        } catch (error) {
            console.error("Error fetching members:", error)
            toast.error(t("Error fetching member list"))
        } finally {
            setLoading(false)
        }
    }, [t])

    useEffect(() => {
        fetchMembers()
    }, [fetchMembers])

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.mobileNumber.includes(search) ||
        m.registrationId.toLowerCase().includes(search.toLowerCase())
    )

    // Selection helpers
    const allFilteredSelected = filteredMembers.length > 0 &&
        filteredMembers.every(m => selectedIds.has(m.registrationId))
    const someFilteredSelected = filteredMembers.some(m => selectedIds.has(m.registrationId))

    const toggleSelectAll = () => {
        if (allFilteredSelected) {
            setSelectedIds(prev => {
                const next = new Set(prev)
                filteredMembers.forEach(m => next.delete(m.registrationId))
                return next
            })
        } else {
            setSelectedIds(prev => {
                const next = new Set(prev)
                filteredMembers.forEach(m => next.add(m.registrationId))
                return next
            })
        }
    }

    const toggleRow = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const openEmailDialog = (targets: Member[]) => {
        const withEmail = targets.filter(m => m.email && m.email !== 'N/A' && m.email.includes('@'))
        if (withEmail.length === 0) {
            toast.error("None of the selected members have a valid email address")
            return
        }
        setEmailTargets(withEmail)
        setEmailDialogOpen(true)
    }

    const openBulkEmailDialog = () => {
        const selected = filteredMembers.filter(m => selectedIds.has(m.registrationId))
        openEmailDialog(selected)
    }

    const openIndividualEmailDialog = (member: Member) => {
        openEmailDialog([member])
    }

    const handleSendEmail = async () => {
        setSending(true)
        try {
            const res = await fetch('/api/admin/send-alert-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipients: emailTargets.map(m => ({
                        registrationId: m.registrationId,
                        name: m.name,
                        email: m.email
                    }))
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to send")
            toast.success(data.message)
            setEmailDialogOpen(false)
            setSelectedIds(new Set())
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to send emails")
        } finally {
            setSending(false)
        }
    }

    // Export helpers
    const toExportRows = (data: Member[]) =>
        data.map(({ isSponsor, type, createdAt, ...rest }) => ({
            ...rest,
            type: isSponsor ? "Sponsor" : type,
            createdAt: createdAt
                ? new Date(createdAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                })
                : "",
        }))

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(toExportRows(filteredMembers))
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Members")
        XLSX.writeFile(workbook, `RIFAH_Members_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    const exportToCSV = () => {
        const worksheet = XLSX.utils.json_to_sheet(toExportRows(filteredMembers))
        const csv = XLSX.utils.sheet_to_csv(worksheet)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `RIFAH_Members_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const exportToJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(toExportRows(filteredMembers), null, 2))
        const downloadAnchorNode = document.createElement('a')
        downloadAnchorNode.setAttribute("href", dataStr)
        downloadAnchorNode.setAttribute("download", `RIFAH_Members_${new Date().toISOString().split('T')[0]}.json`)
        document.body.appendChild(downloadAnchorNode)
        downloadAnchorNode.click()
        downloadAnchorNode.remove()
    }

    const selectedCount = filteredMembers.filter(m => selectedIds.has(m.registrationId)).length

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("All Members")}</h1>
                    <p className="text-muted-foreground">{t("View and export all registered members (Primary & Secondary)")}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchMembers} disabled={loading}>
                        <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {t("Refresh")}
                    </Button>
                    <Button
                        size="sm"
                        variant="default"
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        onClick={() => openEmailDialog(filteredMembers)}
                        disabled={loading || filteredMembers.length === 0}
                    >
                        <IconMailFast className="h-4 w-4 mr-2" />
                        {t("Send Bulk Email")}
                        {!loading && filteredMembers.length > 0 && (
                            <span className="ml-1.5 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                                {filteredMembers.filter(m => m.email && m.email !== 'N/A' && m.email.includes('@')).length}
                            </span>
                        )}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="default" size="sm">
                                <IconDownload className="h-4 w-4 mr-2" />
                                {t("Download")}
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
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium flex items-center justify-between gap-3 flex-wrap">
                        <div className="relative w-full max-w-sm">
                            <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder={t("Search by name, phone or ID...")}
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            {selectedCount > 0 && (
                                <Button
                                    size="sm"
                                    variant="default"
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                    onClick={openBulkEmailDialog}
                                >
                                    <IconMailFast className="h-4 w-4 mr-2" />
                                    Send Email ({selectedCount})
                                </Button>
                            )}
                            <div className="text-sm text-muted-foreground font-normal">
                                {t("Total Members")}: {filteredMembers.length}
                            </div>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-10">
                                        <Checkbox
                                            checked={allFilteredSelected}
                                            data-state={someFilteredSelected && !allFilteredSelected ? "indeterminate" : undefined}
                                            onCheckedChange={toggleSelectAll}
                                            aria-label="Select all"
                                        />
                                    </TableHead>
                                    <TableHead className="w-[120px]">{t("Register ID")}</TableHead>
                                    <TableHead>{t("Name")}</TableHead>
                                    <TableHead>{t("Mobile")}</TableHead>
                                    <TableHead>{t("Type")}</TableHead>
                                    <TableHead>{t("Location")}</TableHead>
                                    <TableHead>{t("Created")}</TableHead>
                                    <TableHead>{t("Status")}</TableHead>
                                    <TableHead className="w-12 text-center">{t("Email")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {Array.from({ length: 9 }).map((_, j) => (
                                                <TableCell key={j}><div className="h-4 w-full bg-muted animate-pulse rounded" /></TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : filteredMembers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                                            {t("No members found")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredMembers.map((member, idx) => (
                                        <TableRow
                                            key={idx}
                                            className={selectedIds.has(member.registrationId) ? "bg-orange-50 dark:bg-orange-950/20" : ""}
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.has(member.registrationId)}
                                                    onCheckedChange={() => toggleRow(member.registrationId)}
                                                    aria-label={`Select ${member.name}`}
                                                />
                                            </TableCell>
                                            <TableCell className="font-bold text-primary">{member.registrationId}</TableCell>
                                            <TableCell className="font-medium">{member.name}</TableCell>
                                            <TableCell>{member.mobileNumber}</TableCell>
                                            <TableCell>
                                                {member.isSponsor ? (
                                                    <Badge variant="outline" className="border-purple-400 text-purple-600 bg-purple-50">
                                                        {t("Sponsor")}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant={member.type === 'Primary' ? 'default' : 'secondary'}>
                                                        {t(member.type)}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>{member.location}</TableCell>
                                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                                {member.createdAt ? (
                                                    <>
                                                        <div>{new Date(member.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                        <div className="text-xs">{new Date(member.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                                                    </>
                                                ) : "—"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    member.approvalStatus === 'approved' ? 'success' :
                                                        member.approvalStatus === 'rejected' ? 'destructive' : 'warning'
                                                }>
                                                    {t(member.approvalStatus)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    disabled={!member.email || member.email === 'N/A' || !member.email.includes('@')}
                                                    title={member.email && member.email !== 'N/A' ? `Send email to ${member.email}` : "No email address"}
                                                    onClick={() => openIndividualEmailDialog(member)}
                                                >
                                                    <IconMail className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Email Send Confirmation Dialog */}
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <IconSend className="h-5 w-5 text-orange-600" />
                            Send Event Alert Email
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Template preview card */}
                        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 px-4 py-3">
                            <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1">Template</p>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">RIFAH Annual Summit 2026 — Event Alert</p>
                            <p className="text-xs text-muted-foreground mt-1">Includes: Schedule · Dress Code · Venue · Important Notes</p>
                        </div>

                        {/* Subject */}
                        <div className="rounded-lg border bg-muted/40 px-4 py-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Subject</p>
                            <p className="text-sm text-foreground">Important Information — RIFAH Annual Summit 2026</p>
                        </div>

                        {/* Recipients */}
                        <div className="rounded-lg border bg-orange-50 dark:bg-orange-950/20 px-4 py-3">
                            <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wide mb-1">
                                Recipients ({emailTargets.length})
                            </p>
                            {emailTargets.length === 1 ? (
                                <p className="text-sm text-gray-800 dark:text-gray-200">
                                    {emailTargets[0].name}
                                    <span className="text-muted-foreground ml-1">({emailTargets[0].email})</span>
                                </p>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-800 dark:text-gray-200">
                                        {emailTargets.slice(0, 4).map(m => m.name).join(", ")}
                                        {emailTargets.length > 4 && (
                                            <span className="text-muted-foreground"> +{emailTargets.length - 4} more</span>
                                        )}
                                    </p>
                                </>
                            )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Each recipient will receive a personalised email with their name and registration ID. This is a manual send — emails are not sent automatically.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEmailDialogOpen(false)} disabled={sending}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSendEmail}
                            disabled={sending}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            {sending ? (
                                <><IconRefresh className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                            ) : (
                                <><IconSend className="h-4 w-4 mr-2" /> Send to {emailTargets.length} {emailTargets.length === 1 ? "Member" : "Members"}</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
