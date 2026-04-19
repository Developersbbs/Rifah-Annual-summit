import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"

export async function POST(request: NextRequest) {
    try {
        await dbConnect()

        // Find all online payment participants that don't have isRegistered set or it's false
        const result = await Participant.updateMany(
            {
                paymentMethod: "online",
                $or: [
                    { isRegistered: { $exists: false } },
                    { isRegistered: false }
                ]
            },
            {
                $set: {
                    isRegistered: true
                }
            }
        )

        // Also ensure online payment participants have correct paymentStatus and approvalStatus
        const result2 = await Participant.updateMany(
            {
                paymentMethod: "online",
                $or: [
                    { paymentStatus: { $ne: "completed" } },
                    { approvalStatus: { $ne: "approved" } }
                ]
            },
            {
                $set: {
                    paymentStatus: "completed",
                    approvalStatus: "approved"
                }
            }
        )

        return NextResponse.json({
            success: true,
            message: `Updated ${result.modifiedCount} online payment participants with isRegistered, and ${result2.modifiedCount} with correct payment/approval status`,
            isRegisteredUpdated: result.modifiedCount,
            statusUpdated: result2.modifiedCount
        })

    } catch (error) {
        console.error("Backfill error:", error)
        return NextResponse.json(
            { success: false, error: "Failed to backfill online payment participants" },
            { status: 500 }
        )
    }
}
