"use client"

import { useState, useEffect, useCallback } from "react"
import {
    IconDownload,
    IconSearch,
    IconFileSpreadsheet,
    IconFileDescription,
    IconFileCode,
    IconRefresh
} from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

    const toExportRows = (data: Member[]) =>
        data.map(({ isSponsor, type, ...rest }) => ({
            ...rest,
            type: isSponsor ? "Sponsor" : type,
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
                    <CardTitle className="text-lg font-medium flex items-center justify-between">
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
                        <div className="text-sm text-muted-foreground font-normal">
                            {t("Total Members")}: {filteredMembers.length}
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-[120px]">{t("Register ID")}</TableHead>
                                    <TableHead>{t("Name")}</TableHead>
                                    <TableHead>{t("Mobile")}</TableHead>
                                    <TableHead>{t("Type")}</TableHead>
                                    <TableHead>{t("Location")}</TableHead>
                                    <TableHead>{t("Status")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {Array.from({ length: 6 }).map((_, j) => (
                                                <TableCell key={j}><div className="h-4 w-full bg-muted animate-pulse rounded" /></TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : filteredMembers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                            {t("No members found")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredMembers.map((member, idx) => (
                                        <TableRow key={idx}>
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
                                            <TableCell>
                                                <Badge variant={
                                                    member.approvalStatus === 'approved' ? 'success' :
                                                        member.approvalStatus === 'rejected' ? 'destructive' : 'warning'
                                                }>
                                                    {t(member.approvalStatus)}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
