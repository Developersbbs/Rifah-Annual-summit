"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { setupAccount, getUserByToken } from "@/app/actions/user-actions"
import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

function SetupAccountForm() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [email, setEmail] = useState<string | null>(null)

    useEffect(() => {
        if (token) {
            getUserByToken(token).then(data => {
                if (data?.email) {
                    setEmail(data.email)
                }
            })
        }
    }, [token])

    if (!token) {
        return (
            <div className="flex h-screen items-center justify-center p-4">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="text-red-500">Invalid Link</CardTitle>
                        <CardDescription>
                            This invite link is missing a token. Please check the link and try again.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData(event.currentTarget)
        const result = await setupAccount(token!, formData)

        setLoading(false)

        if (result.success) {
            toast.success("Account set up successfully!")
            router.push("/login")
        } else {
            setError(result.error || "Failed to setup account")
        }
    }

    return (
        <div className="flex h-screen items-center justify-center p-4 bg-gray-50 dark:bg-zinc-900">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Welcome!</CardTitle>
                    <CardDescription>
                        {email ? (
                            <span>Setting up account for <strong className="text-primary">{email}</strong></span>
                        ) : (
                            "Set your password to activate your account."
                        )}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={onSubmit}>
                    <CardContent className="grid gap-4">
                        {error && <div className="text-red-500 text-sm">{error}</div>}
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <PasswordInput
                                id="confirmPassword"
                                name="confirmPassword"
                                required
                                minLength={6}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full mt-4" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Set Password
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}

export default function SetupAccountPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
            <SetupAccountForm />
        </Suspense>
    )
}
