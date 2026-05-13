import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import SpeakerVolunteer from "@/models/SpeakerVolunteer"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")

    try {
        await dbConnect()
        const query = role ? { role } : {}
        const records = await SpeakerVolunteer.find(query).sort({ createdAt: -1 }).lean()
        return NextResponse.json({ records })
    } catch (error) {
        console.error("Failed to fetch speakers/volunteers:", error)
        return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { role, name, email, mobileNumber, organization, designation, topic, bio, eventId } = body

        if (!role || !["speaker", "volunteer"].includes(role)) {
            return NextResponse.json({ error: "Invalid role. Must be 'speaker' or 'volunteer'" }, { status: 400 })
        }
        if (!name?.trim()) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

        await dbConnect()
        const record = await SpeakerVolunteer.create({
            role,
            name: name.trim(),
            email: email?.trim() || undefined,
            mobileNumber: mobileNumber?.trim() || undefined,
            organization: organization?.trim() || undefined,
            designation: designation?.trim() || undefined,
            topic: topic?.trim() || undefined,
            bio: bio?.trim() || undefined,
            eventId: eventId || undefined,
        })

        return NextResponse.json({ record }, { status: 201 })
    } catch (error) {
        console.error("Failed to create speaker/volunteer:", error)
        return NextResponse.json({ error: "Failed to create record" }, { status: 500 })
    }
}
