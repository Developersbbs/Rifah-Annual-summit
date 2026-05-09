import crypto from "crypto"
import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"
import Event from "@/models/Event"
import { IParticipant } from "@/lib/types"

export async function POST(req: Request) {
  try {
    await dbConnect()

    const rawBody = await req.text()
    const signature = req.headers.get("x-razorpay-signature")

    if (!signature) {
      return Response.json({ error: "Missing signature" }, { status: 400 })
    }

    // 🔐 Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(rawBody)
      .digest("hex")

    if (expectedSignature !== signature) {
      return Response.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(rawBody)

    console.log("Webhook Event:", event.event)

    // ✅ Handle payment success
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity

      const orderId = payment.order_id
      const paymentId = payment.id

      console.log("Processing orderId:", orderId)

      // 🔍 Find participant
      let participant = await Participant.findOne({
        razorpayOrderId: orderId,
      })

      // 🔥 Fallback: create if missing
      if (!participant) {
        console.warn("Participant not found. Creating fallback record.")

        participant = await Participant.create({
          razorpayOrderId: orderId,
          paymentStatus: "completed",
          paymentId: paymentId,
          approvalStatus: "approved",
          isRegistered: true,
          name: "Unknown",
          mobileNumber: "0000000000",
        })

        return Response.json({ success: true })
      }

      // 🔁 Idempotency check
      if (participant.paymentStatus === "completed") {
        console.log("Already processed:", participant._id)
        return Response.json({ success: true })
      }

      // ✅ Update participant
      participant.paymentStatus = "completed"
      participant.paymentId = paymentId
      participant.approvalStatus = "approved"
      participant.isRegistered = true

      await participant.save()

      console.log("Participant updated:", participant._id)

      // 📧 Send email (only once)
      const activeEvent = await Event.findById(participant.eventId)

      if (activeEvent && !participant.emailSent) {
        const { sendRegistrationEmails } = await import("@/lib/email")

        await sendRegistrationEmails(
          participant as unknown as IParticipant,
          activeEvent.eventName
        )

        participant.emailSent = true
        await participant.save()
      }
    }

    return Response.json({ success: true })
  } catch (error: unknown) {
    console.error("Webhook error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}
