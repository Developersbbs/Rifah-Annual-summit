"use client"

import { useState } from "react"
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
import { Loader2, Users, CheckCircle2, AlertCircle, CreditCard, Shield } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { IParticipant } from "@/lib/types"

const personalDetailsSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    location: z.string().min(1, "Please enter your location"),
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

    const form = useForm<z.infer<typeof personalDetailsSchema>>({
        resolver: zodResolver(personalDetailsSchema),
        defaultValues: {
            name: participant.name,
            location: participant.location,
            mobileNumber: participant.mobileNumber,
        }
    })

    const onSubmit = async (data: z.infer<typeof personalDetailsSchema>) => {
        setIsSubmitting(true)
        setDbError(null)
        try {
            const result = await updateParticipant(participant._id, data)
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

    const isCheckedIn = participant.checkIn?.isCheckedIn

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
                                    <Users className="h-4 w-4 text-primary" />
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
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-sm">Mobile Number</Label>
                                            <Input value={participant.mobileNumber} disabled />
                                        </div>
                                        <div>
                                            <Label className="text-sm">Email</Label>
                                            <Input value={participant.email || "N/A"} disabled />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-sm">Business Name</Label>
                                            <Input value={participant.businessName || "N/A"} disabled />
                                        </div>
                                        <div>
                                            <Label className="text-sm">Business Category</Label>
                                            <Input value={participant.businessCategory || "N/A"} disabled />
                                        </div>
                                    </div>
                                    <FormField control={form.control} name="location" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Location</FormLabel>
                                            <FormControl><Input placeholder="Location" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            </div>

                            <Separator />

                            {/* SECTION 2: Secondary Members */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    <h3 className="font-semibold text-lg">Secondary Members ({participant.secondaryMembers?.length || 0})</h3>
                                </div>
                                {participant.secondaryMembers && participant.secondaryMembers.length > 0 ? (
                                    <div className="space-y-3">
                                        {participant.secondaryMembers.map((member, index) => (
                                            <div key={index} className="border rounded-lg p-3 bg-muted/30">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-medium">Member {index + 1}</span>
                                                    <Badge variant={member.isCheckedIn ? "default" : "secondary"} className={member.isCheckedIn ? "bg-green-600" : ""}>
                                                        {member.isCheckedIn ? "✅ Checked-in" : "❌ Not Checked"}
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">Name: </span>
                                                        {member.name}
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Mobile: </span>
                                                        {member.mobileNumber || "N/A"}
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Location: </span>
                                                        {member.location || "N/A"}
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Is Member: </span>
                                                        {member.isMember ? "Yes" : "No"}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No secondary members added.</p>
                                )}
                            </div>

                            <Separator />

                            {/* SECTION 3: Payment Details */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-primary" />
                                    <h3 className="font-semibold text-lg">Payment Details</h3>
                                </div>
                                <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Ticket Price:</span>
                                        <span className="font-medium">₹{participant.ticketPrice || 0}</span>
                                    </div>
                                    {(participant.taxRate || 0) > 0 && (
                                        <>
                                            <div className="flex justify-between text-sm">
                                                <span>Tax Amount ({participant.taxRate}%):</span>
                                                <span className="font-medium">₹{participant.taxAmount || 0}</span>
                                            </div>
                                            <div className="flex justify-between text-sm font-semibold">
                                                <span>Total Amount:</span>
                                                <span className="font-bold">₹{participant.totalAmount || 0}</span>
                                            </div>
                                        </>
                                    )}
                                    <Separator />
                                    <div className="flex justify-between text-sm">
                                        <span>Payment Method:</span>
                                        <Badge variant={participant.paymentMethod === "online" ? "default" : "secondary"}>
                                            {participant.paymentMethod === "online" ? "Online" : "Cash"}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Payment Status:</span>
                                        <Badge
                                            variant={participant.paymentStatus === "completed" ? "default" : "secondary"}
                                            className={participant.paymentStatus === "completed" ? "bg-green-600" : ""}
                                        >
                                            {participant.paymentStatus === "completed" ? "Paid" : "Pending"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* SECTION 4: Approval Status */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary" />
                                    <h3 className="font-semibold text-lg">Approval</h3>
                                </div>
                                <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Approval Status:</span>
                                        <Badge
                                            variant={participant.approvalStatus === "approved" ? "default" : participant.approvalStatus === "rejected" ? "destructive" : "secondary"}
                                            className={participant.approvalStatus === "approved" ? "bg-green-600" : ""}
                                        >
                                            {participant.approvalStatus === "approved" ? "Approved" : participant.approvalStatus === "rejected" ? "Rejected" : "Pending"}
                                        </Badge>
                                    </div>
                                    {participant.approvedBy && (
                                        <div className="flex justify-between text-sm">
                                            <span>Approved By:</span>
                                            <span className="font-medium">{participant.approvedRole || "Admin"}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* SECTION 5: Check-in Status */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    <h3 className="font-semibold text-lg">Check-in Status</h3>
                                </div>
                                <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Primary Member:</span>
                                        <Badge variant={isCheckedIn ? "default" : "secondary"} className={isCheckedIn ? "bg-green-600" : ""}>
                                            {isCheckedIn ? "✅ Checked-in" : "❌ Not Checked"}
                                        </Badge>
                                    </div>
                                    {participant.secondaryMembers && participant.secondaryMembers.length > 0 && (
                                        <>
                                            <Separator />
                                            <div className="text-sm font-medium">Secondary Members:</div>
                                            {participant.secondaryMembers.map((member, index) => (
                                                <div key={index} className="flex justify-between items-center text-sm">
                                                    <span>{member.name || `Member ${index + 1}`}:</span>
                                                    <Badge variant={member.isCheckedIn ? "default" : "secondary"} className={member.isCheckedIn ? "bg-green-600" : ""}>
                                                        {member.isCheckedIn ? "✅" : "❌"}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </>
                                    )}
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
