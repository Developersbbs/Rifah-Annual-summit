import QRCode from "qrcode"
import crypto from "crypto"

const SECRET = process.env.QR_SECRET || "your-secret-key-change-in-production"

export interface QRPayload {
  pId: string // participant ID
  sId: string | null // secondary member ID or null
  exp: number // expiration timestamp
}

export interface QRData {
  payload: string
  sig: string
}

/**
 * Generate a secure QR code with HMAC signature
 */
export async function generateQR(
  participantId: string,
  secondaryMemberId: string | null = null,
  expiresInHours: number = 24
): Promise<string> {
  const payloadObj: QRPayload = {
    pId: participantId,
    sId: secondaryMemberId,
    exp: Date.now() + 1000 * 60 * 60 * expiresInHours,
  }

  const payload = JSON.stringify(payloadObj)
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex")

  const qrData: QRData = { payload, sig }
  const qrDataString = JSON.stringify(qrData)

  return QRCode.toDataURL(qrDataString)
}

/**
 * Verify QR signature and return parsed payload
 */
export function verifyQR(qrDataString: string): { valid: boolean; payload?: QRPayload; error?: string } {
  try {
    const qrData: QRData = JSON.parse(qrDataString)
    const { payload, sig } = qrData

    // Verify signature
    const expectedSig = crypto
      .createHmac("sha256", SECRET)
      .update(payload)
      .digest("hex")

    if (sig !== expectedSig) {
      return { valid: false, error: "Invalid QR signature" }
    }

    // Parse payload
    const payloadObj: QRPayload = JSON.parse(payload)

    // Check expiration
    if (Date.now() > payloadObj.exp) {
      return { valid: false, error: "QR expired" }
    }

    return { valid: true, payload: payloadObj }
  } catch (error) {
    return { valid: false, error: "Invalid QR format" }
  }
}

/**
 * Generate QR for secondary member
 */
export async function generateSecondaryMemberQR(
  participantId: string,
  secondaryMemberId: string,
  expiresInHours: number = 24
): Promise<string> {
  return generateQR(participantId, secondaryMemberId, expiresInHours)
}
