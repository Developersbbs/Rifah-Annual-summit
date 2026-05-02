"use server"

import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"
import { getCurrentUser } from "@/lib/auth"
import Event from "@/models/Event"
import { sendRegistrationEmails } from "@/lib/email"

export async function approveRegistration(participantId: string, markPaid?: boolean) {
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

        // Build update object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {
            $set: {
                approvalStatus: "approved",
                approvedBy: user._id,
                approvedRole: user.role,
                updatedAt: new Date()
            },
            $push: {
                approvalLogs: {
                    approvedBy: user._id,
                    approvedByEmail: user.email,
                    role: user.role,
                    status: "approved",
                    timestamp: new Date()
                }
            }
        }

        // If markPaid flag is set (for cash payments), also mark payment as completed
        if (markPaid) {
            updateData.$set.paymentStatus = "completed"
        }

        // Approve the registration
        const updatedParticipant = await Participant.findByIdAndUpdate(participantId, updateData, { new: true })

        // Send confirmation email to member (Async)
        if (updatedParticipant) {
            const event = await Event.findById(updatedParticipant.eventId).lean()
            if (event) {
                sendRegistrationEmails(updatedParticipant, event.eventName).catch(err => 
                    console.error("Failed to send approval email:", err)
                )
            }
        }

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
            },
            $push: {
                approvalLogs: {
                    approvedBy: user._id,
                    approvedByEmail: user.email,
                    role: user.role,
                    status: "rejected",
                    timestamp: new Date()
                }
            }
        })

        return { success: true, message: "Registration rejected successfully" }

    } catch (error: unknown) {
        console.error("Error rejecting registration:", error)
        return { success: false, error: "Failed to reject registration" }
    }
}
