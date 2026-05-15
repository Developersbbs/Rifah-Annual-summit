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
                { registrationId: { $regex: regex } },
                { "secondaryMembers.mobileNumber": { $regex: regex } },
                { "secondaryMembers.name": { $regex: regex } },
                { "secondaryMembers.registrationId": { $regex: regex } }
            ]
        }).sort({ createdAt: -1 }).limit(10).lean()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (participants as unknown as IParticipant[]).map((p: any) => ({
            ...p,
            _id: p._id.toString(),
            eventId: p.eventId?.toString(),
            approvedBy: p.approvedBy?.toString(),
            createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
            updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            secondaryMembers: p.secondaryMembers?.map((member: any) => ({
                ...member,
                _id: member._id?.toString(),
                checkedInAt: member.checkedInAt instanceof Date ? member.checkedInAt.toISOString() : member.checkedInAt
            })),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            approvalLogs: p.approvalLogs?.map((log: any) => ({
                ...log,
                _id: log._id?.toString(),
                approvedBy: log.approvedBy?.toString(),
                timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp
            }))
        }))
    } catch (error) {
        console.error("Search error:", error)
        return []
    }
}

interface CheckInData {
    memberPresent: boolean
}

interface SecondaryMemberCheckInData {
    participantId: string
    memberMobileNumber?: string
    memberIndex?: number
}

// Derive the correct isCheckedIn and actualGuests from actual individual check-in flags
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deriveCheckInStatus(participant: any): { isCheckedIn: boolean; totalChecked: number } {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const secondaryChecked = participant.secondaryMembers?.filter((m: any) => m.isCheckedIn).length || 0
    const totalMembers = 1 + (participant.secondaryMembers?.length || 0)
    const totalChecked = (participant.checkIn?.memberPresent ? 1 : 0) + secondaryChecked
    return { isCheckedIn: totalChecked === totalMembers, totalChecked }
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

        if (participant.approvalStatus !== 'approved') {
            return { success: false, error: "Participant is not approved for check-in" }
        }

        if (participant.paymentStatus !== 'completed') {
            return { success: false, error: "Payment not completed" }
        }

        if (!participant.isRegistered) {
            return { success: false, error: "User is not registered" }
        }

        // Find the secondary member by mobile number or index
        let memberIndex = -1

        if (data.memberMobileNumber) {
            memberIndex = participant.secondaryMembers.findIndex(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (m: any) => m.mobileNumber === data.memberMobileNumber
            )
        } else if (data.memberIndex !== undefined) {
            memberIndex = data.memberIndex
        }

        if (memberIndex === -1 || memberIndex >= participant.secondaryMembers.length) {
            return { success: false, error: "Secondary member not found" }
        }

        const member = participant.secondaryMembers[memberIndex]

        if (member.isCheckedIn) {
            return { success: false, error: "Member already checked in" }
        }

        // Mark this secondary member as checked in
        participant.secondaryMembers[memberIndex].isCheckedIn = true
        participant.secondaryMembers[memberIndex].checkedInAt = new Date()

        // Recompute isCheckedIn: only true when ALL members are in
        const { isCheckedIn, totalChecked } = deriveCheckInStatus(participant)

        if (!participant.checkIn) {
            participant.checkIn = {
                isCheckedIn,
                memberPresent: false,
                timestamp: new Date(),
                actualGuests: totalChecked,
                checkedInBy: user.email
            }
        } else {
            participant.checkIn.isCheckedIn = isCheckedIn
            participant.checkIn.actualGuests = totalChecked
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

        if (participant.approvalStatus !== 'approved') {
            return { success: false, error: "Participant is not approved for check-in" }
        }

        if (participant.paymentStatus !== 'completed') {
            return { success: false, error: "Payment not completed" }
        }

        if (!participant.isRegistered) {
            return { success: false, error: "User is not registered" }
        }

        if (participant.checkIn?.memberPresent) {
            return { success: false, error: "Primary member already checked in" }
        }

        // Set primary member as present, then derive isCheckedIn from all actual states
        if (!participant.checkIn) {
            participant.checkIn = {
                isCheckedIn: false,
                memberPresent: data.memberPresent,
                timestamp: new Date(),
                actualGuests: 0,
                checkedInBy: user.email
            }
        } else {
            participant.checkIn.memberPresent = data.memberPresent
            participant.checkIn.checkedInBy = user.email
            if (!participant.checkIn.timestamp) {
                participant.checkIn.timestamp = new Date()
            }
        }

        const { isCheckedIn, totalChecked } = deriveCheckInStatus(participant)
        participant.checkIn.isCheckedIn = isCheckedIn
        participant.checkIn.actualGuests = totalChecked

        await participant.save()
        revalidatePath("/admin/checkin")

        return { success: true }
    } catch (error: unknown) {
        console.error("Check-in error:", error)
        return { success: false, error: error instanceof Error ? error.message : "Check-in failed" }
    }
}

// Fix stale checkIn.isCheckedIn values in DB for all registered/approved participants
export async function resyncAllCheckInStatus() {
    await dbConnect()
    const user = await getCurrentUser()
    if (!user) return { success: false, error: "Unauthorized" }

    try {
        const participants = await Participant.find({
            isRegistered: true,
            approvalStatus: 'approved'
        }).lean()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bulkOps: object[] = []

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const p of participants as any[]) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const secondaryChecked = p.secondaryMembers?.filter((m: any) => m.isCheckedIn).length || 0
            const totalMembers = 1 + (p.secondaryMembers?.length || 0)
            const totalChecked = (p.checkIn?.memberPresent ? 1 : 0) + secondaryChecked
            const isCheckedIn = totalChecked === totalMembers

            // Skip if already correct
            if (p.checkIn?.isCheckedIn === isCheckedIn && p.checkIn?.actualGuests === totalChecked) continue

            bulkOps.push({
                updateOne: {
                    filter: { _id: p._id },
                    update: {
                        $set: {
                            'checkIn.isCheckedIn': isCheckedIn,
                            'checkIn.actualGuests': totalChecked
                        }
                    }
                }
            })
        }

        if (bulkOps.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await Participant.bulkWrite(bulkOps as any)
        }

        revalidatePath("/admin/checkin")
        return { success: true, synced: bulkOps.length }
    } catch (error) {
        console.error("Re-sync error:", error)
        return { success: false, error: error instanceof Error ? error.message : "Re-sync failed" }
    }
}

export async function getCheckInStats() {
    await dbConnect()
    try {
        const participants = await Participant.find({
            isRegistered: true,
            approvalStatus: 'approved',
            $or: [
                { paymentStatus: 'completed' },
                { paymentMethod: 'online' }
            ]
        }).lean()

        let registeredMembers = 0
        let registeredParticipants = 0
        let checkedInMembers = 0
        let checkedInParticipants = 0
        let totalSponsors = 0
        let checkedInSponsors = 0

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(participants as unknown as IParticipant[]).forEach((p: any) => {
            if (p.isSponsor) {
                totalSponsors++
            } else {
                registeredMembers++
            }

            const totalSecondary = p.secondaryMembers?.length || 0
            registeredParticipants += totalSecondary

            // Count primary independently — don't gate on isCheckedIn
            if (p.checkIn?.memberPresent) {
                if (p.isSponsor) {
                    checkedInSponsors++
                } else {
                    checkedInMembers++
                }
            }

            // Count each secondary member independently
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const secondaryCheckedIn = p.secondaryMembers?.filter((m: any) => m.isCheckedIn).length || 0
            checkedInParticipants += secondaryCheckedIn
        })

        return {
            registeredMembers,
            registeredParticipants,
            checkedInMembers,
            checkedInParticipants,
            totalSponsors,
            checkedInSponsors
        }
    } catch (error) {
        console.error("Stats error:", error)
        return {
            registeredMembers: 0,
            registeredParticipants: 0,
            checkedInMembers: 0,
            checkedInParticipants: 0,
            totalSponsors: 0,
            checkedInSponsors: 0
        }
    }
}

export async function getParticipantsByStatus(status: 'all' | 'checked-in' | 'pending', page: number = 1, limit: number = 20, query: string = "", regId: string = "") {
    await dbConnect()
    try {
        const dbQuery: Record<string, unknown> = {
            approvalStatus: "approved",
            $or: [
                { paymentStatus: "completed" },
                { paymentMethod: "online" }
            ]
        }

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

        if (regId && regId.length >= 2) {
            const regex = new RegExp(regId, 'i')
            if (dbQuery["$or"]) {
                const regIdMatch = {
                    $or: [
                        { registrationId: { $regex: regex } },
                        { "secondaryMembers.registrationId": { $regex: regex } }
                    ]
                }
                dbQuery["$and"] = [
                    { $or: dbQuery["$or"] },
                    regIdMatch
                ]
                delete dbQuery["$or"]
            } else {
                dbQuery["$or"] = [
                    { registrationId: { $regex: regex } },
                    { "secondaryMembers.registrationId": { $regex: regex } }
                ]
            }
        }

        const total = await Participant.countDocuments(dbQuery)
        const totalPages = Math.ceil(total / limit)
        const skip = (page - 1) * limit

        const sort = status === 'checked-in'
            ? { "checkIn.timestamp": -1 } as const
            : { createdAt: -1 } as const

        const participants = await Participant.find(dbQuery)
            .sort(sort as unknown as string | Record<string, 1 | -1>)
            .skip(skip)
            .limit(limit)
            .lean()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const records = (participants as unknown as IParticipant[]).map((p: any) => {
            // Always recompute isCheckedIn from actual member states to override any stale DB value
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const secondaryChecked = p.secondaryMembers?.filter((m: any) => m.isCheckedIn).length || 0
            const totalMembers = 1 + (p.secondaryMembers?.length || 0)
            const totalChecked = (p.checkIn?.memberPresent ? 1 : 0) + secondaryChecked
            const computedIsCheckedIn = totalChecked === totalMembers

            return {
                ...p,
                _id: p._id.toString(),
                eventId: p.eventId?.toString(),
                approvedBy: p.approvedBy?.toString(),
                createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
                updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
                checkIn: p.checkIn ? {
                    ...p.checkIn,
                    isCheckedIn: computedIsCheckedIn,
                    actualGuests: totalChecked,
                    timestamp: p.checkIn.timestamp instanceof Date ? p.checkIn.timestamp.toISOString() : p.checkIn.timestamp
                } : undefined,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                secondaryMembers: p.secondaryMembers?.map((member: any) => ({
                    ...member,
                    _id: member._id?.toString(),
                    checkedInAt: member.checkedInAt instanceof Date ? member.checkedInAt.toISOString() : member.checkedInAt
                })),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                approvalLogs: p.approvalLogs?.map((log: any) => ({
                    ...log,
                    _id: log._id?.toString(),
                    approvedBy: log.approvedBy?.toString(),
                    timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp
                }))
            }
        })

        return {
            records,
            pagination: {
                total,
                page,
                limit,
                totalPages
            }
        }
    } catch (error) {
        console.error("List error:", error)
        return {
            records: [],
            pagination: {
                total: 0,
                page: 1,
                limit: 20,
                totalPages: 0
            }
        }
    }
}
