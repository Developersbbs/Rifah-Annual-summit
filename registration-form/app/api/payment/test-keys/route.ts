import Razorpay from "razorpay"

export async function GET() {
  const keyId = (process.env.RAZORPAY_KEY_ID || "").trim()
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim()

  const info = {
    keyId_present: !!keyId,
    keyId_prefix: keyId.substring(0, 12) + "...",
    keyId_length: keyId.length,
    keySecret_present: !!keySecret,
    keySecret_length: keySecret.length,
    mode: keyId.startsWith("rzp_live") ? "LIVE" : keyId.startsWith("rzp_test") ? "TEST" : "UNKNOWN",
  }

  if (!keyId || !keySecret) {
    return Response.json({ status: "error", message: "Missing credentials", info })
  }

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
    // Minimal API call - fetch orders with limit 1 to validate credentials
    await razorpay.orders.all({ count: 1 })
    return Response.json({ status: "success", message: "Credentials are VALID ✅", info })
  } catch (err: unknown) {
    const razorpayError = err && typeof err === 'object' && 'error' in err
      ? (err as { error?: { description?: string } }).error?.description
      : String(err)
    const statusCode = err && typeof err === 'object' && 'statusCode' in err
      ? (err as { statusCode?: number }).statusCode
      : undefined
    return Response.json({
      status: "error",
      message: "Credentials are INVALID ❌",
      razorpayError,
      statusCode,
      info,
    })
  }
}
