"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, CheckCircle, XCircle, Trash2 } from "lucide-react"
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
        accessorKey: "gender",
        header: "Gender",
        cell: ({ row }) => <div className="text-sm capitalize">{row.getValue("gender") || "-"}</div>,
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
        accessorKey: "totalAmount",
        header: "Amount",
        cell: ({ row }) => {
            const amount = row.getValue("totalAmount") as number
            return <div className="font-medium">₹{amount}</div>
        },
    },
    {
        id: "secondaryMembers",
        accessorFn: (row) => row.secondaryMembers?.length || 0,
        header: "Secondary Members",
        cell: ({ row }) => {
            const count = row.original.secondaryMembers?.length || 0
            return <div className="text-center">{count}</div>
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
                    className={
                        status === "completed" ? "bg-green-600 hover:bg-green-700" :
                        status === "failed" ? "bg-red-600 hover:bg-red-700" :
                        "bg-orange-500 hover:bg-orange-600 text-white"
                    }
                >
                    {status === "completed" ? "Paid" : status === "failed" ? "Failed" : "Pending"}
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
                    variant={status === "approved" ? "default" : "secondary"}
                >
                    {status}
                </Badge>
            )
        },
    },
    {
        id: "checkInStatus",
        accessorFn: (row) => row.checkIn?.isCheckedIn,
        header: "Check-in",
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
            const paymentStatus = row.getValue("paymentStatus") as string
            const userRole = (window as any).currentUserRole || "admin" // This will be passed from the table component

            const handleApproveEntry = async () => {
                try {
                    const response = await fetch("/api/approve-registration", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            participantId: row.original._id,
                            markPaid: paymentMethod === "cash" && paymentStatus === "pending"
                        })
                    })

                    if (response.ok) {
                        window.location.reload()
                    } else {
                        const { error } = await response.json()
                        alert(error || "Failed to approve entry")
                    }
                } catch {
                    alert("Error approving entry")
                }
            }

            
            const handleDelete = () => {
                // This will be handled by the parent component
                // We'll trigger a custom event or use a callback
                const deleteEvent = new CustomEvent('openDeleteDialog', { 
                    detail: { participant: row.original } 
                })
                window.dispatchEvent(deleteEvent)
            }

            // Determine button text based on payment method and status
            const getButtonText = () => {
                if (paymentMethod === "cash" && paymentStatus === "pending") {
                    return "Approve & Mark Paid"
                }
                return "Approve Entry"
            }

            return (
                <div className="flex gap-2 flex-wrap">
                    {approvalStatus === "pending" && (
                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                onClick={handleApproveEntry}
                                className="bg-green-600 rounded-full hover:bg-green-700"
                            >
                                <CheckCircle className="w-2 h-2 mr-1" />
                                {getButtonText()}
                            </Button>
                        </div>
                    )}
                    {approvalStatus === "approved" && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approved
                        </Badge>
                    )}
                                        {userRole === 'super-admin' && (
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                        </Button>
                    )}
                </div>
            )
        },
    },
    // FOOD PREFERENCE - Commented out
    // {
    //     accessorKey: "foodPreference",
    //     header: "Food",
    //     cell: ({ row }) => {
    //         const { veg, nonVeg } = row.original.foodPreference || { veg: 0, nonVeg: 0 }
    //         return (
    //             <div className="flex gap-2">
    //                 {nonVeg > 0 && <Badge variant="destructive" className="flex gap-1"><Soup className="w-3 h-3" /> {nonVeg}</Badge>}
    //                 {veg > 0 && <Badge variant="secondary" className="flex gap-1 text-green-700 bg-green-100"><Salad className="w-3 h-3" /> {veg}</Badge>}
    //             </div>
    //         )
    //     },
    // },
    // {
    //     accessorKey: "isMorningFood",
    //     header: "Morning Food",
    //     cell: ({ row }) => {
    //         return row.original.isMorningFood ?
    //             <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50"><Coffee className="w-3 h-3 mr-1" /> Yes</Badge> :
    //             <span className="text-muted-foreground text-sm">-</span>
    //     },
    // },
    {
        accessorKey: "createdAt",
        header: "Registered At",
        cell: ({ row }) => {
            return new Date(row.getValue("createdAt") as string).toLocaleDateString()
        },
    },
]
