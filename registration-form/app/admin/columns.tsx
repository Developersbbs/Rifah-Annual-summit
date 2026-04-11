"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Soup, Salad, Coffee, CheckCircle, XCircle } from "lucide-react"
import { IParticipant } from "@/lib/types"

// Types matching what getAdminData returns
export type Participant = IParticipant

export const columns: ColumnDef<Participant>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <div className="font-medium ml-4">{row.getValue("name") || "N/A"}</div>,
    },
    {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => <div className="text-sm">{row.getValue("email") || "-"}</div>,
    },
    {
        accessorKey: "businessName",
        header: "Business",
        cell: ({ row }) => <div className="text-sm">{row.getValue("businessName")}</div>,
    },
    {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => <div className="text-sm">{row.getValue("location")}</div>,
    },
    {
        accessorKey: "ticketType",
        header: "Ticket",
        cell: ({ row }) => {
            const ticketType = row.getValue("ticketType") as string
            return <Badge variant="outline">{ticketType}</Badge>
        },
    },
    {
        accessorKey: "guestCount",
        header: "Guests",
        cell: ({ row }) => {
            const guestCount = row.getValue("guestCount") as number
            return <div className="text-center">{guestCount}</div>
        },
    },
    {
        accessorKey: "totalAmount",
        header: "Amount",
        cell: ({ row }) => {
            const amount = row.getValue("totalAmount") as number
            return <div className="font-medium">₹{amount}</div>
        },
    },
    {
        accessorKey: "paymentMethod",
        header: "Payment",
        cell: ({ row }) => {
            const method = row.getValue("paymentMethod") as string
            return (
                <Badge variant={method === "online" ? "default" : "secondary"}>
                    {method === "online" ? "Online" : "Cash"}
                </Badge>
            )
        },
    },
    {
        accessorKey: "paymentStatus",
        header: "Payment Status",
        cell: ({ row }) => {
            const status = row.getValue("paymentStatus") as string
            return (
                <Badge 
                    variant={status === "completed" ? "default" : status === "failed" ? "destructive" : "secondary"}
                >
                    {status}
                </Badge>
            )
        },
    },
    {
        accessorKey: "approvalStatus",
        header: "Approval Status",
        cell: ({ row }) => {
            const status = row.getValue("approvalStatus") as string
            return (
                <Badge 
                    variant={status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary"}
                >
                    {status}
                </Badge>
            )
        },
    },
    {
        id: "checkInStatus",
        accessorFn: (row) => row.checkIn?.isCheckedIn,
        header: "Status",
        cell: ({ row }) => {
            const isCheckedIn = row.original.checkIn?.isCheckedIn
            return isCheckedIn ?
                <Badge className="bg-green-600 hover:bg-green-700">In</Badge> :
                <Badge variant="outline" className="text-muted-foreground">Pending</Badge>
        }
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const approvalStatus = row.getValue("approvalStatus") as string
            const paymentMethod = row.getValue("paymentMethod") as string
            
            const handleApprove = async () => {
                try {
                    const response = await fetch("/api/approve-registration", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ participantId: row.original._id })
                    })
                    
                    if (response.ok) {
                        window.location.reload()
                    } else {
                        const { error } = await response.json()
                        alert(error || "Failed to approve")
                    }
                } catch {
                    alert("Error approving registration")
                }
            }

            const handleReject = async () => {
                const reason = prompt("Please enter rejection reason (optional):")
                
                try {
                    const response = await fetch("/api/reject-registration", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ participantId: row.original._id, reason })
                    })
                    
                    if (response.ok) {
                        window.location.reload()
                    } else {
                        const { error } = await response.json()
                        alert(error || "Failed to reject")
                    }
                } catch {
                    alert("Error rejecting registration")
                }
            }
            
            return (
                <div className="flex gap-2">
                    {approvalStatus === "pending" && paymentMethod === "cash" && (
                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                onClick={handleApprove}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approve
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleReject}
                            >
                                <XCircle className="w-3 h-3 mr-1" />
                                Reject
                            </Button>
                        </div>
                    )}
                    {approvalStatus === "approved" && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approved
                        </Badge>
                    )}
                    {approvalStatus === "rejected" && (
                        <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            Rejected
                        </Badge>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "foodPreference",
        header: "Food",
        cell: ({ row }) => {
            const { veg, nonVeg } = row.original.foodPreference || { veg: 0, nonVeg: 0 }
            return (
                <div className="flex gap-2">
                    {nonVeg > 0 && <Badge variant="destructive" className="flex gap-1"><Soup className="w-3 h-3" /> {nonVeg}</Badge>}
                    {veg > 0 && <Badge variant="secondary" className="flex gap-1 text-green-700 bg-green-100"><Salad className="w-3 h-3" /> {veg}</Badge>}
                </div>
            )
        },
    },
    {
        accessorKey: "isMorningFood",
        header: "Morning Food",
        cell: ({ row }) => {
            return row.original.isMorningFood ?
                <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50"><Coffee className="w-3 h-3 mr-1" /> Yes</Badge> :
                <span className="text-muted-foreground text-sm">-</span>
        },
    },
    {
        accessorKey: "createdAt",
        header: "Registered At",
        cell: ({ row }) => {
            return new Date(row.getValue("createdAt") as string).toLocaleDateString()
        },
    },
]
