import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"
import * as XLSX from "xlsx"

const FILENAME = `Dashboard_${new Date().toISOString().split("T")[0]}`

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "xlsx"

    try {
        await dbConnect()
        const participants = await Participant.find({ isRegistered: true, approvalStatus: "approved" })
            .select("+createdAt")
            .lean()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any[] = []

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        participants.forEach((p: any) => {
            data.push({
                Name: p.name,
                Type: p.isSponsor ? "Sponsor" : "Primary",
                Phone: p.mobileNumber,
                Email: p.email || "",
                Gender: p.gender || "other",
                "Primary Member": "Self",
                "Primary Phone": "Self",
                CheckedIn: p.checkIn?.memberPresent ? "Yes" : "No",
                EventDate: p.eventDate || "",
                Location: p.location || "",
                BaseAmount: p.baseAmount || 0,
                TaxAmount: p.taxAmount || 0,
                TotalAmount: p.totalAmount || 0,
                TaxRate: p.taxRate || 0,
                PaymentMethod: p.paymentMethod || "",
                PaymentStatus: p.paymentStatus || "",
                "Created Date": p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "",
                "Created Time": p.createdAt ? new Date(p.createdAt).toLocaleTimeString() : "",
            })

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            p.secondaryMembers?.forEach((m: any) => {
                data.push({
                    Name: m.name,
                    Type: "Secondary",
                    Phone: m.mobileNumber,
                    Email: m.email || "",
                    Gender: m.gender || "other",
                    "Primary Member": p.name,
                    "Primary Phone": p.mobileNumber,
                    CheckedIn: m.isCheckedIn ? "Yes" : "No",
                    EventDate: p.eventDate || "",
                    Location: m.location || p.location || "",
                    BaseAmount: m.baseAmount || 0,
                    TaxAmount: m.taxAmount || 0,
                    TotalAmount: m.totalAmount || 0,
                    TaxRate: p.taxRate || 0,
                    PaymentMethod: p.paymentMethod || "",
                    PaymentStatus: p.paymentStatus || "",
                    "Created Date": p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "",
                    "Created Time": p.createdAt ? new Date(p.createdAt).toLocaleTimeString() : "",
                })
            })
        })

        if (format === "json") {
            return new Response(JSON.stringify(data, null, 2), {
                headers: {
                    "Content-Disposition": `attachment; filename=${FILENAME}.json`,
                    "Content-Type": "application/json",
                },
            })
        }

        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Participants")

        if (format === "csv") {
            const csv = XLSX.utils.sheet_to_csv(worksheet)
            return new Response(csv, {
                headers: {
                    "Content-Disposition": `attachment; filename=${FILENAME}.csv`,
                    "Content-Type": "text/csv;charset=utf-8;",
                },
            })
        }

        // default: xlsx
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
        return new Response(new Uint8Array(buffer as ArrayBuffer), {
            headers: {
                "Content-Disposition": `attachment; filename=${FILENAME}.xlsx`,
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
        })
    } catch (error) {
        console.error("Export error:", error)
        return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
    }
}
