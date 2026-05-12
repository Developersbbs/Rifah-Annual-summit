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
      console.warn("Webhook: Missing signature")
      return Response.json({ error: "Missing signature" }, { status: 400 })
    }

    // 🔐 Verify signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("Webhook: RAZORPAY_WEBHOOK_SECRET not configured")
      return Response.json({ error: "Configuration error" }, { status: 500 })
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex")

    if (expectedSignature !== signature) {
      console.warn("Webhook: Invalid signature")
      return Response.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(rawBody)
    console.log("Webhook Event Received:", event.event)

    // ✅ Handle payment success (payment.captured or order.paid)
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payload = event.payload.payment?.entity || event.payload.order?.entity

      const orderId = event.payload.order?.entity?.id || (event.payload.payment?.entity?.order_id)
      const paymentId = event.payload.payment?.entity?.id

      if (!orderId) {
        console.warn("Webhook: No orderId found in payload")
        return Response.json({ success: true, message: "No orderId to process" })
      }

      console.log("Webhook: Processing orderId:", orderId, "paymentId:", paymentId)

      // 🔍 Find participant by razorpayOrderId
      let participant = await Participant.findOne({
        razorpayOrderId: orderId,
      })

      // 🔥 Fallback: find by mobile if notes contains it (optional, but good for safety)
      if (!participant && event.payload.payment?.entity?.notes?.participantId) {
        participant = await Participant.findById(event.payload.payment.entity.notes.participantId)
      }

      if (!participant) {
        console.warn("Webhook: Participant not found for orderId:", orderId)
        // We return 200 to Razorpay because we don't want retries for a non-existent participant
        return Response.json({ success: true, message: "Participant not found" })
      }

      // 🔁 Idempotency check: if already completed, just return success
      if (participant.paymentStatus === "completed" && participant.isRegistered) {
        console.log("Webhook: Already processed participant:", participant._id)
        return Response.json({ success: true, message: "Already processed" })
      }

      // ✅ Update participant
      participant.paymentStatus = "completed"
      participant.paymentId = paymentId || participant.paymentId
      participant.razorpayPaymentId = paymentId || participant.razorpayPaymentId
      participant.approvalStatus = "approved"
      participant.isRegistered = true

      // Add approval log if not already approved
      const hasSystemApproval = participant.approvalLogs?.some((log: any) => log.role === "system" && log.status === "approved")
      if (!hasSystemApproval) {
        participant.approvalLogs.push({
          role: "system",
          status: "approved",
          timestamp: new Date()
        })
      }

      await participant.save()
      console.log("Webhook: Participant updated successfully:", participant._id)

      // 📧 Send email if not already sent
      if (!participant.emailSent) {
        try {
          const activeEvent = await Event.findById(participant.eventId)
          if (activeEvent) {
            const { sendRegistrationEmails } = await import("@/lib/email")
            await sendRegistrationEmails(
              participant as unknown as IParticipant,
              activeEvent.eventName
            )
            participant.emailSent = true
            await participant.save()
            console.log("Webhook: Confirmation email sent to:", participant.email)
          }
        } catch (emailError) {
          console.error("Webhook: Failed to send email:", emailError)
          // Don't fail the webhook if email fails
        }
      }
    }

    return Response.json({ success: true })
  } catch (error: unknown) {
    console.error("Webhook error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}
