"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { registerParticipant } from "@/app/actions/register-participant"
import { getActiveEvent } from "@/app/actions/get-active-event"

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

interface AdminRegistrationProps {
    onSuccess: () => void
}

export function AdminRegistration({ onSuccess }: AdminRegistrationProps) {
    const [formData, setFormData] = useState({
        mobileNumber: "",
        name: "",
        email: "",
        businessName: "",
        businessCategory: "",
        location: "",
        gender: "",
        paymentMethod: "cash" as "cash" | "online",
        guestCount: 0,
        isMember: false,
        gstNumber: "",
        registrationLanguage: "en" as "en" | "ta"
    })

    const [secondaryMembers, setSecondaryMembers] = useState<SecondaryMember[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [activeEvent, setActiveEvent] = useState<any>(null)
    const [isLoadingEvent, setIsLoadingEvent] = useState(false)

    useEffect(() => {
        const loadActiveEvent = async () => {
            setIsLoadingEvent(true)
            try {
                const eventResult = await getActiveEvent()
                if (eventResult.success) {
                    setActiveEvent(eventResult.event)
                } else {
                    console.error('Error loading active event:', eventResult.error)
                }
            } catch (error) {
                console.error('Error loading active event:', error)
            } finally {
                setIsLoadingEvent(false)
            }
        }
        loadActiveEvent()
    }, [])

    const handleInputChange = (field: string, value: string | boolean | number) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

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

    const removeSecondaryMember = (index: number) => {
        setSecondaryMembers(prev => prev.filter((_, i) => i !== index))
    }

    const updateSecondaryMember = (index: number, field: string, value: string | boolean) => {
        setSecondaryMembers(prev => prev.map((member, i) => 
            i === index ? { ...member, [field]: value } : member
        ))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const result = await registerParticipant({
                ...formData,
                secondaryMembers,
                ageGuest: formData.guestCount
            })

            if (result.success) {
                // Reset form
                setFormData({
                    mobileNumber: "",
                    name: "",
                    email: "",
                    businessName: "",
                    businessCategory: "",
                    location: "",
                    gender: "",
                    paymentMethod: "cash",
                    guestCount: 0,
                    isMember: false,
                    gstNumber: "",
                    registrationLanguage: "en"
                })
                setSecondaryMembers([])
                onSuccess()
            } else {
                console.error("Registration failed:", result.error)
            }
        } catch (error) {
            console.error("Error during registration:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Admin Registration (No OTP Required)</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Primary Member Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Primary Member</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="mobileNumber">Mobile Number *</Label>
                                <Input
                                    id="mobileNumber"
                                    value={formData.mobileNumber}
                                    onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="businessName">Business Name</Label>
                                <Input
                                    id="businessName"
                                    value={formData.businessName}
                                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="businessCategory">Business Category</Label>
                                <Input
                                    id="businessCategory"
                                    value={formData.businessCategory}
                                    onChange={(e) => handleInputChange("businessCategory", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => handleInputChange("location", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentMethod">Payment Method</Label>
                                <Select value={formData.paymentMethod} onValueChange={(value: "cash" | "online") => handleInputChange("paymentMethod", value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select payment method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="online">Online</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="guestCount">Guest Count</Label>
                                <Input
                                    id="guestCount"
                                    type="number"
                                    min="0"
                                    value={formData.guestCount}
                                    onChange={(e) => handleInputChange("guestCount", parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gstNumber">GST Number</Label>
                                <Input
                                    id="gstNumber"
                                    value={formData.gstNumber}
                                    onChange={(e) => handleInputChange("gstNumber", e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isMember"
                                checked={formData.isMember}
                                onCheckedChange={(checked) => handleInputChange("isMember", checked)}
                            />
                            <Label htmlFor="isMember">Is Member</Label>
                        </div>
                    </div>

                    <Separator />

                    {/* Secondary Members */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Secondary Members</h3>
                            <Button type="button" onClick={addSecondaryMember} variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Secondary Member
                            </Button>
                        </div>
                        {secondaryMembers.map((member, index) => (
                            <Card key={index} className="p-4">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="font-medium">Secondary Member {index + 1}</h4>
                                    <Button type="button" onClick={() => removeSecondaryMember(index)} variant="outline" size="sm">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Name *</Label>
                                        <Input
                                            value={member.name}
                                            onChange={(e) => updateSecondaryMember(index, "name", e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mobile Number</Label>
                                        <Input
                                            value={member.mobileNumber || ""}
                                            onChange={(e) => updateSecondaryMember(index, "mobileNumber", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            value={member.email || ""}
                                            onChange={(e) => updateSecondaryMember(index, "email", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Business Name</Label>
                                        <Input
                                            value={member.businessName || ""}
                                            onChange={(e) => updateSecondaryMember(index, "businessName", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Business Category</Label>
                                        <Input
                                            value={member.businessCategory || ""}
                                            onChange={(e) => updateSecondaryMember(index, "businessCategory", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Location</Label>
                                        <Input
                                            value={member.location || ""}
                                            onChange={(e) => updateSecondaryMember(index, "location", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Gender</Label>
                                        <Select value={member.gender || ""} onValueChange={(value) => updateSecondaryMember(index, "gender", value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={member.isMember || false}
                                            onCheckedChange={(checked) => updateSecondaryMember(index, "isMember", checked)}
                                        />
                                        <Label>Is Member</Label>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Registering...
                                </>
                            ) : (
                                "Register Participant"
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
