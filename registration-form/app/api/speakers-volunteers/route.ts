import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import SpeakerVolunteer from "@/models/SpeakerVolunteer"
import Counter from "@/models/Counter"

function buildRegistrationId(name: string, seq: number): string {
    const prefix = (name || "REG")
        .replace(/[^a-zA-Z]/g, "")
        .substring(0, 3)
        .toUpperCase()
        .padEnd(3, "X")
    return `${prefix}${String(seq).padStart(3, "0")}`
}

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

        // Auto-generate a registration ID using the shared counter
        const counter = await Counter.findOneAndUpdate(
            { id: "registrationId" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        )
        const registrationId = buildRegistrationId(name.trim(), counter.seq)

        const record = await SpeakerVolunteer.create({
            role,
            name: name.trim(),
            registrationId,
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
