import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminRegistration } from "@/components/admin-registration"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function AdminRegisterPage() {
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
          <h1 className="text-3xl font-bold">Admin Registration</h1>
          <p className="text-gray-600 mt-2">
            Register participants without requiring OTP verification
          </p>
        </div>

        <AdminRegistration 
          onSuccess={() => {
            // This will be handled by the component itself
            console.log('Registration successful')
          }} 
        />
      </div>
    </div>
  )
}
