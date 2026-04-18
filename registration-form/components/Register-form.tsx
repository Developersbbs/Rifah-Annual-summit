"use client"

import { useState, useMemo, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { cn } from "@/lib/utils"
import { usePhoneAuth } from "@/hooks/use-phone-auth"
import { useDebounce } from "@/hooks/use-debounce"
import { checkRegistration } from "@/app/actions/check-registration"
import { registerParticipant } from "@/app/actions/register-participant"
import { getActiveEvent } from "@/app/actions/get-active-event"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCircle2, Phone, Receipt, Info, X, Trash2, UserPlus, AlertCircle, Edit, Check } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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

const personalDetailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  businessName: z.string().min(2, "Business name is required"),
  businessCategory: z.string().min(1, "Please enter a business category"),
  location: z.string().min(1, "Please select a location"),
  gender: z.string().optional(),
})

export function RegisterForm() {
  const [step, setStep] = useState<Step>(Step.PHONE_INPUT)
  const { sendOtp, verifyOtp, loading: authLoading, error: authError } = usePhoneAuth()
  const [isCheckingDb, setIsCheckingDb] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)
  const [activeEvent, setActiveEvent] = useState<{ _id: string; eventName: string; eventDate: string; startTime: string; endTime: string; venue: { name: string; address: string; city: string }; ticketsPrice: { name: string; price: number }[] } | null>(null)
  const [isLoadingEvent, setIsLoadingEvent] = useState(false)

  // Registration Data State
  const [verifiedPhone, setVerifiedPhone] = useState("")
  const [personalData, setPersonalData] = useState<{
    name: string
    email: string
    businessName: string
    businessCategory: string
    location: string
    gender?: string
  }>({
    name: "",
    email: "",
    businessName: "",
    businessCategory: "",
    location: ""
  })
  const [eventData, setEventData] = useState({
    ticketType: "",
    paymentMethod: "cash",
    foodGuest: 0,
    isMorningFood: false,
  })
  const [gstNumber, setGstNumber] = useState("")
  const [invoiceLink, setInvoiceLink] = useState<string | null>(null)
  const [gstValidation, setGstValidation] = useState<{
    isValid: boolean | null
    isLoading: boolean
    gstName: string | null
    error: string | null
  }>({
    isValid: null,
    isLoading: false,
    gstName: null,
    error: null
  })
  const debouncedGstNumber = useDebounce(gstNumber, 800)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [secondaryMembers, setSecondaryMembers] = useState<{ name: string; mobileNumber: string; email: string; businessName: string; businessCategory: string; location: string; gender?: string; isMember?: boolean; showCustomLocation?: boolean; customLocation?: string }[]>([])
  const [currentMember, setCurrentMember] = useState<{ name: string; mobileNumber: string; email: string; businessName: string; businessCategory: string; location: string; gender?: string; isMember?: boolean; showCustomLocation?: boolean; customLocation?: string }>({ name: '', mobileNumber: '', email: '', businessName: '', businessCategory: '', location: '', isMember: false, showCustomLocation: false, customLocation: '' })
  const [showAddMemberForm, setShowAddMemberForm] = useState(false)
  const [primaryLocationOpen, setPrimaryLocationOpen] = useState(false)
  const [primaryCustomLocation, setPrimaryCustomLocation] = useState("")
  const [showPrimaryCustomInput, setShowPrimaryCustomInput] = useState(false)
  const [existingParticipant, setExistingParticipant] = useState<{ 
    mobileNumber: string; 
    name: string; 
    isRegistered: boolean; 
    email?: string; 
    businessName?: string; 
    businessCategory?: string; 
    location?: string; 
    ageGroups?: { guest: number }; 
    guestCount?: number; 
    ticketType?: string; 
    paymentMethod?: string; 
    foodPreference?: { guest: number }; 
    isMorningFood?: boolean 
  } | null>(null)

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

  // Forms
  const phoneForm = useForm<z.infer<typeof phoneSchema>>({ resolver: zodResolver(phoneSchema), defaultValues: { phoneNumber: "+91" } })
  const otpForm = useForm<z.infer<typeof otpSchema>>({ resolver: zodResolver(otpSchema), defaultValues: { otp: "" } })
  const personalForm = useForm<z.infer<typeof personalDetailsSchema>>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: { 
      name: "",
      email: "",
      businessName: "", 
      businessCategory: "",
      location: ""
    }
  })

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

        // Autofill business name if GST is valid and returns gstName
        if (data.valid && data.gstName) {
          setPersonalData(prev => ({ ...prev, businessName: data.gstName }))
        }
      } catch (error) {
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

  // Fetch active event on mount
  useEffect(() => {
    const fetchEvent = async () => {
      setIsLoadingEvent(true)
      try {
        const result = await getActiveEvent()
        if (result.success && result.event) {
          setActiveEvent(result.event)
        }
      } catch (error) {
        console.error("Failed to fetch active event:", error)
      } finally {
        setIsLoadingEvent(false)
      }
    }
    fetchEvent()
  }, [])




  // --- Handlers ---

  const onPhoneSubmit = async (data: z.infer<typeof phoneSchema>) => {
    const success = await sendOtp(data.phoneNumber)
    if (success) setStep(Step.OTP_VERIFICATION)
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
          setExistingParticipant(result.participant)
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
      console.log("Starting online payment")

      // Create Razorpay order without participant ID
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: taxCalculation.totalAmount,
          participantId: null,
        }),
      })

      const order = await res.json()
      console.log("Order response:", order)

      if (!order.id) {
        console.error("Order ID missing:", order)
        throw new Error("Failed to create payment order")
      }

      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        console.error("Razorpay not loaded")
        throw new Error("Payment gateway not loaded. Please refresh the page.")
      }

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY
      if (!razorpayKey) {
        console.error("Razorpay key not configured")
        throw new Error("Payment configuration error. Please contact support.")
      }

      console.log("Razorpay key configured, opening checkout...")

      // Prepare registration data to pass to verification
      const registrationData = {
        mobileNumber: verifiedPhone,
        ...personalData,
        ...eventData,
        eventId: activeEvent?._id || '',
        eventDate: activeEvent?.eventDate || '',
        guestCount: secondaryMembers.length,
        memberCount: totalMembers,
        ticketPrice: pricePerPerson,
        isMember: false,
        paymentMethod: 'online',
        paymentStatus: 'completed',
        totalAmount: taxCalculation.totalAmount,
        taxRate: taxCalculation.taxRate,
        taxAmount: taxCalculation.taxAmount,
        baseAmount: taxCalculation.baseAmount,
        gstNumber: gstNumber || undefined,
        secondaryMembers,
        termsAccepted: termsAccepted,
        termsAcceptedAt: new Date(),
      }

      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: "INR",
        name: "RIFAH ANNUAL SUMMIT",
        description: "Event Ticket",
        order_id: order.id,

        handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
          console.log("Payment successful:", response)
          // Verify payment and create participant
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              registrationData,
            }),
          })

          const verifyData = await verifyRes.json()

          if (verifyData.success) {
            // Store invoice link if available
            if (verifyData.invoiceUrl) {
              setInvoiceLink(verifyData.invoiceUrl)
            }
            setStep(Step.SUCCESS)
          } else {
            console.error("Payment verification failed:", verifyData.error)
            setDbError(verifyData.error || "Payment verification failed")
            setIsSubmitting(false)
          }
        },

        modal: {
          ondismiss: function() {
            console.log("Payment modal dismissed")
            setDbError("Payment was cancelled. Please try again.")
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
      setDbError(error instanceof Error ? error.message : "Payment failed. Please try again.")
      setIsSubmitting(false)
    }
  }

  const onFinalSubmit = async () => {
    // Client-side validation before submission
    if (!eventData.ticketType) {
      setDbError("Please select a ticket type")
      return
    }

    if (!activeEvent) {
      setDbError("Unable to load event details. Please refresh the page.")
      return
    }

    // Terms & Conditions validation - only for online payment
    if (eventData.paymentMethod === 'online' && !termsAccepted) {
      setDbError("Please accept the Terms & Conditions to proceed with registration.")
      return
    }

    // GST validation check for online payment
    if (eventData.paymentMethod === 'online' && gstNumber && gstNumber.trim()) {
      if (gstValidation.isValid === false) {
        setDbError("Invalid GST number. Please enter a valid GST number to proceed with online payment.")
        return
      }
      if (gstValidation.isLoading) {
        setDbError("Please wait for GST validation to complete.")
        return
      }
    }

    // For online payment, trigger payment first (participant created after successful payment)
    if (eventData.paymentMethod === 'online') {
      setIsSubmitting(true)
      setDbError(null)

      // Trigger Razorpay payment without creating participant first
      await handleOnlinePayment()
      return
    }

    // For cash payment, proceed with normal flow
    setIsSubmitting(true)
    setDbError(null)
    try {
      const filteredSecondaryMembers = secondaryMembers.filter(m => m.name.trim() !== '')
      console.log("DEBUG - Secondary Members before API call:", secondaryMembers)
      console.log("DEBUG - Filtered Secondary Members (will be sent):", filteredSecondaryMembers)
      console.log("DEBUG - Member count:", filteredSecondaryMembers.length)
      
      const payload = {
        mobileNumber: verifiedPhone,
        name: personalData.name,
        email: personalData.email,
        businessName: personalData.businessName,
        businessCategory: personalData.businessCategory,
        location: personalData.location,
        guestCount: 0,
        ticketType: eventData.ticketType,
        paymentMethod: eventData.paymentMethod,
        foodGuest: totalMembers, // Total people for food
        ageGuest: 0,
        isMorningFood: eventData.isMorningFood,
        secondaryMembers: filteredSecondaryMembers,
        gstNumber: gstNumber.trim() || undefined,
        termsAccepted: termsAccepted,
        termsAcceptedAt: new Date(),
      }

      const result = await registerParticipant(payload)
      if (result.success) {
        setStep(Step.SUCCESS)
      } else {
        setDbError(result.error || "Registration failed.")
      }
    } catch {
      setDbError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Render Helpers ---

  const renderStepsIndicator = () => (
    <div className="flex justify-center gap-2 mb-8">
      {[Step.PHONE_INPUT, Step.PERSONAL_DETAILS, Step.EVENT_DETAILS].map((s, i) => {
        const isActive = step === s || (step === Step.OTP_VERIFICATION && s === Step.PHONE_INPUT)
        const isCompleted = step > s && step !== Step.OTP_VERIFICATION
        return (
          <div key={i} className={`h-2.5 w-10 sm:w-16 rounded-full transition-colors duration-300 ${isActive ? "bg-primary" : isCompleted ? "bg-primary/40" : "bg-muted"
            }`} />
        )
      })}
    </div>
  )

  // --- Step 1 & 2: Auth (Existing Code Refined) ---
  if (step <= Step.ALREADY_REGISTERED) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div id="recaptcha-container"></div>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            <Phone className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Verification</h1>
          <p className="text-sm text-muted-foreground">
            {step === Step.PHONE_INPUT ? "Verify your mobile number to begin." :
              step === Step.OTP_VERIFICATION ? "Enter the 6-digit code sent to you." : "Checking status..."}
          </p>
        </div>

        {step === Step.PHONE_INPUT && (
          <Form {...phoneForm}>
            <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
              <FormField control={phoneForm.control} name="phoneNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
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
              <Button type="submit" className="w-full" disabled={authLoading}>{authLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Send OTP"}</Button>
            </form>
          </Form>
        )}

        {step === Step.OTP_VERIFICATION && (
          <Form {...otpForm}>
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
              <Button type="submit" className="w-full" disabled={authLoading || isCheckingDb}>{authLoading || isCheckingDb ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Verify"}</Button>
              <Button variant="ghost" type="button" className="w-full" onClick={() => setStep(Step.PHONE_INPUT)}>Change Phone</Button>
            </form>
          </Form>
        )}

        {step === Step.ALREADY_REGISTERED && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Welcome Back!</AlertTitle>
            <AlertDescription>
              {existingParticipant?.name ? `Hello ${existingParticipant.name}, ` : ""}
              This number is already registered.
            </AlertDescription>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => {
                  setVerifiedPhone(phoneForm.getValues("phoneNumber")) // Ensure phone is set
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
                    foodGuest: existingParticipant?.foodPreference?.guest || 0,
                    isMorningFood: existingParticipant?.isMorningFood || false
                  })
                  personalForm.reset({
                    name: existingParticipant?.name || "",
                    email: existingParticipant?.email || "",
                    businessName: existingParticipant?.businessName || "",
                    businessCategory: existingParticipant?.businessCategory || "",
                    location: existingParticipant?.location || ""
                  })
                  setStep(Step.PERSONAL_DETAILS)
                }}
              >
                Edit Registration
              </Button>
              <Button variant="outline" onClick={() => setStep(Step.PHONE_INPUT)}>Use Different Number</Button>
            </div>
          </Alert>
        )}
      </div>
    )
  }

  // --- Step 3: Personal Details ---
  if (step === Step.PERSONAL_DETAILS) {
    return (
      <Card className="w-full max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-300">
        <CardHeader>
          {renderStepsIndicator()}
          <CardTitle>Personal Details</CardTitle>
          {/* <CardDescription>Tell us a bit about yourself.</CardDescription> */}
        </CardHeader>
        <CardContent>
          <Form {...personalForm}>
            <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)} className="space-y-4">
              <FormField control={personalForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="Enter your name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={personalForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="Enter your email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={personalForm.control} name="businessName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your business name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={personalForm.control} name="businessCategory" render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your business category" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={personalForm.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
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
                          {showPrimaryCustomInput ? primaryCustomLocation || "Enter custom location" : field.value || "Select district"}
                          <Check className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 max-h-[350px] overflow-y-auto" align="start">
                      <Command>
                        <CommandInput placeholder="Search district..." />
                        <CommandEmpty>No district found.</CommandEmpty>
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
                              {district}
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
                            Other (enter manually)
                          </CommandItem>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {showPrimaryCustomInput && (
                    <Input
                      placeholder="Enter your location"
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

              <FormField control={personalForm.control} name="gender" render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender (Optional)</FormLabel>
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
                      {/* <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem> */}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />


              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(Step.OTP_VERIFICATION)}>Back</Button>
                <Button type="submit" className="flex-1">Next: Event Details</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    )
  }

  // --- Step 4: Event Details (Pricing, Guests, Food) ---
  if (step === Step.EVENT_DETAILS) {

    return (
      <Card className="w-full max-h-[calc(100vh-8rem)] overflow-y-auto mx-auto animate-in fade-in zoom-in-95 duration-300">
        <CardHeader>
          {renderStepsIndicator()}
          <CardTitle>Event Details</CardTitle>
          <CardDescription>Customize your participation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Active Event Error Alert */}
          {!isLoadingEvent && !activeEvent && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Active Event</AlertTitle>
              <AlertDescription>
                Unable to load event details. Please contact the administrator or try again later.
              </AlertDescription>
            </Alert>
          )}

          {/* Guest Count */}
          {/* <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Guest Count</h3>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground ml-2">
                Total: {totalGuests} person{totalGuests !== 1 ? 's' : ''} (Including you)
              </span>
            </div>
          </div> */}

          <Separator />

          {/* Secondary Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Additional Members</h3>
              </div>
              <span className="text-xs text-muted-foreground">
                {secondaryMembers.length} members added
              </span>
            </div>
              
              {/* Show list of added members */}
              {secondaryMembers.map((member, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Member {index + 1}</span>
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
                    <p><span className="font-medium">Name:</span> {member.name}</p>
                    {member.mobileNumber && <p><span className="font-medium">Mobile:</span> {member.mobileNumber}</p>}
                    {member.email && <p><span className="font-medium">Email:</span> {member.email}</p>}
                    {member.businessName && <p><span className="font-medium">Business:</span> {member.businessName}</p>}
                    {member.location && <p><span className="font-medium">Location:</span> {member.location}</p>}
                  </div>
                </div>
              ))}
              
              {/* Add Member Form - Shows one at a time */}
              {showAddMemberForm && (
                <div className="border rounded-lg p-4 space-y-3 bg-primary/5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Add Member {secondaryMembers.length + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        setShowAddMemberForm(false)
                        setCurrentMember({ name: '', mobileNumber: '', email: '', businessName: '', businessCategory: '', location: '', isMember: false, showCustomLocation: false, customLocation: '' })
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Name *</Label>
                      <Input
                        placeholder="Full name"
                        value={currentMember.name}
                        onChange={(e) => setCurrentMember(prev => ({ ...prev, name: e.target.value }))}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Mobile</Label>
                      <Input
                        placeholder="+91..."
                        value={currentMember.mobileNumber}
                        onChange={(e) => setCurrentMember(prev => ({ ...prev, mobileNumber: e.target.value }))}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Email</Label>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={currentMember.email}
                        onChange={(e) => setCurrentMember(prev => ({ ...prev, email: e.target.value }))}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Business Name</Label>
                      <Input
                        placeholder="Business name"
                        value={currentMember.businessName}
                        onChange={(e) => setCurrentMember(prev => ({ ...prev, businessName: e.target.value }))}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Business Category</Label>
                      <Input
                        placeholder="Category"
                        value={currentMember.businessCategory}
                        onChange={(e) => setCurrentMember(prev => ({ ...prev, businessCategory: e.target.value }))}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Location</Label>
                      <Popover
                        open={currentMember.showCustomLocation ? false : undefined}
                        onOpenChange={() => {
                          if (!currentMember.showCustomLocation) {
                            setCurrentMember(prev => ({ ...prev, showCustomLocation: false }))
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between h-9",
                              !currentMember.location && "text-muted-foreground"
                            )}
                            onClick={() => {
                              if (currentMember.showCustomLocation) {
                                setCurrentMember(prev => ({ ...prev, showCustomLocation: false }))
                              }
                            }}
                          >
                            {currentMember.showCustomLocation ? currentMember.customLocation || "Enter custom location" : currentMember.location || "Select district"}
                            <Check className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 max-h-[350px] overflow-y-auto" align="start">
                          <Command>
                            <CommandInput placeholder="Search district..." />
                            <CommandEmpty>No district found.</CommandEmpty>
                            <CommandGroup>
                              {TAMIL_NADU_DISTRICTS.map((district) => (
                                <CommandItem
                                  key={district}
                                  value={district}
                                  onSelect={() => {
                                    setCurrentMember(prev => ({ ...prev, location: district, showCustomLocation: false }))
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      currentMember.location === district ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {district}
                                </CommandItem>
                              ))}
                              <CommandItem
                                value="other"
                                onSelect={() => {
                                  setCurrentMember(prev => ({ ...prev, showCustomLocation: true, location: '' }))
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    currentMember.showCustomLocation ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                Other (enter manually)
                              </CommandItem>
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {currentMember.showCustomLocation && (
                        <Input
                          placeholder="Enter location"
                          value={currentMember.customLocation || ''}
                          onChange={(e) => {
                            setCurrentMember(prev => ({ ...prev, customLocation: e.target.value, location: e.target.value }))
                          }}
                          className="mt-2 h-9"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Gender (Optional)</Label>
                      <Select
                        value={currentMember.gender}
                        onValueChange={(value) => setCurrentMember(prev => ({ ...prev, gender: value }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          {/* <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem> */}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    disabled={!currentMember.name.trim()}
                    onClick={() => {
                      // Validate required fields
                      if (!currentMember.name.trim()) {
                        setDbError("Member name is required")
                        return
                      }
                      
                      // Validate mobile number format if provided
                      if (currentMember.mobileNumber && !/^\+?[1-9]\d{1,14}$/.test(currentMember.mobileNumber)) {
                        setDbError("Invalid mobile number format for member")
                        return
                      }
                      
                      // Validate email format if provided
                      if (currentMember.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentMember.email)) {
                        setDbError("Invalid email format for member")
                        return
                      }
                      
                      setSecondaryMembers(prev => [...prev, { ...currentMember }])
                      setCurrentMember({ name: '', mobileNumber: '', email: '', businessName: '', businessCategory: '', location: '', isMember: false, showCustomLocation: false, customLocation: '' })
                      setShowAddMemberForm(false)
                      setDbError(null)
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
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
                  Add Member
                </Button>
              )}
          </div>


          {/* Ticket Type */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Ticket Type</h3>
            </div>
            <Select
              value={eventData.ticketType || ""}
              onValueChange={(value) => setEventData(prev => ({ ...prev, ticketType: value }))}
              disabled={isLoadingEvent}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoadingEvent ? "Loading ticket types..." : "Select ticket type"} />
              </SelectTrigger>
              <SelectContent>
                {activeEvent?.ticketsPrice?.map((ticket: { name: string; price: number }) => (
                  <SelectItem key={ticket.name} value={ticket.name}>
                    {ticket.name} - ₹{ticket.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Pricing Display */}
            {eventData.ticketType && pricePerPerson > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="text-center mb-3">
                  <h4 className="font-semibold text-lg">Pricing Summary</h4>
                  <p className="text-xs text-muted-foreground">Total amount for all members</p>
                </div>

                {/* Primary Member */}
                <div className="bg-white rounded p-3 space-y-2 border">
                  <div className="font-semibold text-sm mb-2">Primary Member</div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Ticket Price:</span>
                    <span className="font-medium">₹{pricePerPerson}</span>
                  </div>
                  {taxCalculation.taxRate > 0 && (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span>Tax Amount ({taxCalculation.taxRate}%):</span>
                        <span className="font-medium">₹{Math.round((pricePerPerson * taxCalculation.taxRate) / 100)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span>Total:</span>
                        <span className="font-bold">₹{pricePerPerson + Math.round((pricePerPerson * taxCalculation.taxRate) / 100)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Secondary Members */}
                {secondaryMembers.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-semibold text-sm mb-2">Secondary Members ({secondaryMembers.length})</div>
                    {secondaryMembers.map((member, index) => (
                      <div key={index} className="bg-white rounded p-3 space-y-2 border">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">{member.name || `Member ${index + 1}`}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Ticket Price:</span>
                          <span className="font-medium">₹{pricePerPerson}</span>
                        </div>
                        {taxCalculation.taxRate > 0 && (
                          <>
                            <div className="flex justify-between items-center text-sm">
                              <span>Tax Amount ({taxCalculation.taxRate}%):</span>
                              <span className="font-medium">₹{Math.round((pricePerPerson * taxCalculation.taxRate) / 100)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-semibold">
                              <span>Total:</span>
                              <span className="font-bold">₹{pricePerPerson + Math.round((pricePerPerson * taxCalculation.taxRate) / 100)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Final Total */}
                <div className="bg-green-50 rounded p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-green-700 font-bold text-lg">Grand Total ({totalMembers} members):</span>
                    <span className="font-bold text-xl text-green-800">₹{taxCalculation.totalAmount}</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    {taxCalculation.taxRate > 0 
                      ? `₹{taxCalculation.baseAmount} + ₹{taxCalculation.taxAmount} (GST)`
                      : `₹{taxCalculation.baseAmount} (No GST)`
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* GST Number Input with Real-time Validation */}
          {taxCalculation.taxRate > 0 && (
            <div className="space-y-2">
              <Label htmlFor="gstNumber" className="text-sm">GST Number (Optional)</Label>
              <div className="relative">
                <Input
                  id="gstNumber"
                  type="text"
                  placeholder="Enter GST Number (e.g., 22ABCDE1234F1Z5)"
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
                    <Check className="h-4 w-4 text-green-500" />
                  ) : gstValidation.isValid === false ? (
                    <X className="h-4 w-4 text-red-500" />
                  ) : null}
                </div>
              </div>

              {/* Validation Status Message */}
              {gstValidation.error && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {gstValidation.error}
                </p>
              )}

              {gstValidation.isValid === true && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  GST verified successfully
                  {gstValidation.gstName && ` - ${gstValidation.gstName}`}
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                GST will be applied at {taxCalculation.taxRate}%
              </p>
            </div>
          )}

          <Separator />

          {/* Payment Method */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Payment Method</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={eventData.paymentMethod === 'cash' ? 'default' : 'outline'}
                className="w-full h-14"
                onClick={() => setEventData(prev => ({ ...prev, paymentMethod: 'cash' }))}
              >
                <div className="flex flex-col items-center">
                  <span className="font-semibold">Cash</span>
                  <span className="text-xs opacity-80">Admin Approval</span>
                </div>
              </Button>
              <Button
                type="button"
                variant={eventData.paymentMethod === 'online' ? 'default' : 'outline'}
                className="w-full h-14"
                onClick={() => setEventData(prev => ({ ...prev, paymentMethod: 'online' }))}
              >
                <div className="flex flex-col items-center">
                  <span className="font-semibold">Online</span>
                  <span className="text-xs opacity-80">Pay Now</span>
                </div>
              </Button>
            </div>
            {eventData.paymentMethod === 'cash' && (
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700 text-sm">
                  Cash payment requires admin approval. Please pay at the venue.
                </AlertDescription>
              </Alert>
            )}
            {eventData.paymentMethod === 'online' && (
              <Alert className="border-green-200 bg-green-50">
                <Info className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 text-sm">
                  Secure online payment via Razorpay. You&apos;ll be redirected to complete payment.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* FOOD PREFERENCE - Commented out */}
          {/* <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Food Preference</h3>
              </div>
              <span className="text-xs text-muted-foreground">Optional</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="non-veg">Non-Veg</Label>
                <Input
                  id="non-veg"
                  type="number"
                  min="0"
                  max={totalGuests}
                  value={eventData.foodPreference.nonVeg || ''}
                  placeholder="0"
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0
                    if (val <= totalGuests) {
                      setEventData(prev => ({
                        ...prev,
                        foodPreference: { nonVeg: val, veg: totalGuests - val }
                      }))
                    }
                  }}
                  className="bg-red-50/50 border-red-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="veg">Veg</Label>
                <Input
                  id="veg"
                  type="number"
                  value={eventData.foodPreference.veg || ''}
                  readOnly
                  className="bg-green-50/50 border-green-200 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 border p-4 rounded-lg bg-orange-50/50 border-orange-100">
              <Checkbox
                id="morning-food"
                checked={eventData.isMorningFood}
                onCheckedChange={(c) => setEventData(prev => ({ ...prev, isMorningFood: !!c }))}
              />
              <div>
                <Label htmlFor="morning-food" className="font-medium cursor-pointer">Morning Food Required</Label>
                <p className="text-xs text-muted-foreground">Select if you plan to attend the morning breakfast.</p>
              </div>
            </div>
          </div> */}

          {dbError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{dbError}</AlertDescription></Alert>}

        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={() => setStep(Step.PERSONAL_DETAILS)}>Back</Button>
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
                  I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Terms & Conditions</a> for event registration and payment processing.
                </label>
              </div>
            )}

            <Button
              onClick={onFinalSubmit}
              disabled={isSubmitting || !eventData.ticketType || !activeEvent || (eventData.paymentMethod === 'online' && !termsAccepted)}
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Complete Registration"}
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
            <h2 className="text-2xl font-bold text-foreground">Registration Confirmed!</h2>
            <p className="text-muted-foreground">Thank you for registering. Your details have been saved.</p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-left text-sm space-y-2">
            <div className="flex justify-between"><span>Name:</span><span className="font-medium">{personalData.name}</span></div>
            <div className="flex justify-between"><span>Mobile:</span><span className="font-medium">{verifiedPhone}</span></div>
            <div className="flex justify-between"><span>Secondary Members:</span><span className="font-medium">{secondaryMembers.length}</span></div>
            <div className="flex justify-between"><span>Total Members:</span><span className="font-medium">{totalMembers}</span></div>
            <div className="flex justify-between"><span>Ticket Type:</span><span className="font-medium">{eventData.ticketType}</span></div>
            <div className="flex justify-between"><span>Total Amount:</span><span className="font-bold text-primary">₹{taxCalculation.totalAmount}</span></div>
            {/* FOOD PREFERENCE - Commented out */}
            {/* <div className="flex justify-between"><span>Morning Food:</span><span className="font-medium">{eventData.isMorningFood ? "Yes" : "No"}</span></div> */}
          </div>

          {/* Download Invoice Button */}
          {invoiceLink && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(invoiceLink, '_blank')}
            >
              <Receipt className="mr-2 h-4 w-4" />
              Download Invoice
            </Button>
          )}

          {/* {!invoiceLink && (
            <p className="text-xs text-muted-foreground">Invoice will be generated shortly. If not visible, please contact support.</p>
          )} */}

          <Button className="w-full" onClick={() => window.location.reload()}>Register Another</Button>
        </CardContent>
      </Card>
    )
  }

  return null
}
