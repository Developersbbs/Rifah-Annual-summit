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
            email,
            businessName,
            businessCategory,
            location,
            gender,
            ticketType,
            secondaryMembers,
            registrationLanguage,
        } = data

        // Check if participant exists
        const existingParticipant = await Participant.findById(id)
        if (!existingParticipant) {
            return { success: false, error: "Participant not found" }
        }

        // STRICT RULES: Only allow editing name, email, business name, business category, location
        // ❌ Prevent changing mobile number, ticket price, guest count
        // ❌ Prevent adding/removing secondary members (only allow editing existing ones)

        // Allow editing primary member name, email, business name, business category, location
        if (name) existingParticipant.name = name
        if (email !== undefined) existingParticipant.email = email
        if (businessName !== undefined) existingParticipant.businessName = businessName
        if (businessCategory !== undefined) existingParticipant.businessCategory = businessCategory
        if (location !== undefined) existingParticipant.location = location
        if (gender !== undefined) existingParticipant.gender = gender
        if (ticketType !== undefined) existingParticipant.ticketType = ticketType
        if (registrationLanguage !== undefined) existingParticipant.registrationLanguage = registrationLanguage

        // Allow editing secondary members' name, email, business name, business category, location only
        // Cannot add/remove secondary members, only edit existing ones
        if (secondaryMembers && existingParticipant.secondaryMembers) {
            // Check if number of members changed (adding/removing)
            if (secondaryMembers.length !== existingParticipant.secondaryMembers.length) {
                return { success: false, error: "Cannot add or remove secondary members. Only name, email, business name, business category, and location can be edited." }
            }

            // Update existing secondary members' name, email, business name, business category, location
            secondaryMembers.forEach((updatedMember, index) => {
                if (existingParticipant.secondaryMembers && existingParticipant.secondaryMembers[index]) {
                    if (updatedMember.name) {
                        existingParticipant.secondaryMembers[index].name = updatedMember.name
                    }
                    if (updatedMember.email !== undefined) {
                        existingParticipant.secondaryMembers[index].email = updatedMember.email
                    }
                    if (updatedMember.businessName !== undefined) {
                        existingParticipant.secondaryMembers[index].businessName = updatedMember.businessName
                    }
                    if (updatedMember.businessCategory !== undefined) {
                        existingParticipant.secondaryMembers[index].businessCategory = updatedMember.businessCategory
                    }
                    if (updatedMember.location !== undefined) {
                        existingParticipant.secondaryMembers[index].location = updatedMember.location
                    }
                    if (updatedMember.gender !== undefined) {
                        existingParticipant.secondaryMembers[index].gender = updatedMember.gender
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
