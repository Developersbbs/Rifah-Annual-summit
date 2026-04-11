"use server"

import { getCurrentUser } from "@/lib/auth"
import dbConnect from "@/lib/db"
import SystemConfig from "@/models/SystemConfig"
import User from "@/models/User"
import nodemailer from "nodemailer"
import crypto from "crypto"
import { IUser } from "@/lib/types"

export async function saveSmtpConfig(prevState: unknown, formData: FormData) {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'super-admin') {
        return { success: false, error: 'Unauthorized' }
    }

    const host = formData.get('host') as string
    const port = Number(formData.get('port'))
    const user = formData.get('user') as string
    const pass = formData.get('pass') as string
    const fromEmail = formData.get('fromEmail') as string

    try {
        await dbConnect()

        await SystemConfig.findOneAndUpdate(
            { key: 'smtp' },
            {
                key: 'smtp',
                value: { host, port, user, pass, fromEmail },
                updatedBy: currentUser.email,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        )

        return { success: true }
    } catch (error) {
        console.error('Save SMTP Config Error:', error)
        return { success: false, error: 'Failed to save SMTP settings' }
    }
}

export async function getSmtpConfig() {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'super-admin') {
        return null
    }

    await dbConnect()
    const config = await SystemConfig.findOne({ key: 'smtp' }).lean()
    return config ? config.value : null
}
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function createUser(prevState: unknown, formData: FormData) {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== 'super-admin') {
        return { success: false, error: 'Unauthorized' }
    }

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const role = formData.get('role') as string

    if (!email || !role) {
        return { success: false, error: 'Missing Required Fields' }
    }

    try {
        await dbConnect()

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return { success: false, error: 'User already exists' }
        }

        let hashedPassword = undefined
        let inviteToken = undefined
        let inviteTokenExpiry = undefined

        if (password) {
            const salt = await bcrypt.genSalt(10)
            hashedPassword = await bcrypt.hash(password, salt)
        } else {
            // Generate Invite Token
            inviteToken = crypto.randomBytes(32).toString('hex')
            inviteTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }

        const newUser = new User({
            email,
            password: hashedPassword,
            role,
            inviteToken,
            inviteTokenExpiry
        })

        await newUser.save()

        if (inviteToken) {
            // Send Invite Email
            const config = await SystemConfig.findOne({ key: 'smtp' }).lean()
            if (config && config.value) {
                const { host, port, user, pass, fromEmail } = config.value

                const transporter = nodemailer.createTransport({
                    host,
                    port,
                    secure: port === 465, // true for 465, false for other ports
                    auth: { user, pass },
                })

                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
                const inviteUrl = `${appUrl}/setup-account?token=${inviteToken}`

                await transporter.sendMail({
                    from: fromEmail || user,
                    to: email,
                    subject: "Welcome to Pongal Vizha Admin Panel",
                    html: `
                        <p>You have been invited to join the Pongal Vizha Admin Panel.</p>
                        <p>Click the link below to set your password and access your account:</p>
                        <a href="${inviteUrl}">${inviteUrl}</a>
                        <p>This link expires in 24 hours.</p>
                    `
                })
            } else {
                console.warn("SMTP config missing, invite email not sent.")
                return { success: true, message: "User created, but SMTP config missing. Email not sent." }
            }
        }

        revalidatePath('/admin/users')
        return { success: true, message: inviteToken ? "User invited successfully via email" : "User created successfully" }
    } catch (error) {
        console.error('Create User Error:', error)
        return { success: false, error: 'Failed to create user' }
    }
}

export async function getUsers() {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'super-admin') {
        return []
    }

    await dbConnect()
    const users = await User.find({}).select('-password').sort({ createdAt: -1 }).lean()

    return (users as unknown as IUser[]).map((u) => ({
        ...u,
        _id: u._id.toString(),
        createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt
    }))
}

export async function setupAccount(token: string, formData: FormData) {
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!password || !confirmPassword || password !== confirmPassword) {
        return { success: false, error: "Passwords do not match" }
    }

    try {
        await dbConnect()

        const user = await User.findOne({
            inviteToken: token,
            inviteTokenExpiry: { $gt: new Date() }
        })

        if (!user) {
            return { success: false, error: "Invalid or expired token" }
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        user.password = hashedPassword
        user.inviteToken = undefined
        user.inviteTokenExpiry = undefined
        await user.save()

        return { success: true }
    } catch (error) {
        console.error("Setup Account Error:", error)
        return { success: false, error: "Failed to setup account" }
    }
}

export async function getUserByToken(token: string) {
    try {
        await dbConnect()
        const user = await User.findOne({
            inviteToken: token,
            inviteTokenExpiry: { $gt: new Date() }
        }).select('email').lean()

        if (!user) return null

        return { email: user.email }
    } catch {
        return null
    }
}
