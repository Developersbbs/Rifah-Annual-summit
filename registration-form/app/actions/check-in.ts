"use server"

import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { IParticipant } from "@/lib/types"

export async function searchParticipants(query: string) {
    if (!query || query.length < 2) return []

    await dbConnect()

    try {
        const regex = new RegExp(query, 'i')
        const participants = await Participant.find({
            $or: [
                { name: { $regex: regex } },
                { mobileNumber: { $regex: regex } },
                { "secondaryMembers.mobileNumber": { $regex: regex } },
                { "secondaryMembers.name": { $regex: regex } }
            ]
        }).sort({ createdAt: -1 }).limit(10).lean()

        return (participants as unknown as IParticipant[]).map((p) => ({
            ...p,
            _id: p._id.toString()
        }))
    } catch (error) {
        console.error("Search error:", error)
        return []
    }
}

interface CheckInData {
    memberPresent: boolean
    guestCount: number
}

interface SecondaryMemberCheckInData {
    participantId: string
    memberMobileNumber: string
}

export async function performSecondaryMemberCheckIn(data: SecondaryMemberCheckInData) {
    try {
        await dbConnect()
        const user = await getCurrentUser()

        if (!user) {
            return { success: false, error: "Unauthorized" }
        }

        const participant = await Participant.findById(data.participantId)
        if (!participant) {
            return { success: false, error: "Participant not found" }
        }

        // Negative Test Case 2: Block check-in for non-approved participants
        if (participant.approvalStatus !== 'approved') {
            return { success: false, error: "Participant is not approved for check-in" }
        }

        // Negative Test Case 5: Block check-in for unregistered users
        if (!participant.isRegistered) {
            return { success: false, error: "User is not registered" }
        }

        // Find the secondary member by mobile number
        const memberIndex = participant.secondaryMembers.findIndex(
            (m: any) => m.mobileNumber === data.memberMobileNumber
        )

        if (memberIndex === -1) {
            return { success: false, error: "Secondary member not found" }
        }

        const member = participant.secondaryMembers[memberIndex]

        // Negative Test Case 1: Prevent duplicate check-in
        if (member.isCheckedIn) {
            return { success: false, error: "Member already checked in" }
        }

        // Negative Test Case 6: Prevent over check-in
        const primaryCheckedIn = participant.checkIn?.memberPresent || false
        const secondaryCheckedIn = participant.secondaryMembers.filter((m: any) => m.isCheckedIn).length
        const totalCheckedIn = (primaryCheckedIn ? 1 : 0) + secondaryCheckedIn
        const totalRegistered = 1 + (participant.guestCount || 0) + (participant.memberCount || 0)
        
        if (totalCheckedIn >= totalRegistered) {
            return { success: false, error: "All registered members already checked in" }
        }

        // Check-in the secondary member
        participant.secondaryMembers[memberIndex].isCheckedIn = true
        participant.secondaryMembers[memberIndex].checkedInAt = new Date()

        // Update overall check-in status if primary is checked in or any secondary is checked in
        const anyCheckedIn = participant.checkIn?.isCheckedIn || 
                           participant.secondaryMembers.some((m: any) => m.isCheckedIn)
        
        if (!participant.checkIn) {
            participant.checkIn = {
                isCheckedIn: anyCheckedIn,
                memberPresent: false,
                timestamp: new Date(),
                checkedInBy: user.email
            }
        } else {
            participant.checkIn.isCheckedIn = anyCheckedIn
            participant.checkIn.checkedInBy = user.email
        }

        await participant.save()
        revalidatePath("/admin/checkin")

        return { success: true, memberName: member.name }
    } catch (error: unknown) {
        console.error("Secondary member check-in error:", error)
        return { success: false, error: error instanceof Error ? error.message : "Check-in failed" }
    }
}

// Sync function to derive check-in state from actual data (primary + secondary)
function syncCheckinStatus(participant: any) {
    const secondaryChecked = participant.secondaryMembers?.filter((m: any) => m.isCheckedIn).length || 0
    const totalMembers = 1 + (participant.secondaryMembers?.length || 0)
    const totalChecked = (participant.checkIn?.memberPresent ? 1 : 0) + secondaryChecked

    // AUTO DERIVE STATE
    participant.checkIn = participant.checkIn || {}
    participant.checkIn.memberPresent = totalChecked > 0
    participant.checkIn.isCheckedIn = totalChecked === totalMembers
}

export async function performCheckIn(id: string, data: CheckInData) {
    try {
        await dbConnect()
        const user = await getCurrentUser()

        if (!user) {
            return { success: false, error: "Unauthorized" }
        }

        const participant = await Participant.findById(id)
        if (!participant) {
            return { success: false, error: "Participant not found" }
        }

        // Negative Test Case 2: Block check-in for non-approved participants
        if (participant.approvalStatus !== 'approved') {
            return { success: false, error: "Participant is not approved for check-in" }
        }

        // Negative Test Case 5: Block check-in for unregistered users
        if (!participant.isRegistered) {
            return { success: false, error: "User is not registered" }
        }

        // Negative Test Case 6: Prevent over check-in
        const totalRegistered = 1 + (participant.guestCount || 0) + (participant.memberCount || 0)
        const actualGuests = (data.memberPresent ? 1 : 0) + data.guestCount
        
        if (actualGuests > totalRegistered) {
            return { success: false, error: `Cannot check-in more than registered (${totalRegistered})` }
        }

        // Calculate Totals based on Logic:
        // actualGuests = (MemberPresent ? 1 : 0) + GuestCount
        const isCheckedIn = actualGuests > 0

        participant.checkIn = {
            isCheckedIn: isCheckedIn,
            memberPresent: data.memberPresent,
            timestamp: participant.checkIn?.timestamp || new Date(),
            actualGuests: actualGuests,
            checkedInBy: user.email // Updates last modifier
        }

        // Sync check-in status after primary check-in
        syncCheckinStatus(participant)

        await participant.save()
        revalidatePath("/admin/checkin")

        return { success: true }
    } catch (error: unknown) {
        console.error("Check-in error:", error)
        return { success: false, error: error instanceof Error ? error.message : "Check-in failed" }
    }
}

export async function getCheckInStats() {
    await dbConnect()
    try {
        const participants = await Participant.find({ isRegistered: true, approvalStatus: 'approved' }).lean()

        let registeredMembers = 0
        let registeredParticipants = 0
        let checkedInMembers = 0
        let checkedInParticipants = 0;

        (participants as unknown as IParticipant[]).forEach((p) => {
            registeredMembers++
            // Use memberCount for secondary members, not guestCount
            const totalSecondary = p.memberCount || 0
            registeredParticipants += totalSecondary

            if (p.checkIn?.isCheckedIn) {
                if (p.checkIn.memberPresent) {
                    checkedInMembers++
                }
                // Count checked-in secondary members from secondaryMembers array
                const secondaryCheckedIn = p.secondaryMembers?.filter((m: any) => m.isCheckedIn).length || 0
                checkedInParticipants += secondaryCheckedIn
            }
        })

        return {
            registeredMembers,
            registeredParticipants,
            checkedInMembers,
            checkedInParticipants
        }
    } catch (error) {
        console.error("Stats error:", error)
        return {
            registeredMembers: 0,
            registeredParticipants: 0,
            checkedInMembers: 0,
            checkedInParticipants: 0
        }
    }
}

export async function getParticipantsByStatus(status: 'all' | 'checked-in' | 'pending', page: number = 1, limit: number = 20, query: string = "") {
    await dbConnect()
    try {
        const dbQuery: Record<string, unknown> = { isRegistered: true, approvalStatus: "approved" }

        if (status === 'checked-in') {
            dbQuery["checkIn.isCheckedIn"] = true
        } else if (status === 'pending') {
            dbQuery["checkIn.isCheckedIn"] = { $ne: true }
        }

        if (query && query.length >= 2) {
            const regex = new RegExp(query, 'i')
            dbQuery["$or"] = [
                { name: { $regex: regex } },
                { mobileNumber: { $regex: regex } },
                { "secondaryMembers.mobileNumber": { $regex: regex } },
                { "secondaryMembers.name": { $regex: regex } }
            ]
        }

        const skip = (page - 1) * limit
        const sort = status === 'checked-in' 
            ? { "checkIn.timestamp": -1 } as const 
            : { createdAt: -1 } as const

        const participants = await Participant.find(dbQuery)
            .sort(sort as unknown as string | Record<string, 1 | -1>) 
            .skip(skip)
            .limit(limit)
            .lean()

        return (participants as unknown as IParticipant[]).map((p) => ({
            ...p,
            _id: p._id.toString()
        }))
    } catch (error) {
        console.error("List error:", error)
        return []
    }
}
