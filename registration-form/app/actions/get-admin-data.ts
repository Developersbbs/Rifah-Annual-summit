"use server"

import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"
import { startOfDay, endOfDay } from "date-fns"
import { IParticipant } from "@/lib/types"

interface GroupStat {
    _id: string
    primaryReg: number
    secondaryReg: number
    totalReg: number
    primaryIn: number
    secondaryIn: number
    totalIn: number
}

export async function getAdminData() {
    await dbConnect()

    try {
        const participants = await Participant.find({}).sort({ createdAt: -1 }).lean()

        const stats = {
            totalRegistrations: participants.length,
            totalGuests: 0,
            totalAmount: 0,
            pendingApprovals: 0,
            approvedRegistrations: 0,
            rejectedRegistrations: 0,
            cashPayments: 0,
            onlinePayments: 0,
            // FOOD PREFERENCE - Commented out
            // vegCount: 0,
            // nonVegCount: 0,
            foodGuestCount: 0,
            morningFoodCount: 0,
            totalMembers: 0,
        };

        (participants as unknown as IParticipant[]).forEach((p: IParticipant) => {
            // Handle new schema fields for participants
            const secondaryMembersCount = p.secondaryMembers?.length || 0
            const totalMembers = 1 + secondaryMembersCount
            const totalAmount = p.totalAmount || 0
            const paymentMethod = p.paymentMethod || "cash"
            const approvalStatus = p.approvalStatus || "pending"
            // FOOD PREFERENCE - Commented out
            // const veg = p.foodPreference?.veg || 0
            // const nonVeg = p.foodPreference?.nonVeg || 0
            const foodGuest = p.foodPreference?.guest || 0

            stats.totalGuests += totalMembers
            stats.totalAmount += totalAmount
            // FOOD PREFERENCE - Commented out
            // stats.vegCount += veg
            // stats.nonVegCount += nonVeg
            stats.foodGuestCount += foodGuest
            stats.totalMembers += totalMembers
            
            if (paymentMethod === "cash") {
                stats.cashPayments += 1
            } else {
                stats.onlinePayments += 1
            }

            if (approvalStatus === "pending") {
                stats.pendingApprovals += 1
            } else if (approvalStatus === "approved") {
                stats.approvedRegistrations += 1
            } else if (approvalStatus === "rejected") {
                stats.rejectedRegistrations += 1
            }

            // FOOD PREFERENCE - Commented out
            if (p.isMorningFood) {
                stats.morningFoodCount += (foodGuest) // foodGuest includes registrant if they opted in
            }
        })

        // Serializing MongoDB IDs and dates for client components
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const safeParticipants = (participants as unknown as IParticipant[]).map((p: any) => ({
            ...p,
            _id: p._id.toString(),
            eventId: p.eventId?.toString(),
            rescheduledTo: p.rescheduledTo?.toString(),
            approvedBy: p.approvedBy?.toString(),
            createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
            updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
            checkIn: p.checkIn ? {
                ...p.checkIn,
                checkInTime: p.checkIn.timestamp instanceof Date ? p.checkIn.timestamp.toISOString() : p.checkIn.timestamp
            } : undefined,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            approvalLogs: p.approvalLogs?.map((log: any) => ({
                ...log,
                _id: log._id?.toString(),
                approvedBy: log.approvedBy?.toString(),
                timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp
            })),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            secondaryMembers: p.secondaryMembers?.map((member: any) => ({
                ...member,
                _id: member._id?.toString(),
                checkedInAt: member.checkedInAt instanceof Date ? member.checkedInAt.toISOString() : member.checkedInAt
            }))
        }))

        return { success: true, participants: safeParticipants, stats }
    } catch (error: unknown) {
        console.error("Error fetching admin data:", error)
        return { success: false, error: "Failed to fetch data" }
    }
}

export async function getLocationStats(from?: string, to?: string) {
    await dbConnect()

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matchStage: any = {}

        if (from) {
            const startDate = startOfDay(new Date(from))
            const endDate = to ? endOfDay(new Date(to)) : endOfDay(new Date(from))
            matchStage.createdAt = {
                $gte: startDate,
                $lte: endDate
            }
        }

        // Get all participants with date filter
        const participants = await Participant.find(matchStage).lean()

        // Build stats object
        const stats: { [key: string]: GroupStat } = {}

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        participants.forEach((p: any) => {
            const primaryLocation = p.location || 'Unknown'

            // Initialize location if not exists
            if (!stats[primaryLocation]) {
                stats[primaryLocation] = {
                    _id: primaryLocation,
                    primaryReg: 0,
                    secondaryReg: 0,
                    totalReg: 0,
                    primaryIn: 0,
                    secondaryIn: 0,
                    totalIn: 0
                }
            }

            // Count primary member
            stats[primaryLocation].primaryReg += 1
            stats[primaryLocation].totalReg += 1

            // Check primary member check-in
            if (p.checkIn?.isCheckedIn && p.checkIn?.memberPresent) {
                stats[primaryLocation].primaryIn += 1
                stats[primaryLocation].totalIn += 1
            }

            // Count secondary members
            const secondaryMembers = p.secondaryMembers || []
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            secondaryMembers.forEach((m: any) => {
                const secondaryLocation = m.location || primaryLocation

                // Initialize secondary location if not exists
                if (!stats[secondaryLocation]) {
                    stats[secondaryLocation] = {
                        _id: secondaryLocation,
                        primaryReg: 0,
                        secondaryReg: 0,
                        totalReg: 0,
                        primaryIn: 0,
                        secondaryIn: 0,
                        totalIn: 0
                    }
                }

                // Count secondary member
                stats[secondaryLocation].secondaryReg += 1
                stats[secondaryLocation].totalReg += 1

                // Check secondary member check-in
                if (m.isCheckedIn) {
                    stats[secondaryLocation].secondaryIn += 1
                    stats[secondaryLocation].totalIn += 1
                }
            })
        })

        // Convert to array and sort
        const statsArray = Object.values(stats).sort((a, b) => {
            const numA = parseInt(a._id) || 0
            const numB = parseInt(b._id) || 0
            
            const isANum = !isNaN(parseInt(a._id))
            const isBNum = !isNaN(parseInt(b._id))

            if (isANum && isBNum) {
                return numA - numB
            }
            return (a._id || "").localeCompare(b._id || "")
        })

        return { success: true, stats: statsArray }
    } catch (error) {
        console.error("Error fetching location stats:", error)
        return { success: false, error: "Failed to fetch location stats" }
    }
}
