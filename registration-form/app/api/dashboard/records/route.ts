import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"

export async function GET(request: Request) {
    try {
        await dbConnect()
        const { searchParams } = new URL(request.url)
        const filter = searchParams.get('filter') || 'all'
        const type = searchParams.get('type') || 'all'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const search = searchParams.get('search') || ''

        let query: any = { isRegistered: true, approvalStatus: 'approved' }
        
        if (filter === 'checked-in') {
            query["checkIn.isCheckedIn"] = true
        } else if (filter === 'not-checked-in') {
            query["checkIn.isCheckedIn"] = false
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { mobileNumber: { $regex: search, $options: 'i' } }
            ]
        }

        // Use projection to only fetch needed fields
        const participants = await Participant.find(query, {
            name: 1,
            mobileNumber: 1,
            email: 1,
            location: 1,
            checkIn: 1,
            secondaryMembers: 1
        }).lean()

        let records: any[] = []

        participants.forEach((p: any) => {
            // primary
            if (type === 'all' || type === 'primary') {
                records.push({
                    type: "Primary",
                    name: p.name,
                    phone: p.mobileNumber,
                    email: p.email || "",
                    checkedIn: p.checkIn?.isCheckedIn || false,
                    eventDate: p.eventDate || "",
                    location: p.location || "",
                    primaryMember: "",
                    primaryPhone: ""
                })
            }

            // secondary
            if (type === 'all' || type === 'secondary') {
                p.secondaryMembers?.forEach((m: any) => {
                    records.push({
                        type: "Secondary",
                        name: m.name,
                        phone: m.mobileNumber,
                        email: m.email || "",
                        checkedIn: m.isCheckedIn || false,
                        eventDate: p.eventDate || "",
                        location: p.location || "",
                        primaryMember: p.name,
                        primaryPhone: p.mobileNumber
                    })
                })
            }
        })

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
        console.error("Dashboard records error:", error)
        return NextResponse.json(
            { error: "Failed to fetch dashboard records" },
            { status: 500 }
        )
    }
}
