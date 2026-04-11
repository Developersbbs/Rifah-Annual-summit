"use server"

import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"
import { getCurrentUser } from "@/lib/auth"

export async function approveRegistration(participantId: string) {
    try {
        await dbConnect()
        
        const user = await getCurrentUser()
        
        if (!user || (user.role !== "admin" && user.role !== "super-admin")) {
            return { success: false, error: "Unauthorized" }
        }

        const participant = await Participant.findById(participantId)
        
        if (!participant) {
            return { success: false, error: "Participant not found" }
        }

        if (participant.approvalStatus !== "pending") {
            return { success: false, error: "Registration already processed" }
        }

        // Approve the registration
        await Participant.findByIdAndUpdate(participantId, {
            $set: {
                approvalStatus: "approved",
                approvedBy: user._id,
                approvedRole: user.role,
                updatedAt: new Date()
            }
        })

        return { success: true, message: "Registration approved successfully" }

    } catch (error: unknown) {
        console.error("Error approving registration:", error)
        return { success: false, error: "Failed to approve registration" }
    }
}

export async function rejectRegistration(participantId: string, reason?: string) {
    try {
        await dbConnect()
        
        const user = await getCurrentUser()
        
        if (!user || (user.role !== "admin" && user.role !== "super-admin")) {
            return { success: false, error: "Unauthorized" }
        }

        const participant = await Participant.findById(participantId)
        
        if (!participant) {
            return { success: false, error: "Participant not found" }
        }

        if (participant.approvalStatus !== "pending") {
            return { success: false, error: "Registration already processed" }
        }

        // Reject the registration
        await Participant.findByIdAndUpdate(participantId, {
            $set: {
                approvalStatus: "rejected",
                approvedBy: user._id,
                approvedRole: user.role,
                rejectionReason: reason || "Rejected by admin",
                updatedAt: new Date()
            }
        })

        return { success: true, message: "Registration rejected successfully" }

    } catch (error: unknown) {
        console.error("Error rejecting registration:", error)
        return { success: false, error: "Failed to reject registration" }
    }
}
