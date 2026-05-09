"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { IParticipant } from "@/lib/types"

interface ViewParticipantDialogProps {
    participant: IParticipant
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ViewParticipantDialog({ participant, open, onOpenChange }: ViewParticipantDialogProps) {
    if (!participant) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Participant Details</DialogTitle>
                    <DialogDescription>
                        Full details of the primary and secondary members.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Primary Member */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Primary Member</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-muted-foreground">Name:</span>
                                <div className="mt-1">{participant.name || "-"}</div>
                            </div>
                            <div>
                                <span className="font-medium text-muted-foreground">Mobile:</span>
                                <div className="mt-1">{participant.mobileNumber || "-"}</div>
                            </div>
                            <div>
                                <span className="font-medium text-muted-foreground">Email:</span>
                                <div className="mt-1">{participant.email || "-"}</div>
                            </div>
                            <div>
                                <span className="font-medium text-muted-foreground">Business Name:</span>
                                <div className="mt-1">{participant.businessName || "-"}</div>
                            </div>
                            <div>
                                <span className="font-medium text-muted-foreground">Business Category:</span>
                                <div className="mt-1">{participant.businessCategory || "-"}</div>
                            </div>
                            <div>
                                <span className="font-medium text-muted-foreground">Location:</span>
                                <div className="mt-1">{participant.location || "-"}</div>
                            </div>
                            <div>
                                <span className="font-medium text-muted-foreground">Gender:</span>
                                <div className="mt-1 capitalize">{participant.gender || "-"}</div>
                            </div>
                            <div>
                                <span className="font-medium text-muted-foreground">Ticket Type:</span>
                                <div className="mt-1">{participant.ticketType || "-"}</div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Members */}
                    {participant.secondaryMembers && participant.secondaryMembers.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg border-b pb-2">Secondary Members</h3>
                            <div className="space-y-4">
                                {participant.secondaryMembers.map((member, index) => (
                                    <div key={index} className="border rounded-lg p-4 bg-muted/30">
                                        <div className="font-medium mb-3">Member {index + 1}</div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium text-muted-foreground">Name:</span>
                                                <div className="mt-1">{member.name || "-"}</div>
                                            </div>
                                            <div>
                                                <span className="font-medium text-muted-foreground">Email:</span>
                                                <div className="mt-1">{member.email || "-"}</div>
                                            </div>
                                            <div>
                                                <span className="font-medium text-muted-foreground">Business Name:</span>
                                                <div className="mt-1">{member.businessName || "-"}</div>
                                            </div>
                                            <div>
                                                <span className="font-medium text-muted-foreground">Business Category:</span>
                                                <div className="mt-1">{member.businessCategory || "-"}</div>
                                            </div>
                                            <div>
                                                <span className="font-medium text-muted-foreground">Location:</span>
                                                <div className="mt-1">{member.location || "-"}</div>
                                            </div>
                                            <div>
                                                <span className="font-medium text-muted-foreground">Gender:</span>
                                                <div className="mt-1 capitalize">{member.gender || "-"}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
