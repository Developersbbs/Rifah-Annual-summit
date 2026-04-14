"use server"

import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"
import Event from "@/models/Event"

interface RegisterParticipantData {
    mobileNumber: string
    name: string
    email?: string
    businessName?: string
    businessCategory?: string
    location?: string
    paymentMethod?: string
    // Simplified food preference
    foodGuest?: number
    isMorningFood?: boolean
    guestCount?: number
    // Simplified age groups
    ageGuest?: number
    ticketType: string
    isMember?: boolean
}

export async function registerParticipant(data: RegisterParticipantData) {
    try {
        await dbConnect()

        const {
            mobileNumber,
            name,
            email,
            businessName,
            businessCategory,
            location,
            paymentMethod = "cash",
            foodGuest = 0,
            isMorningFood = false,
            guestCount = 0,
            ageGuest = 0,
            ticketType,
            isMember = false
        } = data

        const totalPeople = 1 + (guestCount || 0)
        const finalAgeGroups = { guest: ageGuest || guestCount || 0 }
        const finalFoodPreference = { guest: foodGuest || totalPeople }

        // COMPREHENSIVE VALIDATION
        if (!mobileNumber || !name || !ticketType) {
            return {
                success: false,
                error: "Missing required fields: mobile number, name, and ticket type are required"
            }
        }

        // Validate mobile number format
        const phoneRegex = /^\+?[1-9]\d{1,14}$/
        if (!phoneRegex.test(mobileNumber)) {
            return {
                success: false,
                error: "Invalid mobile number format"
            }
        }

        // Validate email format if provided
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email)) {
                return {
                    success: false,
                    error: "Invalid email format"
                }
            }
        }

        // Validate guest counts
        if (totalPeople < 1 || !Number.isInteger(totalPeople)) {
            return {
                success: false,
                error: "Invalid guest counts"
            }
        }

        // Validate payment method
        if (!["cash", "online"].includes(paymentMethod)) {
            return {
                success: false,
                error: "Invalid payment method"
            }
        }

        // FOOD PREFERENCE - Commented out
        // if (foodPreference) {
        //     const veg = foodPreference.veg || 0
        //     const nonVeg = foodPreference.nonVeg || 0
        //     
        //     if (veg < 0 || nonVeg < 0) {
        //         return {
        //             success: false,
        //             error: "Food preference counts cannot be negative"
        //         }
        //     }

        //     if (veg + nonVeg > totalPeople) {
        //         return {
        //             success: false,
        //             error: "Total food preference count exceeds total people"
        //         }
        //     }
        // }

        const now = new Date()

        // FIND ACTIVE EVENT
        const activeEvent = await Event.findOne({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        })

        if (!activeEvent) {
            return {
                success: false,
                error: "No active event found. Please contact administrator."
            }
        }

        // FIND TICKET
        const selectedTicket = activeEvent.ticketsPrice.find(
            (t: { name: string; price: number; soldCount: number }) => t.name === ticketType
        )

        if (!selectedTicket) {
            return {
                success: false,
                error: `Invalid ticket type: ${ticketType}. Please select a valid ticket.`
            }
        }

        // Check event capacity
        if (activeEvent.registeredCount + totalPeople > activeEvent.maxCapacity) {
            return {
                success: false,
                error: "Event is at full capacity. No more registrations available."
            }
        }

        let pricePerPerson = selectedTicket.price

        // Validate price
        if (pricePerPerson < 0) {
            return {
                success: false,
                error: "Invalid ticket price"
            }
        }

        // FOOD PREFERENCE - Commented out
        // const normalizedFoodPreference = {
        //     veg: Math.max(0, foodPreference?.veg || 0),
        //     nonVeg: Math.max(0, foodPreference?.nonVeg || 0)
        // }

        // Apply member discount
        if (isMember) {
            pricePerPerson = Math.max(0, pricePerPerson - 200)
        }

        const totalAmount = totalPeople * pricePerPerson

        // PAYMENT LOGIC
        let paymentStatus = "pending"
        let approvalStatus = "pending"

        if (paymentMethod === "online") {
            paymentStatus = "completed"
            approvalStatus = "approved"
        }

        // Create participant with validated data
        const participant = await Participant.create({
            mobileNumber: mobileNumber.trim(),
            name: name.trim(),
            email: email?.trim(),
            businessName: businessName?.trim(),
            businessCategory: businessCategory?.trim(),
            location: location?.trim(),
            paymentMethod,
            paymentStatus,
            approvalStatus,
            foodPreference: finalFoodPreference,
            isMorningFood,
            isRegistered: true,
            eventId: activeEvent._id,
            eventDate: activeEvent.startDate,
            ageGroups: finalAgeGroups,
            guestCount: totalPeople - 1,
            ticketType,
            ticketPrice: pricePerPerson,
            totalAmount,
            isMember
        })

        // Update event counts atomically
        selectedTicket.soldCount += totalPeople
        await activeEvent.save()

        await Event.findByIdAndUpdate(
            activeEvent._id,
            { $inc: { registeredCount: totalPeople } }
        )

        return {
            success: true,
            id: participant._id.toString(),
            totalAmount
        }

    } catch (error: unknown) {
        console.error("Error registering participant:", error)

        // Handle specific MongoDB errors
        if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
            return {
                success: false,
                error: "This mobile number is already registered for this event"
            }
        }

        if (error && typeof error === 'object' && 'name' in error && error.name === "ValidationError") {
            return {
                success: false,
                error: "Validation failed: " + Object.values((error as unknown as { errors: Record<string, { message: string }> }).errors).map((e) => e.message).join(", ")
            }
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to register. Please try again later."
        }
    }
}
