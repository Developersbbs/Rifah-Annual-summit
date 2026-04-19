"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Menu, ArrowRight, CheckCircle2, Clock, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Users, Search, Globe, BookOpen, Shield, Handshake } from "lucide-react";


interface EventStatus {
  isActive: boolean
  isUpcoming: boolean
  isPast: boolean
  event?: {
    _id: string
    eventName: string
    eventDate: string
    startTime: string
    endTime: string
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

export default function PongalLandingPage() {
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
          const registrationStart = new Date(data.registrationStart)
          const registrationEnd = new Date(data.registrationEnd)

          const status: EventStatus = {
            isActive: false,
            isUpcoming: false,
            isPast: false,
            event: data
          }

          if (data.isActive && now >= registrationStart && now <= registrationEnd) {
            status.isActive = true
            if (data.registeredCount >= data.maxCapacity) {
              status.isActive = false
              status.message = "Registration is closed due to maximum capacity"
            }
          } else if (now < registrationStart) {
            status.isUpcoming = true
            status.message = `Registration opens on ${registrationStart.toLocaleDateString('en-IN', {
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
            message: ""
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

  const handleRegistrationClick = () => {
    if (eventStatus?.isActive) {
      router.push('/register')
    }
  }
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground font-sans">
      {/* Navbar */}
      <header className=" w-full border-b border-white/10 ">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* <Earth className="h-6 w-6 text-primary animate-spin-slow" /> */}
            <Image src="/assets/logo.png" alt="RIFAH" width={48} height={48} className="h-7 sm:h-12 w-auto" />
            <span className="text-xl font-bold tracking-tight">RIFAH ANNUAL SUMMIT</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {/* <Link href="#about" className="hover:text-primary transition-colors">About</Link>
            <Link href="#events" className="hover:text-primary transition-colors">Events</Link>
            <Link href="#contact" className="hover:text-primary transition-colors">Contact</Link> */}
            <Button
              onClick={handleRegistrationClick}
              size="sm"
              className="bg-red-700 hover:bg-red-700 text-white font-semibold rounded-full px-8"
              disabled={loading || !eventStatus?.isActive}
            >
              {loading ? "Loading..." : eventStatus?.isActive ? "Registration Open" : "Registration Closed"}
            </Button>
          </nav>

          {/* Mobile Nav */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
              <div className="flex flex-col h-full">

                {/* Sheet Header */}
                <div className="px-6 py-5 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <Image src="/assets/logo.png" alt="RIFAH" width={28} height={28} className="h-7 w-auto" />
                    <span className="font-semibold text-sm tracking-wide">RIFAH ANNUAL SUMMIT</span>
                  </div>
                </div>

                {/* Nav Links */}
                {/* <nav className="flex flex-col px-4 py-6 gap-1 flex-1">
                  {[
                    { href: "#about", label: "About" },
                    { href: "#events", label: "Events" },
                    { href: "#schedule", label: "Schedule" },
                    { href: "#gallery", label: "Gallery" },
                    { href: "#contact", label: "Contact" },
                  ].map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                </nav> */}

                {/* Bottom CTA */}
                <div className="px-6 py-6 border-t border-border/50">
                  <Button
                    onClick={handleRegistrationClick}
                    className="w-full h-11 text-sm font-semibold bg-red-800 rounded-full hover:bg-red-800"
                    disabled={loading || !eventStatus?.isActive}
                  >
                    {loading
                      ? "Loading..."
                      : eventStatus?.isActive
                        ? "Open Registration"
                        : "Registration Closed"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    RIFAH Annual Summit 2026
                  </p>
                </div>

              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 md:pt-20 md:pb-48 overflow-hidden bg-primary/7 bg-[url('/assets/herobg.png')] bg-cover bg-center bg-no-repeat">

          <div className="container mx-auto px-4 sm:px-6 flex flex-col items-center text-center relative z-10">

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent text-white leading-[1.1] py-2 w-full max-w-5xl">
              Building Connections{" "}
              Creating Opportunities{" "}
              Driving Business Growth
            </h1>

            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white max-w-xl md:max-w-2xl mb-5 leading-relaxed px-2">
              Join 400+ entrepreneurs, professionals, and business leaders for a day of
              networking, collaboration, and growth.
            </p>

            <p className="text-sm sm:text-base text-white max-w-xl md:max-w-2xl mb-8 leading-relaxed px-2 opacity-80">
              A one-day business summit designed to connect ideas, people, and
              opportunities — all under one roof.
            </p>

            {/* Event Meta Info */}
            {!loading && eventStatus?.event && (
              <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-3 sm:gap-5 lg:gap-8 mt-6 md:mt-10 text-xs sm:text-sm text-white w-full px-2 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    {new Date(eventStatus.event.eventDate).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="hidden sm:block h-4 w-px bg-white/30" />

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    {new Date(eventStatus.event.startTime).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}{" "}
                    -{" "}
                    {new Date(eventStatus.event.endTime).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>

                <div className="hidden sm:block h-4 w-px bg-white/30" />

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="max-w-[220px] sm:max-w-none leading-snug">
                    {eventStatus.event.venue?.city ||
                      eventStatus.event.venue?.name ||
                      "TBD"}
                  </span>
                </div>
              </div>
            )}

            {/* Event Status Alert */}
            {/* {!loading && eventStatus && !eventStatus.isActive && (
              <div className="mt-4 mb-6 w-full max-w-sm mx-auto">
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border">
                  <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-muted-foreground text-left">
                    {eventStatus.message}
                  </p>
                </div>
              </div>
            )} */}

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2 sm:mt-4 px-4 sm:px-0">
              <Button
                onClick={handleRegistrationClick}
                size="lg"
                className="w-full sm:w-auto rounded-full text-sm sm:text-base h-12 sm:px-8 bg-red-800 hover:bg-red-800 shadow-lg shadow-red-600/30"
                disabled={loading || !eventStatus?.isActive}
              >
                {loading
                  ? "Loading..."
                  : eventStatus?.isActive
                    ? "Registration Open"
                    : "Registration Closed"}
              </Button>
            </div>

          </div>
        </section>

        {/* Events Grid */}
        <section id="events" className="py-12 sm:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">What is RIFAH Annual Summit 2026</h2>
              <p className="">
                Building Connections Creating Opportunities Driving Business Growth
              </p>
            </div>

            {/* Top row: Text + Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Left: Description */}
              <div className="flex flex-col justify-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-6 leading-snug">
                  RIFAH Annual Summit 2026 is a flagship business event that brings together
                  entrepreneurs, professionals, and industry leaders from across Tamil Nadu and India.
                </h2>
                <h3 className="text-lg md:text-xl font-semibold mb-6">
                  This summit is built around one simple idea —{" "}
                  <span className="text-red-700">
                    grow together through meaningful connections and ethical business practices.
                  </span>
                </h3>
                <p className="text-sm md:text-base">
                  From networking opportunities to collaboration discussions, the event is designed
                  to help individuals and businesses move forward with clarity, purpose, and the
                  right connections.
                </p>
              </div>

              {/* Right: RIFAH Annual Summit Card */}
              <Card className="group overflow-hidden hover:border-primary/50 transition-colors p-0">
                <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] overflow-hidden">
                  <Image
                    src="/assets/register-banner.jpeg"
                    alt="RIFAH Annual Summit"
                    fill
                    className="object-cover object-center"
                  />
                </div>
                <CardHeader className="pt-4">
                  <CardTitle className="group-hover:text-red-700 transition-colors">RIFAH Annual Summit</CardTitle>
                </CardHeader>
                {/* <CardContent>
                  <Link href="/register" className="text-sm font-medium hover:underline flex items-center gap-1">
                    Register Now <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardContent> */}
              </Card>
            </div>
          </div>
        </section>

        {/* Introduction / About */}
        <section id="about" className="py-12 sm:py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">

              {/* Left Content */}
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  RIFAH Presence
                  <span className="text-red-700"> Across India</span>
                </h2>
                <p className="leading-relaxed">
                  RIFAH has established a strong and expanding network across multiple states, connecting businesses nationwide.
                </p>

                {/* States Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <h3 className="font-semibold text-sm uppercase tracking-widest text-red-700">
                      States List
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      "Karnataka", "Maharashtra", "Telangana", "Tamil Nadu",
                      "Gujarat", "Delhi", "West Bengal", "Chhattisgarh",
                      "Andhra Pradesh", "Uttar Pradesh", "Goa", "Rajasthan",
                      "Madhya Pradesh", "Punjab", "Bihar", "Uttarakhand",
                      "Assam", "Kerala"
                    ].map((state) => (
                      <span
                        key={state}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-300/10 text-red-700 border border-red-300/20 hover:bg-primary/20 transition-colors cursor-default"
                      >
                        {state}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Banner Image */}
              <div className="relative sm:h-[550px] h-[300px] rounded-2xl overflow-hidden border border-border bg-card p-2 shadow-2xl transition-transform duration-500">
                <Image
                  src="/assets/banner-2.jpeg"
                  alt="RIFAH Presence Across India"
                  fill
                  className="object-cover object-center rounded-xl"
                />
              </div>

            </div>
          </div>
        </section>

        {/* Why Attend Section */}
        <section id="why-attend" className="py-24 bg-background">
          <div className="container mx-auto px-4">

            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Why You Should Attend This Summit
              </h2>
              <p className="">
                Five powerful reasons that make RIFAH Annual Summit 2026 the event you cannot afford to miss.
              </p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  icon: <Users className="h-5 w-5 text-primary" />,
                  title: "Meet the right people",
                  desc: "Connect directly with entrepreneurs, business owners, and professionals who are actively growing.",
                },
                {
                  icon: <Search className="h-5 w-5 text-primary" />,
                  title: "Find real opportunities",
                  desc: "Discover collaborations, partnerships, and business leads that actually matter.",
                },
                {
                  icon: <Globe className="h-5 w-5 text-primary" />,
                  title: "Broaden your connections nationwide",
                  desc: "Interact with members from multiple chapters across Tamil Nadu and India.",
                },
                {
                  icon: <BookOpen className="h-5 w-5 text-primary" />,
                  title: "Learn from real experiences",
                  desc: "Gain insights from people who are already building and scaling businesses.",
                },
                {
                  icon: <Shield className="h-5 w-5 text-primary" />,
                  title: "Be part of a purpose-driven community",
                  desc: "Engage in a platform that promotes ethical and value-based business growth.",
                },
                {
                  icon: <Handshake className="h-5 w-5 text-primary" />,
                  title: "Build lasting business relationships",
                  desc: "Walk away with meaningful connections that go beyond the event and turn into long-term partnerships.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="group flex flex-col gap-4 p-6 rounded-xl border border-border/50 bg-card hover:border-red-500/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <h3 className="font-bold text-lg text-base leading-snug">{item.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Bottom CTA Banner */}
            <div className="max-w-5xl mx-auto mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-red-200/10 border border-red-400/20 rounded-xl px-6 py-5">
              <div>
                <p className="font-semibold text-red-700">Ready to grow with RIFAH?</p>
                <p className="text-sm  mt-0.5">
                  Join hundreds of business leaders at the Annual Summit 2026.
                </p>
              </div>
              <Link href="/register" className="px-6 py-2 bg-red-800 rounded-full text-white shrink-0">Registration Open</Link>
            </div>

          </div>
        </section>

        {/* Sponsor Section */}
        <section id="sponsors" className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4 max-w-5xl">

            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Sponsor the RIFAH Annual Summit 2026
              </h2>
              <p className="leading-relaxed">
                A unique opportunity for brands to directly connect with a highly relevant audience
                of entrepreneurs and decision-makers.
              </p>
            </div>

            {/* Sponsor Table */}
            <div className="overflow-x-auto rounded-xl border border-border/50 mb-14">
              <table className="w-full text-sm min-w-[540px]">
                <thead>
                  <tr className="bg-[#7a1a1a] text-[#f5d78e]">
                    <th className="text-left px-5 py-4 font-semibold">Category</th>
                    {[
                      { label: "Title", bg: "bg-amber-400 text-amber-900" },
                      { label: "Platinum", bg: "bg-gray-300 text-gray-800" },
                      { label: "Gold", bg: "bg-yellow-300 text-yellow-900" },
                      { label: "Silver", bg: "bg-gray-200 text-gray-700" },
                    ].map(({ label, bg }) => (
                      <th key={label} className="text-center px-4 py-4 font-semibold">
                        <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full mb-1 ${bg}`}>
                          {label}
                        </span>
                        <div>Sponsor</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      label: "Amount per sponsor",
                      values: ["₹50,000", "₹30,000", "₹20,000", "₹10,000"],
                      bold: true,
                    },
                    { label: "No. of sponsors", values: ["1", "4", "6", "6"] },
                    { label: "Delegate passes", values: ["5", "3", "2", "1"] },
                    {
                      label: "Pamphlet distribution",
                      values: ["Yes", "Yes", "Yes", "No"],
                      badge: true,
                    },
                    {
                      label: "Branding at venue & promotions",
                      values: ["Yes", "Yes", "Yes", "Yes"],
                      badge: true,
                    },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 1 ? "bg-muted/40" : ""}>
                      <td className="px-5 py-3.5 font-medium border-r border-border/40">
                        {row.label}
                      </td>
                      {row.values.map((val, j) => (
                        <td key={j} className="text-center px-4 py-3.5 border-r border-border/40 last:border-r-0">
                          {row.badge ? (
                            <span
                              className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${val === "Yes"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-700"
                                }`}
                            >
                              {val}
                            </span>
                          ) : (
                            <span className={row.bold ? "font-semibold text-base" : ""}>{val}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Key Benefits */}
            <div className="mb-14">
              <h3 className="text-2xl font-bold text-center mb-8">Key Benefits for Sponsors</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  "Reach 400–500 active entrepreneurs from across Tamil Nadu",
                  "Get direct visibility among business owners, professionals, and decision-makers",
                  "Access support from RIFAH's national network of experienced consultants",
                  "Expand your business across Tamil Nadu and Pan India through RIFAH chapters",
                  "Strengthen your brand presence through on-ground promotions and engagement",
                  "Be part of an initiative that promotes ethical business practices based on strong values",
                ].map((benefit, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-card"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-red-700 shrink-0" />

                    <p className="text-sm  leading-relaxed">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Banner */}
            <div className="rounded-xl bg-[#7a1a1a] px-6 py-10 text-center">
              <h3 className="text-xl font-bold text-[#f5d78e] mb-2">
                Ready to sponsor RIFAH Annual Summit 2026?
              </h3>
              <p className="text-sm text-[#e8c485] mb-6 opacity-90">
                Secure your sponsorship slot before they fill up.
              </p>
              <Link href="/register" className="rounded-full p-3 bg-[#f5d78e] sm:px-8 shadow-lg shadow-red-700/30">
                Register Now
              </Link>
            </div>

          </div>
        </section>

        {/* About RIFAH */}
        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className=" text-center">

              {/* Tag */}
              {/* <span className="inline-block bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-medium tracking-widest uppercase px-4 py-1.5 rounded-full mb-5">
                About Us
              </span> */}

              {/* Title */}
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground leading-tight mb-4">
                RIFAH Chamber of Commerce
              </h2>

              {/* Description */}
              <p className="text-sm sm:text-base  leading-relaxed max-w-3xl mx-auto mb-8">
                A not-for-profit business network empowering entrepreneurs through collaboration,mentorship, and ethical growth. RIFAH supports businesses with consulting, startup guidance, financial advisory, and international expansion — rooted in responsible entrepreneurship.
              </p>

              {/* Stats Row */}
              {/* <div className="flex flex-wrap justify-center gap-3 mb-8">
                {[
                  { num: "500+", label: "Members" },
                  { num: "12+", label: "Countries" },
                  { num: "10", label: "Years Active" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-muted border border-border/40 rounded-lg px-5 py-3 min-w-[90px] text-center"
                  >
                    <span className="block text-lg font-semibold text-foreground">{stat.num}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{stat.label}</span>
                  </div>
                ))}
              </div> */}

              {/* Divider */}
              <hr className="border-border/40 mb-8" />

              {/* Summit Block */}
              <div className="bg-muted rounded-xl px-6 py-6 max-w-xl mx-auto mb-8">
                <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-1">
                  Annual Summit 2026
                </p>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground leading-snug mb-2">
                  Be part of the RIFAH Annual Summit 2026
                </h3>
                <p className="text-sm  leading-relaxed">
                  Join business leaders, entrepreneurs, and professionals to build a visionary
                  Tamil Nadu and a sustainable India.
                </p>

                <div className="mt-10">
                  {/* CTA Button */}
                  <Link href="/register" className="rounded-full text-sm sm:text-base bg-red-800 p-3 text-white font-medium h-12 px-8 gap-2 shadow-none">
                    Register Now
                    {/* <span aria-hidden="true">→</span> */}
                  </Link>
                </div>
              </div>


            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-primary-foreground py-10 border-t border-primary-foreground/10 bg-[url('/assets/herobg.png')] bg-cover bg-center bg-no-repeat">
        <div className="container mx-auto px-6 text-center">

          {/* Brand */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 text-primary-foreground mb-4">
              <Image src="/assets/logo.png" alt="RIFAH" width={48} height={48} className="h-7 sm:h-12 w-auto" />
              <span className="text-xl font-bold tracking-tight">RIFAH ANNUAL SUMMIT</span>
            </div>
            <p className="text-sm">
              RIFAH Chamber of Commerce and Industry is dedicated to building an ethical business
              ecosystem that empowers entrepreneurs, fosters collaboration, and drives
              sustainable growth across communities and industries in India.
            </p>
          </div>

          {/* Contact Info */}
          <div className="mb-10">
            <h3 className="text-primary-foreground font-semibold text-base mb-3">Contact Us</h3>
            <ul className="space-y-3 text-sm inline-block text-left mx-auto">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 " />
                <span className="leading-relaxed">
                  KAY EM SPECTRA Vanagaram, Near Maduravoyal Bridge,
                  Chennai
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 shrink-0" />
                <span>info@rafah.co.in</span>
              </li>
            </ul>
          </div>

          <Separator className="bg-primary-foreground/10 mb-8" />

          {/* Bottom Bar */}
          <div className="flex flex-col items-center justify-center gap-6 text-sm">
            <Link href={"https://sbbs.co.in/"}>&copy; 2026 | SBBS. All rights reserved.</Link>
          </div>

        </div>
      </footer>
    </div >
  )
}
