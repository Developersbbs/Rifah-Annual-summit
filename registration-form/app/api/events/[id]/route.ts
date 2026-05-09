import { NextRequest, NextResponse } from 'next/server'
import dbConnect from "@/lib/db"
import Event from '@/models/Event'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()
    
    // ✅ Await params in Next.js 15
    const { id } = await params
    
    const event = await Event.findById(id)
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    return NextResponse.json(event)
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized. Only super admin can update events.' }, { status: 403 })
    }

    const eventData = await request.json()
    
    await dbConnect()
    
    // ✅ Await params in Next.js 15
    const { id } = await params
    
    // Convert dates to Date objects if they're strings
    const updateData = {
      ...eventData,
      ...(eventData.registrationStart && { registrationStart: new Date(eventData.registrationStart) }),
      ...(eventData.registrationEnd && { registrationEnd: new Date(eventData.registrationEnd) }),
      ...(eventData.eventDate && { eventDate: new Date(eventData.eventDate) }),
      ...(eventData.startTime && { startTime: new Date(eventData.startTime) }),
      ...(eventData.endTime && { endTime: new Date(eventData.endTime) }),
    }
    
    const event = await Event.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    return NextResponse.json(event)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized. Only super admin can delete events.' }, { status: 403 })
    }

    await dbConnect()
    
    // ✅ Await params in Next.js 15
    const { id } = await params
    
    const event = await Event.findByIdAndDelete(id)
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
