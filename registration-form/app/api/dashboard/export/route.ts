import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"
import * as XLSX from "xlsx"

export async function GET() {
    try {
        await dbConnect()
        const participants = await Participant.find({ isRegistered: true, approvalStatus: 'approved' }).lean()

        let data: any[] = []

        participants.forEach((p: any) => {
            // primary
            data.push({
                Name: p.name,
                Type: "Primary",
                Phone: p.mobileNumber,
                Email: p.email || "",
                CheckedIn: p.checkIn?.isCheckedIn ? "Yes" : "No",
                EventDate: p.eventDate || "",
                Location: p.location || "",
                PrimaryMember: "",
                PrimaryPhone: ""
            })

            // secondary
            p.secondaryMembers?.forEach((m: any) => {
                data.push({
                    Name: m.name,
                    Type: "Secondary",
                    Phone: m.mobileNumber,
                    Email: m.email || "",
                    CheckedIn: m.isCheckedIn ? "Yes" : "No",
                    EventDate: p.eventDate || "",
                    Location: p.location || "",
                    PrimaryMember: p.name,
                    PrimaryPhone: p.mobileNumber
                })
            })
        })

        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Participants")

        const buffer = XLSX.write(workbook, {
            type: "buffer",
            bookType: "xlsx"
        })

        return new Response(buffer as Buffer, {
            headers: {
                "Content-Disposition": "attachment; filename=participants.xlsx",
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
        })
    } catch (error) {
        console.error("Excel export error:", error)
        return NextResponse.json(
            { error: "Failed to export to Excel" },
            { status: 500 }
        )
    }
}
