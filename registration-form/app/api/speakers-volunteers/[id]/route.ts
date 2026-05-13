import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import SpeakerVolunteer from "@/models/SpeakerVolunteer"

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const body = await request.json()
        const { role, name, email, mobileNumber, organization, designation, topic, bio } = body

        if (role && !["speaker", "volunteer"].includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 })
        }
        if (name !== undefined && !name?.trim()) {
            return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
        }

        await dbConnect()
        const updated = await SpeakerVolunteer.findByIdAndUpdate(
            id,
            {
                ...(role && { role }),
                ...(name && { name: name.trim() }),
                email: email?.trim() || "",
                mobileNumber: mobileNumber?.trim() || "",
                organization: organization?.trim() || "",
                designation: designation?.trim() || "",
                topic: topic?.trim() || "",
                bio: bio?.trim() || "",
            },
            { new: true, runValidators: true }
        )

        if (!updated) {
            return NextResponse.json({ error: "Record not found" }, { status: 404 })
        }
        return NextResponse.json({ record: updated })
    } catch (error) {
        console.error("Failed to update record:", error)
        return NextResponse.json({ error: "Failed to update record" }, { status: 500 })
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        await dbConnect()
        const deleted = await SpeakerVolunteer.findByIdAndDelete(id)
        if (!deleted) {
            return NextResponse.json({ error: "Record not found" }, { status: 404 })
        }
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to delete record:", error)
        return NextResponse.json({ error: "Failed to delete record" }, { status: 500 })
    }
}
