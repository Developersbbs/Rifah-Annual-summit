import nodemailer from "nodemailer"
import SystemConfig from "@/models/SystemConfig"
import User from "@/models/User"
import dbConnect from "@/lib/db"
import { IParticipant } from "@/lib/types"

export async function sendRegistrationEmails(participant: IParticipant, eventName: string) {
    try {
        await dbConnect()

        // 1. Get SMTP Config
        const config = await SystemConfig.findOne({ key: 'smtp' }).lean()
        if (!config || !config.value) {
            console.warn("SMTP configuration missing. Emails not sent.")
            return { success: false, error: "SMTP not configured" }
        }

        const { host, port, user, pass, fromEmail } = config.value

        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
        })

        const language = participant.registrationLanguage || 'en'
        const isTamil = language === 'ta'
        
        const isPending = participant.paymentStatus === 'pending'
        
        console.log(`DEBUG - Sending emails for ${participant.name}. Language: ${language}, isTamil: ${isTamil}`)
        
        // 2. Prepare Member Email Content
        const memberSubject = isTamil 
            ? `${isPending ? 'பதிவு பெறப்பட்டது' : 'பதிவு உறுதிப்படுத்தப்பட்டது'} - ${eventName}`
            : `${isPending ? 'Registration Received' : 'Registration Confirmed'} - ${eventName}`

        const memberHtml = isTamil ? `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #16a34a;">வணக்கம் ${participant.name},</h2>
                <p>${eventName}-ற்கான உங்கள் பதிவு ${isPending ? 'பெறப்பட்டது' : 'வெற்றிகரமாக முடிந்தது'}.</p>
                <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>பதிவு விவரங்கள்:</strong></p>
                    <ul style="list-style: none; padding: 0;">
                        <li>பெயர்: ${participant.name}</li>
                        <li>கைபேசி: ${participant.mobileNumber}</li>
                        <li>டிக்கெட் வகை: ${participant.ticketType}</li>
                        <li>பணம் செலுத்தும் முறை: ${participant.paymentMethod === 'online' ? 'ஆன்லைன்' : 'ரொக்கம்'}</li>
                        <li>தொகை: ₹${participant.totalAmount}</li>
                        <li>நிலை: ${participant.paymentStatus === 'pending' ? 'நிலுவையில் உள்ளது (நிர்வாக அனுமதிக்கு காத்திருக்கிறது)' : 'முடிந்தது'}</li>
                    </ul>
                </div>
                ${isPending ? '<p>நிர்வாகம் உங்கள் பதிவை சரிபார்த்து விரைவில் உறுதி செய்யும்.</p>' : '<p>மாநாட்டில் உங்களை சந்திக்க ஆவலாக உள்ளோம்.</p>'}
                <p>வாழ்த்துகளுடன்,<br>ரிஃபா (RIFAH) குழு</p>
            </div>
        ` : `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #16a34a;">Hello ${participant.name},</h2>
                <p>Your registration for the ${eventName} has been ${isPending ? 'received' : 'successfully completed'}.</p>
                <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Registration Details:</strong></p>
                    <ul style="list-style: none; padding: 0;">
                        <li>Name: ${participant.name}</li>
                        <li>Mobile: ${participant.mobileNumber}</li>
                        <li>Ticket Type: ${participant.ticketType}</li>
                        <li>Payment Method: ${participant.paymentMethod}</li>
                        <li>Amount: ₹${participant.totalAmount}</li>
                        <li>Payment Status: ${participant.paymentStatus === 'pending' ? 'Pending (Awaiting Admin Approval)' : 'Completed'}</li>
                    </ul>
                </div>
                ${isPending ? '<p>Our team will review your registration and confirm it shortly.</p>' : '<p>We look forward to seeing you at the summit.</p>'}
                <p>Best Regards,<br>RIFAH Team</p>
            </div>
        `

        // 3. Prepare Admin Email Content
        const adminSubject = `New Registration: ${participant.name} - ${eventName}`
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === "production"
            ? "https://rifahtn.com"
            : "http://localhost:3000")

        const adminHtml = `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #2563eb;">New Event Registration</h2>
                <p>A new participant has registered for ${eventName}.</p>
                <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Participant Details:</strong></p>
                    <ul style="list-style: none; padding: 0;">
                        <li>Name: ${participant.name}</li>
                        <li>Mobile: ${participant.mobileNumber}</li>
                        <li>Email: ${participant.email || 'N/A'}</li>
                        <li>Ticket: ${participant.ticketType}</li>
                        <li>Location: ${participant.location || 'N/A'}</li>
                        <li>Amount: ₹${participant.totalAmount}</li>
                        <li>Payment: ${participant.paymentMethod} (${participant.paymentStatus})</li>
                        <li>Language: ${participant.registrationLanguage || 'en (defaulted)'}</li>
                    </ul>
                </div>
                <p><a href="${appUrl}/admin/participants" style="color: #2563eb;">View in Admin Dashboard</a></p>
            </div>
        `

        // 4. Send to Member (if email exists)
        if (participant.email) {
            try {
                await transporter.sendMail({
                    from: fromEmail || user,
                    to: participant.email,
                    subject: memberSubject,
                    html: memberHtml,
                })
                console.log(`Confirmation email sent to member: ${participant.email}`)
            } catch (memberErr) {
                console.error(`Failed to send email to member (${participant.email}):`, memberErr)
            }
        }

        // 5. Send to Admins & Additional Manual Emails
        // Add any manual emails here
        const manualEmails: string[] = ["info@rifah.org", "jeevanandam2708@gmail.com"]
        
        // Combine all admin recipients, including fromEmail, and exclude the participant themselves
        const adminRecipientsList = [...manualEmails, fromEmail || user]
        const finalAdminRecipients = [...new Set(adminRecipientsList.filter(email => email && email !== participant.email))]

        if (finalAdminRecipients.length > 0) {
            try {
                await transporter.sendMail({
                    from: fromEmail || user,
                    to: finalAdminRecipients.join(','),
                    subject: adminSubject,
                    html: adminHtml,
                })
                console.log(`Admin notification emails sent to: ${finalAdminRecipients.join(', ')}`)
            } catch (adminErr) {
                console.error("Failed to send admin notification emails:", adminErr)
            }
        }

        return { success: true }
    } catch (error) {
        console.error("General error in sendRegistrationEmails:", error)
        return { success: false, error: "Email process failed" }
    }
}
