"use client"

import { useState, useMemo, useEffect } from "react"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { checkRegistration } from "@/app/actions/check-registration"
import { registerParticipant } from "@/app/actions/register-participant"
import { getActiveEvent } from "@/app/actions/get-active-event"
import { usePhoneAuth } from "@/hooks/use-phone-auth"
import { useDebounce } from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"


import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Phone, Info, CheckCircle2, Loader2, AlertCircle, UserPlus, Edit, Trash2, X, Check, Receipt } from "lucide-react"
import { cn } from "@/lib/utils"

enum Step {
    PHONE_INPUT = 0,
    OTP_VERIFICATION = 1,
    ALREADY_REGISTERED = 2,
    PERSONAL_DETAILS = 3,
    EVENT_DETAILS = 4,
    SUCCESS = 5,
}

const phoneSchema = z.object({
    phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number")
})

const otpSchema = z.object({
    otp: z.string().length(6, "OTP must be 6 digits")
})

const personalDetailsSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    gender: z.string().min(1, "Please select a gender"),
    businessName: z.string().min(2, "Business name is required"),
    businessCategory: z.string().min(1, "Please enter a business category"),
    location: z.string().min(1, "Please select a location"),
})

// Tamil Nadu Districts for Location
const TAMIL_NADU_DISTRICTS = [
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", 
    "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram",
    "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Nagapattinam",
    "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram",
    "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni",
    "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur",
    "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
]

interface QuickCreateFormProps {
    createdBy?: {
        _id: string
        role: string
        email?: string
        name?: string
    }
}

export function QuickCreateForm({ createdBy }: QuickCreateFormProps = {}) {
    const { t, i18n } = useTranslation()
    const [step, setStep] = useState<Step>(Step.PHONE_INPUT)
    const { sendOtp, verifyOtp, loading: authLoading, error: authError } = usePhoneAuth()
    const [isCheckingDb, setIsCheckingDb] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [dbError, setDbError] = useState<string | null>(null)

    // Firebase reCAPTCHA container
    useEffect(() => {
        const recaptchaContainer = document.createElement('div')
        recaptchaContainer.id = 'recaptcha-container'
        recaptchaContainer.style.display = 'none'
        document.body.appendChild(recaptchaContainer)

        return () => {
            const container = document.getElementById('recaptcha-container')
            if (container) {
                document.body.removeChild(container)
            }
        }
    }, [])

    // Registration Data State
    const [verifiedPhone, setVerifiedPhone] = useState("")
    const [activeEvent, setActiveEvent] = useState<{ _id: string; eventName: string; startDate: string; endDate: string; eventDate: string; ticketsPrice: { name: string; price: number }[] } | null>(null)
    const [isLoadingEvent, setIsLoadingEvent] = useState(false)
    const [personalData, setPersonalData] = useState({ 
        name: "",
        email: "",
        gender: "",
        businessName: "", 
        businessCategory: "",
        location: ""
    })
    const [eventData, setEventData] = useState({
        ticketType: "",
        paymentMethod: "online",
    })
    const [gstNumber, setGstNumber] = useState("")
    const [gstValidation, setGstValidation] = useState<{ isValid: boolean | null, isLoading: boolean, gstName: string | null, error: string | null }>({
        isValid: null,
        isLoading: false,
        gstName: null,
        error: null
    })
    const [termsAccepted, setTermsAccepted] = useState(false)
    const debouncedGstNumber = useDebounce(gstNumber, 800)
    const [secondaryMembers, setSecondaryMembers] = useState<{ name: string; mobileNumber: string; email: string; businessName: string; businessCategory: string; location: string; gender?: string; isMember?: boolean; showCustomLocation?: boolean; customLocation?: string }[]>([])
    const [currentMember, setCurrentMember] = useState<{ name: string; mobileNumber: string; email: string; businessName: string; businessCategory: string; location: string; gender?: string; isMember?: boolean; showCustomLocation?: boolean; customLocation?: string }>({ name: '', mobileNumber: '', email: '', businessName: '', businessCategory: '', location: '', gender: '', isMember: false, showCustomLocation: false, customLocation: '' })
    const [showAddMemberForm, setShowAddMemberForm] = useState(false)
    const [primaryLocationOpen, setPrimaryLocationOpen] = useState(false)
    const [primaryCustomLocation, setPrimaryCustomLocation] = useState("")
    const [showPrimaryCustomInput, setShowPrimaryCustomInput] = useState(false)
    const [secondaryLocationOpen, setSecondaryLocationOpen] = useState(false)
    const [invoiceLink, setInvoiceLink] = useState<string | null>(null)

    // Forms
    const phoneForm = useForm<z.infer<typeof phoneSchema>>({ resolver: zodResolver(phoneSchema), defaultValues: { phoneNumber: "+91" } })
    const otpForm = useForm<z.infer<typeof otpSchema>>({ resolver: zodResolver(otpSchema), defaultValues: { otp: "" } })
    const personalForm = useForm<z.infer<typeof personalDetailsSchema>>({
        resolver: zodResolver(personalDetailsSchema),
        defaultValues: { 
            name: "",
            email: "",
            gender: "",
            businessName: "", 
            businessCategory: "",
            location: ""
        }
    })

    // Handle primary location selection
    const handlePrimaryLocationSelect = (value: string) => {
        if (value === "other") {
            setShowPrimaryCustomInput(true)
            personalForm.setValue("location", "")
        } else {
            setShowPrimaryCustomInput(false)
            personalForm.setValue("location", value)
        }
        setPrimaryLocationOpen(false)
    }

    // Handle secondary member location selection
    const handleSecondaryLocationSelect = (value: string) => {
        if (value === "other") {
            setCurrentMember(prev => ({ 
                ...prev, 
                showCustomLocation: true, 
                location: "" 
            }))
        } else {
            setCurrentMember(prev => ({ 
                ...prev, 
                showCustomLocation: false, 
                location: value,
                customLocation: ""
            }))
        }
        setSecondaryLocationOpen(false)
    }

    // --- Derived State (Pricing) ---
    // Calculate total members: 1 (primary) + secondary members
    const totalMembers = useMemo(() => {
        return 1 + secondaryMembers.length
    }, [secondaryMembers.length])

    const pricePerPerson = useMemo(() => {
        if (!activeEvent || !eventData.ticketType) return 0
        const ticket = activeEvent.ticketsPrice?.find((t: { name: string; price: number }) => t.name === eventData.ticketType)
        return ticket?.price || 0
    }, [activeEvent, eventData.ticketType])

    const taxCalculation = useMemo(() => {
        const baseAmount = totalMembers * pricePerPerson
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const taxRate = (activeEvent as any)?.taxRate || 0
        const taxAmount = Math.round((baseAmount * taxRate) / 100)
        const totalAmount = baseAmount + taxAmount
        return {
            baseAmount,
            taxRate,
            taxAmount,
            totalAmount
        }
    }, [totalMembers, pricePerPerson, activeEvent])

    // GST validation
    useEffect(() => {
        const validateGst = async () => {
            if (!debouncedGstNumber || debouncedGstNumber.length < 15) {
                setGstValidation({
                    isValid: null,
                    isLoading: false,
                    gstName: null,
                    error: null
                })
                return
            }

            setGstValidation(prev => ({ ...prev, isLoading: true, error: null }))

            try {
                const response = await fetch("/api/payment/verify-gst", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        gstNumber: debouncedGstNumber,
                        eventId: activeEvent?._id
                    }),
                })

                const data = await response.json()

                setGstValidation({
                    isValid: data.valid,
                    isLoading: false,
                    gstName: data.gstName || null,
                    error: data.error || null
                })
            } catch {
                setGstValidation({
                    isValid: false,
                    isLoading: false,
                    gstName: null,
                    error: "Failed to validate GST number"
                })
            }
        }

        validateGst()
    }, [debouncedGstNumber, activeEvent?._id])

    // Fetch active event on mount
    useEffect(() => {
        const fetchEvent = async () => {
            setIsLoadingEvent(true)
            try {
                const result = await getActiveEvent()
                if (result.success && result.event) {
                    setActiveEvent(result.event)
                    // Set default ticket type if available
                    if (result.event.ticketsPrice && result.event.ticketsPrice.length > 0) {
                        setEventData(prev => ({
                            ...prev,
                            ticketType: result.event.ticketsPrice[0].name
                        }))
                    }
                }
            } catch (error) {
                console.error("Failed to fetch active event:", error)
            } finally {
                setIsLoadingEvent(false)
            }
        }
        fetchEvent()
    }, [])

    // FOOD PREFERENCE - Commented out
    // Update Food Prefs when total guests changes
    // useEffect(() => {
    //     setEventData(prev => ({
    //         ...prev,
    //         foodPreference: {
    //             veg: Math.max(0, totalGuests - (prev.foodPreference.nonVeg || 0)),
    //             nonVeg: prev.foodPreference.nonVeg || 0
    //         }
    //     }))
    // }, [totalGuests])

    // --- Handlers ---

    const onPhoneSubmit = async (data: z.infer<typeof phoneSchema>) => {
        const success = await sendOtp(data.phoneNumber)
        if (success) {
            otpForm.reset({ otp: "" })
            setStep(Step.OTP_VERIFICATION)
            // Auto-focus the first OTP slot after a short delay
            setTimeout(() => {
                const firstSlot = document.querySelector('[data-slot="input-otp-slot"] input')
                if (firstSlot) {
                    (firstSlot as HTMLInputElement).focus()
                }
            }, 100)
        }
    }

    const onOtpSubmit = async (data: z.infer<typeof otpSchema>) => {
        const user = await verifyOtp(data.otp)
        if (user) {
            setIsCheckingDb(true)
            setDbError(null)
            try {
                const ph = phoneForm.getValues("phoneNumber")
                const result = await checkRegistration(ph)
                if (result.exists && result.participant) {
                    setStep(Step.ALREADY_REGISTERED)
                } else if (result.error) {
                    setDbError(result.error)
                } else {
                    setVerifiedPhone(ph)
                    setStep(Step.PERSONAL_DETAILS)
                }
            } catch {
                setDbError("System error checking registration.")
            } finally {
                setIsCheckingDb(false)
            }
        }
    }

    const onPersonalSubmit = (data: z.infer<typeof personalDetailsSchema>) => {
        setPersonalData(data)
        setStep(Step.EVENT_DETAILS)
    }

    const handleOnlinePayment = async () => {
        try {
            // Per-member tax breakdown
            const perPersonTax = Math.round((pricePerPerson * taxCalculation.taxRate) / 100)
            const perPersonTotal = pricePerPerson + perPersonTax
            const filteredSecondaryMembers = secondaryMembers.filter(m => m.name.trim() !== '')
            
            const secondaryMembersWithTax = filteredSecondaryMembers.map(member => ({
                ...member,
                baseAmount: pricePerPerson,
                taxAmount: perPersonTax,
                totalAmount: perPersonTotal
            }))

            const paymentRegistrationData = {
                mobileNumber: verifiedPhone,
                name: personalData.name,
                email: personalData.email,
                businessName: personalData.businessName,
                businessCategory: personalData.businessCategory,
                location: personalData.location,
                gender: personalData.gender,
                registrationLanguage: i18n.language as "en" | "ta",
                guestCount: filteredSecondaryMembers.length,
                memberCount: 1 + filteredSecondaryMembers.length,
                ticketType: eventData.ticketType,
                paymentMethod: 'online',
                paymentStatus: 'completed',
                ticketPrice: pricePerPerson,
                totalAmount: taxCalculation.totalAmount,
                taxRate: taxCalculation.taxRate,
                taxAmount: taxCalculation.taxAmount,
                baseAmount: taxCalculation.baseAmount,
                secondaryMembers: secondaryMembersWithTax,
                gstNumber: gstNumber.trim() || undefined,
                termsAccepted: termsAccepted,
                termsAcceptedAt: new Date(),
                eventId: activeEvent?._id,
                eventDate: activeEvent?.eventDate,
                isRegistered: true,
                approvalStatus: 'approved',
                createdBy: createdBy ? {
                    _id: createdBy._id,
                    role: createdBy.role,
                    email: createdBy.email,
                    name: createdBy.name
                } : undefined
            }

            // Create Razorpay order
            const res = await fetch("/api/payment/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: taxCalculation.totalAmount,
                    participantId: null,
                }),
            })

            const order = await res.json()

            if (!order.id) {
                throw new Error(order.error || "Failed to create payment order")
            }

            // Check if Razorpay is loaded
            if (!window.Razorpay) {
                throw new Error("Payment gateway not loaded. Please refresh the page.")
            }

            const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY
            if (!razorpayKey) {
                throw new Error("Payment configuration error. Please contact support.")
            }

            const options = {
                key: razorpayKey,
                amount: order.amount,
                currency: "INR",
                name: "RIFAH ANNUAL SUMMIT",
                description: "Event Ticket",
                order_id: order.id,

                handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
                    try {
                        const verifyRes = await fetch("/api/payment/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                ...response,
                                registrationData: paymentRegistrationData,
                            }),
                        })

                        const verifyData = await verifyRes.json()

                        if (verifyData.success) {
                            if (verifyData.invoiceUrl) {
                                setInvoiceLink(verifyData.invoiceUrl)
                            }
                            setStep(Step.SUCCESS)
                        } else {
                            setDbError(`Payment verification failed: ${verifyData.error || "Unknown error"}`)
                            setIsSubmitting(false)
                        }
                    } catch (err) {
                        console.error("Error calling verify endpoint:", err)
                        setDbError("Payment successful but registration failed. Please contact support.")
                        setIsSubmitting(false)
                    }
                },

                modal: {
                    ondismiss: function () {
                        setDbError("Payment was cancelled.")
                        setIsSubmitting(false)
                    }
                },

                prefill: {
                    name: personalData.name,
                    email: personalData.email,
                    contact: verifiedPhone.replace("+91", ""),
                },

                theme: {
                    color: "#C45A2D",
                },
            }

            const rzp = new window.Razorpay(options)
            rzp.open()
        } catch (error) {
            console.error("Payment error:", error)
            setDbError(error instanceof Error ? error.message : "Payment failed.")
            setIsSubmitting(false)
        }
    }

    const onFinalSubmit = async () => {
        setIsSubmitting(true)
        setDbError(null)

        // For online payment, trigger payment first
        if (eventData.paymentMethod === 'online') {
            await handleOnlinePayment()
            return
        }

        try {
            const filteredSecondaryMembers = secondaryMembers.filter(m => m.name.trim() !== '')

            const payload = {
                mobileNumber: verifiedPhone,
                name: personalData.name,
                email: personalData.email,
                gender: personalData.gender,
                businessName: personalData.businessName,
                businessCategory: personalData.businessCategory,
                location: personalData.location,
                guestCount: 0,
                ticketType: eventData.ticketType || "General",
                paymentMethod: eventData.paymentMethod,
                ageGuest: 0,
                secondaryMembers: filteredSecondaryMembers,
                gstNumber: gstNumber.trim() || undefined,
                termsAccepted: termsAccepted,
                termsAcceptedAt: new Date(),
                totalAmount: taxCalculation.totalAmount,
                taxRate: taxCalculation.taxRate,
                taxAmount: taxCalculation.taxAmount,
                baseAmount: taxCalculation.baseAmount,
                createdBy: createdBy ? {
                    _id: createdBy._id,
                    role: createdBy.role,
                    email: createdBy.email,
                    name: createdBy.name
                } : undefined
            }

            const result = await registerParticipant(payload)
            if (result.success) {
                setStep(Step.SUCCESS)
            } else {
                setDbError(result.error || "Registration failed.")
            }
        } catch {
            setDbError("An unexpected error occurred.")
        } finally {
            setIsSubmitting(false)
        }
    }

    // --- Render Helpers ---

    const renderStepsIndicator = () => (
        <div className="flex justify-center gap-2 mb-8">
            {[Step.PERSONAL_DETAILS, Step.EVENT_DETAILS].map((s, i) => {
                const isActive = step === s
                const isCompleted = step > s
                return (
                    <div key={i} className={`h-2.5 w-10 sm:w-16 rounded-full transition-colors duration-300 ${isActive ? "bg-primary" : isCompleted ? "bg-primary/40" : "bg-muted"
                        }`} />
                )
            })}
        </div>
    )

    // --- Step 1: Phone Input ---
    if (step === Step.PHONE_INPUT) {
        return (
            <div className="flex flex-col gap-6 w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                        <Phone className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-bold">{t("Quick Create")}</h1>
                    <p className="text-sm text-muted-foreground">
                        {t("Verify your mobile number to begin.")}
                    </p>
                </div>

                <Form {...phoneForm}>
                    <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                        <FormField control={phoneForm.control} name="phoneNumber" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("Mobile Number")}</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="+91 98765 43210" className="pl-9" {...field} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        {authError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{authError}</AlertDescription></Alert>}
                        <Button type="submit" className="w-full" disabled={authLoading}>{authLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : t("Send OTP")}</Button>
                    </form>
                </Form>
            </div>
        )
    }

    // --- Step 2: OTP Verification ---
    if (step === Step.OTP_VERIFICATION) {
        return (
            <div className="flex flex-col gap-6 w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                        <Phone className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-bold">{t("Quick Create")}</h1>
                    <p className="text-sm text-muted-foreground">
                        {t("Enter the 6-digit code sent to you.")}
                    </p>
                </div>

                <Form {...otpForm} key="otp-form">
                    <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
                        <FormField control={otpForm.control} name="otp" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="sr-only">OTP</FormLabel>
                                <FormControl>
                                    <div className="flex justify-center">
                                        <InputOTP maxLength={6} {...field}>
                                            <InputOTPGroup>
                                                <InputOTPSlot index={0} className="w-12 h-12 text-lg" />
                                                <InputOTPSlot index={1} className="w-12 h-12 text-lg" />
                                                <InputOTPSlot index={2} className="w-12 h-12 text-lg" />
                                            </InputOTPGroup>
                                            <InputOTPSeparator />
                                            <InputOTPGroup>
                                                <InputOTPSlot index={3} className="w-12 h-12 text-lg" />
                                                <InputOTPSlot index={4} className="w-12 h-12 text-lg" />
                                                <InputOTPSlot index={5} className="w-12 h-12 text-lg" />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>
                                </FormControl>
                                <FormMessage className="text-center" />
                            </FormItem>
                        )} />
                        {authError && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{authError}</AlertDescription></Alert>}
                        {dbError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{dbError}</AlertDescription></Alert>}
                        <Button type="submit" className="w-full" disabled={authLoading || isCheckingDb}>{authLoading || isCheckingDb ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : t("Verify")}</Button>
                        <Button variant="ghost" type="button" className="w-full" onClick={() => setStep(Step.PHONE_INPUT)}>{t("Change Phone")}</Button>
                    </form>
                </Form>
            </div>
        )
    }

    // --- Step 3: Already Registered Alert ---
    if (step === Step.ALREADY_REGISTERED) {
        return (
            <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>{t("Already Registered")}</AlertTitle>
                    <AlertDescription>
                        {t("This number is already registered.")}
                    </AlertDescription>
                </Alert>
                <div className="flex flex-col gap-2">
                    {/* Edit button commented out */}
                    {/* <Button variant="outline" onClick={() => {
                        setPersonalData({
                            name: existingParticipant?.name || "",
                            email: existingParticipant?.email || "",
                            businessName: existingParticipant?.businessName || "",
                            businessCategory: existingParticipant?.businessCategory || "",
                            location: existingParticipant?.location || ""
                        })
                        setEventData({
                            ticketType: existingParticipant?.ticketType || "",
                            paymentMethod: existingParticipant?.paymentMethod || "cash",
                        })
                        personalForm.reset({
                            name: existingParticipant?.name || "",
                            email: existingParticipant?.email || "",
                            businessName: existingParticipant?.businessName || "",
                            businessCategory: existingParticipant?.businessCategory || "",
                            location: existingParticipant?.location || ""
                        })
                        setStep(Step.PERSONAL_DETAILS)
                    }}>
                        Edit
                    </Button> */}
                    <Button variant="outline" onClick={() => setStep(Step.PHONE_INPUT)}>{t("Use Different Number")}</Button>
                </div>
            </div>
        )
    }

    // --- Step 4: Personal Details ---
    if (step === Step.PERSONAL_DETAILS) {
        return (
            <Card className="w-full max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-300">
                <CardHeader>
                    {renderStepsIndicator()}
                    <CardTitle>{t("Personal Details")}</CardTitle>
                    <CardDescription>{t("Member details.")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...personalForm}>
                        <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)} className="space-y-4">
                            <FormField control={personalForm.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("Full Name")}</FormLabel>
                                    <FormControl><Input placeholder={t("Enter member name")} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={personalForm.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("Email")}</FormLabel>
                                    <FormControl><Input type="email" placeholder={t("Enter email")} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            

                            <FormField control={personalForm.control} name="businessName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("Business Name")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("Enter business name")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={personalForm.control} name="businessCategory" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("Business Category")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("Enter business category")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={personalForm.control} name="gender" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("Gender")}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t("Select gender")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="male">{t("Male")}</SelectItem>
                                            <SelectItem value="female">{t("Female")}</SelectItem>
                                            <SelectItem value="other">{t("Other")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={personalForm.control} name="location" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("Location")}</FormLabel>
                                    <Popover open={primaryLocationOpen} onOpenChange={setPrimaryLocationOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn(
                                                        "w-full justify-between",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {showPrimaryCustomInput ? primaryCustomLocation || t("Enter custom location") : t(field.value) || t("Select district")}
                                                    <Check className="ml-2 h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0 max-h-[350px] overflow-y-auto" align="start">
                                            <Command>
                                                <CommandInput placeholder={t("Search district...")} />
                                                <CommandEmpty>{t("No district found.")}</CommandEmpty>
                                                <CommandGroup>
                                                    {TAMIL_NADU_DISTRICTS.map((district) => (
                                                        <CommandItem
                                                            key={district}
                                                            value={district}
                                                            onSelect={() => handlePrimaryLocationSelect(district)}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    field.value === district ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {t(district)}
                                                        </CommandItem>
                                                    ))}
                                                    <CommandItem
                                                        value="other"
                                                        onSelect={() => handlePrimaryLocationSelect("other")}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                showPrimaryCustomInput ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {t("Other (enter manually)")}
                                                    </CommandItem>
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {showPrimaryCustomInput && (
                                        <Input
                                            placeholder={t("Enter your location")}
                                            value={primaryCustomLocation}
                                            onChange={(e) => {
                                                setPrimaryCustomLocation(e.target.value)
                                                personalForm.setValue("location", e.target.value)
                                            }}
                                            className="mt-2"
                                        />
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <Button type="submit" className="w-full">{t("Next")}</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        )
    }

    // --- Step 4: Event Details ---
    if (step === Step.EVENT_DETAILS) {
        return (
            <Card className="w-full max-h-[calc(100vh-8rem)] overflow-y-auto mx-auto animate-in fade-in zoom-in-95 duration-300">
                <CardHeader>
                    {renderStepsIndicator()}
                    <CardTitle>{t("Event Details")}</CardTitle>
                    <CardDescription>{t("Member participation details.")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Active Event Error Alert */}
                    {!isLoadingEvent && !activeEvent && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>{t("No Active Event")}</AlertTitle>
                            <AlertDescription>
                                {t("Unable to load event details. Please contact the administrator or try again later.")}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Secondary Members */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <UserPlus className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold">{t("Additional Members")}</h3>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {secondaryMembers.length} {t("members added")}
                            </span>
                        </div>
                          
                        {/* Show list of added members */}
                        {secondaryMembers.map((member, index) => (
                            <div key={index} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">{t("Member")} {index + 1}</span>
                                    <div className="flex gap-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => {
                                                setCurrentMember(member)
                                                setShowAddMemberForm(true)
                                                setSecondaryMembers(prev => prev.filter((_, i) => i !== index))
                                            }}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => setSecondaryMembers(prev => prev.filter((_, i) => i !== index))}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="text-sm space-y-1">
                                    <p><span className="font-medium">{t("Name")}:</span> {member.name}</p>
                                    {member.mobileNumber && <p><span className="font-medium">{t("Mobile")}:</span> {member.mobileNumber}</p>}
                                    {member.email && <p><span className="font-medium">{t("Email")}:</span> {member.email}</p>}
                                    {member.businessName && <p><span className="font-medium">{t("Business Name")}:</span> {member.businessName}</p>}
                                    {member.location && <p><span className="font-medium">{t("Location")}:</span> {t(member.location)}</p>}
                                </div>
                            </div>
                        ))}
                          
                        {/* Add Member Form - Shows one at a time */}
                        {showAddMemberForm && (
                            <div className="border rounded-lg p-4 space-y-3 bg-primary/5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{t("Add Member")} {secondaryMembers.length + 1}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => {
                                            setShowAddMemberForm(false)
                                            setCurrentMember({ name: '', mobileNumber: '', email: '', businessName: '', businessCategory: '', location: '', gender: '', isMember: false, showCustomLocation: false, customLocation: '' })
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-xs">{t("Name")} *</Label>
                                        <Input
                                            placeholder={t("Member name")}
                                            value={currentMember.name}
                                            onChange={(e) => setCurrentMember(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">{t("Mobile")}</Label>
                                        <Input
                                            placeholder={t("Mobile number")}
                                            value={currentMember.mobileNumber}
                                            onChange={(e) => setCurrentMember(prev => ({ ...prev, mobileNumber: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">{t("Email")}</Label>
                                        <Input
                                            type="email"
                                            placeholder={t("Email address")}
                                            value={currentMember.email}
                                            onChange={(e) => setCurrentMember(prev => ({ ...prev, email: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">{t("Business Name")}</Label>
                                        <Input
                                            placeholder={t("Business name")}
                                            value={currentMember.businessName}
                                            onChange={(e) => setCurrentMember(prev => ({ ...prev, businessName: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">{t("Business Category")}</Label>
                                        <Input
                                            placeholder={t("Business category")}
                                            value={currentMember.businessCategory}
                                            onChange={(e) => setCurrentMember(prev => ({ ...prev, businessCategory: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">{t("Location")}</Label>
                                        <Popover open={secondaryLocationOpen} onOpenChange={setSecondaryLocationOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn(
                                                        "w-full justify-between",
                                                        !currentMember.location && "text-muted-foreground"
                                                    )}
                                                >
                                                    {currentMember.showCustomLocation ? currentMember.customLocation || t("Enter custom location") : t(currentMember.location) || t("Select district")}
                                                    <Check className="ml-2 h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0 max-h-[350px] overflow-y-auto" align="start">
                                                <Command>
                                                    <CommandInput placeholder={t("Search district...")} />
                                                    <CommandEmpty>{t("No district found.")}</CommandEmpty>
                                                    <CommandGroup>
                                                        {TAMIL_NADU_DISTRICTS.map((district) => (
                                                            <CommandItem
                                                                key={district}
                                                                value={district}
                                                                onSelect={() => handleSecondaryLocationSelect(district)}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        currentMember.location === district ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {t(district)}
                                                            </CommandItem>
                                                        ))}
                                                        <CommandItem
                                                            value="other"
                                                            onSelect={() => handleSecondaryLocationSelect("other")}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    currentMember.showCustomLocation ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {t("Other (enter manually)")}
                                                        </CommandItem>
                                                    </CommandGroup>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        {currentMember.showCustomLocation && (
                                            <Input
                                                placeholder={t("Enter your location")}
                                                value={currentMember.customLocation || ""}
                                                onChange={(e) => {
                                                    setCurrentMember(prev => ({ 
                                                        ...prev, 
                                                        customLocation: e.target.value,
                                                        location: e.target.value 
                                                    }))
                                                }}
                                                className="mt-2"
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">{t("Gender")}</Label>
                                        <Select
                                            value={currentMember.gender || ''}
                                            onValueChange={(value) => setCurrentMember(prev => ({ ...prev, gender: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t("Select gender")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">{t("Male")}</SelectItem>
                                                <SelectItem value="female">{t("Female")}</SelectItem>
                                                <SelectItem value="other">{t("Other")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setShowAddMemberForm(false)
                                            setCurrentMember({ name: '', mobileNumber: '', email: '', businessName: '', businessCategory: '', location: '', gender: '', isMember: false, showCustomLocation: false, customLocation: '' })
                                        }}
                                    >
                                        {t("Cancel")}
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => {
                                            if (!currentMember.name.trim()) {
                                                setDbError(t("Member name is required"))
                                                return
                                            }
                                            if (currentMember.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentMember.email)) {
                                                setDbError(t("Invalid email format for member"))
                                                return
                                            }
                                              
                                            setSecondaryMembers(prev => [...prev, { ...currentMember }])
                                            setCurrentMember({ name: '', mobileNumber: '', email: '', businessName: '', businessCategory: '', location: '', gender: '', isMember: false, showCustomLocation: false, customLocation: '' })
                                            setShowAddMemberForm(false)
                                            setDbError(null)
                                        }}
                                    >
                                        <Check className="h-4 w-4 mr-2" />
                                        {t("Add Member")}
                                    </Button>
                                </div>
                            </div>
                        )}
                          
                        {!showAddMemberForm && (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => setShowAddMemberForm(true)}
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                {t("Add Member")}
                            </Button>
                        )}
                    </div>

                    <Separator />

                    {/* Ticket Type */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">{t("Ticket Type")}</h3>
                        </div>
                        <Select value={eventData.ticketType} onValueChange={(value) => setEventData(prev => ({ ...prev, ticketType: value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder={t("Select ticket type")} />
                            </SelectTrigger>
                            <SelectContent>
                                {activeEvent?.ticketsPrice?.map((ticket: { name: string; price: number }) => (
                                    <SelectItem key={ticket.name} value={ticket.name}>
                                        {ticket.name} - ₹{ticket.price}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Payment Method - Online Only */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">{t("Payment Method")}</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <Button
                                type="button"
                                variant="default"
                                className="w-full h-14"
                                disabled
                            >
                                <div className="flex flex-col items-center">
                                    <span className="font-semibold">{t("Online")}</span>
                                    <span className="text-xs opacity-70">{t("Pay now")}</span>
                                </div>
                            </Button>
                        </div>
                    </div>

                    {/* GST Number Input with Real-time Validation */}
                    {taxCalculation.taxRate > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="gstNumber" className="text-sm">{t("GST Number (Optional)")}</Label>
                            <div className="relative">
                                <Input
                                    id="gstNumber"
                                    type="text"
                                    placeholder={t("Enter GST Number (e.g., 22ABCDE1234F1Z5)")}
                                    value={gstNumber}
                                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                                    className={cn(
                                        "w-full pr-10",
                                        gstValidation.isValid === true && "border-green-500 focus-visible:ring-green-500",
                                        gstValidation.isValid === false && "border-red-500 focus-visible:ring-red-500"
                                    )}
                                    disabled={gstValidation.isLoading}
                                />
                                {/* Validation Status Icon */}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {gstValidation.isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    ) : gstValidation.isValid === true ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    ) : gstValidation.isValid === false ? (
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                    ) : null}
                                </div>
                            </div>
                            {gstValidation.gstName && (
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                                    ✓ Valid GST - {gstValidation.gstName}
                                </p>
                            )}
                            {gstValidation.error && (
                                <p className="text-xs text-red-600 dark:text-red-400">
                                    ✗ {gstValidation.error}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                {t("GST will be applied at")} {taxCalculation.taxRate}%
                            </p>
                        </div>
                    )}

                    {/* Pricing Summary */}
                    {eventData.ticketType && (
                        <div className="border rounded-lg p-4 bg-muted/30">
                            <h4 className="font-semibold mb-3">{t("Pricing Summary")}</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span>{t("Ticket Price")}:</span>
                                    <span className="font-medium">₹{pricePerPerson}</span>
                                </div>
                                {taxCalculation.taxRate > 0 && (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span>{t("Tax Amount")} ({taxCalculation.taxRate}%):</span>
                                            <span className="font-medium">₹{Math.round((pricePerPerson * taxCalculation.taxRate) / 100)}</span>
                                        </div>
                                        <div className="flex justify-between items-center font-semibold">
                                            <span>{t("Total")}:</span>
                                            <span className="font-bold">₹{pricePerPerson + Math.round((pricePerPerson * taxCalculation.taxRate) / 100)}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Secondary Members */}
                            {secondaryMembers.length > 0 && (
                                <div className="space-y-2 mt-3">
                                    <div className="font-semibold text-sm mb-2">{t("Secondary Members")} ({secondaryMembers.length})</div>
                                    {secondaryMembers.map((member, index) => (
                                        <div key={index} className="bg-white rounded p-3 space-y-2 border">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="font-medium">{member.name || `${t("Member")} ${index + 1}`}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span>{t("Ticket Price")}:</span>
                                                <span className="font-medium">₹{pricePerPerson}</span>
                                            </div>
                                            {taxCalculation.taxRate > 0 && (
                                                <>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span>{t("Tax Amount")} ({taxCalculation.taxRate}%):</span>
                                                        <span className="font-medium">₹{Math.round((pricePerPerson * taxCalculation.taxRate) / 100)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm font-semibold">
                                                        <span>{t("Total")}:</span>
                                                        <span className="font-bold">₹{pricePerPerson + Math.round((pricePerPerson * taxCalculation.taxRate) / 100)}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Final Total */}
                            <div className="bg-green-50 rounded p-3 mt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-green-700 font-bold text-lg">{t("Grand Total")} ({totalMembers} {t("members added")}):</span>
                                    <span className="font-bold text-xl text-green-800">₹{taxCalculation.totalAmount}</span>
                                </div>
                                <p className="text-xs text-green-600 mt-1">
                                    {taxCalculation.taxRate > 0
                                        ? `₹${taxCalculation.baseAmount} + ₹${taxCalculation.taxAmount} (GST)`
                                        : `₹${taxCalculation.baseAmount} (${t("No GST")})`
                                    }
                                </p>
                            </div>
                        </div>
                    )}

                    <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/20">
                        <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <AlertTitle className="text-yellow-800 dark:text-yellow-300 font-semibold mb-1">{t("Fee Reminder")}</AlertTitle>
                        <AlertDescription className="text-yellow-700 dark:text-yellow-400 font-medium">
                            {t("Collect entrance fee if applicable.")}
                        </AlertDescription>
                    </Alert>

                    {dbError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{dbError}</AlertDescription></Alert>}

                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(Step.PERSONAL_DETAILS)}>{t("Back")}</Button>
                    <div className="flex flex-col gap-3">
                        {/* Terms & Conditions Checkbox - Only for Online Payment */}
                        {eventData.paymentMethod === 'online' && (
                            <div className="flex items-start gap-2">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight">
                                    {t("I agree to the")} <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{t("Terms & Conditions")}</a> {t("for event registration and payment processing.")}
                                </label>
                            </div>
                        )}

                        <Button
                            onClick={onFinalSubmit}
                            disabled={isSubmitting || !eventData.ticketType || !activeEvent || (eventData.paymentMethod === 'online' && !termsAccepted)}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : t("Complete Registration")}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        )
    }

    // --- Step 5: Success ---
    if (step === Step.SUCCESS) {
        return (
            <Card className="w-full max-w-md mx-auto text-center py-10 animate-in fade-in zoom-in-95">
                <CardContent className="space-y-6">
                    <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-foreground">{t("Registered Successfully!")}</h2>
                        <p className="text-muted-foreground">{t("The participant has been added.")}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-left text-sm space-y-2">
                        <div className="flex justify-between"><span>{t("Name")}:</span><span className="font-medium">{personalData.name}</span></div>
                        <div className="flex justify-between"><span>{t("Mobile")}:</span><span className="font-medium">{verifiedPhone}</span></div>
                        <div className="flex justify-between"><span>{t("Secondary Members")}:</span><span className="font-medium">{secondaryMembers.length}</span></div>
                        <div className="flex justify-between"><span>{t("Total Members")}:</span><span className="font-medium">{totalMembers}</span></div>
                        <div className="flex justify-between"><span>{t("Ticket Type")}:</span><span className="font-medium">{eventData.ticketType}</span></div>
                        <div className="flex justify-between"><span>{t("Total Amount")}:</span><span className="font-bold text-primary">₹{taxCalculation.totalAmount}</span></div>
                    </div>
                    {invoiceLink && (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => window.open(invoiceLink, '_blank')}
                        >
                            <Receipt className="mr-2 h-4 w-4" />
                            {t("Download Invoice")}
                        </Button>
                    )}
                    <Button className="w-full" onClick={() => {
                        setStep(Step.PHONE_INPUT)
                        phoneForm.reset()
                        personalForm.reset()
                        setPersonalData({ name: "", email: "", gender: "", businessName: "", businessCategory: "", location: "" })
                        setEventData({ 
                            ticketType: activeEvent?.ticketsPrice?.[0]?.name || "", 
                            paymentMethod: "online" 
                        })
                        setSecondaryMembers([])
                        setVerifiedPhone("")
                        setGstNumber("")
                        setDbError(null)
                        setInvoiceLink(null)
                    }}>{t("Add Another")}</Button>
                </CardContent>
            </Card>
        )
    }

    return null
}
