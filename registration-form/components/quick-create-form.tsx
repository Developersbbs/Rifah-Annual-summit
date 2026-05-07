"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { registerParticipant } from "@/app/actions/register-participant"
import { getActiveEvent } from "@/app/actions/get-active-event"
import { checkRegistration } from "@/app/actions/check-registration"
import { usePhoneAuth } from "@/hooks/use-phone-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Phone, Info, CheckCircle2, Loader2, AlertCircle, UserPlus, Plus, Trash2, Shield, ShieldOff } from "lucide-react"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"

enum Step {
    MODE_SELECTION = 0,
    PHONE_INPUT = 1,
    OTP_VERIFICATION = 2,
    PERSONAL_DETAILS = 3,
    EVENT_DETAILS = 4,
    SUCCESS = 5,
}

const quickCreateSchema = z.object({
    mobileNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
    gender: z.string().min(1, "Please select a gender"),
    businessName: z.string().min(2, "Business name is required"),
    businessCategory: z.string().min(1, "Please enter a business category"),
    location: z.string().min(1, "Please select a location"),
    ticketType: z.string().min(1, "Please select a ticket type"),
    paymentMethod: z.enum(["cash", "online"]),
    guestCount: z.number().min(0).optional(),
    isMember: z.boolean().optional(),
    gstNumber: z.string().optional(),
    termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms and conditions")
})

interface QuickCreateFormProps {
    createdBy?: {
        _id: string
        role: string
        email?: string
        name?: string
    }
}

export function QuickCreateForm({ createdBy }: QuickCreateFormProps = {}) {
    const [step, setStep] = useState<Step>(Step.MODE_SELECTION)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [activeEvent, setActiveEvent] = useState<any>(null)
    const [isLoadingEvent, setIsLoadingEvent] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [useOtp, setUseOtp] = useState<boolean>(false)
    const [phoneNumber, setPhoneNumber] = useState<string>("+91")
    const { sendOtp, verifyOtp, loading: authLoading, error: authError } = usePhoneAuth()
    const [otpCode, setOtpCode] = useState<string>("")

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
            ticketType: "",
            paymentMethod: "cash",
            guestCount: 0,
            isMember: false,
            gstNumber: "",
            termsAccepted: false
        }
    })

    useEffect(() => {
        const loadActiveEvent = async () => {
            setIsLoadingEvent(true)
            try {
                const event = await getActiveEvent()
                setActiveEvent(event)
            } catch (err) {
                console.error("Failed to load active event:", err)
            } finally {
                setIsLoadingEvent(false)
            }
        }
        loadActiveEvent()
    }, [])

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
                ticketType: data.ticketType,
                paymentMethod: data.paymentMethod,
                ageGuest: data.guestCount || 0,
                isMember: data.isMember || false,
                gstNumber: data.gstNumber || undefined,
                registrationLanguage: "en"
            })

            if (result.success) {
                setStep(Step.SUCCESS)
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
                // Check if already registered
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

    if (step === Step.MODE_SELECTION) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Choose Registration Mode
                    </CardTitle>
                    <CardDescription>
                        Select how you want to register the participant
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

    if (step === Step.SUCCESS) {
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

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Quick Registration (No OTP)
                </CardTitle>
                <CardDescription>
                    Register participants instantly without requiring OTP verification
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Personal Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="mobileNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mobile Number *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+91 98765 43210" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="john@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="gender"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gender *</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="businessName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Business Name *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="ABC Company" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="businessCategory"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Business Category *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Technology" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="location"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Location *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Chennai" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="guestCount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Guest Count</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    min="0" 
                                                    placeholder="0" 
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="isMember"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Is Member</FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator />

                        {/* Event Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Event Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="ticketType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ticket Type *</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select ticket type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {activeEvent?.ticketsPrice?.map((ticket: any) => (
                                                        <SelectItem key={ticket.name} value={ticket.name}>
                                                            {ticket.name} - ₹{ticket.price}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="paymentMethod"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Payment Method *</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select payment method" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="cash">Cash</SelectItem>
                                                    <SelectItem value="online">Online</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="gstNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>GST Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="GSTIN1234567890" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator />

                        {/* Terms and Conditions */}
                        <FormField
                            control={form.control}
                            name="termsAccepted"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>I accept the terms and conditions *</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />

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
                </Form>
            </CardContent>
        </Card>
    )
}
