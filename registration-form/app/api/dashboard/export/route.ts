import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"
import * as XLSX from "xlsx"

export async function GET() {
    try {
        await dbConnect()
        const participants = await Participant.find({ isRegistered: true, approvalStatus: 'approved' }).lean()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any[] = []

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                PrimaryPhone: "",
                BaseAmount: p.primaryAmount?.baseAmount || 0,
                TaxAmount: p.primaryAmount?.taxAmount || 0,
                TotalAmount: p.primaryAmount?.totalAmount || 0,
                TaxRate: p.taxRate || 0
            })

            // secondary
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            p.secondaryMembers?.forEach((m: any) => {
                data.push({
                    Name: m.name,
                    Type: "Secondary",
                    Phone: m.mobileNumber,
                    Email: m.email || "",
                    CheckedIn: m.isCheckedIn ? "Yes" : "No",
                    EventDate: p.eventDate || "",
                    Location: m.location || p.location || "",
                    PrimaryMember: p.name,
                    PrimaryPhone: p.mobileNumber,
                    BaseAmount: m.baseAmount || 0,
                    TaxAmount: m.taxAmount || 0,
                    TotalAmount: m.totalAmount || 0,
                    TaxRate: p.taxRate || 0
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

        return new Response(new Uint8Array(buffer as ArrayBuffer), {
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
