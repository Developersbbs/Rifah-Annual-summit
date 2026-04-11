import { NextResponse } from 'next/server'
import dbConnect from "@/lib/db"
import Event from '@/models/Event'

export async function GET() {
  try {
    await dbConnect()
    
    const now = new Date()
    const activeEvent = await Event.findOne({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).sort({ createdAt: -1 })
    
    return NextResponse.json(activeEvent || null)
  } catch (error: unknown) {
    console.error('Error fetching active event:', error)
    return NextResponse.json({ error: 'Failed to fetch active event' }, { status: 500 })
  }
}
