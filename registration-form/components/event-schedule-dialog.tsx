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

interface Venue {
  name: string
  address: string
  city: string
}

interface Event {
  _id?: string
  eventName: string
  registrationStart?: string
  registrationEnd?: string
  eventDate?: string
  startTime?: string
  endTime?: string
  venue?: Venue
  // Backward compatibility
  startDate?: string
  endDate?: string
  location?: string
  maxCapacity: number
  isActive: boolean
  ticketsPrice?: TicketPrice[]
  taxRate?: number
}

interface EventScheduleDialogProps {
  event?: Event
  onSuccess?: () => void
  children?: React.ReactNode
}

export function EventScheduleDialog({ event, onSuccess, children }: EventScheduleDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<Event>({
    eventName: event?.eventName || "",
    registrationStart: event?.registrationStart ? new Date(event.registrationStart).toISOString().slice(0, 16) : 
                       (event?.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : ""),
    registrationEnd: event?.registrationEnd ? new Date(event.registrationEnd).toISOString().slice(0, 16) : 
                     (event?.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : ""),
    eventDate: event?.eventDate ? new Date(event.eventDate).toISOString().slice(0, 10) : "",
    startTime: event?.startTime ? new Date(event.startTime).toISOString().slice(0, 16) : "",
    endTime: event?.endTime ? new Date(event.endTime).toISOString().slice(0, 16) : "",
    venue: event?.venue || { 
      name: "", 
      address: event?.location || "", 
      city: "" 
    },
    maxCapacity: event?.maxCapacity || 100,
    isActive: event?.isActive ?? true,
    ticketsPrice: event?.ticketsPrice || [
      { name: "General", price: 0, soldCount: 0 }
    ],
    taxRate: event?.taxRate || 0,
    // Backward compatibility fields
    startDate: event?.startDate,
    endDate: event?.endDate,
    location: event?.location,
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
          registrationStart: new Date(formData.registrationStart || ""),
          registrationEnd: new Date(formData.registrationEnd || ""),
          eventDate: new Date(formData.eventDate || ""),
          startTime: new Date(formData.startTime || ""),
          endTime: new Date(formData.endTime || ""),
          ticketsPrice: cleanedTickets,
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
          registrationStart: "",
          registrationEnd: "",
          eventDate: "",
          startTime: "",
          endTime: "",
          venue: { name: "", address: "", city: "" },
          maxCapacity: 100,
          isActive: true,
          ticketsPrice: [{ name: "General", price: 0, soldCount: 0 }],
          startDate: "",
          endDate: "",
          location: "",
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
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
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
          <div className="flex items-center gap-2 mt-2">
            <div className={`flex-1 h-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
            <div className={`flex-1 h-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Event Details</span>
            <span>Registration & Tickets</span>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {step === 1 && (
              <>
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
                  <Label htmlFor="venueName">Venue Name</Label>
                  <Input
                    id="venueName"
                    value={formData.venue?.name || ""}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      venue: { ...prev.venue, name: e.target.value, address: prev.venue?.address || "", city: prev.venue?.city || "" }
                    }))}
                    placeholder="e.g., Convention Center"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="venueAddress">Venue Address</Label>
                  <Input
                    id="venueAddress"
                    value={formData.venue?.address || ""}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      venue: { ...prev.venue, address: e.target.value, name: prev.venue?.name || "", city: prev.venue?.city || "" }
                    }))}
                    placeholder="Enter full address"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="venueCity">City</Label>
                  <Input
                    id="venueCity"
                    value={formData.venue?.city || ""}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      venue: { ...prev.venue, city: e.target.value, name: prev.venue?.name || "", address: prev.venue?.address || "" }
                    }))}
                    placeholder="e.g., Chennai"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => handleInputChange("eventDate", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange("startTime", e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange("endTime", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="registrationStart">Registration Start</Label>
                    <Input
                      id="registrationStart"
                      type="datetime-local"
                      value={formData.registrationStart}
                      onChange={(e) => handleInputChange("registrationStart", e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="registrationEnd">Registration End</Label>
                    <Input
                      id="registrationEnd"
                      type="datetime-local"
                      value={formData.registrationEnd}
                      onChange={(e) => handleInputChange("registrationEnd", e.target.value)}
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

                <div className="grid gap-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={formData.taxRate || 0}
                    onChange={(e) => handleInputChange("taxRate", parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="e.g., 18"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter tax percentage (0-100%). This will be applied to all ticket sales.
                  </p>
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
              </>
            )}
          </div>
          
          <DialogFooter>
            {step === 1 ? (
              <>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={(e) => { e.preventDefault(); setStep(2); }}>
                  Next
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : event?._id ? "Update Event" : "Create Event"}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
