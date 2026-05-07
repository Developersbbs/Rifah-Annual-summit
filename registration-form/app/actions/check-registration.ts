"use server"

import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"

export async function checkRegistration(mobileNumber: string) {
    try {
        await dbConnect()

        // Find if a participant exists with this mobile number
        // We only care if they are fully "registered" or if we want to block any partial attempts too.
        // Based on requirements: "check weather the number is already register or not"
        // Assuming we check for ANY record, or specifically `isRegistered: true`
        // For now, let's check if a record exists and if `isRegistered` flag is true (if we use that flag).
        // Or just existence if we treat any entry as "started/registered".
        // Let's stick to the model definition: `isRegistered` field.

        const participant = await Participant.findOne({ mobileNumber }).lean()

        // Only block re-registration if user is fully registered (isRegistered: true)
        // Allow re-registration for pending users who haven't completed payment
        if (participant && participant.isRegistered) {
            return {
                exists: true,
                participant: {
                    ...participant,
                    _id: participant._id.toString(),
                    eventId: participant.eventId?.toString(),
                    rescheduledTo: participant.rescheduledTo?.toString(),
                    approvedBy: participant.approvedBy?.toString(),
                    createdAt: participant.createdAt?.toISOString(),
                    updatedAt: participant.updatedAt?.toISOString(),
                    eventDate: participant.eventDate?.toISOString(),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    approvalLogs: participant.approvalLogs?.map((log: any) => ({
                        ...log,
                        _id: log._id?.toString(),
                        approvedBy: log.approvedBy?.toString(),
                        timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp
                    })),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    secondaryMembers: participant.secondaryMembers?.map((member: any) => ({
                        ...member,
                        _id: member._id?.toString(),
                        checkedInAt: member.checkedInAt instanceof Date ? member.checkedInAt.toISOString() : member.checkedInAt
                    }))
                },
                message: "This mobile number is already registered."
            }
        }

        // If participant exists but is not fully registered (pending), allow re-registration
        // but delete the old pending record first
        if (participant && !participant.isRegistered) {
            try {
                // Delete the old pending registration to allow fresh registration
                await Participant.findByIdAndDelete(participant._id)
                console.log(`Deleted pending registration for ${mobileNumber} to allow re-registration`)
            } catch (error) {
                console.error("Error deleting pending registration:", error)
            }
        }

        return { exists: false }

    } catch (error) {
        console.error("Error checking registration:", error)
        return {
            exists: false,
            error: "Failed to verify registration status."
        }
    }
}
