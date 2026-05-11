"use server"

import { registerParticipant } from "./register-participant"
import { getCurrentUser } from "@/lib/auth"

export async function bulkRegisterParticipants(participants: any[]) {
    const user = await getCurrentUser()
    
    if (!user || !['admin', 'super-admin'].includes(user.role)) {
        throw new Error("Unauthorized: Only admins can perform bulk registration")
    }

    const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
    }

    // Process participants in sequence to avoid hitting rate limits or database locks
    // though for small batches parallel could work, sequential is safer for now.
    for (const data of participants) {
        try {
            // Add current admin user info to the registration data
            // as registerParticipant checks for (data as any).createdBy
            const registrationData = {
                ...data,
                createdBy: {
                    _id: user.id,
                    role: user.role
                }
            }

            const result = await registerParticipant(registrationData)
            
            if (result.success) {
                results.success++
            } else {
                results.failed++
                results.errors.push(`${data.name || 'Unknown'}: ${result.error}`)
            }
        } catch (error: any) {
            results.failed++
            results.errors.push(`${data.name || 'Unknown'}: ${error.message || 'Unknown error'}`)
        }
    }

    return results
}
