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
                { mobileNumber: { $regex: regex } }
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
    guestAdults: number
    guestChildren: number
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

        // Calculate Totals based on Logic:
        // actualAdults = (MemberPresent ? 1 : 0) + GuestAdults
        // actualChildren = GuestChildren

        const actualAdults = (data.memberPresent ? 1 : 0) + data.guestAdults
        const totalCount = actualAdults + data.guestChildren
        const isCheckedIn = totalCount > 0

        participant.checkIn = {
            isCheckedIn: isCheckedIn,
            memberPresent: data.memberPresent,
            timestamp: participant.checkIn?.timestamp || new Date(),
            actualAdults: actualAdults,
            actualChildren: data.guestChildren,
            checkedInBy: user.email // Updates last modifier
        }

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
        const participants = await Participant.find({ isRegistered: true }).lean()

        let registeredMembers = 0
        let registeredParticipants = 0
        let checkedInMembers = 0
        let checkedInParticipants = 0;

        (participants as unknown as IParticipant[]).forEach((p) => {
            registeredMembers++
            const regAdults = p.ageGroups?.adults || 0
            const regChildren = p.ageGroups?.children || 0
            // Registered Participants: Total People - 1 (The Member)
            // This treats "Participants" as "Guests/Additional Members"
            const totalReg = regAdults + regChildren
            registeredParticipants += Math.max(0, totalReg - 1)

            if (p.checkIn?.isCheckedIn) {
                if (p.checkIn.memberPresent) {
                    checkedInMembers++
                }
                const actualAdults = p.checkIn?.actualAdults || 0
                const actualChildren = p.checkIn?.actualChildren || 0
                const totalActual = actualAdults + actualChildren

                // Checked-in Participants: Total Actual - (Member Present ? 1 : 0)
                const memberCount = p.checkIn.memberPresent ? 1 : 0
                checkedInParticipants += Math.max(0, totalActual - memberCount)
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
        const dbQuery: Record<string, unknown> = { isRegistered: true }

        if (status === 'checked-in') {
            dbQuery["checkIn.isCheckedIn"] = true
        } else if (status === 'pending') {
            dbQuery["checkIn.isCheckedIn"] = { $ne: true }
        }

        if (query && query.length >= 2) {
            const regex = new RegExp(query, 'i')
            dbQuery["$or"] = [
                { name: { $regex: regex } },
                { mobileNumber: { $regex: regex } }
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
