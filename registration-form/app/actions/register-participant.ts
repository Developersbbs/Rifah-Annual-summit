"use server"

import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"
import Event from "@/models/Event"

// Helper function for input sanitization
function sanitizeInput(input: string): string {
    if (!input) return ""
    return input.trim().replace(/[<>"'&]/g, "")
}

interface SecondaryMemberInput {
    name: string
    mobileNumber?: string
    email?: string
    businessName?: string
    businessCategory?: string
    location?: string
    gender?: string
    isMember?: boolean
}

interface RegisterParticipantData {
    mobileNumber: string
    name: string
    email?: string
    businessName?: string
    businessCategory?: string
    location?: string
    gender?: string
    paymentMethod?: string
    // Simplified food preference
    foodGuest?: number
    isMorningFood?: boolean
    guestCount?: number
    // Simplified age groups
    ageGuest?: number
    ticketType: string
    isMember?: boolean
    secondaryMembers?: SecondaryMemberInput[]
    gstNumber?: string
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
            gender,
            paymentMethod = "cash",
            foodGuest = 0,
            isMorningFood = false,
            ageGuest = 0,
            ticketType,
            isMember = false,
            secondaryMembers = [],
            gstNumber
        } = data

        const totalPeople = 1 + secondaryMembers.length
        const finalAgeGroups = { guest: ageGuest || 0 }
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

        // PAYMENT LOGIC
        let paymentStatus = "pending"
        let approvalStatus = "pending"

        if (paymentMethod === "online") {
            paymentStatus = "completed"
            approvalStatus = "approved"
        }

        // Build secondary members array with defaults and sanitization
        const formattedSecondaryMembers = secondaryMembers
            .filter(member => member.name && member.name.trim() !== '') // Only include members with names
            .map(member => ({
                name: sanitizeInput(member.name),
                mobileNumber: member.mobileNumber ? sanitizeInput(member.mobileNumber) : undefined,
                email: member.email ? sanitizeInput(member.email) : undefined,
                businessName: member.businessName ? sanitizeInput(member.businessName) : undefined,
                businessCategory: member.businessCategory ? sanitizeInput(member.businessCategory) : undefined,
                location: member.location ? sanitizeInput(member.location) : undefined,
                gender: member.gender || undefined,
                isMember: member.isMember || false,
                isCheckedIn: false
            }))

        // Check for duplicate mobile numbers in secondary members
        const mobileNumbers = formattedSecondaryMembers
            .map(m => m.mobileNumber)
            .filter((n): n is string => n !== undefined)
        
        const uniqueMobileNumbers = new Set(mobileNumbers)
        if (mobileNumbers.length !== uniqueMobileNumbers.size) {
            return { success: false, error: "Duplicate mobile numbers found in secondary members" }
        }
        
        // Check if secondary member mobile number matches primary registrant
        if (mobileNumbers.includes(mobileNumber.trim())) {
            return { success: false, error: "Secondary member mobile number cannot match primary registrant" }
        }

        const actualMemberCount = formattedSecondaryMembers.length
        const actualTotalPeople = 1 + actualMemberCount
        
        // Force recalculation in backend (never trust frontend)
        const backendTotalMembers = 1 + actualMemberCount
        const taxRate = activeEvent.taxRate || 0

        // Calculate per-person amounts
        const perPersonBase = pricePerPerson
        const perPersonTax = Math.round((perPersonBase * taxRate) / 100)
        const perPersonTotal = perPersonBase + perPersonTax

        // Primary member tax breakdown
        const primaryAmount = {
            baseAmount: perPersonBase,
            taxAmount: perPersonTax,
            totalAmount: perPersonTotal
        }

        // Secondary members with per-person tax breakdown
        const formattedSecondaryMembersWithTax = formattedSecondaryMembers.map(member => ({
            ...member,
            baseAmount: perPersonBase,
            taxAmount: perPersonTax,
            totalAmount: perPersonTotal
        }))

        // Calculate totals by summing all individual amounts
        const totalBaseAmount = primaryAmount.baseAmount + formattedSecondaryMembersWithTax.reduce((sum, m) => sum + m.baseAmount, 0)
        const totalTaxAmount = primaryAmount.taxAmount + formattedSecondaryMembersWithTax.reduce((sum, m) => sum + m.taxAmount, 0)
        const totalAmount = totalBaseAmount + totalTaxAmount

        // Create participant with validated and sanitized data
        const participant = await Participant.create({
            mobileNumber: sanitizeInput(mobileNumber),
            name: sanitizeInput(name),
            email: email ? sanitizeInput(email) : undefined,
            businessName: businessName ? sanitizeInput(businessName) : undefined,
            businessCategory: businessCategory ? sanitizeInput(businessCategory) : undefined,
            location: location ? sanitizeInput(location) : undefined,
            gender: gender || undefined,
            paymentMethod,
            paymentStatus,
            approvalStatus,
            foodPreference: finalFoodPreference,
            isMorningFood,
            isRegistered: true,
            eventId: activeEvent._id,
            eventDate: activeEvent.eventDate,
            ageGroups: finalAgeGroups,
            guestCount: 0,
            memberCount: backendTotalMembers,
            ticketType,
            ticketPrice: pricePerPerson,
            totalAmount: totalAmount,
            taxRate,
            taxAmount: totalTaxAmount,
            baseAmount: totalBaseAmount,
            primaryAmount,
            gstNumber: gstNumber ? sanitizeInput(gstNumber) : undefined,
            isMember,
            secondaryMembers: formattedSecondaryMembersWithTax
        })

        // Update event counts atomically
        selectedTicket.soldCount += actualTotalPeople
        await activeEvent.save()

        await Event.findByIdAndUpdate(
            activeEvent._id,
            { $inc: { registeredCount: actualTotalPeople } }
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
