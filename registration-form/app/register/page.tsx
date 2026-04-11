"use client"

import { GalleryVerticalEnd, AlertCircle, ArrowLeft } from "lucide-react"
import { RegisterForm } from "@/components/Register-form"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface EventStatus {
  isActive: boolean
  isUpcoming: boolean
  isPast: boolean
  event?: {
    _id: string
    eventName: string
    startDate: string
    endDate: string
    location: string
    maxCapacity: number
    registeredCount: number
  }
  message?: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [eventStatus, setEventStatus] = useState<EventStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEventStatus = async () => {
      try {
        const response = await fetch("/api/events/active")
        const data = await response.json()
        
        if (data) {
          const now = new Date()
          const start = new Date(data.startDate)
          const end = new Date(data.endDate)
          
          const status: EventStatus = {
            isActive: false,
            isUpcoming: false,
            isPast: false,
            event: data
          }
          
          if (data.isActive && now >= start && now <= end) {
            status.isActive = true
            if (data.registeredCount >= data.maxCapacity) {
              status.isActive = false
              status.message = "Registration is closed due to maximum capacity"
            }
          } else if (now < start) {
            status.isUpcoming = true
            status.message = `Registration opens on ${start.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}`
          } else {
            status.isPast = true
            status.message = "Registration has ended"
          }
          
          setEventStatus(status)
        } else {
          setEventStatus({
            isActive: false,
            isUpcoming: false,
            isPast: false,
            message: "No events scheduled at the moment"
          })
        }
      } catch (error) {
        console.error("Error fetching event status:", error)
        setEventStatus({
          isActive: false,
          isUpcoming: false,
          isPast: false,
          message: "Unable to check registration status"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEventStatus()
  }, [])

  if (loading) {
    return (
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex justify-center gap-2 md:justify-start">
            <Link href="/" className="flex items-center gap-2 font-medium">
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-4" />
              </div>
              பொங்கல் விழா
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xl text-center">
              <p className="text-muted-foreground">Loading registration status...</p>
            </div>
          </div>
        </div>
        <div className="bg-muted relative hidden lg:block">
          <Image
            src="/assets/register-banner.jpg"
            alt="Image"
            fill
            className="object-cover dark:brightness-[0.2] dark:grayscale"
          />
        </div>
      </div>
    )
  }

  if (!eventStatus?.isActive) {
    return (
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex justify-center gap-2 md:justify-start">
            <Link href="/" className="flex items-center gap-2 font-medium">
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-4" />
              </div>
              பொங்கல் விழா
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xl">
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-2xl">Registration Closed</CardTitle>
                  <CardDescription>
                    {eventStatus?.message}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button onClick={() => router.push('/')} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <div className="bg-muted relative hidden lg:block">
          <Image
            src="/assets/register-banner.jpg"
            alt="Image"
            fill
            className="object-cover dark:brightness-[0.2] dark:grayscale"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            பொங்கல் விழா
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xl">
            <RegisterForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/assets/register-banner.jpg"
          alt="Image"
          fill
          className="object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
