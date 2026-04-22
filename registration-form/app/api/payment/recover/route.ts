import Razorpay from "razorpay"
import Participant from "@/models/Participant"
import mongoose from "mongoose"

// POST /api/payment/recover
// Body: { paymentId: "pay_XXXXXXXXXXXX", registrationData: { ...form fields } }
export async function POST(req: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URI!)

    const body = await req.json()
    const { paymentId, registrationData } = body

    if (!paymentId) {
      return Response.json({ error: "paymentId is required" }, { status: 400 })
    }

    // Check if participant already exists with this paymentId
    const existing = await Participant.findOne({ paymentId })
    if (existing) {
      return Response.json({
        success: true,
        message: "Participant already exists with this payment ID",
        participant: existing,
      })
    }

    // Fetch payment details from Razorpay to verify it's real
    const razorpay = new Razorpay({
      key_id: (process.env.RAZORPAY_KEY_ID || "").trim(),
      key_secret: (process.env.RAZORPAY_KEY_SECRET || "").trim(),
    })

    const payment = await razorpay.payments.fetch(paymentId)
    console.log("Fetched payment from Razorpay:", payment)

    if (payment.status !== "captured" && payment.status !== "authorized") {
      return Response.json({
        error: `Payment status is '${payment.status}', not captured. Cannot recover.`,
        payment,
      }, { status: 400 })
    }

    // If registrationData is provided, use it. Otherwise build minimal record from Razorpay data.
    const dataToSave = registrationData ? {
      ...registrationData,
      paymentId,
      paymentStatus: "completed",
      paymentMethod: "online",
      isRegistered: true,
      approvalStatus: "approved",
    } : {
      // Minimal data from Razorpay payment
      mobileNumber: payment.contact || "unknown",
      name: payment.description || "Unknown",
      email: payment.email || "",
      paymentId,
      paymentStatus: "completed",
      paymentMethod: "online",
      totalAmount: (payment.amount as number) / 100,
      isRegistered: true,
      approvalStatus: "approved",
    }

    const participant = await Participant.create(dataToSave)
    console.log("Recovered participant:", participant._id)

    return Response.json({
      success: true,
      message: "Participant recovered and saved to DB successfully",
      participantId: participant._id.toString(),
      paymentDetails: {
        id: payment.id,
        amount: (payment.amount as number) / 100,
        status: payment.status,
        email: payment.email,
        contact: payment.contact,
        createdAt: new Date((payment.created_at as number) * 1000).toISOString(),
      },
    })
  } catch (error: unknown) {
    console.error("Recovery error:", error)
    const errorMessage = error instanceof Error ? error.message : "Recovery failed"
    return Response.json({
      error: errorMessage,
      details: error,
    }, { status: 500 })
  }
}
