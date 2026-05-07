"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { registerParticipant } from "@/app/actions/register-participant"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"

const quickCreateSchema = z.object({
    mobileNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
    gender: z.string().min(1, "Please select a gender"),
    businessName: z.string().min(2, "Business name is required"),
    businessCategory: z.string().min(1, "Please enter a business category"),
    location: z.string().min(1, "Please select a location"),
    paymentMethod: z.enum(["cash", "online"]),
    guestCount: z.number().min(0).optional(),
    gstNumber: z.string().optional(),
    termsAccepted: z.boolean().refine(val => val === true, "You must accept terms and conditions")
})

export function QuickCreateForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const form = useForm<z.infer<typeof quickCreateSchema>>({
        resolver: zodResolver(quickCreateSchema),
        defaultValues: {
            mobileNumber: "+91",
            name: "",
            email: "",
            gender: "",
            businessName: "",
            businessCategory: "",
            location: "",
            paymentMethod: "cash",
            guestCount: 0,
            gstNumber: "",
            termsAccepted: false
        }
    })

    const onSubmit = async (data: z.infer<typeof quickCreateSchema>) => {
        setIsSubmitting(true)
        setError(null)

        try {
            const result = await registerParticipant({
                mobileNumber: data.mobileNumber,
                name: data.name,
                email: data.email || undefined,
                businessName: data.businessName,
                businessCategory: data.businessCategory,
                location: data.location,
                gender: data.gender,
                paymentMethod: data.paymentMethod,
                ageGuest: data.guestCount || 0,
                isMember: false,
                gstNumber: data.gstNumber || undefined,
                registrationLanguage: "en"
            })

            if (result.success) {
                setSuccess(true)
                form.reset()
            } else {
                setError(result.error || "Registration failed")
            }
        } catch (err) {
            setError("An unexpected error occurred")
            console.error("Registration error:", err)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (success) {
        return (
            <Card className="w-full max-w-md mx-auto text-center py-10">
                <CardContent className="space-y-6">
                    <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-green-600">Registration Successful!</h3>
                        <p className="text-muted-foreground mt-2">
                            Participant has been registered successfully without OTP verification.
                        </p>
                    </div>
                    <Button onClick={() => setSuccess(false)} className="w-full">
                        Register Another Participant
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Quick Registration (No OTP)</CardTitle>
                <CardDescription>
                    Register participants instantly without requiring OTP verification
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="mobileNumber">Mobile Number *</Label>
                                <Input
                                    id="mobileNumber"
                                    placeholder="+91 98765 43210"
                                    value={form.watch("mobileNumber")}
                                    onChange={(e) => form.setValue("mobileNumber", e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    value={form.watch("name")}
                                    onChange={(e) => form.setValue("name", e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={form.watch("email")}
                                    onChange={(e) => form.setValue("email", e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="gender">Gender *</Label>
                                <select
                                    id="gender"
                                    value={form.watch("gender")}
                                    onChange={(e) => form.setValue("gender", e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                    <option value="prefer-not-to-say">Prefer not to say</option>
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="businessName">Business Name *</Label>
                                <Input
                                    id="businessName"
                                    placeholder="ABC Company"
                                    value={form.watch("businessName")}
                                    onChange={(e) => form.setValue("businessName", e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="businessCategory">Business Category *</Label>
                                <Input
                                    id="businessCategory"
                                    placeholder="Technology"
                                    value={form.watch("businessCategory")}
                                    onChange={(e) => form.setValue("businessCategory", e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="location">Location *</Label>
                                <Input
                                    id="location"
                                    placeholder="Chennai"
                                    value={form.watch("location")}
                                    onChange={(e) => form.setValue("location", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Event Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="paymentMethod">Payment Method *</Label>
                                <select
                                    id="paymentMethod"
                                    value={form.watch("paymentMethod")}
                                    onChange={(e) => form.setValue("paymentMethod", e.target.value as "cash" | "online")}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="online">Online</option>
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="guestCount">Guest Count</Label>
                                <Input
                                    id="guestCount"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={form.watch("guestCount")}
                                    onChange={(e) => form.setValue("guestCount", parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="gstNumber">GST Number</Label>
                                <Input
                                    id="gstNumber"
                                    placeholder="GSTIN1234567890"
                                    value={form.watch("gstNumber")}
                                    onChange={(e) => form.setValue("gstNumber", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="flex flex-row items-start space-x-3 space-y-0">
                        <input
                            type="checkbox"
                            checked={form.watch("termsAccepted")}
                            onChange={(e) => form.setValue("termsAccepted", e.target.checked)}
                        />
                        <div className="space-y-1 leading-none">
                            <Label>I accept terms and conditions *</Label>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Registering...
                            </>
                        ) : (
                            "Register Participant"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
