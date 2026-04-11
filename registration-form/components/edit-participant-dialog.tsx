"use client"

import { useState, useMemo, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { updateParticipant } from "@/app/actions/edit-participant"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus, Minus, Users, Utensils, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
// import { toast } from "sonner"
import { IParticipant } from "@/lib/types"
// Assuming sonner or toast is available? If not, simple alert or callback. 
// I'll stick to props based callback or internal state.

const personalDetailsSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    groupNumber: z.string().min(1, "Please select a group number"),
    mobileNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"),
})

interface EditParticipantDialogProps {
    participant: IParticipant
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function EditParticipantDialog({ participant, open, onOpenChange, onSuccess }: EditParticipantDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [dbError, setDbError] = useState<string | null>(null)

    // Event Data State
    const [eventData, setEventData] = useState({
        ageGroups: participant.ageGroups || { adults: 1, children: 0 },
        foodPreference: participant.foodPreference || { veg: 1, nonVeg: 0 },
        isMorningFood: participant.isMorningFood || false,
    })

    const form = useForm<z.infer<typeof personalDetailsSchema>>({
        resolver: zodResolver(personalDetailsSchema),
        defaultValues: {
            name: participant.name,
            groupNumber: participant.groupNumber,
            mobileNumber: participant.mobileNumber,
        }
    })

    // Reset state when participant changes (if dialog re-opens with different user)
    useEffect(() => {
        if (open && participant) {
            setEventData({
                ageGroups: participant.ageGroups || { adults: 1, children: 0 },
                foodPreference: participant.foodPreference || { veg: 1, nonVeg: 0 },
                isMorningFood: participant.isMorningFood || false,
            })
            form.reset({
                name: participant.name,
                groupNumber: participant.groupNumber,
                mobileNumber: participant.mobileNumber,
            })
            setDbError(null)
        }
    }, [open, participant, form])

    // --- Derived State (Pricing) ---
    const totalGuests = useMemo(() => {
        const { adults, children } = eventData.ageGroups
        return (Number(adults) || 0) + (Number(children) || 0)
    }, [eventData.ageGroups])

    // Update Food Prefs when total guests changes
    useEffect(() => {
        // Only auto-adjust valid numbers
        setEventData(prev => ({
            ...prev,
            foodPreference: {
                veg: Math.max(0, totalGuests - (prev.foodPreference.nonVeg || 0)),
                nonVeg: prev.foodPreference.nonVeg || 0
            }
        }))
    }, [totalGuests])

    // --- Handlers ---

    const updateCount = (key: keyof typeof eventData.ageGroups, delta: number) => {
        const current = eventData.ageGroups[key]
        const next = Math.max(key === 'adults' ? 1 : 0, current + delta)
        setEventData(prev => ({ ...prev, ageGroups: { ...prev.ageGroups, [key]: next } }))
    }

    const onSubmit = async (data: z.infer<typeof personalDetailsSchema>) => {
        setIsSubmitting(true)
        setDbError(null)
        try {
            const payload = {
                ...data,
                ageGroups: eventData.ageGroups,
                foodPreference: eventData.foodPreference,
                isMorningFood: eventData.isMorningFood,
            }

            const result = await updateParticipant(participant._id, payload)
            if (result.success) {
                onOpenChange(false)
                if (onSuccess) onSuccess()
                // Optional: Toast success
            } else {
                setDbError(result.error || "Update failed.")
            }
        } catch {
            setDbError("An unexpected error occurred.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Participant</DialogTitle>
                    <DialogDescription>
                        Make changes to the participant details here. Click save when you&apos;re done.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <Form {...form}>
                        <form id="edit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                            {/* Personal Details */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-muted-foreground">Personal Details</h3>
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl><Input placeholder="Name" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="mobileNumber" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mobile Number</FormLabel>
                                        <FormControl><Input placeholder="+91..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="groupNumber" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Group Number</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select Group" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {[...Array(23)].map((_, i) => (
                                                    <SelectItem key={i} value={(i + 1).toString()}>{`Group ${i + 1}`}</SelectItem>
                                                ))}
                                                <SelectItem value="covai">Covai Group</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <Separator />

                            {/* Event Details */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    <h3 className="text-sm font-medium text-muted-foreground">Guest Counts</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Adults need special handling to include/exclude Logic? 
                                        In Database, Adults count INCLUDES member.
                                        So here we edit the RAW DB VALUE. 
                                        UI should probably reflect that.
                                        "Adults (15+)" usually implies total adults.
                                        We will keep it consistent with Register Form -> Raw Value.
                                     */}
                                    {[
                                        { key: 'adults', label: 'Adults' },
                                        { key: 'children', label: 'Children' },
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between p-2 border rounded-lg bg-muted/20">
                                            <span className="text-sm font-medium">{item.label}</span>
                                            <div className="flex items-center gap-2">
                                                <Button type="button" variant="outline" size="icon" className="h-6 w-6" onClick={() => updateCount(item.key as 'adults' | 'children', -1)}><Minus className="h-3 w-3" /></Button>
                                                <span className="w-4 text-center text-sm">{eventData.ageGroups[item.key as keyof typeof eventData.ageGroups]}</span>
                                                <Button type="button" variant="outline" size="icon" className="h-6 w-6" onClick={() => updateCount(item.key as 'adults' | 'children', 1)}><Plus className="h-3 w-3" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Utensils className="h-4 w-4 text-primary" />
                                    <h3 className="text-sm font-medium text-muted-foreground">Food Preference</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-non-veg">Non-Veg</Label>
                                        <Input
                                            id="edit-non-veg"
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
                                            className="h-8"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-veg">Veg</Label>
                                        <Input id="edit-veg" value={eventData.foodPreference.veg} readOnly className="h-8 bg-muted" />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/20">
                                    <Checkbox
                                        id="edit-morning-food"
                                        checked={eventData.isMorningFood}
                                        onCheckedChange={(c) => setEventData(prev => ({ ...prev, isMorningFood: !!c }))}
                                    />
                                    <Label htmlFor="edit-morning-food" className="font-medium cursor-pointer">Morning Food Required</Label>
                                </div>
                            </div>

                            {dbError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{dbError}</AlertDescription></Alert>}

                        </form>
                    </Form>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" form="edit-form" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
