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
        const regId = searchParams.get('regId') || ''

        const genderFilter = searchParams.get('gender') || 'all'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = { isRegistered: true }

        if (filter === 'checked-in') {
            query.$or = [
                { "checkIn.memberPresent": true },
                { "secondaryMembers.isCheckedIn": true }
            ]
        } else if (filter === 'not-checked-in') {
            query.$or = [
                { "checkIn.memberPresent": false },
                { "secondaryMembers": { $exists: true, $ne: [] }, "secondaryMembers.isCheckedIn": { $ne: true } },
                { "secondaryMembers": { $size: 0 } } // Also include those with no secondary members if primary is false (already covered by first condition mostly)
            ]
        }

        if (search) {
            const regex = { $regex: search, $options: 'i' }
            query.$or = [
                { name: regex },
                { mobileNumber: regex },
                { registrationId: regex },
                { "secondaryMembers.name": regex },
                { "secondaryMembers.mobileNumber": regex },
                { "secondaryMembers.registrationId": regex }
            ]
        }

        if (regId) {
            const regRegex = { $regex: regId, $options: 'i' }
            query.$or = query.$or || []
            query.$or.push({ registrationId: regRegex })
            query.$or.push({ "secondaryMembers.registrationId": regRegex })
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
            approvalStatus: 1,
            businessName: 1,
            businessCategory: 1,
            ticketType: 1,
            registrationId: 1,
            createdAt: 1,
            isSponsor: 1
        }).lean()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const records: any[] = []

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        participants.forEach((p: any) => {
            const matchesSearchPrimary = !search || 
                (p.name && p.name.toLowerCase().includes(search.toLowerCase())) || 
                (p.mobileNumber && p.mobileNumber.includes(search))
            
            const matchesRegIdPrimary = !regId || 
                (p.registrationId && p.registrationId.toLowerCase().includes(regId.toLowerCase()))

            // primary
            const isMatchForType = type === 'all' || 
                                   (type === 'primary' && !p.isSponsor) || 
                                   (type === 'sponsor' && p.isSponsor);
            
            const isMatchForCheckInPrimary = filter === 'all' || 
                                             (filter === 'checked-in' && p.checkIn?.memberPresent) || 
                                             (filter === 'not-checked-in' && !p.checkIn?.memberPresent);

            if (isMatchForType && isMatchForCheckInPrimary &&
                (genderFilter === 'all' || p.gender === genderFilter) &&
                matchesSearchPrimary && matchesRegIdPrimary) {
                records.push({
                    _id: p._id.toString(),
                    type: p.isSponsor ? "Sponsor" : "Primary",
                    registrationId: p.registrationId || "",
                    name: p.name,
                    phone: p.mobileNumber,
                    email: p.email || "",
                    gender: p.gender || "other",
                    checkedIn: p.checkIn?.memberPresent || false,
                    eventDate: p.eventDate || "",
                    location: p.location || "",
                    primaryMember: "",
                    primaryPhone: "",
                    approvalStatus: p.approvalStatus || "pending",
                    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : "",
                    isSponsor: p.isSponsor || false,
                    originalParticipant: p
                })
            }

            // secondary
            if (type === 'all' || type === 'secondary') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                p.secondaryMembers?.forEach((m: any) => {
                    const matchesSearchSecondary = !search || 
                        (m.name && m.name.toLowerCase().includes(search.toLowerCase())) || 
                        (m.mobileNumber && m.mobileNumber.includes(search)) ||
                        (p.name && p.name.toLowerCase().includes(search.toLowerCase())) || 
                        (p.mobileNumber && p.mobileNumber.includes(search))
                    
                    const matchesRegIdSecondary = !regId || 
                        (m.registrationId && m.registrationId.toLowerCase().includes(regId.toLowerCase()))

                    const isMatchForCheckInSecondary = filter === 'all' || 
                                                       (filter === 'checked-in' && m.isCheckedIn) || 
                                                       (filter === 'not-checked-in' && !m.isCheckedIn);

                    if ((genderFilter === 'all' || m.gender === genderFilter) &&
                        isMatchForCheckInSecondary &&
                        matchesSearchSecondary && matchesRegIdSecondary) {
                        records.push({
                            _id: p._id.toString(),
                            type: "Secondary",
                            registrationId: m.registrationId || "",
                            name: m.name,
                            phone: m.mobileNumber,
                            email: m.email || "",
                            gender: m.gender || "other",
                            checkedIn: m.isCheckedIn || false,
                            eventDate: p.eventDate || "",
                            location: m.location || p.location || "",
                            primaryMember: p.name,
                            primaryPhone: p.mobileNumber,
                            approvalStatus: p.approvalStatus || "pending",
                            createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : "",
                            originalParticipant: p
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
            return r.type === 'Primary' || r.type === 'Secondary' || r.type === 'Sponsor'
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
