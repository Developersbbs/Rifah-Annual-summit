import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sendThankYouEmail, AlertEmailRecipient } from "@/lib/email"
import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user || !['admin', 'super-admin'].includes(user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()

        let recipients: AlertEmailRecipient[]

        if (body.recipients && Array.isArray(body.recipients)) {
            recipients = body.recipients
        } else {
            // Fetch all approved participants with valid emails from the database
            await dbConnect()
            const participants = await Participant.find({
                email: { $exists: true, $nin: [null, "", "N/A"] },
                approvalStatus: "approved",
            })
                .select("name email registrationId")
                .lean()

            recipients = participants
                .filter((p) => p.email && p.email !== "N/A" && p.email.includes("@"))
                .map((p) => ({
                    registrationId: p.registrationId || "N/A",
                    name: p.name || "Participant",
                    email: p.email as string,
                }))
        }

        const validRecipients: AlertEmailRecipient[] = recipients.filter(
            (r) => r.email && r.email !== "N/A" && r.email.includes("@")
        )

        if (validRecipients.length === 0) {
            return NextResponse.json(
                { error: "No recipients with valid email addresses" },
                { status: 400 }
            )
        }

        const result = await sendThankYouEmail(validRecipients)

        return NextResponse.json({
            success: result.success,
            message: `Thank you emails sent. Success: ${result.successCount}, Failed: ${result.failureCount}`,
            details: {
                successCount: result.successCount,
                failureCount: result.failureCount,
                totalRecipients: validRecipients.length,
            },
        })
    } catch (error) {
        console.error("Send thank you email error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
