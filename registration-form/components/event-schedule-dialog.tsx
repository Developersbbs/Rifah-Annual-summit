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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Minus } from "lucide-react"
import { toast } from "sonner"

interface TicketPrice {
  name: string
  price: number
  soldCount: number
}

interface Event {
  _id?: string
  eventName: string
  startDate: string
  endDate: string
  location: string
  maxCapacity: number
  isActive: boolean
  ticketsPrice?: TicketPrice[]
}

interface EventScheduleDialogProps {
  event?: Event
  onSuccess?: () => void
  children?: React.ReactNode
}

export function EventScheduleDialog({ event, onSuccess, children }: EventScheduleDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Event>({
    eventName: event?.eventName || "",
    startDate: event?.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : "",
    endDate: event?.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "",
    location: event?.location || "",
    maxCapacity: event?.maxCapacity || 100,
    isActive: event?.isActive ?? true,
    ticketsPrice: event?.ticketsPrice || [
      { name: "General", price: 0, soldCount: 0 }
    ],
  })

  const [tickets, setTickets] = useState<TicketPrice[]>(
    event?.ticketsPrice || [{ name: "General", price: 0, soldCount: 0 }]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // ✅ FRONTEND SAFETY: Validate tickets before sending
      if (!tickets.length) {
        toast.error("Add at least one ticket")
        setLoading(false)
        return
      }

      // ✅ FILTER EMPTY TICKETS: Remove invalid entries
      const cleanedTickets = tickets.filter(
        t => t.name && t.price >= 0
      )

      if (cleanedTickets.length === 0) {
        toast.error("Please fill in all ticket details")
        setLoading(false)
        return
      }

      const url = event?._id 
        ? `/api/events/${event._id}` 
        : "/api/events"
      
      const method = event?._id ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
          ticketsPrice: cleanedTickets, // ✅ Send cleaned tickets
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save event")
      }

      toast.success(event?._id ? "Event updated successfully!" : "Event created successfully!")
      setOpen(false)
      onSuccess?.()
      
      // Reset form if creating new event
      if (!event?._id) {
        setFormData({
          eventName: "",
          startDate: "",
          endDate: "",
          location: "",
          maxCapacity: 100,
          isActive: true,
          ticketsPrice: [{ name: "General", price: 0, soldCount: 0 }],
        })
        setTickets([{ name: "General", price: 0, soldCount: 0 }])
      }
    } catch (error) {
      console.error("Error saving event:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save event")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof Event, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addTicket = () => {
    setTickets([...tickets, { name: "", price: 0, soldCount: 0 }])
  }

  const removeTicket = (index: number) => {
    if (tickets.length > 1) {
      setTickets(tickets.filter((_, i) => i !== index))
    }
  }

  const updateTicket = (index: number, field: keyof TicketPrice, value: string | number) => {
    const newTickets = [...tickets]
    newTickets[index] = { ...newTickets[index], [field]: value }
    setTickets(newTickets)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Event
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {event?._id ? "Edit Event" : "Schedule New Event"}
          </DialogTitle>
          <DialogDescription>
            {event?._id 
              ? "Update the event details below."
              : "Create a new event and set registration dates."
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="eventName">Event Name</Label>
              <Input
                id="eventName"
                value={formData.eventName}
                onChange={(e) => handleInputChange("eventName", e.target.value)}
                placeholder="e.g., Pongal Vizha 2026"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="Enter location"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Registration Start</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="endDate">Registration End</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxCapacity">Maximum Capacity</Label>
              <Input
                id="maxCapacity"
                type="number"
                value={formData.maxCapacity}
                onChange={(e) => handleInputChange("maxCapacity", parseInt(e.target.value))}
                min="1"
                required
              />
            </div>

            {/* 🎫 Ticket Pricing Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Ticket Pricing</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTicket}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Ticket
                </Button>
              </div>
              
              {tickets.map((ticket, index) => (
                <div key={index} className="grid grid-cols-3 gap-2 items-end">
                  <div className="grid gap-1">
                    <Label className="text-xs">Name</Label>
                    <Input
                      placeholder="e.g., General"
                      value={ticket.name}
                      onChange={(e) => updateTicket(index, "name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Price (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={ticket.price}
                      onChange={(e) => updateTicket(index, "price", parseFloat(e.target.value) || 0)}
                      min="0"
                      required
                    />
                  </div>
                  <div className="flex gap-1">
                    <div className="grid gap-1 flex-1">
                      <Label className="text-xs">Sold</Label>
                      <Input
                        type="number"
                        value={ticket.soldCount}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    {tickets.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTicket(index)}
                        className="mt-5"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange("isActive", e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isActive">Event is active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : event?._id ? "Update Event" : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
