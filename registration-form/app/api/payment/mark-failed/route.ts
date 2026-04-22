import Participant from "@/models/Participant"
import mongoose from "mongoose"

export async function POST(req: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URI!)

    const body = await req.json()
    const { participantId } = body

    if (!participantId) {
      return Response.json(
        { error: "Missing participant ID" },
        { status: 400 }
      )
    }

    console.log("Marking payment as failed for participant:", participantId)

    const participant = await Participant.findById(participantId)
    if (!participant) {
      return Response.json(
        { success: false, error: "Participant not found" },
        { status: 404 }
      )
    }

    // Only update if not already paid
    if (participant.paymentStatus !== "paid") {
      participant.paymentStatus = "failed"
      await participant.save()
      console.log("Payment marked as failed:", participantId)
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error marking payment as failed:", error)
    return Response.json(
      { success: false, error: "Failed to mark payment as failed" },
      { status: 500 }
    )
  }
}
