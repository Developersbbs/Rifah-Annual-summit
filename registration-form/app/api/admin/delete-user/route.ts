import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Participant from '@/models/Participant'
import { getCurrentUser } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
    try {
        // Check if user is authenticated and is admin
        const currentUser = await getCurrentUser()
        
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user has admin role
        if (!['admin', 'super-admin'].includes(currentUser.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        const { participantId, confirmName } = await request.json()

        if (!participantId || !confirmName) {
            return NextResponse.json({ error: 'Participant ID and confirmation name are required' }, { status: 400 })
        }

        await dbConnect()

        // Find the participant to get their name for verification
        const participant = await Participant.findById(participantId)
        
        if (!participant) {
            return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
        }

        // Verify the entered name matches the participant's name (case-insensitive)
        if (confirmName.trim().toLowerCase() !== participant.name.toLowerCase()) {
            return NextResponse.json({ error: 'Name does not match. Deletion cancelled.' }, { status: 400 })
        }

        // Delete the participant
        await Participant.findByIdAndDelete(participantId)

        return NextResponse.json({ 
            success: true, 
            message: `Participant "${participant.name}" has been deleted successfully` 
        })

    } catch (error) {
        console.error('Error deleting participant:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
