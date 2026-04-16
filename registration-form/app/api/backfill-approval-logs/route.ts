import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"

export async function POST() {
    try {
        await dbConnect()

        const participants = await Participant.find({ 
            approvalLogs: { $exists: true, $ne: [] },
            approvedBy: { $exists: true }
        }).lean()

        let updatedCount = 0

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const participant of participants as any[]) {
            let needsUpdate = false
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updatedLogs = participant.approvalLogs.map((log: any) => {
                if (!log.approvedBy && participant.approvedBy) {
                    needsUpdate = true
                    return {
                        ...log,
                        approvedBy: participant.approvedBy
                    }
                }
                return log
            })

            if (needsUpdate) {
                await Participant.findByIdAndUpdate(participant._id, {
                    approvalLogs: updatedLogs
                })
                updatedCount++
            }
        }

        return NextResponse.json({
            success: true,
            message: `Backfilled approvedBy in ${updatedCount} participants`,
            updatedCount
        })

    } catch (error) {
        console.error("Backfill error:", error)
        return NextResponse.json(
            { error: "Failed to backfill approval logs" },
            { status: 500 }
        )
    }
}
