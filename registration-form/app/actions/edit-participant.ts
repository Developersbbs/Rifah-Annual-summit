"use server"

import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"
import { revalidatePath } from "next/cache"
import { IParticipant } from "@/lib/types"

export async function updateParticipant(id: string, data: Partial<IParticipant>) {
    try {
        await dbConnect()

        const {
            mobileNumber,
            name,
            location,
            guestCount,
            ageGroups,
            foodPreference,
            isMorningFood,
        } = data

        // Check if participant exists
        const existingParticipant = await Participant.findById(id)
        if (!existingParticipant) {
            return { success: false, error: "Participant not found" }
        }

        // Check if mobile number is being changed and if it conflicts
        if (mobileNumber && mobileNumber !== existingParticipant.mobileNumber) {
            const conflict = await Participant.findOne({ mobileNumber, _id: { $ne: id } })
            if (conflict) {
                return { success: false, error: "Mobile number already registered to another participant" }
            }
        }

        // Update fields
        if (mobileNumber) existingParticipant.mobileNumber = mobileNumber
        if (name) existingParticipant.name = name
        if (location) existingParticipant.location = location
        
        if (guestCount !== undefined) {
            existingParticipant.guestCount = guestCount
            existingParticipant.ageGroups = { guest: guestCount }
            // Automatically update foodPreference if not provided separately
            if (!foodPreference) {
                existingParticipant.foodPreference = { guest: guestCount + 1 }
            }
        } else if (ageGroups) {
            existingParticipant.ageGroups = ageGroups
            existingParticipant.guestCount = ageGroups.guest || 0
        }

        if (foodPreference) existingParticipant.foodPreference = foodPreference
        if (isMorningFood !== undefined) existingParticipant.isMorningFood = isMorningFood
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
