import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Event from "@/models/Event"

export async function POST(req: NextRequest) {
    try {
        await dbConnect()

        // Check if event already exists
        const existingEvent = await Event.findOne({})
        if (existingEvent) {
            return NextResponse.json({ 
                message: "Event already exists", 
                event: existingEvent 
            }, { status: 409 })
        }

        // Create default event
        const now = new Date()
        const eventDate = new Date(now)
        eventDate.setDate(eventDate.getDate() + 7) // Event in 7 days
        
        const newEvent = new Event({
            eventName: "Pongal Vizha 2025",
            eventDate: eventDate,
            startTime: new Date(eventDate.setHours(10, 0, 0, 0)),
            endTime: new Date(eventDate.setHours(18, 0, 0, 0)),
            registrationStart: new Date(),
            registrationEnd: new Date(eventDate.setDate(eventDate.getDate() + 1)), // Registration ends day before event
            venue: {
                name: "Chennai Trade Centre",
                address: "Mount Road, Chennai",
                city: "Chennai"
            },
            maxCapacity: 1000,
            isActive: true,
            ticketsPrice: [
                {
                    name: "Regular",
                    price: 500,
                    soldCount: 0
                },
                {
                    name: "VIP",
                    price: 1000,
                    soldCount: 0
                },
                {
                    name: "Student",
                    price: 200,
                    soldCount: 0
                }
            ],
            taxRate: 18, // 18% GST
            createdBy: null
        })

        await newEvent.save()

        return NextResponse.json({
            success: true,
            message: "Default event created successfully",
            event: newEvent
        })

    } catch (error) {
        console.error("Error seeding event:", error)
        return NextResponse.json({ 
            error: "Failed to create event",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
}
