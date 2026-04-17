import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"
import { getCurrentUser } from "@/lib/auth"
import { verifyQR } from "@/lib/qr-generator"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const user = await getCurrentUser()

    // Access control - only admin and super-admin can check in
    if (!user || !["admin", "super-admin"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { qr } = await req.json()

    if (!qr) {
      return NextResponse.json(
        { success: false, error: "QR data is required" },
        { status: 400 }
      )
    }

    // Verify QR signature and parse payload
    const verification = verifyQR(qr)

    if (!verification.valid) {
      return NextResponse.json(
        { success: false, error: verification.error },
        { status: 400 }
      )
    }

    const { payload } = verification
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid QR payload" },
        { status: 400 }
      )
    }

    const participant = await Participant.findById(payload.pId!)

    if (!participant) {
      // Log failed scan attempt
      return NextResponse.json(
        { success: false, error: "Invalid participant" },
        { status: 404 }
      )
    }

    // Check if participant is approved and registered
    if (participant.approvalStatus !== "approved") {
      return NextResponse.json(
        { success: false, error: "Participant is not approved" },
        { status: 400 }
      )
    }

    if (!participant.isRegistered) {
      return NextResponse.json(
        { success: false, error: "Participant is not registered" },
        { status: 400 }
      )
    }

    // PRIMARY CHECK-IN (no secondary member ID)
    if (!payload.sId) {
      const updated = await Participant.updateOne(
        { _id: payload.pId!, "checkIn.isCheckedIn": false },
        {
          $set: {
            "checkIn.isCheckedIn": true,
            "checkIn.memberPresent": true,
            "checkIn.timestamp": new Date(),
            "checkIn.checkedInBy": user.email,
          },
          $push: {
            scanLogs: {
              type: "primary",
              memberId: null,
              scannedBy: user._id,
              deviceId: req.headers.get("user-agent") || "unknown",
              status: "success",
              timestamp: new Date(),
            },
          },
        }
      )

      if (updated.modifiedCount === 0) {
        // Check if already checked in
        if (participant.checkIn?.isCheckedIn) {
          return NextResponse.json(
            { success: false, error: "Already checked in" },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { success: false, error: "Check-in failed" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "Primary checked in successfully",
        participantName: participant.name,
      })
    }

    // SECONDARY MEMBER CHECK-IN
    const member = participant.secondaryMembers.id(payload.sId!)

    if (!member) {
      return NextResponse.json(
        { success: false, error: "Invalid secondary member" },
        { status: 404 }
      )
    }

    if (member.isCheckedIn) {
      return NextResponse.json(
        { success: false, error: "Member already checked in" },
        { status: 400 }
      )
    }

    // Update secondary member check-in
    member.isCheckedIn = true
    member.checkedInAt = new Date()

    // Add scan log
    participant.scanLogs?.push({
      type: "secondary",
      memberId: payload.sId!,
      scannedBy: user._id,
      deviceId: req.headers.get("user-agent") || "unknown",
      status: "success",
      timestamp: new Date(),
    })

    // Update overall check-in status if primary is checked in or any secondary is checked in
    const anyCheckedIn = participant.checkIn?.isCheckedIn || 
                       participant.secondaryMembers.some((m: any) => m.isCheckedIn)
    
    if (!participant.checkIn) {
      participant.checkIn = {
        isCheckedIn: anyCheckedIn,
        memberPresent: false,
        timestamp: new Date(),
        checkedInBy: user.email,
      }
    } else {
      participant.checkIn.isCheckedIn = anyCheckedIn
      participant.checkIn.checkedInBy = user.email
    }

    await participant.save()

    return NextResponse.json({
      success: true,
      message: "Secondary checked in successfully",
      participantName: participant.name,
      memberName: member.name,
    })
  } catch (error) {
    console.error("QR Check-in error:", error)
    return NextResponse.json(
      { success: false, error: "Check-in failed" },
      { status: 500 }
    )
  }
}
