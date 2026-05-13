"use server"

import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"
import SpeakerVolunteer from "@/models/SpeakerVolunteer"
import Counter from "@/models/Counter"
import { revalidatePath } from "next/cache"

/**
 * Generate a registration ID from the member's name and a sequence number.
 * Format: First 3 letters of name (uppercase) + 3-digit padded sequence.
 * Example: name="Imran", seq=1 → "IMR001"
 */
function buildRegistrationId(name: string, seq: number): string {
    // Take first 3 characters of the name, uppercase, fallback to "REG" if name is too short
    const prefix = (name || "REG")
        .replace(/[^a-zA-Z]/g, "") // Remove non-alpha characters
        .substring(0, 3)
        .toUpperCase()
        .padEnd(3, "X") // Pad with X if name has fewer than 3 letters

    return `${prefix}${String(seq).padStart(3, '0')}`
}

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
                participant.registrationId = buildRegistrationId(participant.name || "", counter.seq)
                participantUpdated = true
                updatedCount += 1
            }

            // Generate IDs for secondary members if missing
            if (participant.secondaryMembers && participant.secondaryMembers.length > 0) {
                for (const member of participant.secondaryMembers) {
                    if (!member.registrationId) {
                        counter.seq += 1
                        member.registrationId = buildRegistrationId(member.name || "", counter.seq)
                        participantUpdated = true
                        updatedCount += 1
                    }
                }
            }

            if (participantUpdated) {
                await participant.save()
            }
        }

        // Backfill IDs for speakers/volunteers that are missing one
        const svRecords = await SpeakerVolunteer.find({ registrationId: { $exists: false } })
        for (const sv of svRecords) {
            counter.seq += 1
            sv.registrationId = buildRegistrationId(sv.name || "", counter.seq)
            await sv.save()
            updatedCount += 1
        }

        await counter.save()
        revalidatePath("/admin")
        revalidatePath("/admin/speakers")

        return { success: true, message: `Generated ${updatedCount} IDs` }
    } catch (error) {
        console.error("Error generating IDs:", error)
        return { success: false, error: "Failed to generate IDs" }
    }
}

