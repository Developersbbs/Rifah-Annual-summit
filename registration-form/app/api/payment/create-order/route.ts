import Razorpay from "razorpay"
import Participant from "@/models/Participant"
import mongoose from "mongoose"

export async function POST(req: Request) {
  try {
    // Check if env variables are set
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Missing Razorpay environment variables")
      return Response.json(
        { error: "Payment configuration error" },
        { status: 500 }
      )
    }

    const keyId = process.env.RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    
    console.log(`Key ID length: ${keyId.length}, strict match: ${keyId === keyId.trim()}`);
    console.log(`Key Secret length: ${keySecret.length}, strict match: ${keySecret === keySecret.trim()}`);
    console.log(`Key Secret raw: >${keySecret}<`);

    const razorpay = new Razorpay({
      key_id: keyId.trim(),
      key_secret: keySecret.trim(),
    })

    const body = await req.json()
    console.log("Create order request body:", body)

    const { amount, participantId } = body

    if (!amount) {
      console.error("Missing required field: amount")
      return Response.json(
        { error: "Missing required field: amount" },
        { status: 400 }
      )
    }

    console.log("Creating Razorpay order with amount:", amount)
    console.log("participantId:", participantId || "not provided")
    console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID)

    const order = await razorpay.orders.create({
      amount: amount * 100, // ₹ → paise
      currency: "INR",
      receipt: "order_" + Date.now(),
    })

    console.log("Razorpay order created successfully:", order.id)

    // Store razorpayOrderId in participant if participantId provided
    if (participantId) {
      await mongoose.connect(process.env.MONGODB_URI!)
      await Participant.findByIdAndUpdate(participantId, {
        razorpayOrderId: order.id
      })
      console.log("Stored razorpayOrderId in participant:", participantId)
    }

    return Response.json(order)
  } catch (error: unknown) {
    console.error("Error creating Razorpay order:", error)
    const errorMessage = error && typeof error === 'object' && 'error' in error
      ? (error as { error: { description?: string } }).error?.description || "Failed to create order"
      : "Failed to create order"
    return Response.json(
      { error: errorMessage, fullError: error },
      { status: 500 }
    )
  }
}
