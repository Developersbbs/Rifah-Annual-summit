"use server"

import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"
import Counter from "@/models/Counter"
import { revalidatePath } from "next/cache"
import { IParticipant } from "@/lib/types"

function buildRegistrationId(name: string, seq: number): string {
    const prefix = (name || "REG")
        .replace(/[^a-zA-Z]/g, "")
        .substring(0, 3)
        .toUpperCase()
        .padEnd(3, "X")
    return `${prefix}${String(seq).padStart(3, "0")}`
}

export async function updateParticipant(id: string, data: Partial<IParticipant>) {
    try {
        await dbConnect()

        const {
            name,
            email,
            businessName,
            businessCategory,
            location,
            gender,
            ticketType,
            secondaryMembers,
            isSponsor,
            registrationLanguage,
        } = data

        const existingParticipant = await Participant.findById(id)
        if (!existingParticipant) {
            return { success: false, error: "Participant not found" }
        }

        if (name) existingParticipant.name = name
        if (email !== undefined) existingParticipant.email = email
        if (businessName !== undefined) existingParticipant.businessName = businessName
        if (businessCategory !== undefined) existingParticipant.businessCategory = businessCategory
        if (location !== undefined) existingParticipant.location = location
        if (gender !== undefined) existingParticipant.gender = gender
        if (ticketType !== undefined) existingParticipant.ticketType = ticketType
        if (isSponsor !== undefined) {
            existingParticipant.isSponsor = isSponsor
            if (isSponsor === true) {
                existingParticipant.approvalStatus = "approved"
                existingParticipant.paymentStatus = "completed"
            }
        }
        if (registrationLanguage !== undefined) existingParticipant.registrationLanguage = registrationLanguage

        // Replace secondary members array — supports adding, removing, and editing
        if (secondaryMembers !== undefined) {
            // Build the new array, preserving _id and registrationId for existing members
            const newMembers = secondaryMembers.map((m, index) => {
                const existing = existingParticipant.secondaryMembers?.[index]
                return {
                    ...(existing ? { _id: existing._id, registrationId: existing.registrationId } : {}),
                    name: m.name || "",
                    email: m.email ?? "",
                    businessName: m.businessName ?? "",
                    businessCategory: m.businessCategory ?? "",
                    location: m.location ?? "",
                    gender: m.gender ?? "",
                    isMember: (m as { isMember?: boolean }).isMember ?? false,
                    isCheckedIn: existing?.isCheckedIn ?? false,
                    checkedInAt: existing?.checkedInAt,
                }
            })

            // Generate registration IDs for any new member that doesn't have one
            const needsId = newMembers.filter(m => !m.registrationId && m.name)
            if (needsId.length > 0) {
                const counter = await Counter.findOneAndUpdate(
                    { id: "registrationId" },
                    { $inc: { seq: needsId.length } },
                    { new: true, upsert: true }
                )
                // Assign IDs from the end of the incremented range
                let seq = counter.seq - needsId.length + 1
                for (const member of newMembers) {
                    if (!member.registrationId && member.name) {
                        member.registrationId = buildRegistrationId(member.name, seq++)
                    }
                }
            }

            existingParticipant.secondaryMembers = newMembers
        }

        existingParticipant.updatedAt = new Date()
        await existingParticipant.save()

        revalidatePath("/admin")
        revalidatePath("/admin/locations")
        revalidatePath("/admin/members")

        return { success: true }
    } catch (error: unknown) {
        console.error("Error updating participant:", error)
        return { success: false, error: "Failed to update participant" }
    }
}
