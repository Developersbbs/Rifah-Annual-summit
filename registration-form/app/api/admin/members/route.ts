import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser()
        if (!user || !['admin', 'super-admin'].includes(user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await dbConnect()
        
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search') || ''

        const query: any = { isRegistered: true }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { mobileNumber: { $regex: search, $options: 'i' } },
                { registrationId: { $regex: search, $options: 'i' } }
            ]
        }

        const participants = await Participant.find(query).lean()

        const allMembers: any[] = []

        participants.forEach((p: any) => {
            // Add primary member
            allMembers.push({
                registrationId: p.registrationId || "N/A",
                name: p.name,
                mobileNumber: p.mobileNumber,
                email: p.email || "N/A",
                location: p.location || "N/A",
                type: "Primary",
                gender: p.gender || "N/A",
                businessName: p.businessName || "N/A",
                businessCategory: p.businessCategory || "N/A",
                paymentStatus: p.paymentStatus,
                approvalStatus: p.approvalStatus,
                createdAt: p.createdAt
            })

            // Add secondary members
            if (p.secondaryMembers && p.secondaryMembers.length > 0) {
                p.secondaryMembers.forEach((sm: any) => {
                    allMembers.push({
                        registrationId: sm.registrationId || "N/A",
                        name: sm.name,
                        mobileNumber: sm.mobileNumber || p.mobileNumber, // Fallback to primary
                        email: sm.email || "N/A",
                        location: sm.location || p.location || "N/A",
                        type: "Secondary",
                        gender: sm.gender || "N/A",
                        businessName: sm.businessName || p.businessName || "N/A",
                        businessCategory: sm.businessCategory || p.businessCategory || "N/A",
                        paymentStatus: p.paymentStatus, // Inherit from primary
                        approvalStatus: p.approvalStatus, // Inherit from primary
                        createdAt: p.createdAt
                    })
                })
            }
        })

        // Sort by registration ID or creation date
        allMembers.sort((a, b) => {
            if (a.registrationId && b.registrationId) {
                return a.registrationId.localeCompare(b.registrationId)
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })

        return NextResponse.json({ members: allMembers })
    } catch (error) {
        console.error("Fetch members error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
