import { NextRequest, NextResponse } from "next/server"
import { sendRegistrationEmails } from "@/lib/email"
import Participant from "@/models/Participant"
import Event from "@/models/Event"
import dbConnect from "@/lib/db"

export async function POST(request: NextRequest) {
    try {
        await dbConnect()

        const { participantIds } = await request.json()

        if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
            return NextResponse.json(
                { error: "A valid array of Participant IDs is required" },
                { status: 400 }
            )
        }

        // Get active event for email context
        const activeEvent = await Event.findOne({ isActive: true })
        if (!activeEvent) {
            return NextResponse.json(
                { error: "No active event found" },
                { status: 404 }
            )
        }

        let successCount = 0
        let failureCount = 0

        // Iterate through all participant IDs to send emails
        for (const id of participantIds) {
            try {
                const participant = await Participant.findById(id)
                if (!participant) {
                    failureCount++
                    continue
                }

                // Skip admin notification to avoid spamming the admin inbox during bulk send
                const emailResult = await sendRegistrationEmails(participant, activeEvent.eventName, true)
                
                if (emailResult.success) {
                    successCount++
                } else {
                    failureCount++
                }
            } catch (err) {
                console.error(`Failed to send email to participant ${id}:`, err)
                failureCount++
            }
        }

        return NextResponse.json(
            { 
                success: true, 
                message: `Bulk email processing complete. Success: ${successCount}, Failures: ${failureCount}`,
                details: { successCount, failureCount }
            },
            { status: 200 }
        )

    } catch (error) {
        console.error("Error sending bulk confirmation emails:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
