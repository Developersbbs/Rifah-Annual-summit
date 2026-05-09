import nodemailer from "nodemailer"
import SystemConfig from "@/models/SystemConfig"
import dbConnect from "@/lib/db"
import { IParticipant } from "@/lib/types"
import path from "path"

export async function sendRegistrationEmails(participant: IParticipant, eventName: string, skipAdmin: boolean = false) {
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
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>பதிவு உறுதிப்படுத்தல்</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #ef0707 0%, #801515 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);"></div>
                        <div style="position: relative; z-index: 1;">
                            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                                <img src="cid:logo" alt="RIFAH Logo" style="width: 80px; height: auto; margin: 0 auto 15px; display: block;">
                            </div>
                            <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                RIFAH ANNUAL SUMMIT 2026 REGISTRATION CONFIRMED
                            </h1>
                            
                        </div>
                    </div>

                    <!-- Content -->
                    <div style="padding: 40px 30px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0;">
                                வணக்கம் ${participant.name},
                            </h2>
                            <p style="color: #6b7280; font-size: 16px; margin: 10px 0 0; line-height: 1.6;">
                                ${eventName}-ற்கான உங்கள் பதிவு ${isPending ? 'வெற்றிகரமாக பெறப்பட்டது' : 'வெற்றிகரமாக உறுதிப்படுத்தப்பட்டது'}.
                            </p>
                        </div>

                        <!-- Email Images -->
                        <div style="text-align: center; margin: 30px 0;">
                            <img src="cid:mail1" alt="Event Image" style="max-width: 100%; height: auto; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                            <img src="cid:mail2" alt="Event Details" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        </div>

                        <!-- Registration Details Card -->
                        <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; margin: 30px 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                            <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 20px; display: flex; align-items: center;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" style="margin-right: 8px;">
                                    <rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0110 0v4"></path>
                                </svg>
                                பதிவு விவரங்கள்
                            </h3>
                            <div style="display: grid; gap: 15px;">
                                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">பெயர்</span>
                                    <span style="color: #1f2937; font-weight: 600;">${participant.name}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">கைபேசி</span>
                                    <span style="color: #1f2937; font-weight: 600;">${participant.mobileNumber}</span>
                                </div>
                                                                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">பணம் செலுத்தும் முறை</span>
                                    <span style="color: #1f2937; font-weight: 600;">${participant.paymentMethod === 'online' ? 'ஆன்லைன்' : 'ரொக்கம்'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 12px 0;">
                                    <span style="color: #6b7280; font-weight: 500;">தொகை</span>
                                    <span style="color: #16a34a; font-weight: 700; font-size: 18px;">₹${participant.totalAmount}</span>
                                </div>
                            </div>
                            <div style="margin-top: 20px; padding: 15px; background: ${participant.paymentStatus === 'pending' ? '#fef3c7' : '#92400e'}; border-radius: 8px; border-left: 4px solid ${participant.paymentStatus === 'pending' ? '#f59e0b' : '#92400e'};">
                                <div style="display: flex; align-items: center;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${participant.paymentStatus === 'pending' ? '#f59e0b' : '#92400e'}" stroke-width="2" style="margin-right: 10px;">
                                        ${participant.paymentStatus === 'pending'
                ? '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>'
                : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
            }
                                    </svg>
                                    <span style="color: ${participant.paymentStatus === 'pending' ? '#92400e' : '#7c2d12'}; font-weight: 600;">
                                        ${participant.paymentStatus === 'pending' ? 'நிலுவையில் உள்ளது (நிர்வாக அனுமதிக்கு காத்திருக்கிறது)' : 'முடிந்தது'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Status Message -->
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="display: inline-block; padding: 15px 25px; background: ${isPending ? '#fef3c7' : '#92400e'}; border-radius: 50px; color: ${isPending ? '#92400e' : '#7c2d12'}; font-weight: 500;">
                                ${isPending ? 'நிர்வாகம் உங்கள் பதிவை சரிபார்த்து விரைவில் உறுதி செய்யும்.' : 'மாநாட்டில் உங்களை சந்திக்க ஆவலாக உள்ளோம்.'}
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="background: #1f2937; padding: 30px; text-align: center;">
                        <div style="margin-bottom: 20px;">
                            <img src="cid:logo" alt="RIFAH Logo" style="width: 80px; height: auto; margin: 0 auto 15px; display: block;">
                            <h4 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0;">ரிஃபா (RIFAH)</h4>
                            <p style="color: #9ca3af; font-size: 14px; margin: 5px 0 0;">தமிழ்நாடு வர்த்தக சங்கங்களின் கூட்டமைப்பு</p>
                        </div>
                        <div style="border-top: 1px solid #374151; padding-top: 20px;">
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                இந்த மின்னஞ்சல் தானியங்கி முறையில் அனுப்பப்பட்டது. தயவு செய்து பதிலளிக்க வேண்டாம்.
                            </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        ` : `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Registration Confirmation</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #d10c09 0%, #f52404 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
    <div style="position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);"></div>
    <div style="position: relative; z-index: 1;">
        <!-- Fixed: removed flexbox, use line-height to center SVG -->
        <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; line-height: 60px; text-align: center;">
            <img 
                src="cid:logo" 
                width="30" 
                height="30" 
                alt="Confirmed" 
                style="vertical-align: middle; display: inline-block;"
            />
        </div>
        <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            RIFAH ANNUAL SUMMIT 2026 REGISTRATION CONFIRMED
        </h1>
    </div>
</div>

                    <!-- Content -->
                    <div style="padding: 40px 30px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0;">
                                Hello ${participant.name},
                            </h2>
                            <p style="color: #6b7280; font-size: 16px; margin: 10px 0 0; line-height: 1.6;">
                                Your registration for the ${eventName} has been ${isPending ? 'successfully received' : 'successfully completed'}.
                            </p>
                        </div>

                        <!-- Email Images -->
                        <div style="text-align: center; margin: 30px 0;">
                            <img src="cid:mail1" alt="Event Image" style="max-width: 100%; height: auto; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                            <img src="cid:mail2" alt="Event Details" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        </div>

                        <!-- Registration Details Card -->
                        <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; margin: 30px 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                            <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 20px; display: flex; align-items: center;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" style="margin-right: 8px;">
                                    <rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0110 0v4"></path>
                                </svg>
                                Registration Details
                            </h3>
                            <div style="display: grid; gap: 15px;">
                                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">Name : </span>
                                    <span style="color: #1f2937; font-weight: 600;">${participant.name}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">Mobile : </span>
                                    <span style="color: #1f2937; font-weight: 600;">${participant.mobileNumber}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">Payment Method : </span>
                                    <span style="color: #1f2937; font-weight: 600;">${participant.paymentMethod}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 12px 0;">
                                    <span style="color: #6b7280; font-weight: 500;">Amount : </span>
                                    <span style="color: #16a34a; font-weight: 700; font-size: 18px;">₹${participant.totalAmount}</span>
                                </div>
                            </div>
                            <div style="margin-top: 20px; padding: 15px; background: ${participant.paymentStatus === 'pending' ? '#fef3c7' : '#92400e'}; border-radius: 8px; border-left: 4px solid ${participant.paymentStatus === 'pending' ? '#f59e0b' : '#92400e'};">
                                <div style="display: flex; align-items: center;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${participant.paymentStatus === 'pending' ? '#f59e0b' : '#92400e'}" stroke-width="2" style="margin-right: 10px;">
                                        ${participant.paymentStatus === 'pending'
            ? '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>'
            : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
        }
                                    </svg>
                                    <span style="color: ${participant.paymentStatus === 'pending' ? '#fcfcfc' : '#ffffff'}; font-weight: 600;">
                                        ${participant.paymentStatus === 'pending' ? 'Pending (Awaiting Admin Approval)' : 'Completed'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Status Message -->
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="display: inline-block; padding: 15px 25px; background: ${isPending ? '#fef3c7' : '#4fbc1d'}; border-radius: 50px; color: ${isPending ? '#ffffff' : '#ffffff'}; font-weight: 500;">
                                ${isPending ? 'Our team will review your registration and confirm it shortly.' : 'We look forward to seeing you at the summit.'}
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="background: #1f2937; padding: 30px; text-align: center;">
                        <div style="margin-bottom: 20px;">
                            <img src="cid:logo" alt="RIFAH Logo" style="width: 80px; height: auto; margin: 0 auto 15px; display: block;">
                            <h4 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0;">RIFAH</h4>
                            <p style="color: #9ca3af; font-size: 14px; margin: 5px 0 0;">Tamilnadu Traders Federation</p>
                        </div>
                        <div style="border-top: 1px solid #374151; padding-top: 20px;">
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                This email was sent automatically. Please do not reply.
                            </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `

        // 3. Prepare Admin Email Content
        const adminSubject = `New Registration: ${participant.name} - ${eventName}`
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === "production"
            ? "https://rifahtn.com"
            : "http://localhost:3000")

        const adminHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Registration Alert</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);"></div>
                        <div style="position: relative; z-index: 1;">
                            <div style="margin: 0 auto 15px; display: block;">
                                <img src="cid:logo" alt="RIFAH Logo" style="width: 80px; height: auto; ">
                            </div>
                            <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                New Registration Alert!
                            </h1>
                            <p style="color: #e0f2fe; font-size: 16px; margin: 10px 0 0; opacity: 0.9;">
                                ${eventName}
                            </p>
                        </div>
                    </div>

                    <!-- Content -->
                    <div style="padding: 40px 30px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0;">
                                New Participant Registered
                            </h2>
                            <p style="color: #6b7280; font-size: 16px; margin: 10px 0 0; line-height: 1.6;">
                                A new participant has registered for ${eventName}.
                            </p>
                        </div>

                        <!-- Participant Details Card -->
                        <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; margin: 30px 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                            <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 20px; display: flex; align-items: center;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" style="margin-right: 8px;">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                Participant Details
                            </h3>
                            <div style="display: grid; gap: 15px;">
                                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">Name : </span>
                                    <span style="color: #1f2937; font-weight: 600;">${participant.name}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">Mobile : </span>
                                    <span style="color: #1f2937; font-weight: 600;">${participant.mobileNumber}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">Email : </span>
                                    <span style="color: #1f2937; font-weight: 600;">${participant.email || 'N/A'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">Location : </span>
                                    <span style="color: #1f2937; font-weight: 600;">${participant.location || 'N/A'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">Amount : </span>
                                    <span style="color: #16a34a; font-weight: 700; font-size: 18px;">₹${participant.totalAmount}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">Payment : </span>
                                    <span style="color: #1f2937; font-weight: 600;">${participant.paymentMethod} (${participant.paymentStatus})</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 12px 0;">
                                    <span style="color: #6b7280; font-weight: 500;">Language : </span>
                                    <span style="color: #1f2937; font-weight: 600;">${participant.registrationLanguage || 'en (defaulted)'}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Action Button -->
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${appUrl}/admin/participants" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3); transition: all 0.2s;">
                                View in Admin Dashboard
                            </a>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="background: #1f2937; padding: 30px; text-align: center;">
                        <div style="margin-bottom: 20px;">
                            <img src="cid:logo" alt="RIFAH Logo" style="width: 80px; height: auto; margin: 0 auto 15px; display: block;">
                            <h4 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0;">RIFAH Admin</h4>
                            <p style="color: #9ca3af; font-size: 14px; margin: 5px 0 0;">Event Management System</p>
                        </div>
                        <div style="border-top: 1px solid #374151; padding-top: 20px;">
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                This is an automated notification from the RIFAH event management system.
                            </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `

        // 4. Send to Member (if email exists)
        if (participant.email) {
            try {
                await transporter.sendMail({
                    from: fromEmail || user,
                    to: participant.email,
                    subject: memberSubject,
                    html: memberHtml,
                    attachments: [
                        {
                            filename: 'mail1.jpeg',
                            path: path.join(process.cwd(), 'public', 'assets', 'mail1.jpeg'),
                            cid: 'mail1'
                        },
                        {
                            filename: 'mail2.jpeg',
                            path: path.join(process.cwd(), 'public', 'assets', 'mail2.jpeg'),
                            cid: 'mail2'
                        },
                        {
                            filename: 'logo.png',
                            path: path.join(process.cwd(), 'public', 'assets', 'logo.png'),
                            cid: 'logo'
                        }
                    ]
                })
                console.log(`Confirmation email sent to member: ${participant.email}`)
            } catch (memberErr) {
                console.error(`Failed to send email to member (${participant.email}):`, memberErr)
            }
        }

        if (!skipAdmin) {
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
                        attachments: [
                            {
                                filename: 'logo.png',
                                path: path.join(process.cwd(), 'public', 'assets', 'logo.png'),
                                cid: 'logo'
                            }
                        ]
                    })
                    console.log(`Admin notification emails sent to: ${finalAdminRecipients.join(', ')}`)
                } catch (adminErr) {
                    console.error("Failed to send admin notification emails:", adminErr)
                }
            }
        }

        return { success: true }
    } catch (error) {
        console.error("General error in sendRegistrationEmails:", error)
        return { success: false, error: "Email process failed" }
    }
}
