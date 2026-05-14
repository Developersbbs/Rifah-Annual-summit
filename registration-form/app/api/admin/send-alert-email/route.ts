import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sendAlertEmail, AlertEmailRecipient } from "@/lib/email"

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user || !['admin', 'super-admin'].includes(user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { recipients } = await request.json()

        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return NextResponse.json({ error: "Recipients list is required" }, { status: 400 })
        }

        const validRecipients: AlertEmailRecipient[] = recipients.filter(
            (r: AlertEmailRecipient) => r.email && r.email !== 'N/A' && r.email.includes('@')
        )

        if (validRecipients.length === 0) {
            return NextResponse.json({ error: "No recipients with valid email addresses" }, { status: 400 })
        }

        const result = await sendAlertEmail(validRecipients)

        return NextResponse.json({
            success: result.success,
            message: `Email sent. Success: ${result.successCount}, Failed: ${result.failureCount}`,
            details: { successCount: result.successCount, failureCount: result.failureCount }
        })
    } catch (error) {
        console.error("Send alert email error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
