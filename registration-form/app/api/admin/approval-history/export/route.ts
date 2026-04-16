import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"
import { getCurrentUser } from "@/lib/auth"
import * as XLSX from "xlsx"

export async function GET(request: Request) {
    try {
        await dbConnect()
        
        const user = await getCurrentUser()
        
        if (!user || (user.role !== "admin" && user.role !== "super-admin")) {
            return NextResponse.json(
                { error: "Unauthorized - Admin access required" },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search') || ''
        const role = searchParams.get('role') || 'all'
        const status = searchParams.get('status') || 'all'
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // Build query
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = {}

        // Add date range filter if provided
        if (startDate || endDate) {
            query["approvalLogs.timestamp"] = {}
            if (startDate) {
                query["approvalLogs.timestamp"].$gte = new Date(startDate)
            }
            if (endDate) {
                query["approvalLogs.timestamp"].$lte = new Date(endDate + "T23:59:59.999Z")
            }
        }

        // Fetch participants with approval logs
        const participants = await Participant.find(query)
            .lean()

        // Flatten approval logs into records
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const records: any[] = []

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        participants.forEach((participant: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            participant.approvalLogs?.forEach((log: any) => {
                // Apply filters
                if (role !== 'all' && log.role !== role) return
                if (status !== 'all' && log.status !== status) return
                if (search) {
                    const searchLower = search.toLowerCase()
                    const participantName = participant.name?.toLowerCase() || ""
                    const participantPhone = participant.mobileNumber?.toLowerCase() || ""
                    const approvedByEmail = log.approvedByEmail?.toLowerCase() || ""

                    if (!participantName.includes(searchLower) &&
                        !participantPhone.includes(searchLower) &&
                        !approvedByEmail.includes(searchLower)) {
                        return
                    }
                }

                records.push({
                    "Participant Name": participant.name || "",
                    "Participant Phone": participant.mobileNumber || "",
                    "Participant Email": participant.email || "",
                    "Approved By": log.approvedByEmail || "Unknown",
                    "Role": log.role,
                    "Status": log.status,
                    "Date": new Date(log.timestamp).toLocaleString(),
                })
            })
        })

        // Sort by date (newest first)
        records.sort((a, b) => new Date(b["Date"]).getTime() - new Date(a["Date"]).getTime())

        // Create Excel file
        const worksheet = XLSX.utils.json_to_sheet(records)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Approval History")

        const buffer = XLSX.write(workbook, {
            type: "buffer",
            bookType: "xlsx"
        })

        return new Response(new Uint8Array(buffer as ArrayBuffer), {
            headers: {
                "Content-Disposition": "attachment; filename=approval-history.xlsx",
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
        })

    } catch (error) {
        console.error("Approval history export error:", error)
        return NextResponse.json(
            { error: "Failed to export approval history" },
            { status: 500 }
        )
    }
}
