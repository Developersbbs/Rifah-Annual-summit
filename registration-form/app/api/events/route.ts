import { NextRequest, NextResponse } from 'next/server'
import dbConnect from "@/lib/db"
import Event from '@/models/Event'
import { getCurrentUser } from '@/lib/auth'
import mongoose from 'mongoose'

export async function GET() {
  try {
    await dbConnect()

    const events = await Event.find({})
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(events)

  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const user = await getCurrentUser()

    // AUTH CHECK
    if (!user || user.role !== 'super-admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Only super admin allowed.' },
        { status: 403 }
      )
    }

    // ✅ FINAL SAFE VERSION
    const userId = user.id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // 🔍 DEBUG: Check what's coming from frontend
    console.log("BODY:", body)
    console.log("TICKETS:", body.ticketsPrice)

    const {
      eventName,
      startDate,
      endDate,
      location,
      maxCapacity,
      taxRate = 0,
    } = body

    // VALIDATION
    if (!eventName || !startDate || !endDate || !location) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // DATE VALIDATION
    if (new Date(startDate) > new Date(endDate)) {
      return NextResponse.json(
        { error: 'Start date cannot be after end date' },
        { status: 400 }
      )
    }

    // ✅ STRONG VALIDATION: Handle tickets properly
    let finalTickets = body.ticketsPrice

    if (!Array.isArray(finalTickets) || finalTickets.length === 0) {
      finalTickets = [{ name: "General", price: 0, soldCount: 0 }]
    }

    // ✅ FILTER EMPTY TICKETS: Remove invalid entries
    finalTickets = finalTickets.filter((ticket: { name: string; price: number }) =>
      ticket.name && ticket.price >= 0
    )

    console.log("FINAL TICKETS TO SAVE:", finalTickets)

    // ✅ CLEAN EVENT CREATION
    const event = new Event({
      eventName,
      registrationStart,
      registrationEnd,
      eventDate,
      startTime,
      endTime,
      venue,
      maxCapacity: maxCapacity || 100,
      ticketsPrice: finalTickets,
      taxRate,
      createdBy: userId
    })

    await event.save()

    return NextResponse.json(event, { status: 201 })

  } catch (error: unknown) {
    console.error('Error creating event:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create event' },
      { status: 500 }
    )
  }
}