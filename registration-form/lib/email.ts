import nodemailer from "nodemailer"
import SystemConfig from "@/models/SystemConfig"
import dbConnect from "@/lib/db"
import { IParticipant, ISecondaryMember } from "@/lib/types"
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
            pool: true,
            maxConnections: 5,
            maxMessages: 100
        })

        const language = participant.registrationLanguage || 'en'
        const isTamil = language === 'ta'

        const isPending = participant.paymentStatus === 'pending' && !participant.isSponsor

        console.log(`DEBUG - Sending emails for ${participant.name}. Language: ${language}, isTamil: ${isTamil}`)

        // 2. Prepare Member Email Content
        const memberSubject = isTamil
            ? `${isPending ? 'பதிவு பெறப்பட்டது' : 'பதிவு உறுதிப்படுத்தப்பட்டது'} - ${eventName}`
            : `${isPending ? 'Registration Received' : 'Registration Confirmed'} - ${eventName}`

        const memberHtml = getMemberEmailHtml({
            participant,
            eventName,
            isTamil,
            isPending,
            isPrimary: true
        })


        // 3. Prepare Admin Email Content
        const adminSubject = `New Registration: ${participant.name} - ${eventName}`
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === "production"
            ? "https://rifahtn.com"
            : "http://localhost:3011")

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
                                    <span style="color: #6b7280; font-weight: 500;">Registration ID : </span>
                                    <span style="color: #2563eb; font-weight: 700; font-size: 16px; background: #eff6ff; padding: 4px 12px; border-radius: 6px;">${participant.registrationId || 'N/A'}</span>
                                </div>
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
                                ${participant.isSponsor ? `
                                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">Type : </span>
                                    <span style="color: #16a34a; font-weight: 700; background: #f0fdf4; padding: 4px 12px; border-radius: 6px;">Sponsor</span>
                                </div>
                                ` : ''}
                                ${!participant.isSponsor ? `
                                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">Amount : </span>
                                    <span style="color: #16a34a; font-weight: 700; font-size: 18px;">₹${participant.totalAmount}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">Payment : </span>
                                    <span style="color: #1f2937; font-weight: 600;">${participant.paymentMethod} (${participant.paymentStatus})</span>
                                </div>
                                ` : ''}
                                <div style="display: flex; justify-content: space-between; padding: 12px 0;">
                                    <span style="color: #6b7280; font-weight: 500;">Language : </span>
                                    <span style="color: #1f2937; font-weight: 600;">${participant.registrationLanguage || 'en (defaulted)'}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Action Button -->
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${appUrl}/admin" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3); transition: all 0.2s;">
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
                        // {
                        //     filename: 'mail1.jpeg',
                        //     path: path.join(process.cwd(), 'public', 'assets', 'mail1.jpeg'),
                        //     cid: 'mail1'
                        // },
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

        // 4.1 Send to Secondary Members (if they have emails) concurrently
        if (participant.secondaryMembers && participant.secondaryMembers.length > 0) {
            const smRecipients = participant.secondaryMembers.filter(sm => sm.email)
            await Promise.all(smRecipients.map(async (sm) => {
                try {
                    const smHtml = getMemberEmailHtml({
                        participant: sm as unknown as IParticipant,
                        eventName,
                        isTamil,
                        isPending,
                        isPrimary: false,
                        primaryName: participant.name
                    })

                    await transporter.sendMail({
                        from: fromEmail || user,
                        to: sm.email,
                        subject: memberSubject,
                        html: smHtml,
                        attachments: [
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
                    console.log(`Confirmation email sent to secondary member: ${sm.email}`)
                } catch (smErr) {
                    console.error(`Failed to send email to secondary member (${sm.email}):`, smErr)
                }
            }))
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

export interface AlertEmailRecipient {
    registrationId: string
    name: string
    email: string
    secondaryMembers?: { registrationId: string; name: string }[]
}

export async function sendThankYouEmail(
    recipients: AlertEmailRecipient[]
): Promise<{ success: boolean; successCount: number; failureCount: number; error?: string }> {
    const subject = "Thank You for Attending — RIFAH Annual Summit 2026"
    try {
        await dbConnect()

        const config = await SystemConfig.findOne({ key: 'smtp' }).lean()
        if (!config || !config.value) {
            return { success: false, successCount: 0, failureCount: recipients.length, error: "SMTP not configured" }
        }

        const { host, port, user, pass, fromEmail } = config.value

        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
            pool: true,
            maxConnections: 5,
            maxMessages: 100
        })

        let successCount = 0
        let failureCount = 0

        const seen = new Set<string>()
        const uniqueRecipients = recipients.filter(r => {
            const addr = r.email?.toLowerCase()
            if (!addr || addr === 'n/a' || !addr.includes('@') || seen.has(addr)) return false
            seen.add(addr)
            return true
        })

        const logoPath = path.join(process.cwd(), 'public', 'assets', 'logo.png')

        const batchSize = 10
        for (let i = 0; i < uniqueRecipients.length; i += batchSize) {
            const batch = uniqueRecipients.slice(i, i + batchSize)
            await Promise.all(batch.map(async (recipient) => {
                if (!recipient.email || recipient.email === 'N/A') {
                    failureCount++
                    return
                }

                const html = getThankYouEmailHtml({ name: recipient.name, registrationId: recipient.registrationId })

                try {
                    await transporter.sendMail({
                        from: fromEmail || user,
                        to: recipient.email,
                        subject,
                        html,
                        attachments: [
                            {
                                filename: 'logo.png',
                                path: logoPath,
                                cid: 'logo'
                            }
                        ]
                    })
                    successCount++
                } catch (err) {
                    console.error(`Failed to send thank you email to ${recipient.email}:`, err)
                    failureCount++
                }
            }))
        }

        transporter.close()
        return { success: true, successCount, failureCount }
    } catch (error) {
        console.error("Error in sendThankYouEmail:", error)
        return { success: false, successCount: 0, failureCount: recipients.length, error: "Email process failed" }
    }
}

function getThankYouEmailHtml(params: { name: string; registrationId: string }) {
    const { name, registrationId } = params
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You — RIFAH Annual Summit 2026</title>
  <style>
    @media only screen and (max-width:600px){
      .email-wrapper{width:100%!important;padding:0!important;}
      .content-pad{padding:24px 16px!important;}
      .info-card{padding:16px!important;}
      h1.title{font-size:20px!important;}
      .highlight-card{padding:20px 16px!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr><td align="center" style="padding:24px 8px;">

      <table role="presentation" class="email-wrapper" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- ===== HEADER ===== -->
        <tr>
          <td style="background:linear-gradient(135deg,#d10c09 0%,#f52404 100%);padding:44px 30px;text-align:center;position:relative;overflow:hidden;">
            <div style="position:absolute;top:-60%;right:-40%;width:220%;height:220%;background:radial-gradient(circle,rgba(255,255,255,0.08) 0%,transparent 65%);pointer-events:none;"></div>
            <div style="position:relative;z-index:1;">
              <div style="width:76px;height:76px;background:rgba(255,255,255,0.15);border-radius:50%;margin:0 auto 18px;line-height:76px;text-align:center;">
                <img src="cid:logo" width="56" height="56" alt="RIFAH" style="vertical-align:middle;display:inline-block;">
              </div>
              <h1 class="title" style="color:#ffffff;font-size:26px;font-weight:700;margin:0 0 10px;text-shadow:0 2px 6px rgba(0,0,0,0.18);line-height:1.3;">
                Thank You for Attending!
              </h1>
              <p style="color:rgba(255,255,255,0.88);font-size:15px;margin:0;line-height:1.5;">
                RIFAH Annual Summit 2026
              </p>
            </div>
          </td>
        </tr>

        <!-- ===== BODY ===== -->
        <tr>
          <td class="content-pad" style="padding:36px 30px;">

            <!-- Greeting -->
            <p style="color:#1f2937;font-size:17px;font-weight:600;margin:0 0 14px;">Dear <strong>${name}</strong>,</p>
            <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 28px;">
              On behalf of the entire <strong>RIFAH</strong> team, we extend our heartfelt gratitude for your presence at the
              <strong>RIFAH Annual Summit 2026</strong>. Your participation made this event truly remarkable and memorable.
            </p>

            <!-- Thank You Highlight -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td class="highlight-card" style="background:linear-gradient(135deg,#fff7ed 0%,#fef9ec 100%);border:1.5px solid #fcd34d;border-radius:14px;padding:26px 24px;text-align:center;">
                  <div style="font-size:34px;margin-bottom:12px;">🌟</div>
                  <p style="color:#92400e;font-size:15px;font-weight:600;margin:0 0 10px;line-height:1.4;">
                    Your presence meant the world to us!
                  </p>
                  <p style="color:#78350f;font-size:14px;margin:0;line-height:1.7;">
                    Together, we shared ideas, built meaningful connections, and took a collective step forward in strengthening our business community.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Registration ID -->
            <!-- <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;">
                  <p style="color:#6b7280;font-size:11px;font-weight:700;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.08em;">Your Registration ID</p>
                  <p style="color:#1e40af;font-size:26px;font-weight:800;margin:0 0 6px;letter-spacing:0.04em;">${registrationId}</p>
                  <p style="color:#9ca3af;font-size:13px;margin:0;">Thank you for being part of this landmark event.</p>
                </td>
              </tr>
            </table> -->

            <!-- What We Achieved -->
            <p style="color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">What We Achieved Together</p>
            <table role="presentation" class="info-card" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
              <tr>
                <td style="padding:20px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-bottom:12px;vertical-align:top;">
                        <table role="presentation" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="width:30px;color:#dc2626;font-size:18px;font-weight:700;vertical-align:top;padding-top:2px;">&#x2736;</td>
                            <td style="color:#374151;font-size:14px;line-height:1.7;">Inspiring keynotes and actionable business insights from industry leaders</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom:12px;vertical-align:top;">
                        <table role="presentation" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="width:30px;color:#dc2626;font-size:18px;font-weight:700;vertical-align:top;padding-top:2px;">&#x2736;</td>
                            <td style="color:#374151;font-size:14px;line-height:1.7;">Meaningful networking with fellow entrepreneurs, traders, and business leaders</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="vertical-align:top;">
                        <table role="presentation" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="width:30px;color:#dc2626;font-size:18px;font-weight:700;vertical-align:top;padding-top:2px;">&#x2736;</td>
                            <td style="color:#374151;font-size:14px;line-height:1.7;">A shared vision for a stronger, more unified and prosperous business community</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Stay Connected -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:12px;padding:22px 24px;text-align:center;">
                  <p style="color:#991b1b;font-size:15px;font-weight:700;margin:0 0 8px;">Stay Connected with RIFAH</p>
                  <p style="color:#7f1d1d;font-size:13px;margin:0;line-height:1.7;">
                    Follow us for updates on future events, workshops, and community initiatives.
                    Your journey with the RIFAH family has just begun &mdash; and we are excited for what lies ahead!
                  </p>
                </td>
              </tr>
            </table>

            <!-- Closing -->
            <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 24px;">
              We hope you found the summit valuable, enriching, and inspiring. We look forward to welcoming you at our future events and continuing this wonderful journey of growth together.
            </p>
            <p style="color:#1f2937;font-size:15px;margin:0;line-height:1.9;">
              With warm regards,<br>
              <strong style="font-size:16px;">Team RIFAH</strong><br>
              <span style="color:#6b7280;font-size:13px;">Tamilnadu Traders Federation</span>
            </p>

          </td>
        </tr>

        <!-- ===== FOOTER ===== -->
        <tr>
          <td style="background:#1f2937;padding:30px;text-align:center;">
            <img src="cid:logo" alt="RIFAH" style="width:62px;height:auto;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;">
            <p style="color:#ffffff;font-size:15px;font-weight:600;margin:0 0 4px;">RIFAH</p>
            <div style="border-top:1px solid #374151;padding-top:18px;">
              <p style="color:#6b7280;font-size:11px;margin:0;">This message was sent by the event organizers. Please do not reply to this email.</p>
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendAlertEmail(
    recipients: AlertEmailRecipient[]
): Promise<{ success: boolean; successCount: number; failureCount: number; error?: string }> {
    const subject = "Important Information — RIFAH Annual Summit 2026"
    try {
        await dbConnect()

        const config = await SystemConfig.findOne({ key: 'smtp' }).lean()
        if (!config || !config.value) {
            return { success: false, successCount: 0, failureCount: recipients.length, error: "SMTP not configured" }
        }

        const { host, port, user, pass, fromEmail } = config.value

        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
            pool: true, // Use a connection pool for better performance with bulk emails
            maxConnections: 5,
            maxMessages: 100
        })

        let successCount = 0
        let failureCount = 0

        // Deduplicate: one email per unique address (keep first occurrence)
        const seen = new Set<string>()
        const uniqueRecipients = recipients.filter(r => {
            const addr = r.email?.toLowerCase()
            if (!addr || addr === 'n/a' || !addr.includes('@') || seen.has(addr)) return false
            seen.add(addr)
            return true
        })

        const logoPath = path.join(process.cwd(), 'public', 'assets', 'logo.png')

        // Send in batches to avoid overwhelming the SMTP server or hitting rate limits
        const batchSize = 10
        for (let i = 0; i < uniqueRecipients.length; i += batchSize) {
            const batch = uniqueRecipients.slice(i, i + batchSize)
            await Promise.all(batch.map(async (recipient) => {
                if (!recipient.email || recipient.email === 'N/A') {
                    failureCount++
                    return
                }

                const html = getAlertEmailHtml({ name: recipient.name, registrationId: recipient.registrationId, secondaryMembers: recipient.secondaryMembers })

                try {
                    await transporter.sendMail({
                        from: fromEmail || user,
                        to: recipient.email,
                        subject,
                        html,
                        attachments: [
                            {
                                filename: 'logo.png',
                                path: logoPath,
                                cid: 'logo'
                            }
                        ]
                    })
                    successCount++
                } catch (err) {
                    console.error(`Failed to send alert email to ${recipient.email}:`, err)
                    failureCount++
                }
            }))
        }

        transporter.close() // Close the pool
        return { success: true, successCount, failureCount }
    } catch (error) {
        console.error("Error in sendAlertEmail:", error)
        return { success: false, successCount: 0, failureCount: recipients.length, error: "Email process failed" }
    }
}

function getAlertEmailHtml(params: { name: string; registrationId: string; secondaryMembers?: { registrationId: string; name: string }[] }) {
    const { name, registrationId, secondaryMembers } = params

    const secondaryMembersHtml = secondaryMembers && secondaryMembers.length > 0
        ? `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-top:2px solid #fdba74;padding-top:14px;">
              <tr>
                <td>
                  <p style="color:#9a3412;font-size:11px;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.08em;">Secondary Members</p>
                  ${secondaryMembers.map(sm => `
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
                    <tr>
                      <td style="color:#78350f;font-size:14px;">${sm.name}</td>
                      <td style="text-align:right;color:#c2410c;font-size:14px;font-weight:700;letter-spacing:0.03em;">${sm.registrationId}</td>
                    </tr>
                  </table>`).join('')}
                </td>
              </tr>
            </table>`
        : ''
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RIFAH Annual Summit 2026 — Important Information</title>
  <style>
    @media only screen and (max-width:600px){
      .email-wrapper{width:100%!important;padding:0!important;}
      .content-pad{padding:24px 16px!important;}
      .schedule-table td{display:block;width:100%!important;box-sizing:border-box;}
      .schedule-time{border-radius:6px 6px 0 0!important;border-bottom:none!important;}
      .schedule-desc{border-radius:0 0 6px 6px!important;padding-top:6px!important;}
      .info-card{padding:16px!important;}
      h1.title{font-size:20px!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr><td align="center" style="padding:24px 8px;">

      <table role="presentation" class="email-wrapper" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- ===== HEADER ===== -->
        <tr>
          <td style="background:linear-gradient(135deg,#d10c09 0%,#f52404 100%);padding:36px 30px;text-align:center;position:relative;overflow:hidden;">
            <div style="position:absolute;top:-60%;right:-40%;width:220%;height:220%;background:radial-gradient(circle,rgba(255,255,255,0.08) 0%,transparent 65%);pointer-events:none;"></div>
            <div style="position:relative;z-index:1;">
              <div style="width:68px;height:68px;background:rgba(255,255,255,0.15);border-radius:50%;margin:0 auto 16px;line-height:68px;text-align:center;">
                <img src="cid:logo" width="52" height="52" alt="RIFAH" style="vertical-align:middle;display:inline-block;">
              </div>
              <h1 class="title" style="color:#ffffff;font-size:24px;font-weight:700;margin:0 0 8px;text-shadow:0 2px 6px rgba(0,0,0,0.15);line-height:1.3;">RIFAH Annual Summit 2026</h1>
            </div>
          </td>
        </tr>

        <!-- ===== BODY ===== -->
        <tr>
          <td class="content-pad" style="padding:32px 30px;">

            <!-- Greeting -->
            <p style="color:#1f2937;font-size:16px;margin:0 0 14px;">Dear <strong>${name}</strong>,</p>
            <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px;">
              We are excited to welcome you to the <strong>RIFAH Annual Summit 2026</strong> &mdash; <em>Let&rsquo;s Grow Together</em>.
              Please read the following important information carefully before arriving at the venue.
            </p>

            <!-- Registration ID -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#fff7ed;border:1.5px solid #fdba74;border-radius:12px;padding:18px 22px;">
                  <p style="color:#9a3412;font-size:11px;font-weight:700;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.08em;">Your Registration ID</p>
                  <p style="color:#c2410c;font-size:26px;font-weight:800;margin:0 0 6px;letter-spacing:0.04em;">${registrationId}</p>
                  <p style="color:#78350f;font-size:13px;margin:0;">Please show this ID at the registration desk upon entry.</p>
                  ${secondaryMembersHtml}
                </td>
              </tr>
            </table>

            <!-- Schedule -->
            <p style="color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 10px;">Schedule for the Day</p>
            <table role="presentation" class="schedule-table" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 6px;margin-bottom:28px;">
              <tr>
                <td class="schedule-time" style="background:#fef2f2;color:#dc2626;font-weight:700;font-size:14px;padding:12px 16px;border-radius:8px 0 0 8px;white-space:nowrap;width:110px;">9:00 AM</td>
                <td class="schedule-desc" style="background:#fef2f2;color:#374151;font-size:14px;padding:12px 16px;border-radius:0 8px 8px 0;">Registration Opens</td>
              </tr>
              <tr>
                <td class="schedule-time" style="background:#fff1f2;color:#e11d48;font-weight:700;font-size:14px;padding:12px 16px;border-radius:8px 0 0 8px;white-space:nowrap;width:110px;">9:45 AM</td>
                <td class="schedule-desc" style="background:#fff1f2;color:#374151;font-size:14px;padding:12px 16px;border-radius:0 8px 8px 0;"><strong>Registration Closes</strong> &mdash; Please arrive before this time</td>
              </tr>
              <tr>
                <td class="schedule-time" style="background:#fef2f2;color:#dc2626;font-weight:700;font-size:14px;padding:12px 16px;border-radius:8px 0 0 8px;white-space:nowrap;width:110px;">10:00 AM</td>
                <td class="schedule-desc" style="background:#fef2f2;color:#374151;font-size:14px;padding:12px 16px;border-radius:0 8px 8px 0;">Event Begins</td>
              </tr>
              <tr>
                <td class="schedule-time" style="background:#fff7ed;color:#c2410c;font-weight:700;font-size:14px;padding:12px 16px;border-radius:8px 0 0 8px;white-space:nowrap;width:110px;">6:00 PM</td>
                <td class="schedule-desc" style="background:#fff7ed;color:#374151;font-size:14px;padding:12px 16px;border-radius:0 8px 8px 0;">Event Concludes</td>
              </tr>
            </table>

            <!-- Dress Code -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
              <tr>
                <td class="info-card" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-right:12px;vertical-align:top;">
  <div style="width:42px;height:42px;background:#1d4ed8;border-radius:10px;text-align:center;line-height:42px;font-size:22px;">
    👔
  </div>
</td>
                      <td>
                        <p style="color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;margin:0 0 4px;">Dress Code</p>
                        <p style="color:#1f2937;font-size:15px;font-weight:700;margin:0 0 5px;">Business formal or Blazer</p>
                        <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">Please come Formals (White Shirt with Dark Pant preferable)</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Venue -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td class="info-card" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-right:12px;vertical-align:top;">
  <div style="width:42px;height:42px;background:#dc2626;border-radius:10px;text-align:center;line-height:42px;font-size:22px;">
    📍
  </div>
</td>
                      <td>
                        <p style="color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;margin:0 0 4px;">Venue</p>
                        <p style="color:#1f2937;font-size:15px;font-weight:700;margin:0 0 3px;">KAY EM SPECTRA</p>
                        <p style="color:#6b7280;font-size:13px;margin:0 0 3px;">Vanagaram, Chennai</p>
                        <p style="color:#dc2626;font-size:13px;font-weight:600;margin:0;">Saturday, 16th May 2026 &nbsp;|&nbsp; 9:00 AM &ndash; 6:00 PM</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Please Note -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#fffbeb;border:1.5px solid #fcd34d;border-radius:10px;padding:18px 20px;">
                  <p style="color:#92400e;font-size:13px;font-weight:700;margin:0 0 10px;">&#9888; Please Note</p>
                  <ul style="color:#78350f;font-size:13px;line-height:1.8;margin:0;padding-left:18px;">
                    <li>Registration closes sharp at <strong>9:45 AM</strong>. Late arrivals may not be accommodated.</li>
                    <li>Carry a valid Registration ID.</li>
                    <li>Be seated before <strong>10:00 AM</strong> as the event starts promptly.</li>
                    <li>Spot registrations are strictly not allowed.</li>
                  </ul>
                </td>
              </tr>
            </table>

            <!-- Closing -->
            <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">We look forward to seeing you at the summit!</p>
            <p style="color:#1f2937;font-size:15px;margin:0;">Warm regards,<br><strong>Team RIFAH</strong><br><span style="color:#6b7280;font-size:13px;">Tamilnadu Traders Federation</span></p>

          </td>
        </tr>

        <!-- ===== FOOTER ===== -->
        <tr>
          <td style="background:#1f2937;padding:28px 30px;text-align:center;">
            <img src="cid:logo" alt="RIFAH" style="width:60px;height:auto;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;">
            <p style="color:#ffffff;font-size:15px;font-weight:600;margin:0 0 4px;">RIFAH</p>
            <div style="border-top:1px solid #374151;padding-top:16px;">
              <p style="color:#6b7280;font-size:11px;margin:0;">This message was sent by the event organizers. Please do not reply to this email.</p>
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function getMemberEmailHtml(params: {
    participant: IParticipant | (ISecondaryMember & {
        secondaryMembers?: ISecondaryMember[];
        isSponsor?: boolean;
        paymentMethod?: string;
        totalAmount?: number;
        ticketType?: string;
    }),
    eventName: string,
    isTamil: boolean,
    isPending: boolean,
    isPrimary?: boolean,
    primaryName?: string
}) {
    const { participant, eventName, isTamil, isPending, isPrimary, primaryName } = params;

    const secondaryMembersHtml = (isPrimary && participant.secondaryMembers && participant.secondaryMembers.length > 0)
        ? (isTamil ? `
            <div style="margin-top: 15px; border-top: 2px solid #e2e8f0; padding-top: 15px;">
                <h4 style="color: #1f2937; font-size: 15px; font-weight: 600; margin: 0 0 10px;">கூடுதல் உறுப்பினர்கள்</h4>
                ${participant.secondaryMembers.map((sm: ISecondaryMember) => `
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                        <span style="color: #6b7280; font-size: 14px;">${sm.name}</span>
                        <span style="color: #2563eb; font-weight: 600; font-size: 14px;">${sm.registrationId || 'நிலுவையில் உள்ளது'}</span>
                    </div>
                `).join('')}
            </div>
        ` : `
            <div style="margin-top: 15px; border-top: 2px solid #e2e8f0; padding-top: 15px;">
                <h4 style="color: #1f2937; font-size: 15px; font-weight: 600; margin: 0 0 10px;">Additional Members</h4>
                ${participant.secondaryMembers.map((sm: ISecondaryMember) => `
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                        <span style="color: #6b7280; font-size: 14px;">${sm.name}</span>
                        <span style="color: #2563eb; font-weight: 600; font-size: 14px;">${sm.registrationId || 'Pending'}</span>
                    </div>
                `).join('')}
            </div>
        `) : '';

    if (isTamil) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>பதிவு உறுதிப்படுத்தல்</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <div style="background: linear-gradient(135deg, #ef0707 0%, #801515 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);"></div>
                        <div style="position: relative; z-index: 1;">
                            <div style="width: 60px; height: 60px; background: rgba(221, 217, 217, 0.1); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                                <img src="cid:logo" alt="RIFAH Logo" style="width: 80px; height: auto; margin: 0 auto 15px; display: block;">
                            </div>
                            <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                RIFAH ANNUAL SUMMIT 2026 REGISTRATION CONFIRMED
                            </h1>
                        </div>
                    </div>

                    <div style="padding: 40px 30px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0;">
                                வணக்கம் ${participant.name},
                            </h2>
                            <p style="color: #6b7280; font-size: 16px; margin: 10px 0 0; line-height: 1.6;">
                                ${eventName}-ற்கான உங்கள் பதிவு ${isPending ? 'வெற்றிகரமாக பெறப்பட்டது' : 'வெற்றிகரமாக உறுதிப்படுத்தப்பட்டது'}.
                                ${!isPrimary ? `<br><span style="font-size: 14px;">(மூலம் பதிவு செய்யப்பட்டது: ${primaryName})</span>` : ''}
                            </p>
                        </div>

                        

                        <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; margin: 30px 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                            <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 20px; display: flex; align-items: center;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" style="margin-right: 8px;">
                                    <rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0110 0v4"></path>
                                </svg>
                                பதிவு விவரங்கள்
                            </h3>
                            <div style="display: grid; gap: 15px;">
                                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">பதிவு எண்</span>
                                    <span style="color: #2563eb; font-weight: 700; font-size: 16px; background: #eff6ff; padding: 4px 12px; border-radius: 6px;">${participant.registrationId || 'N/A'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">பெயர்</span>
                                    <span style="color: #1f2937; font-weight: 600;">${participant.name}</span>
                                </div>
                                ${participant.mobileNumber ? `
                                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">கைபேசி</span>
                                    <span style="color: #1f2937; font-weight: 600;">${participant.mobileNumber}</span>
                                </div>
                                ` : ''}
                                ${isPrimary && participant.isSponsor ? `
                                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">வகை</span>
                                    <span style="color: #16a34a; font-weight: 700; background: #f0fdf4; padding: 4px 12px; border-radius: 6px;">ஸ்பான்சர் (Sponsor)</span>
                                </div>
                                ` : ''}
                                ${isPrimary && !participant.isSponsor ? `
                                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">பணம் செலுத்தும் முறை</span>
                                    <span style="color: #1f2937; font-weight: 600;">${participant.paymentMethod === 'online' ? 'ஆன்லைன்' : 'ரொக்கம்'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 12px 0;">
                                    <span style="color: #6b7280; font-weight: 500;">தொகை</span>
                                    <span style="color: #16a34a; font-weight: 700; font-size: 18px;">₹${participant.totalAmount}</span>
                                </div>
                                ` : ''}
                                ${secondaryMembersHtml}
                            </div>
                            <div style="margin-top: 20px; padding: 15px; background: ${isPending ? '#fef3c7' : '#92400e'}; border-radius: 8px; border-left: 4px solid ${isPending ? '#f59e0b' : '#92400e'};">
                                <div style="display: flex; align-items: center;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${isPending ? '#f59e0b' : '#92400e'}" stroke-width="2" style="margin-right: 10px;">
                                        ${isPending
                ? '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>'
                : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
            }
                                    </svg>
                                    <span style="color: ${isPending ? '#92400e' : '#7c2d12'}; font-weight: 600;">
                                        ${isPending ? 'நிலுவையில் உள்ளது (நிர்வாக அனுமதிக்கு காத்திருக்கிறது)' : 'முடிந்தது'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <img src="cid:mail2" alt="Event Details" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <div style="display: inline-block; padding: 15px 25px; background: ${isPending ? '#fef3c7' : '#92400e'}; border-radius: 50px; color: ${isPending ? '#92400e' : '#7c2d12'}; font-weight: 500;">
                                ${isPending ? 'நிர்வாகம் உங்கள் பதிவை சரிபார்த்து விரைவில் உறுதி செய்யும்.' : 'மாநாட்டில் உங்களை சந்திக்க ஆவலாக உள்ளோம்.'}
                            </div>
                        </div>
                    </div>

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
        `;
    } else {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Registration Confirmation</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <div style="background: linear-gradient(135deg, #d10c09 0%, #f52404 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);"></div>
                        <div style="position: relative; z-index: 1;">
                            <div style="width: 60px; height: 60px; background: rgba(221, 217, 217, 0.1); border-radius: 50%; margin: 0 auto 20px; line-height: 60px; text-align: center;">
                                <img src="cid:logo" width="50" height="50" alt="Confirmed" style="vertical-align: middle; display: inline-block;" />
                            </div>
                            <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                RIFAH ANNUAL SUMMIT 2026 REGISTRATION CONFIRMED
                            </h1>
                        </div>
                    </div>

                    <div style="padding: 40px 30px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0;">
                                Hello ${participant.name},
                            </h2>
                            <p style="color: #6b7280; font-size: 16px; margin: 10px 0 0; line-height: 1.6;">
                                Your registration for the ${eventName} has been ${isPending ? 'successfully received' : 'successfully completed'}.
                                ${!isPrimary ? `<br><span style="font-size: 14px;">(Registered by: ${primaryName})</span>` : ''}
                            </p>
                        </div>

                        

                        <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; margin: 30px 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                            <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 20px; display: flex; align-items: center;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" style="margin-right: 8px;">
                                    <rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0110 0v4"></path>
                                </svg>
                                Registration Details
                            </h3>
                            <div style="display: grid; gap: 15px;">
                                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">Registration ID : </span>
                                    <span style="color: #2563eb; font-weight: 700; font-size: 16px; background: #eff6ff; padding: 4px 12px; border-radius: 6px; text-align: right;">${participant.registrationId || 'N/A'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">Name : </span>
                                    <span style="color: #1f2937; font-weight: 600;">${participant.name}</span>
                                </div>
                                ${participant.mobileNumber ? `
                                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">Mobile : </span>
                                    <span style="color: #1f2937; font-weight: 600;">${participant.mobileNumber}</span>
                                </div>
                                ` : ''}
                                ${isPrimary && participant.isSponsor ? `
                                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">Type : </span>
                                    <span style="color: #16a34a; font-weight: 700; background: #f0fdf4; padding: 4px 12px; border-radius: 6px;">Sponsor</span>
                                </div>
                                ` : ''}
                                ${isPrimary && !participant.isSponsor ? `
                                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #6b7280; font-weight: 500;">Payment Method : </span>
                                    <span style="color: #1f2937; font-weight: 600;">${participant.paymentMethod}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 12px 0;">
                                    <span style="color: #6b7280; font-weight: 500;">Amount : </span>
                                    <span style="color: #16a34a; font-weight: 700; font-size: 18px;">₹${participant.totalAmount}</span>
                                </div>
                                ` : ''}
                                ${secondaryMembersHtml}
                            </div>
                            <div style="margin-top: 20px; padding: 15px; background: ${isPending ? '#fef3c7' : '#92400e'}; border-radius: 8px; border-left: 4px solid ${isPending ? '#f59e0b' : '#92400e'};">
                                <div style="display: flex; align-items: center;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${isPending ? '#f59e0b' : '#92400e'}" stroke-width="2" style="margin-right: 10px;">
                                        ${isPending
                ? '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>'
                : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
            }
                                    </svg>
                                    <span style="color: ${isPending ? '#fcfcfc' : '#ffffff'}; font-weight: 600;">
                                        ${isPending ? 'Pending (Awaiting Admin Approval)' : 'Completed'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div style="text-align: center; margin: 30px 0;">
                            
                            <img src="cid:mail2" alt="Event Details" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <div style="inline-block; padding: 15px 25px; background: ${isPending ? '#fef3c7' : '#4fbc1d'}; border-radius: 50px; color: ${isPending ? '#ffffff' : '#ffffff'}; font-weight: 500;">
                                ${isPending ? 'Our team will review your registration and confirm it shortly.' : 'We look forward to seeing you at the summit.'}
                            </div>
                        </div>
                    </div>

                    <div style="background: #1f2937; padding: 30px; text-align: center;">
                        <div style="margin-bottom: 20px;">
                            <img src="cid:logo" alt="RIFAH Logo" style="width: 80px; height: auto; margin: 0 auto 15px; display: block;">
                            <h4 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0;">RIFAH</h4>
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
        `;
    }
}
