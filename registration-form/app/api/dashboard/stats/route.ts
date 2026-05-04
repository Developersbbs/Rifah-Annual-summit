import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"

export async function GET() {
    try {
        await dbConnect()
        const participants = await Participant.find({ isRegistered: true, approvalStatus: 'approved' }).lean()

        const totalRegistrations = participants.length
        let totalPeople = 0
        let totalCheckedIn = 0
        let totalSecondaryCheckedIn = 0
        let primaryMembers = 0
        let secondaryMembers = 0
        let male = 0
        let female = 0
        let other = 0

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        participants.forEach((p: any) => {
            const secondaryCount = p.secondaryMembers?.length || 0
            totalPeople += 1 + secondaryCount
            primaryMembers += 1
            secondaryMembers += secondaryCount
            if (p.checkIn?.isCheckedIn) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                totalCheckedIn += (p.checkIn?.memberPresent ? 1 : 0) + (p.secondaryMembers?.filter((m: any) => m.isCheckedIn).length || 0)
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            totalSecondaryCheckedIn += p.secondaryMembers?.filter((m: any) => m.isCheckedIn).length || 0

            // Primary gender
            if (p.gender === 'male') male++
            else if (p.gender === 'female') female++
            else if (p.gender === 'other') other++

            // Secondary gender
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            p.secondaryMembers?.forEach((m: any) => {
                if (m.gender === 'male') male++
                else if (m.gender === 'female') female++
                else if (m.gender === 'other') other++
            })
        })

        return NextResponse.json({
            totalRegistrations,
            totalPeople,
            totalCheckedIn,
            totalSecondaryCheckedIn,
            primaryMembers,
            secondaryMembers,
            male,
            female,
            other
        })
    } catch (error) {
        console.error("Dashboard stats error:", error)
        return NextResponse.json(
            { error: "Failed to fetch dashboard stats" },
            { status: 500 }
        )
    }
}
