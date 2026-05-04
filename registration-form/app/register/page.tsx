"use client"

import { AlertCircle, ArrowLeft } from "lucide-react"
import { RegisterForm } from "@/components/Register-form"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"

interface EventStatus {
  isActive: boolean
  isUpcoming: boolean
  isPast: boolean
  event?: {
    _id: string
    eventName: string
    registrationStart: string
    registrationEnd: string
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

export default function RegisterPage() {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const [eventStatus, setEventStatus] = useState<EventStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEventStatus = async () => {
      try {
        const response = await fetch("/api/events/active")
        const data = await response.json()
        
        if (data) {
          const now = new Date()
          const start = new Date(data.registrationStart)
          const end = new Date(data.registrationEnd)
          
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
              status.message = t("Registration is closed due to maximum capacity")
            }
          } else if (now < start) {
            status.isUpcoming = true
            status.message = `${t("Registration opens on")} ${start.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}`
          } else {
            status.isPast = true
            status.message = t("Registration has ended")
          }
          
          setEventStatus(status)
        } else {
          setEventStatus({
            isActive: false,
            isUpcoming: false,
            isPast: false,
            message: t("No events scheduled at the moment")
          })
        }
      } catch (error) {
        console.error("Error fetching event status:", error)
        setEventStatus({
          isActive: false,
          isUpcoming: false,
          isPast: false,
          message: t("Unable to check registration status")
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEventStatus()
  }, [t])

  if (loading) {
    return (
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex justify-center gap-2 md:justify-start">
            <Link href="/" className="flex items-center gap-2 font-medium">
              <div className="flex  items-center justify-center rounded-md">
               <Image src="/assets/logo.png" alt="RIFAH" width={40} height={40} className="w-10 h-10" />
              </div>
              RIFAH ANNUAL SUMMIT
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xl text-center">
              <p className="text-muted-foreground">{t("Loading registration status...")}</p>
            </div>
          </div>
        </div>
        <div className="bg-muted relative hidden lg:block">
          <Image
            src={i18n.language === 'ta' ? "/assets/register-bg-1.jpeg" : "/assets/register-bg.jpeg"}
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
              <div className="flex items-center justify-center rounded-md">
               <Image src="/assets/logo.png" alt="RIFAH" width={40} height={40} className="w-10 h-10" />
              </div>
              RIFAH ANNUAL SUMMIT
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xl">
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-2xl">{t("Registration Closed")}</CardTitle>
                  <CardDescription>
                    {eventStatus?.message}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button onClick={() => router.push('/')} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("Back to Home")}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <div className="bg-muted relative hidden lg:block">
          <Image
            src={i18n.language === 'ta' ? "/assets/register-bg-1.jpeg" : "/assets/register-bg.jpeg"}
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
        <div className="flex items-center gap-5 md:justify-start">
          {/* Mobile Back Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="foreground flex items-center justify-center rounded-md">
             <Image src="/assets/logo.png" alt="RIFAH" width={40} height={40} className="w-10 h-10" />
            </div>
            {t("RIFAH ANNUAL SUMMIT")}
          </Link>
          <div className="ml-auto">
            <LanguageSwitcher />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xl">
            <RegisterForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src={i18n.language === 'ta' ? "/assets/register-bd-2.jpeg" : "/assets/register-bg.jpeg"}
          alt="Image"
          fill
          className="object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
