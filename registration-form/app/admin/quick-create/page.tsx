
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { QuickCreateForm } from "@/components/quick-create-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function QuickCreatePage() {
    const user = await getCurrentUser()

    if (!user || !['admin', 'super-admin'].includes(user.role)) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="mb-6">
                    <Link href="/admin">
                        <Button variant="outline" className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Admin Dashboard
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold">Quick Registration</h1>
                    <p className="text-gray-600 mt-2">
                        Register participants instantly without requiring OTP verification
                    </p>
                </div>

                <div className="flex flex-1 items-center justify-center py-8">
                    <div className="w-full max-w-4xl">
                        <QuickCreateForm />
                    </div>
                </div>
            </div>
        </div>
    )
}
