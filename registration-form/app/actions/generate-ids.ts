"use server"

import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"
import Counter from "@/models/Counter"
import { revalidatePath } from "next/cache"

export async function generateRegisterIds() {
    try {
        await dbConnect()

        // Get or initialize counter
        let counter = await Counter.findOne({ id: "registrationId" })
        if (!counter) {
            counter = await Counter.create({ id: "registrationId", seq: 0 })
        }

        const participants = await Participant.find({ isRegistered: true })
        let updatedCount = 0

        for (const participant of participants) {
            let participantUpdated = false

            // Generate ID for primary member if missing
            if (!participant.registrationId) {
                counter.seq += 1
                participant.registrationId = `RAS-${String(counter.seq).padStart(4, '0')}`
                participantUpdated = true
                updatedCount += 1
            }

            // Generate IDs for secondary members if missing
            if (participant.secondaryMembers && participant.secondaryMembers.length > 0) {
                for (const member of participant.secondaryMembers) {
                    if (!member.registrationId) {
                        counter.seq += 1
                        member.registrationId = `RAS-${String(counter.seq).padStart(4, '0')}`
                        participantUpdated = true
                        updatedCount += 1
                    }
                }
            }

            if (participantUpdated) {
                await participant.save()
            }
        }

        await counter.save()
        revalidatePath("/admin")

        return { success: true, message: `Generated ${updatedCount} IDs` }
    } catch (error) {
        console.error("Error generating IDs:", error)
        return { success: false, error: "Failed to generate IDs" }
    }
}
