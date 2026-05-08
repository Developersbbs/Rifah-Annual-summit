import { NextRequest, NextResponse } from 'next/server'
import Participant from '@/models/Participant'
import dbConnect from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        await dbConnect()

        // Get sample participants to check gender data
        const participants = await Participant.find({}).limit(10).select('name gender email')
        
        const genderStats = await Participant.aggregate([
            {
                $group: {
                    _id: '$gender',
                    count: { $sum: 1 }
                }
            }
        ])

        const missingGender = await Participant.countDocuments({
            $or: [
                { gender: { $exists: false } },
                { gender: null },
                { gender: '' }
            ]
        })

        return NextResponse.json({
            totalChecked: participants.length,
            sampleParticipants: participants.map(p => ({
                name: p.name,
                email: p.email,
                gender: p.gender || 'MISSING'
            })),
            genderDistribution: genderStats,
            missingGenderCount: missingGender
        })

    } catch (error) {
        console.error('Debug gender error:', error)
        return NextResponse.json({ error: 'Failed to debug gender data' }, { status: 500 })
    }
}
