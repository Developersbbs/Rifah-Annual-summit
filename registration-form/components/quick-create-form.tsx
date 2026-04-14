"use client"

import { useState, useMemo, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { checkRegistration } from "@/app/actions/check-registration"
import { registerParticipant } from "@/app/actions/register-participant"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, CheckCircle2, AlertCircle, Plus, Minus, Phone, Users, Utensils, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { IParticipant } from "@/lib/types"

enum Step {
    PHONE_INPUT = 0,
    ALREADY_REGISTERED = 1,
    PERSONAL_DETAILS = 2,
    EVENT_DETAILS = 3,
    SUCCESS = 4,
}

const phoneSchema = z.object({
    phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number")
})

const personalDetailsSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    location: z.string().min(1, "Please enter your location"),
})

export function QuickCreateForm() {
    const [step, setStep] = useState<Step>(Step.PHONE_INPUT)
    const [isCheckingDb, setIsCheckingDb] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [dbError, setDbError] = useState<string | null>(null)

    // Registration Data State
    const [verifiedPhone, setVerifiedPhone] = useState("")
    const [personalData, setPersonalData] = useState({ name: "", location: "" })
    const [eventData, setEventData] = useState({
        guestCount: 0,
        ageGuest: 0,
        foodGuest: 0,
        ticketType: "General",
    })
    const [existingParticipant, setExistingParticipant] = useState<{
        name?: string;
        location?: string;
        guestCount?: number;
        ageGroups?: { guest: number };
        foodPreference?: { guest: number };
        isMorningFood?: boolean;
        ticketType?: string;
    } | null>(null)

    // Forms
    const phoneForm = useForm<z.infer<typeof phoneSchema>>({ resolver: zodResolver(phoneSchema), defaultValues: { phoneNumber: "+91" } })
    const personalForm = useForm<z.infer<typeof personalDetailsSchema>>({
        resolver: zodResolver(personalDetailsSchema),
        defaultValues: { name: "", location: "" }
    })

    // --- Derived State (Pricing) ---
    const totalGuests = useMemo(() => {
        return 1 + eventData.guestCount
    }, [eventData.guestCount])

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
        setIsCheckingDb(true)
        setDbError(null)
        try {
            const ph = data.phoneNumber
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

    const onPersonalSubmit = (data: z.infer<typeof personalDetailsSchema>) => {
        setPersonalData(data)
        setStep(Step.EVENT_DETAILS)
    }

    const onFinalSubmit = async () => {
        setIsSubmitting(true)
        try {
            const payload = {
                mobileNumber: verifiedPhone,
                name: personalData.name,
                location: personalData.location,
                guestCount: eventData.guestCount,
                ageGuest: eventData.guestCount,
                foodGuest: eventData.guestCount + 1,
                ticketType: eventData.ticketType || "General",
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
            {[Step.PHONE_INPUT, Step.PERSONAL_DETAILS, Step.EVENT_DETAILS].map((s, i) => {
                const isActive = step === s
                const isCompleted = step > s
                return (
                    <div key={i} className={`h-2.5 w-10 sm:w-16 rounded-full transition-colors duration-300 ${isActive ? "bg-primary" : isCompleted ? "bg-primary/40" : "bg-muted"
                        }`} />
                )
            })}
        </div>
    )

    // --- Step 1: Input (No OTP) ---
    if (step === Step.PHONE_INPUT) { // Consolidated input & already registered handling wrapper not needed here
        return (
            <div className="flex flex-col gap-6 w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                        <Phone className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-bold">Quick Create</h1>
                    <p className="text-sm text-muted-foreground">
                        Enter guest mobile number to begin.
                    </p>
                </div>

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
                        {dbError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{dbError}</AlertDescription></Alert>}
                        <Button type="submit" className="w-full" disabled={isCheckingDb}>{isCheckingDb ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Check Number"}</Button>
                    </form>
                </Form>
            </div>
        )
    }

    // --- Step 2: Already Registered Alert ---
    if (step === Step.ALREADY_REGISTERED) {
        return (
            <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
                <Alert className="border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Already Registered</AlertTitle>
                    <AlertDescription>
                        {existingParticipant?.name ? `User ${existingParticipant.name} is` : "This number is"} already registered.
                    </AlertDescription>
                    <div className="mt-4 flex gap-2">
                        <Button
                            onClick={() => {
                                setVerifiedPhone(phoneForm.getValues("phoneNumber"))
                                setPersonalData({
                                    name: existingParticipant?.name || "",
                                    location: existingParticipant?.location || ""
                                })
                                setEventData({
                                    guestCount: existingParticipant?.guestCount || 0,
                                    ageGuest: existingParticipant?.ageGroups?.guest || 0,
                                    foodGuest: existingParticipant?.foodPreference?.guest || 1,
                                    ticketType: existingParticipant?.ticketType || "General"
                                })
                                personalForm.reset({
                                    name: existingParticipant?.name || "",
                                    location: existingParticipant?.location || ""
                                })
                                setStep(Step.PERSONAL_DETAILS)
                            }}
                        >
                            Edit
                        </Button>
                        <Button variant="outline" onClick={() => setStep(Step.PHONE_INPUT)}>Use Different Number</Button>
                    </div>
                </Alert>
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
                    <CardDescription>Guest details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...personalForm}>
                        <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)} className="space-y-4">
                            <FormField control={personalForm.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl><Input placeholder="Enter guest name" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={personalForm.control} name="location" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <FormControl><Input placeholder="Enter your location (e.g. Covai, Trichy)" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <Button type="submit" className="w-full">Next</Button>
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
                    <CardTitle>Event Details</CardTitle>
                    <CardDescription>Guest participation details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">Guest Count</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => setEventData(prev => ({ ...prev, guestCount: Math.max(0, prev.guestCount - 1) }))}
                                disabled={eventData.guestCount <= 0}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="text-xl font-semibold w-8 text-center">{eventData.guestCount}</span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => setEventData(prev => ({ ...prev, guestCount: prev.guestCount + 1 }))}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground ml-2">
                                Total: {totalGuests} person{totalGuests !== 1 ? 's' : ''} (Including you)
                            </span>
                        </div>
                    </div>

                    {/* FOOD PREFERENCE - Commented out */}
                    {/* <Separator />

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Utensils className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">Food Preference</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="non-veg">Non-Veg</Label>
                                <Input
                                    id="non-veg"
                                    inputMode="numeric"
                                    value={eventData.foodPreference.nonVeg.toString()}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === "") {
                                            setEventData(prev => ({ ...prev, foodPreference: { nonVeg: 0, veg: totalGuests } }))
                                            return;
                                        }
                                        const val = parseInt(value);
                                        if (!isNaN(val) && val <= totalGuests) {
                                            setEventData(prev => ({
                                                ...prev,
                                                foodPreference: { nonVeg: val, veg: totalGuests - val }
                                            }))
                                        }
                                    }}
                                    onFocus={(e) => e.target.select()}
                                    className="bg-red-50/50 border-red-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="veg">Veg</Label>
                                <Input id="veg" value={eventData.foodPreference.veg} readOnly className="bg-green-50/50 border-green-200 cursor-not-allowed" />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 border p-4 rounded-lg bg-orange-50/50 border-orange-100 mt-4">
                            <Checkbox
                                id="morning-food"
                                checked={eventData.isMorningFood}
                                onCheckedChange={(c) => setEventData(prev => ({ ...prev, isMorningFood: !!c }))}
                            />
                            <div>
                                <Label htmlFor="morning-food" className="font-medium cursor-pointer">Morning Food Required</Label>
                            </div>
                        </div>
                    </div> */}

                    <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/20">
                        <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <AlertTitle className="text-yellow-800 dark:text-yellow-300 font-semibold mb-1">Fee Reminder</AlertTitle>
                        <AlertDescription className="text-yellow-700 dark:text-yellow-400 font-medium">
                            Collect entrance fee if applicable.
                        </AlertDescription>
                    </Alert>

                    {dbError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{dbError}</AlertDescription></Alert>}

                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(Step.PERSONAL_DETAILS)}>Back</Button>
                    <Button onClick={onFinalSubmit} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Complete Registration"}
                    </Button>
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
                        <h2 className="text-2xl font-bold text-foreground">Registered Successfully!</h2>
                        <p className="text-muted-foreground">The participant has been added.</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-left text-sm space-y-2">
                        <div className="flex justify-between"><span>Name:</span><span className="font-medium">{personalData.name}</span></div>
                        <div className="flex justify-between"><span>Mobile:</span><span className="font-medium">{verifiedPhone}</span></div>
                        <div className="flex justify-between"><span>Total Guests:</span><span className="font-medium">{totalGuests}</span></div>
                    </div>
                    <Button className="w-full" onClick={() => {
                        setStep(Step.PHONE_INPUT)
                        phoneForm.reset()
                        personalForm.reset()
                        setPersonalData({ name: "", location: "" })
                        setEventData({ guestCount: 0, ageGuest: 0, foodGuest: 0, ticketType: "General" })
                        setVerifiedPhone("")
                    }}>Add Another</Button>
                </CardContent>
            </Card>
        )
    }

    return null
}
