import { NextRequest, NextResponse } from "next/server"
import { approveRegistration } from "@/app/actions/approve-registration"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { participantId, markPaid } = body

        if (!participantId) {
            return NextResponse.json(
                { success: false, error: "Participant ID is required" },
                { status: 400 }
            )
        }

        const result = await approveRegistration(participantId, markPaid)

        if (result.success) {
            return NextResponse.json(result, { status: 200 })
        } else {
            return NextResponse.json(result, { status: 400 })
        }

    } catch (error) {
        console.error("API Error:", error)
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        )
    }
}
