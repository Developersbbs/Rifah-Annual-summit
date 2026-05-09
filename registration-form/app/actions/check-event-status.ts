import dbConnect from "@/lib/db"
import Event from "@/models/Event"

export interface EventStatus {
  isActive: boolean
  isUpcoming: boolean
  isPast: boolean
  event?: {
    _id: string
    eventName: string
    registrationStart: Date
    registrationEnd: Date
    eventDate: Date
    startTime: Date
    endTime: Date
    venue: {
      name: string
      address: string
      city: string
    }
    maxCapacity: number
    registeredCount: number
  }
  message?: string
}

export async function getEventStatus(): Promise<EventStatus> {
  try {
    await dbConnect()
    
    const now = new Date()
    const activeEvent = await Event.findOne({
      isActive: true,
      registrationStart: { $lte: now },
      registrationEnd: { $gte: now }
    }).sort({ createdAt: -1 })
    
    if (!activeEvent) {
      // Check if there's any upcoming event
      const upcomingEvent = await Event.findOne({
        isActive: true,
        registrationStart: { $gt: now }
      }).sort({ registrationStart: 1 })
      
      if (upcomingEvent) {
        return {
          isActive: false,
          isUpcoming: true,
          isPast: false,
          event: {
            _id: upcomingEvent._id.toString(),
            eventName: upcomingEvent.eventName,
            registrationStart: upcomingEvent.registrationStart,
            registrationEnd: upcomingEvent.registrationEnd,
            eventDate: upcomingEvent.eventDate,
            startTime: upcomingEvent.startTime,
            endTime: upcomingEvent.endTime,
            venue: upcomingEvent.venue || { name: "", address: "", city: "" },
            maxCapacity: upcomingEvent.maxCapacity,
            registeredCount: upcomingEvent.registeredCount
          },
          message: `Registration will open on ${upcomingEvent.registrationStart.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}`
        }
      }
      
      return {
        isActive: false,
        isUpcoming: false,
        isPast: false,
        message: "No events scheduled at the moment"
      }
    }
    
    // Check if event is at full capacity
    if (activeEvent.registeredCount >= activeEvent.maxCapacity) {
      return {
        isActive: false,
        isUpcoming: false,
        isPast: false,
        event: {
          _id: activeEvent._id.toString(),
          eventName: activeEvent.eventName,
          registrationStart: activeEvent.registrationStart,
          registrationEnd: activeEvent.registrationEnd,
          eventDate: activeEvent.eventDate,
          startTime: activeEvent.startTime,
          endTime: activeEvent.endTime,
          venue: activeEvent.venue || { name: "", address: "", city: "" },
          maxCapacity: activeEvent.maxCapacity,
          registeredCount: activeEvent.registeredCount
        },
        message: "Registration is closed due to maximum capacity"
      }
    }
    
    return {
      isActive: true,
      isUpcoming: false,
      isPast: false,
      event: {
        _id: activeEvent._id.toString(),
        eventName: activeEvent.eventName,
        registrationStart: activeEvent.registrationStart,
        registrationEnd: activeEvent.registrationEnd,
        eventDate: activeEvent.eventDate,
        startTime: activeEvent.startTime,
        endTime: activeEvent.endTime,
        venue: activeEvent.venue || { name: "", address: "", city: "" },
        maxCapacity: activeEvent.maxCapacity,
        registeredCount: activeEvent.registeredCount
      }
    }
  } catch (error) {
    console.error("Error checking event status:", error)
    return {
      isActive: false,
      isUpcoming: false,
      isPast: false,
      message: "Unable to check registration status"
    }
  }
}
