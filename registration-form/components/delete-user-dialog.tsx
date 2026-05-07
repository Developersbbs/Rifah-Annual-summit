"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, AlertTriangle } from "lucide-react"
import { IParticipant } from "@/lib/types"

interface DeleteUserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    participant: IParticipant | null
    onSuccess: () => void
}

export function DeleteUserDialog({ open, onOpenChange, participant, onSuccess }: DeleteUserDialogProps) {
    const [confirmName, setConfirmName] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleDelete = async () => {
        if (!participant) return

        setIsDeleting(true)
        setError(null)

        try {
            const response = await fetch("/api/admin/delete-user", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    participantId: participant._id,
                    confirmName: confirmName.trim()
                })
            })

            const data = await response.json()

            if (response.ok) {
                onSuccess()
                onOpenChange(false)
                setConfirmName("")
            } else {
                setError(data.error || "Failed to delete user")
            }
        } catch (err) {
            setError("Network error. Please try again.")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleClose = () => {
        if (!isDeleting) {
            onOpenChange(false)
            setConfirmName("")
            setError(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <Trash2 className="h-5 w-5" />
                        Delete User
                    </DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete the user
                        and all their associated data.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            You are about to delete <strong>{participant?.name}</strong>.
                            This action is irreversible.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                        <label htmlFor="confirm-name" className="text-sm font-medium">
                            Type the user's name to confirm deletion:
                        </label>
                        <Input
                            id="confirm-name"
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            placeholder={participant?.name || "Enter user name"}
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter exactly: <strong>{participant?.name}</strong>
                        </p>
                    </div>

                    {error && (
                        <Alert className="border-red-200 bg-red-50">
                            <AlertDescription className="text-red-800">
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting || confirmName.trim() !== participant?.name}
                    >
                        {isDeleting ? "Deleting..." : "Delete User"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
