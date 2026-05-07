"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { registerParticipant } from "@/app/actions/register-participant"
import { checkRegistration } from "@/app/actions/check-registration"
import { usePhoneAuth } from "@/hooks/use-phone-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Loader2, AlertCircle, Phone, Shield, ShieldOff, Plus, Trash2 } from "lucide-react"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"

interface SecondaryMember {
    name: string
    mobileNumber?: string
    email?: string
    businessName?: string
    businessCategory?: string
    location?: string
    gender?: string
    isMember?: boolean
}

enum Step {
    MODE_SELECTION = 0,
    PHONE_INPUT = 1,
    OTP_VERIFICATION = 2,
    PERSONAL_DETAILS = 3,
    SUCCESS = 4,
}

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
    const [step, setStep] = useState<Step>(Step.MODE_SELECTION)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [useOtp, setUseOtp] = useState<boolean>(false)
    const [phoneNumber, setPhoneNumber] = useState<string>("+91")
    const { sendOtp, verifyOtp, loading: authLoading, error: authError } = usePhoneAuth()
    const [otpCode, setOtpCode] = useState<string>("")
    const [secondaryMembers, setSecondaryMembers] = useState<SecondaryMember[]>([])

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

    const addSecondaryMember = () => {
        setSecondaryMembers(prev => [...prev, {
            name: "",
            mobileNumber: "",
            email: "",
            businessName: "",
            businessCategory: "",
            location: "",
            gender: "",
            isMember: false
        }])
    }

    const updateSecondaryMember = (index: number, field: keyof SecondaryMember, value: string | boolean) => {
        setSecondaryMembers(prev => prev.map((member, i) => 
            i === index ? { ...member, [field]: value } : member
        ))
    }

    const removeSecondaryMember = (index: number) => {
        setSecondaryMembers(prev => prev.filter((_, i) => i !== index))
    }

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
                secondaryMembers,
                registrationLanguage: "en"
            })

            if (result.success) {
                setStep(Step.SUCCESS)
                form.reset()
                setSecondaryMembers([])
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

    const handleModeSelect = (mode: string) => {
        if (mode === "otp") {
            setUseOtp(true)
            setStep(Step.PHONE_INPUT)
        } else {
            setUseOtp(false)
            setStep(Step.PERSONAL_DETAILS)
        }
    }

    const handleSendOtp = async () => {
        try {
            const success = await sendOtp(phoneNumber)
            if (success) {
                setOtpCode("")
                setStep(Step.OTP_VERIFICATION)
            }
        } catch (err) {
            setError("Failed to send OTP")
        }
    }

    const handleVerifyOtp = async () => {
        try {
            const user = await verifyOtp(otpCode)
            if (user) {
                const result = await checkRegistration(phoneNumber)
                if (result.exists) {
                    setError("This number is already registered")
                    return
                }
                setStep(Step.PERSONAL_DETAILS)
                form.setValue("mobileNumber", phoneNumber)
            }
        } catch (err) {
            setError("Invalid OTP")
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
                            Participant has been registered successfully {useOtp ? "with OTP verification" : "without OTP verification"}.
                        </p>
                    </div>
                    <Button onClick={() => setStep(Step.MODE_SELECTION)} className="w-full">
                        Register Another Participant
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (step === Step.MODE_SELECTION) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                        Choose Registration Mode
                    </CardTitle>
                    <CardDescription>
                        Select how you want to register participants
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button 
                        onClick={() => handleModeSelect("no-otp")}
                        className="w-full h-16 text-left justify-start"
                        variant="outline"
                    >
                        <div className="flex items-center gap-3">
                            <ShieldOff className="h-6 w-6 text-blue-600" />
                            <div>
                                <div className="font-semibold">Quick Registration (No OTP)</div>
                                <div className="text-sm text-muted-foreground">
                                    Register instantly without phone verification
                                </div>
                            </div>
                        </div>
                    </Button>
                    
                    <Button 
                        onClick={() => handleModeSelect("otp")}
                        className="w-full h-16 text-left justify-start"
                        variant="outline"
                    >
                        <div className="flex items-center gap-3">
                            <Shield className="h-6 w-6 text-green-600" />
                            <div>
                                <div className="font-semibold">Standard Registration (With OTP)</div>
                                <div className="text-sm text-muted-foreground">
                                    Verify phone number with OTP before registration
                                </div>
                            </div>
                        </div>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (step === Step.PHONE_INPUT) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                        <Phone className="h-5 w-5" />
                        Enter Phone Number
                    </CardTitle>
                    <CardDescription>
                        We'll send a verification code to this number
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="phone">Mobile Number</Label>
                        <Input
                            id="phone"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="text-center text-lg"
                        />
                    </div>
                    
                    <Button onClick={handleSendOtp} className="w-full" disabled={authLoading}>
                        {authLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending OTP...
                            </>
                        ) : (
                            "Send OTP"
                        )}
                    </Button>
                    
                    {authError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{authError}</AlertDescription>
                        </Alert>
                    )}
                    
                    <Button 
                        variant="outline" 
                        onClick={() => setStep(Step.MODE_SELECTION)}
                        className="w-full"
                    >
                        Back
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (step === Step.OTP_VERIFICATION) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                        <Shield className="h-5 w-5" />
                        Enter OTP
                    </CardTitle>
                    <CardDescription>
                        Enter the 6-digit code sent to {phoneNumber}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="otp">Verification Code</Label>
                        <InputOTP
                            value={otpCode}
                            onChange={setOtpCode}
                            maxLength={6}
                        >
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>
                    
                    <Button onClick={handleVerifyOtp} className="w-full" disabled={authLoading}>
                        {authLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            "Verify OTP"
                        )}
                    </Button>
                    
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    
                    <Button 
                        variant="outline" 
                        onClick={() => setStep(Step.PHONE_INPUT)}
                        className="w-full"
                    >
                        Back
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Quick Registration ({useOtp ? "With OTP" : "No OTP"})</CardTitle>
                <CardDescription>
                    Register participants {useOtp ? "with OTP verification" : "without requiring OTP verification"}
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

                    {/* Guest Members Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Guest Members</h3>
                            <Button
                                type="button"
                                onClick={addSecondaryMember}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add Guest Member
                            </Button>
                        </div>
                        
                        {secondaryMembers.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                <p className="text-gray-500">No guest members added yet</p>
                                <p className="text-sm text-gray-400 mt-1">Click "Add Guest Member" to add guest details</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {secondaryMembers.map((member, index) => (
                                    <Card key={index} className="p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-semibold">Guest Member {index + 1}</h4>
                                            <Button
                                                type="button"
                                                onClick={() => removeSecondaryMember(index)}
                                                variant="destructive"
                                                size="sm"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor={`guest-name-${index}`}>Name *</Label>
                                                <Input
                                                    id={`guest-name-${index}`}
                                                    value={member.name}
                                                    onChange={(e) => updateSecondaryMember(index, "name", e.target.value)}
                                                    placeholder="Guest name"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor={`guest-mobile-${index}`}>Mobile Number</Label>
                                                <Input
                                                    id={`guest-mobile-${index}`}
                                                    value={member.mobileNumber || ""}
                                                    onChange={(e) => updateSecondaryMember(index, "mobileNumber", e.target.value)}
                                                    placeholder="+91 98765 43210"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor={`guest-email-${index}`}>Email</Label>
                                                <Input
                                                    id={`guest-email-${index}`}
                                                    type="email"
                                                    value={member.email || ""}
                                                    onChange={(e) => updateSecondaryMember(index, "email", e.target.value)}
                                                    placeholder="guest@example.com"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor={`guest-gender-${index}`}>Gender</Label>
                                                <select
                                                    id={`guest-gender-${index}`}
                                                    value={member.gender || ""}
                                                    onChange={(e) => updateSecondaryMember(index, "gender", e.target.value)}
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
                                                <Label htmlFor={`guest-business-${index}`}>Business Name</Label>
                                                <Input
                                                    id={`guest-business-${index}`}
                                                    value={member.businessName || ""}
                                                    onChange={(e) => updateSecondaryMember(index, "businessName", e.target.value)}
                                                    placeholder="Guest business name"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor={`guest-category-${index}`}>Business Category</Label>
                                                <Input
                                                    id={`guest-category-${index}`}
                                                    value={member.businessCategory || ""}
                                                    onChange={(e) => updateSecondaryMember(index, "businessCategory", e.target.value)}
                                                    placeholder="Business category"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor={`guest-location-${index}`}>Location</Label>
                                                <Input
                                                    id={`guest-location-${index}`}
                                                    value={member.location || ""}
                                                    onChange={(e) => updateSecondaryMember(index, "location", e.target.value)}
                                                    placeholder="Location"
                                                />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`guest-member-${index}`}
                                                    checked={member.isMember || false}
                                                    onChange={(e) => updateSecondaryMember(index, "isMember", e.target.checked)}
                                                />
                                                <Label htmlFor={`guest-member-${index}`}>Is Member</Label>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
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
