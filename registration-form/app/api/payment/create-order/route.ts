import Razorpay from "razorpay"

// Check if env variables are set
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("Missing Razorpay environment variables")
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("Create order request body:", body)

    const { amount } = body

    if (!amount) {
      console.error("Missing required field: amount")
      return Response.json(
        { error: "Missing required field: amount" },
        { status: 400 }
      )
    }

    console.log("Creating Razorpay order with amount:", amount)

    const order = await razorpay.orders.create({
      amount: amount * 100, // ₹ → paise
      currency: "INR",
      receipt: "order_" + Date.now(),
    })

    console.log("Razorpay order created successfully:", order.id)
    return Response.json(order)
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error)
    console.error("Error details:", error.message, error.stack)
    return Response.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    )
  }
}
