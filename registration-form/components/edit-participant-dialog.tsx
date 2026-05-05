"use client"

import { useState, useEffect } from "react"
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
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IParticipant } from "@/lib/types"

const personalDetailsSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email format").optional(),
    businessName: z.string().optional(),
    businessCategory: z.string().optional(),
    location: z.string().optional(),
    gender: z.string().optional(),
    ticketType: z.string().optional(),
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
    const [secondaryMembers, setSecondaryMembers] = useState<Array<{ name: string; email: string; businessName: string; businessCategory: string; location: string; gender: string; isCheckedIn: boolean }>>([])

    const form = useForm<z.infer<typeof personalDetailsSchema>>({
        resolver: zodResolver(personalDetailsSchema),
        defaultValues: {
            name: participant.name,
            email: participant.email || "",
            businessName: participant.businessName || "",
            businessCategory: participant.businessCategory || "",
            location: participant.location || "",
            gender: participant.gender || "",
            ticketType: participant.ticketType || "",
        }
    })

    // Reset form when participant changes
    useEffect(() => {
        if (participant) {
            form.reset({
                name: participant.name,
                email: participant.email || "",
                businessName: participant.businessName || "",
                businessCategory: participant.businessCategory || "",
                location: participant.location || "",
                gender: participant.gender || "",
                ticketType: participant.ticketType || "",
            })
            // Initialize secondary members
            setSecondaryMembers(
                participant.secondaryMembers?.map((member) => ({
                    name: member.name || "",
                    email: member.email || "",
                    businessName: member.businessName || "",
                    businessCategory: member.businessCategory || "",
                    location: member.location || "",
                    gender: member.gender || "",
                    isCheckedIn: member.isCheckedIn || false,
                })) || []
            )
        }
    }, [participant, form])

    const onSubmit = async (data: z.infer<typeof personalDetailsSchema>) => {
        setIsSubmitting(true)
        setDbError(null)
        try {
            const result = await updateParticipant(participant._id, { ...data, secondaryMembers })
            if (result.success) {
                onOpenChange(false)
                if (onSuccess) onSuccess()
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Participant Details</DialogTitle>
                    <DialogDescription>
                        View and edit participant information.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <Form {...form}>
                        <form id="edit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            {/* SECTION 1: Primary Member */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-lg">Primary Member</h3>
                                </div>
                                <div className="space-y-3">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl><Input placeholder="Name" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="businessName" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Business Name</FormLabel>
                                            <FormControl><Input placeholder="Business Name" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl><Input type="email" placeholder="Email" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="businessCategory" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Business Category</FormLabel>
                                            <FormControl><Input placeholder="Business Category" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="location" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Location</FormLabel>
                                            <FormControl><Input placeholder="Location" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="gender" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gender</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Gender" />
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
                                        )} />
                                        <FormField control={form.control} name="ticketType" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ticket Type</FormLabel>
                                                <FormControl><Input placeholder="Ticket Type" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: Secondary Members */}
                            {secondaryMembers.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg">Secondary Members</h3>
                                    </div>
                                    {secondaryMembers.map((member, index) => (
                                        <div key={index} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                                            <span className="text-sm font-medium text-muted-foreground">Member {index + 1}</span>
                                            <div className="space-y-3">
                                                <div>
                                                    <Label className="text-xs">Name</Label>
                                                    <Input
                                                        value={member.name}
                                                        onChange={(e) => {
                                                            const updated = [...secondaryMembers]
                                                            updated[index] = { ...updated[index], name: e.target.value }
                                                            setSecondaryMembers(updated)
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Email</Label>
                                                    <Input
                                                        type="email"
                                                        value={member.email}
                                                        onChange={(e) => {
                                                            const updated = [...secondaryMembers]
                                                            updated[index] = { ...updated[index], email: e.target.value }
                                                            setSecondaryMembers(updated)
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Business Name</Label>
                                                    <Input
                                                        value={member.businessName}
                                                        onChange={(e) => {
                                                            const updated = [...secondaryMembers]
                                                            updated[index] = { ...updated[index], businessName: e.target.value }
                                                            setSecondaryMembers(updated)
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Business Category</Label>
                                                    <Input
                                                        value={member.businessCategory}
                                                        onChange={(e) => {
                                                            const updated = [...secondaryMembers]
                                                            updated[index] = { ...updated[index], businessCategory: e.target.value }
                                                            setSecondaryMembers(updated)
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Location</Label>
                                                    <Input
                                                        value={member.location}
                                                        onChange={(e) => {
                                                            const updated = [...secondaryMembers]
                                                            updated[index] = { ...updated[index], location: e.target.value }
                                                            setSecondaryMembers(updated)
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Gender</Label>
                                                    <Select 
                                                        value={member.gender} 
                                                        onValueChange={(value) => {
                                                            const updated = [...secondaryMembers]
                                                            updated[index] = { ...updated[index], gender: value }
                                                            setSecondaryMembers(updated)
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-10">
                                                            <SelectValue placeholder="Select Gender" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="male">Male</SelectItem>
                                                            <SelectItem value="female">Female</SelectItem>
                                                            <SelectItem value="other">Other</SelectItem>
                                                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

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
