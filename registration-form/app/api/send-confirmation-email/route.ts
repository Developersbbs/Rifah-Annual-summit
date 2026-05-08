import { NextRequest, NextResponse } from "next/server"
import { sendRegistrationEmails } from "@/lib/email"
import Participant from "@/models/Participant"
import Event from "@/models/Event"
import dbConnect from "@/lib/db"

export async function POST(request: NextRequest) {
    try {
        await dbConnect()

        const { participantId } = await request.json()

        if (!participantId) {
            return NextResponse.json(
                { error: "Participant ID is required" },
                { status: 400 }
            )
        }

        // Get participant details
        const participant = await Participant.findById(participantId)
        if (!participant) {
            return NextResponse.json(
                { error: "Participant not found" },
                { status: 404 }
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

        // Send confirmation email
        const emailResult = await sendRegistrationEmails(participant, activeEvent.eventName)

        if (emailResult.success) {
            return NextResponse.json(
                { success: true, message: "Confirmation email sent successfully" },
                { status: 200 }
            )
        } else {
            return NextResponse.json(
                { error: emailResult.error || "Failed to send email" },
                { status: 500 }
            )
        }

    } catch (error) {
        console.error("Error sending confirmation email:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
