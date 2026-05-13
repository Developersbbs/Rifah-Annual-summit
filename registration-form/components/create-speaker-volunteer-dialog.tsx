"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

type Role = "speaker" | "volunteer"

interface FormData {
    role: Role
    name: string
    email: string
    mobileNumber: string
    organization: string
    designation: string
    topic: string
    bio: string
}

const DEFAULT_FORM: FormData = {
    role: "speaker",
    name: "",
    email: "",
    mobileNumber: "",
    organization: "",
    designation: "",
    topic: "",
    bio: "",
}

export interface SpeakerVolunteerRecord {
    _id: string
    role: Role
    name: string
    email?: string
    mobileNumber?: string
    organization?: string
    designation?: string
    topic?: string
    bio?: string
}

interface CreateSpeakerVolunteerDialogProps {
    open: boolean
    onClose: () => void
    onCreated: () => void
    /** Pass a record to switch the dialog into edit mode */
    editRecord?: SpeakerVolunteerRecord | null
}

export function CreateSpeakerVolunteerDialog({
    open,
    onClose,
    onCreated,
    editRecord,
}: CreateSpeakerVolunteerDialogProps) {
    const isEdit = !!editRecord
    const [form, setForm] = useState<FormData>(DEFAULT_FORM)
    const [submitting, setSubmitting] = useState(false)

    // Populate form when editing
    useEffect(() => {
        if (editRecord) {
            setForm({
                role: editRecord.role,
                name: editRecord.name,
                email: editRecord.email || "",
                mobileNumber: editRecord.mobileNumber || "",
                organization: editRecord.organization || "",
                designation: editRecord.designation || "",
                topic: editRecord.topic || "",
                bio: editRecord.bio || "",
            })
        } else {
            setForm(DEFAULT_FORM)
        }
    }, [editRecord, open])

    const set = (field: keyof FormData, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }))

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!form.name.trim()) {
            toast.error("Name is required")
            return
        }
        setSubmitting(true)
        try {
            const url = isEdit
                ? `/api/speakers-volunteers/${editRecord!._id}`
                : "/api/speakers-volunteers"
            const method = isEdit ? "PATCH" : "POST"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Request failed")

            const label = form.role === "speaker" ? "Speaker" : "Volunteer"
            toast.success(isEdit ? `${label} updated successfully` : `${label} created successfully`)
            setForm(DEFAULT_FORM)
            onCreated()
            onClose()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Something went wrong")
        } finally {
            setSubmitting(false)
        }
    }

    const handleClose = () => {
        if (submitting) return
        setForm(DEFAULT_FORM)
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Edit Speaker / Volunteer" : "Create Speaker / Volunteer"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {/* Role */}
                    <div className="space-y-1.5">
                        <Label htmlFor="sv-role">Role *</Label>
                        <select
                            id="sv-role"
                            value={form.role}
                            onChange={(e) => set("role", e.target.value)}
                            className="w-full p-2 border rounded-md bg-background text-sm"
                        >
                            <option value="speaker">Speaker</option>
                            <option value="volunteer">Volunteer</option>
                        </select>
                    </div>

                    {/* Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="sv-name">Name *</Label>
                        <Input
                            id="sv-name"
                            placeholder="Full name"
                            value={form.name}
                            onChange={(e) => set("name", e.target.value)}
                            required
                        />
                    </div>

                    {/* Email & Mobile */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="sv-email">Email</Label>
                            <Input
                                id="sv-email"
                                type="email"
                                placeholder="email@example.com"
                                value={form.email}
                                onChange={(e) => set("email", e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="sv-mobile">Mobile Number</Label>
                            <Input
                                id="sv-mobile"
                                placeholder="+91 98765 43210"
                                value={form.mobileNumber}
                                onChange={(e) => set("mobileNumber", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Organization & Designation */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="sv-org">Organization</Label>
                            <Input
                                id="sv-org"
                                placeholder="Company / Institution"
                                value={form.organization}
                                onChange={(e) => set("organization", e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="sv-designation">Designation</Label>
                            <Input
                                id="sv-designation"
                                placeholder="CEO / Manager..."
                                value={form.designation}
                                onChange={(e) => set("designation", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Topic (speaker only) */}
                    {form.role === "speaker" && (
                        <div className="space-y-1.5">
                            <Label htmlFor="sv-topic">Topic / Session Title</Label>
                            <Input
                                id="sv-topic"
                                placeholder="Talk or session title"
                                value={form.topic}
                                onChange={(e) => set("topic", e.target.value)}
                            />
                        </div>
                    )}

                    {/* Bio */}
                    <div className="space-y-1.5">
                        <Label htmlFor="sv-bio">Bio / Notes</Label>
                        <textarea
                            id="sv-bio"
                            rows={3}
                            placeholder="Short bio or additional notes..."
                            value={form.bio}
                            onChange={(e) => set("bio", e.target.value)}
                            className="w-full p-2 border rounded-md bg-background text-sm resize-none"
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isEdit ? "Saving..." : "Creating..."}
                                </>
                            ) : (
                                isEdit ? "Save Changes" : "Create"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
