import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

interface InvoiceData {
  name: string
  email: string
  mobileNumber: string
  businessName?: string
  gstNumber?: string
  gstName?: string
  ticketType: string
  baseAmount: number
  taxAmount: number
  totalAmount: number
  taxRate: number
  paymentId: string
  memberCount: number
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const invoiceData: InvoiceData = body

    console.log("Generating invoice for:", invoiceData.name)

    // Create invoices directory if it doesn't exist
    const invoicesDir = join(process.cwd(), "public", "invoices")
    if (!existsSync(invoicesDir)) {
      await mkdir(invoicesDir, { recursive: true })
    }

    // Generate unique filename
    const filename = `invoice_${invoiceData.paymentId}_${Date.now()}.txt`
    const filepath = join(invoicesDir, filename)

    // Generate invoice content
    const invoiceContent = generateInvoiceText(invoiceData)

    // Write invoice file
    await writeFile(filepath, invoiceContent, "utf-8")

    // Return public URL
    const invoiceUrl = `/invoices/${filename}`

    console.log("Invoice generated successfully:", invoiceUrl)

    return NextResponse.json({
      success: true,
      invoiceUrl: invoiceUrl,
      filename: filename
    })

  } catch (error) {
    console.error("Error generating invoice:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate invoice"
      },
      { status: 500 }
    )
  }
}

function generateInvoiceText(data: InvoiceData): string {
  const date = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })

  let invoice = `
════════════════════════════════════════════════════════════════
                    RIFAH ANNUAL SUMMIT 2026
════════════════════════════════════════════════════════════════

INVOICE

Date: ${date}
Invoice ID: ${data.paymentId}

────────────────────────────────────────────────────────────────
BILLING DETAILS
────────────────────────────────────────────────────────────────

Name: ${data.name}
Mobile: ${data.mobileNumber}
${data.email ? `Email: ${data.email}` : ''}
${data.businessName ? `Business: ${data.businessName}` : ''}
${data.ticketType ? `Ticket Type: ${data.ticketType}` : ''}
${data.memberCount ? `Total Members: ${data.memberCount}` : ''}

────────────────────────────────────────────────────────────────
PAYMENT DETAILS
────────────────────────────────────────────────────────────────

Base Amount: ₹${data.baseAmount.toLocaleString()}
GST (${data.taxRate}%): ₹${data.taxAmount.toLocaleString()}
────────────────────────────────────────────────────────────────
TOTAL: ₹${data.totalAmount.toLocaleString()}
────────────────────────────────────────────────────────────────

Payment ID: ${data.paymentId}
Payment Status: Completed

`

  // Add GST section if GST number provided
  if (data.gstNumber) {
    invoice += `
────────────────────────────────────────────────────────────────
GST DETAILS
────────────────────────────────────────────────────────────────

GST Number: ${data.gstNumber.toUpperCase()}
${data.gstName ? `Business Name (as per GST): ${data.gstName}` : ''}

`
  }

  invoice += `
────────────────────────────────────────────────────────────────
TERMS & CONDITIONS
────────────────────────────────────────────────────────────────

1. Registration fees are non-transferable and non-refundable.
2. GST is applicable as per government regulations.
3. This invoice is generated automatically upon successful payment.
4. For any queries, please contact the event organizer.

════════════════════════════════════════════════════════════════
                    Thank you for your registration!
════════════════════════════════════════════════════════════════
`

  return invoice
}
