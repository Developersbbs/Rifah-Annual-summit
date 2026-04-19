"use server"

import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"
import { revalidatePath } from "next/cache"
import { IParticipant } from "@/lib/types"

export async function updateParticipant(id: string, data: Partial<IParticipant>) {
    try {
        await dbConnect()

        const {
            name,
            businessName,
            secondaryMembers,
        } = data

        // Check if participant exists
        const existingParticipant = await Participant.findById(id)
        if (!existingParticipant) {
            return { success: false, error: "Participant not found" }
        }

        // STRICT RULES: Only allow editing name and business name
        // ❌ Prevent changing location, mobile number, ticket price, guest count
        // ❌ Prevent adding/removing secondary members (only allow editing existing ones)

        // Allow editing primary member name and business name
        if (name) existingParticipant.name = name
        if (businessName !== undefined) existingParticipant.businessName = businessName

        // Allow editing secondary members' name and business name only
        // Cannot add/remove secondary members, only edit existing ones
        if (secondaryMembers && existingParticipant.secondaryMembers) {
            // Check if number of members changed (adding/removing)
            if (secondaryMembers.length !== existingParticipant.secondaryMembers.length) {
                return { success: false, error: "Cannot add or remove secondary members. Only name and business name can be edited." }
            }

            // Update existing secondary members' name and business name
            secondaryMembers.forEach((updatedMember, index) => {
                if (existingParticipant.secondaryMembers && existingParticipant.secondaryMembers[index]) {
                    if (updatedMember.name) {
                        existingParticipant.secondaryMembers[index].name = updatedMember.name
                    }
                    if (updatedMember.businessName !== undefined) {
                        existingParticipant.secondaryMembers[index].businessName = updatedMember.businessName
                    }
                }
            })
        }

        existingParticipant.updatedAt = new Date()

        await existingParticipant.save()

        revalidatePath("/admin")
        revalidatePath("/admin/locations")

        return { success: true }
    } catch (error: unknown) {
        console.error("Error updating participant:", error)
        return { success: false, error: "Failed to update participant" }
    }
}
