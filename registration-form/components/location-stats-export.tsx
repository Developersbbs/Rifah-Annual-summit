"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface LocationStatsExportProps {
    data: Array<{
        _id: string
        primaryReg: number
        secondaryReg: number
        totalReg: number
        primaryIn: number
        secondaryIn: number
        totalIn: number
    }>
}

export function LocationStatsExport({ data }: LocationStatsExportProps) {
    const handleExport = () => {
        // Define headers
        const headers = [
            "Location",
            "Primary (Reg)",
            "Secondary (Reg)",
            "Total (Reg)",
            "Primary (In)",
            "Secondary (In)",
            "Total (In)"
        ]

        // Map data to CSV rows
        const rows = data.map(item => [
            item._id || "Unknown",
            item.primaryReg,
            item.secondaryReg,
            item.totalReg,
            item.primaryIn,
            item.secondaryIn,
            item.totalIn
        ])

        // Combine headers and rows
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n")

        // Create blob and download link
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `location_stats_${new Date().toISOString().split('T')[0]}.csv`)

        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Export
            </span>
        </Button>
    )
}
