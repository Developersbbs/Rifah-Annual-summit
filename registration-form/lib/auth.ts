import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export type AuthUser = {
    id: string
    _id?: string  // Optional for MongoDB documents
    role: string
    email: string
    name?: string  // Optional for user display
    mobileNumber?: string  // Optional for user authentication
}

export async function getCurrentUser(): Promise<AuthUser | null> {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value

    if (!token) return null

    try {
        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || 'default-secret-change-me'
        )

        const { payload } = await jwtVerify(token, secret)

        const userId = payload.sub

        //  STRICT VALIDATION
        if (!userId || typeof userId !== 'string') {
            throw new Error("Invalid token: userId missing")
        }

        return {
            id: userId,
            role: payload.role as string,
            email: payload.email as string,
            name: payload.name as string | undefined,
            mobileNumber: payload.mobileNumber as string | undefined
        }

    } catch (error) {
        console.error("Auth error:", error)
        return null
    }
}
