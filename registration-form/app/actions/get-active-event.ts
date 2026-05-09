"use server"

import dbConnect from "@/lib/db"
import Event from "@/models/Event"

export async function getActiveEvent() {
    try {
        await dbConnect()

        const now = new Date()

        const activeEvent = await Event.findOne({
            isActive: true,
            registrationStart: { $lte: now },
            registrationEnd: { $gte: now }
        }).lean()

        if (!activeEvent) {
            return {
                success: false,
                error: "No active event found"
            }
        }

        // Serialize the event data for client consumption.
        // JSON.parse(JSON.stringify(...)) converts all ObjectId / Date instances
        // (which have toJSON methods) into plain strings/values that Next.js RSC
        // can safely pass to Client Components.
        const serialized = JSON.parse(JSON.stringify(activeEvent))

        return {
            success: true,
            event: {
                ...serialized,
                // Keep dates as explicit ISO strings for consistent client usage
                registrationStart: activeEvent.registrationStart.toISOString(),
                registrationEnd: activeEvent.registrationEnd.toISOString(),
                eventDate: activeEvent.eventDate.toISOString(),
                startTime: activeEvent.startTime.toISOString(),
                endTime: activeEvent.endTime.toISOString(),
                createdAt: activeEvent.createdAt?.toISOString() ?? null,
                updatedAt: activeEvent.updatedAt?.toISOString() ?? null,
            }
        }
    } catch (error: unknown) {
        console.error("Error fetching active event:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch active event"
        }
    }
}
