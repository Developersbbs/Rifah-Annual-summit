"use server"

import { SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/db'
import User from '@/models/User'

export async function login(prevState: unknown, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
        await dbConnect()

        const user = await User.findOne({ email })

        if (!user) {
            return { success: false, error: 'Invalid credentials' }
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return { success: false, error: 'Invalid credentials' }
        }

        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || 'default-secret-change-me'
        )

        const token = await new SignJWT({ 
            sub: user._id.toString(), // ✅ Convert ObjectId to string
            role: user.role, 
            email: user.email 
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(secret)

        const cookieStore = await cookies()
        cookieStore.set('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/'
        })

    } catch (error) {
        console.error("Login error:", error)
        return { success: false, error: 'An unexpected error occurred' }
    }

    redirect('/admin')
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete('admin_token')
    redirect('/login')
}
