import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"
import { getCurrentUser } from "@/lib/auth"

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
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // Build query
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = { isRegistered: true }

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
            .populate("approvalLogs.approvedBy", "name email")
            .lean()

        // Flatten approval logs into records
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const records: any[] = []

        console.log("DEBUG: Total participants found:", participants.length)

        participants.forEach((participant: any) => {
            participant.approvalLogs?.forEach((log: any) => {
                // Resolve approver label
                // Priority: stored approvedByEmail string → populated approvedBy.email → system label → Unknown
                let approverLabel = "Unknown"
                if (log.approvedByEmail) {
                    approverLabel = log.approvedByEmail
                } else if (log.approvedBy?.email) {
                    approverLabel = log.approvedBy.email
                } else if (log.role === "system") {
                    approverLabel = "System (Auto-approved)"
                }

                // Apply filters
                if (role !== 'all' && log.role !== role) return
                if (status !== 'all' && log.status !== status) return
                if (search) {
                    const searchLower = search.toLowerCase()
                    const participantName = participant.name?.toLowerCase() || ""
                    const participantPhone = participant.mobileNumber?.toLowerCase() || ""
                    const approvedByStr = approverLabel.toLowerCase()

                    if (!participantName.includes(searchLower) &&
                        !participantPhone.includes(searchLower) &&
                        !approvedByStr.includes(searchLower)) {
                        return
                    }
                }

                records.push({
                    participantName: participant.name || "",
                    participantPhone: participant.mobileNumber || "",
                    participantEmail: participant.email || "",
                    approvedBy: approverLabel,
                    approvedByEmail: approverLabel,
                    role: log.role,
                    status: log.status,
                    date: log.timestamp,
                    participantId: participant._id
                })
            })
        })

        // Sort by date (newest first)
        records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        // Pagination
        const total = records.length
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginatedRecords = records.slice(startIndex, endIndex)

        return NextResponse.json({
            records: paginatedRecords,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })

    } catch (error) {
        console.error("Approval history error:", error)
        return NextResponse.json(
            { error: "Failed to fetch approval history" },
            { status: 500 }
        )
    }
}
