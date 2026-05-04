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

        const genderFilter = searchParams.get('gender') || 'all'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = { isRegistered: true }

        if (filter === 'checked-in') {
            query["checkIn.memberPresent"] = true
        } else if (filter === 'not-checked-in') {
            query["checkIn.memberPresent"] = false
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
            gender: 1,
            checkIn: 1,
            secondaryMembers: 1,
            approvalStatus: 1
        }).lean()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const records: any[] = []

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        participants.forEach((p: any) => {
            // primary
            if ((type === 'all' || type === 'primary') && (genderFilter === 'all' || p.gender === genderFilter)) {
                records.push({
                    _id: p._id.toString(),
                    type: "Primary",
                    name: p.name,
                    phone: p.mobileNumber,
                    email: p.email || "",
                    gender: p.gender || "other",
                    checkedIn: p.checkIn?.memberPresent || false,
                    eventDate: p.eventDate || "",
                    location: p.location || "",
                    primaryMember: "",
                    primaryPhone: "",
                    approvalStatus: p.approvalStatus || "pending"
                })
            }

            // secondary
            if (type === 'all' || type === 'secondary') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                p.secondaryMembers?.forEach((m: any) => {
                    if (genderFilter === 'all' || m.gender === genderFilter) {
                        records.push({
                            _id: p._id.toString(),
                            type: "Secondary",
                            name: m.name,
                            phone: m.mobileNumber,
                            email: m.email || "",
                            gender: m.gender || "other",
                            checkedIn: m.isCheckedIn || false,
                            eventDate: p.eventDate || "",
                            location: m.location || p.location || "",
                            primaryMember: p.name,
                            primaryPhone: p.mobileNumber,
                            approvalStatus: p.approvalStatus || "pending"
                        })
                    }
                })
            }
        })

        // Pagination
        const total = records.length
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filteredRecords = records.filter((r: any) => {
            return r.type === 'Primary' || r.type === 'Secondary'
        })
        const paginatedRecords = filteredRecords.slice(startIndex, endIndex)

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
