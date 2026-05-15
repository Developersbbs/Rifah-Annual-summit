import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"
import { IParticipant, ISecondaryMember } from "@/lib/types"

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
        let totalSponsors = 0
        let male = 0
        let female = 0
        let other = 0

        ;(participants as unknown as IParticipant[]).forEach((p: IParticipant) => {
            const secondaryCount = p.secondaryMembers?.length || 0
            totalPeople += 1 + secondaryCount
            
            if (p.isSponsor) {
                totalSponsors++
            } else {
                primaryMembers++
            }

            secondaryMembers += secondaryCount
            // Count every checked-in member individually
            if (p.checkIn?.memberPresent) {
                totalCheckedIn += 1
            }
            
            const secondaryChecked = p.secondaryMembers?.filter((m: ISecondaryMember) => m.isCheckedIn).length || 0
            totalCheckedIn += secondaryChecked
            totalSecondaryCheckedIn += secondaryChecked

            // Primary gender
            if (p.gender === 'male') male++
            else if (p.gender === 'female') female++
            else if (p.gender === 'other') other++

            // Secondary gender
            p.secondaryMembers?.forEach((m: ISecondaryMember) => {
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
            totalSponsors,
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
