import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Participant from "@/models/Participant"

// GST Format Validation (India)
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

// Cache for GST verification (24 hours TTL)
const gstCache = new Map<string, { valid: boolean; gstName: string | null; timestamp: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

// GST Verification API (Placeholder - replace with actual API)
async function verifyGstWithApi(gstNumber: string): Promise<{ valid: boolean; gstName: string | null; status: string }> {
  try {
    // TODO: Replace with actual GST verification API
    // Example APIs:
    // - https://appyflow.in/api/gst
    // - https://api.mastergst.com
    
    // For now, simulate API call
    // In production, make actual API call here
    console.log("Simulating GST API verification for:", gstNumber)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Placeholder: Return valid for demo purposes
    // In production, this would be actual API response
    return {
      valid: true,
      gstName: "Demo Business Name",
      status: "ACTIVE"
    }
  } catch (error) {
    console.error("GST API verification error:", error)
    return {
      valid: false,
      gstName: null,
      status: "UNKNOWN"
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const body = await req.json()
    const { gstNumber, eventId } = body

    console.log("GST verification request:", { gstNumber, eventId })

    // Stage 1: GST empty check
    if (!gstNumber || typeof gstNumber !== 'string') {
      return NextResponse.json({
        valid: false,
        error: "GST number is required",
        gstName: null
      })
    }

    // Normalize GST number (uppercase, trim)
    const normalizedGst = gstNumber.trim().toUpperCase()

    // Stage 2: Basic format validation
    if (!GST_REGEX.test(normalizedGst)) {
      return NextResponse.json({
        valid: false,
        error: "Invalid GST number format. Format: 22ABCDE1234F1Z5",
        gstName: null
      })
    }

    // Stage 3: Check cache
    const cached = gstCache.get(normalizedGst)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("GST found in cache:", normalizedGst)
      
      // Still need to check duplicate for this specific event
      if (eventId) {
        const duplicate = await Participant.findOne({
          gstNumber: normalizedGst,
          eventId: eventId
        }).lean()

        if (duplicate) {
          return NextResponse.json({
            valid: false,
            error: "This GST number has already been used for this event",
            gstName: cached.gstName,
            isDuplicate: true
          })
        }
      }

      return NextResponse.json({
        valid: cached.valid,
        gstName: cached.gstName,
        fromCache: true
      })
    }

    // Stage 4: Call GST API
    const apiResult = await verifyGstWithApi(normalizedGst)

    // Stage 5: Check if GST is ACTIVE
    if (!apiResult.valid || apiResult.status !== "ACTIVE") {
      return NextResponse.json({
        valid: false,
        error: apiResult.valid ? "GST is not active" : "Invalid GST number",
        gstName: apiResult.gstName
      })
    }

    // Stage 6: Check duplicate GST (same event)
    if (eventId) {
      const duplicate = await Participant.findOne({
        gstNumber: normalizedGst,
        eventId: eventId
      }).lean()

      if (duplicate) {
        return NextResponse.json({
          valid: false,
          error: "This GST number has already been used for this event",
          gstName: apiResult.gstName,
          isDuplicate: true
        })
      }
    }

    // Stage 7: Save to cache
    gstCache.set(normalizedGst, {
      valid: true,
      gstName: apiResult.gstName,
      timestamp: Date.now()
    })

    // Stage 8: Return success
    return NextResponse.json({
      valid: true,
      gstName: apiResult.gstName,
      status: apiResult.status
    })

  } catch (error) {
    console.error("GST verification error:", error)
    return NextResponse.json({
      valid: false,
      error: "Failed to verify GST number. Please try again.",
      gstName: null
    }, { status: 500 })
  }
}
