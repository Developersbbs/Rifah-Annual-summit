import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { checkRegistration } from "@/app/actions/check-registration"
import { Calendar, MapPin, Phone, Mail, Users, Receipt, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function UserDashboard() {
    const user = await getCurrentUser()

    if (!user) {
        return <div>Please log in</div>
    }

    if (!user.mobileNumber) {
        return <div>Invalid user data</div>
    }

    const registrationData = await checkRegistration(user.mobileNumber)
    
    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-6 py-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">My Registration</h1>
                    <div className="flex gap-2">
                        <span className="text-sm text-muted-foreground">Logged in as:</span>
                        <Badge variant="outline">{user.name || user.email}</Badge>
                    </div>
                </div>

                {registrationData.exists ? (
                    registrationData.participant ? (
                        // User has completed registration
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        Registration Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <h3 className="font-semibold text-sm">Personal Information</h3>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <span>{registrationData.participant.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <span>{registrationData.participant.email || 'Not provided'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    <span>{registrationData.participant.mobileNumber}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <span>{registrationData.participant.location}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="font-semibold text-sm">Business Information</h3>
                                            <div className="space-y-1 text-sm">
                                                <div>
                                                    <span className="font-medium">Business:</span> {registrationData.participant.businessName}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Category:</span> {registrationData.participant.businessCategory}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <h3 className="font-semibold text-sm">Event Details</h3>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Receipt className="h-4 w-4 text-muted-foreground" />
                                                    <span>Ticket: {registrationData.participant.ticketType}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <span>Guests: {registrationData.participant.guestCount || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Receipt className="h-4 w-4 text-muted-foreground" />
                                                    <span>Amount: ₹{registrationData.participant.totalAmount || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="font-semibold text-sm">Payment & Approval</h3>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Receipt className="h-4 w-4 text-muted-foreground" />
                                                    <span>Method: {registrationData.participant.paymentMethod}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <span>Status: </span>
                                                    <Badge
                                                        variant={
                                                            registrationData.participant.approvalStatus === 'approved' ? 'default' :
                                                            registrationData.participant.approvalStatus === 'rejected' ? 'destructive' : 'secondary'
                                                        }
                                                    >
                                                        {registrationData.participant.approvalStatus}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {registrationData.participant.approvalStatus === 'pending' && (
                                <Card className="border-orange-200 bg-orange-50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-orange-800">
                                            <AlertCircle className="h-5 w-5" />
                                            Awaiting Approval
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription>
                                            Your registration is pending admin approval. You will be able to check in once approved.
                                            Please contact the event organizers for more information.
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            )}

                            {registrationData.participant.approvalStatus === 'rejected' && (
                                <Card className="border-red-200 bg-red-50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-red-800">
                                            <XCircle className="h-5 w-5" />
                                            Registration Rejected
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription>
                                            Your registration has been rejected.
                                            {registrationData.participant.rejectionReason ? (
                                                <span>Reason: {registrationData.participant.rejectionReason}</span>
                                            ) : null}
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            )}

                            {registrationData.participant.approvalStatus === 'approved' && (
                                <Card className="border-green-200 bg-green-50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-green-800">
                                            <CheckCircle className="h-5 w-5" />
                                            Registration Approved
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription>
                                            Your registration has been approved! You can now proceed to check-in.
                                        </CardDescription>
                                        <div className="mt-4">
                                            <Link href="/checkin">
                                                <Button className="w-full">
                                                    Proceed to Check-in
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    ) : (
                        // User exists but no registration completed
                        <Card>
                            <CardHeader>
                                <CardTitle>Complete Your Registration</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    You have an account but haven't completed registration yet.
                                    Please complete your registration to participate in the event.
                                </CardDescription>
                                <div className="mt-4">
                                    <Link href="/register">
                                        <Button className="w-full">
                                            Complete Registration
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    )
                ) : (
                    // User doesn't exist in database
                    <Card>
                        <CardHeader>
                            <CardTitle>No Registration Found</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>
                                You haven't registered for the event yet. Please complete your registration to participate.
                            </CardDescription>
                            <div className="mt-4">
                                <Link href="/register">
                                    <Button className="w-full">
                                        Register Now
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
