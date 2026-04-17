"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Users, Edit, Trash2, Plus } from "lucide-react"
import { EventScheduleDialog } from "./event-schedule-dialog"
import { toast } from "sonner"

interface Event {
  _id: string
  eventName: string
  registrationStart?: string
  registrationEnd?: string
  eventDate?: string
  startTime?: string
  endTime?: string
  venue?: {
    name: string
    address: string
    city: string
  }
  // Backward compatibility
  startDate?: string
  endDate?: string
  location?: string
  maxCapacity: number
  registeredCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface EventsTableProps {
  userRole: string
}

export function EventsTable({ userRole }: EventsTableProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events")
      if (!response.ok) throw new Error("Failed to fetch events")
      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error("Error fetching events:", error)
      toast.error("Failed to load events")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return

    setDeleteLoading(eventId)
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete event")
      }

      toast.success("Event deleted successfully!")
      fetchEvents()
    } catch (error) {
      console.error("Error deleting event:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete event")
    } finally {
      setDeleteLoading(null)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isEventActive = (event: Event) => {
    const now = new Date()
    const start = new Date(event.registrationStart || event.startDate || '')
    const end = new Date(event.registrationEnd || event.endDate || '')
    return event.isActive && now >= start && now <= end
  }

  const isEventUpcoming = (event: Event) => {
    const now = new Date()
    const start = new Date(event.registrationStart || event.startDate || '')
    return now < start
  }

  const isEventPast = (event: Event) => {
    const now = new Date()
    const end = new Date(event.registrationEnd || event.endDate || '')
    return now > end
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-muted-foreground">Loading events...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {userRole === "super-admin" && (
        <div className="flex justify-end">
          <EventScheduleDialog onSuccess={fetchEvents}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Event
            </Button>
          </EventScheduleDialog>
        </div>
      )}

      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No events scheduled yet</p>
            {userRole === "super-admin" && (
              <p className="text-sm text-muted-foreground mt-1">
                Create your first event to start managing registrations
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event._id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{event.eventName}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {event.venue?.city || event.venue?.name || event.location || 'TBD'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {event.registeredCount}/{event.maxCapacity}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEventActive(event) && (
                      <Badge variant="default" className="bg-green-500">
                        Active
                      </Badge>
                    )}
                    {isEventUpcoming(event) && (
                      <Badge variant="secondary">
                        Upcoming
                      </Badge>
                    )}
                    {isEventPast(event) && (
                      <Badge variant="outline">
                        Ended
                      </Badge>
                    )}
                    {userRole === "super-admin" && (
                      <div className="flex gap-1">
                        <EventScheduleDialog 
                          event={event} 
                          onSuccess={fetchEvents}
                        >
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </EventScheduleDialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(event._id)}
                          disabled={deleteLoading === event._id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Event Date</p>
                    <p>{event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Event Time</p>
                    <p>{event.startTime && event.endTime ? `${new Date(event.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${new Date(event.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Registration Window</p>
                    <p>{formatDate(event.registrationStart || event.startDate || '')} - {formatDate(event.registrationEnd || event.endDate || '')}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Venue</p>
                    <p>{event.venue?.name || event.location || 'TBD'}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Registration Progress</span>
                    <span>{event.registeredCount}/{event.maxCapacity}</span>
                  </div>
                  <div className="mt-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ 
                        width: `${Math.min((event.registeredCount / event.maxCapacity) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
