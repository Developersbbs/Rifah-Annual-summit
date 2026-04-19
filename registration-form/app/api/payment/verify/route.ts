import crypto from "crypto"
import Participant from "@/models/Participant"
import Event from "@/models/Event"
import mongoose from "mongoose"

export async function POST(req: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URI!)

    const body = await req.json()

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      registrationData,
    } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!registrationData) {
      return Response.json(
        { error: "Missing registration data" },
        { status: 400 }
      )
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex")

    if (expected !== razorpay_signature) {
      return Response.json({ success: false, error: "Invalid signature" }, { status: 400 })
    }

    // ✅ Create participant after successful payment
    const participant = await Participant.create({
      ...registrationData,
      paymentStatus: "completed",
      paymentMethod: "online",
      paymentId: razorpay_payment_id,
      approvalStatus: "approved",
      isRegistered: true,
      eventId: registrationData.eventId,
      eventDate: registrationData.eventDate,
    })

    // Update event counts
    const activeEvent = await Event.findById(registrationData.eventId)
    if (activeEvent) {
      const selectedTicket = activeEvent.ticketsPrice.find(
        (t: { name: string; price: number }) => t.name === registrationData.ticketType
      )
      if (selectedTicket) {
        selectedTicket.soldCount += registrationData.memberCount
        await activeEvent.save()
      }

      await Event.findByIdAndUpdate(
        registrationData.eventId,
        { $inc: { registeredCount: registrationData.memberCount } }
      )
    }

    return Response.json({ success: true, participantId: participant._id.toString() })
  } catch (error) {
    console.error("Error verifying payment:", error)
    return Response.json(
      { success: false, error: "Failed to verify payment" },
      { status: 500 }
    )
  }
}
