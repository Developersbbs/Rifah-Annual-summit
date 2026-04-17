"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Calendar, MapPin, Menu, ArrowRight, Instagram, Facebook, Twitter, Mail, Clock, AlertCircle, Earth } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"

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
          const registrationStart = new Date(data.registrationStart || data.startDate)
          const registrationEnd = new Date(data.registrationEnd || data.endDate)

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

  const handleRegistrationClick = () => {
    if (eventStatus?.isActive) {
      router.push('/register')
    }
  }
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Earth className="h-6 w-6 text-primary animate-spin-slow" />
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
              className="rounded-full px-6"
              disabled={loading || !eventStatus?.isActive}
            >
              {loading ? "Loading..." : eventStatus?.isActive ? "Open Registration" : "Registration Closed"}
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
            <SheetContent side="right">
              <div className="flex flex-col gap-6 mt-10">
                <Link href="#about" className="text-lg font-medium hover:text-primary">About</Link>
                <Link href="#events" className="text-lg font-medium hover:text-primary">Events</Link>
                <Link href="#schedule" className="text-lg font-medium hover:text-primary">Schedule</Link>
                <Link href="#gallery" className="text-lg font-medium hover:text-primary">Gallery</Link>
                <Link href="#contact" className="text-lg font-medium hover:text-primary">Contact</Link>
                <div className="w-full">
                  <Button
                    onClick={handleRegistrationClick}
                    className="w-full"
                    disabled={loading || !eventStatus?.isActive}
                  >
                    {loading ? "Loading..." : eventStatus?.isActive ? "Open Registration" : "Registration Closed"}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 md:pt-32 md:pb-48 overflow-hidden">
          {/* Ornamental Background Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-10 pointer-events-none">
            <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-primary blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-secondary blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 flex flex-col items-center text-center relative z-10">
            {/* <Badge variant="outline" className="mb-6 px-4 py-1 border-primary/20 text-primary bg-primary/5 uppercase tracking-widest text-xs">
              தமிழ் பாரம்பரியத்தைப் போற்றும்
            </Badge> */}
            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-7xl font-black tracking-tighter mb-4 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent h-auto py-2">
              Building Connections Creating Opportunities Driving Business Growth 
              {/* <span className="text-primary block md:inline">2026</span> */}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed px-4">
              Join 400+ entrepreneurs, professionals, and business leaders for a day of 
              networking, collaboration, and growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button
                onClick={handleRegistrationClick}
                size="lg"
                className="rounded-full text-base h-12 sm:px-8 shadow-lg shadow-primary/20"
                disabled={loading || !eventStatus?.isActive}
              >
                {loading ? "Loading..." : eventStatus?.isActive ? "Open Registration" : "Registration Closed"}
              </Button>
              {/* <Button disabled size="lg" variant="outline" className="rounded-full text-base h-12 px-8 opacity-50 cursor-not-allowed">
                Schedule (Coming Soon)
              </Button> */}
            </div>

            {!loading && eventStatus?.event && (
              <div className="flex flex-col md:flex-row flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 mt-12 md:mt-16 text-sm text-muted-foreground w-full px-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-center md:text-left">
                    {new Date(eventStatus.event.eventDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="hidden md:block h-4 w-px bg-border"></div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-center md:text-left">
                    {new Date(eventStatus.event.startTime).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })} - {new Date(eventStatus.event.endTime).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
                <div className="hidden md:block h-4 w-px bg-border"></div>
                <div className="flex items-center gap-2 text-center md:text-left">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="break-words max-w-[250px] md:max-w-none">{eventStatus.event.venue?.city || eventStatus.event.venue?.name || 'TBD'}</span>
                </div>
              </div>
            )}

            {/* Event Status Message */}
            {!loading && eventStatus && !eventStatus.isActive && (
              <div className="mt-6 max-w-md mx-auto">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {eventStatus.message}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Introduction / About */}
        {/* <section id="about" className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Harvesting Gratitude, <br />
                  <span className="text-primary">Celebrating Heritage.</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Pongal is not just a harvest festival; it is an emotion that connects us to our roots, our land, and our farmers.
                  Tha.Pa.Va is proud to bring you "Pongal Vizha 2026", a grand celebration of Tamil culture using modern aesthetics while preserving traditional values.
                </p>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Wheat className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Traditional Pongal</h3>
                      <p className="text-sm text-muted-foreground">Witness the majestic Pongal cooking ceremony in earthenware pots.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Utensils className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Grand Feast</h3>
                      <p className="text-sm text-muted-foreground">Enjoy a traditional banana leaf feast with 21 varieties of dishes.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden border border-border bg-card p-2 shadow-2xl rotate-3 transition-transform hover:rotate-0 duration-500">
                <div className="w-full h-full bg-muted/50 rounded-xl flex items-center justify-center text-muted-foreground flex-col gap-4">

                  <div className="grid grid-cols-2 gap-2 p-4 w-full h-full">
                    <div className="bg-primary/20 rounded-lg w-full h-full"></div>
                    <div className="bg-primary/10 rounded-lg w-full h-full"></div>
                    <div className="bg-primary/5 rounded-lg w-full h-full"></div>
                    <div className="bg-primary/15 rounded-lg w-full h-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section> */}

        {/* Events Grid */}
        {/* <section id="events" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Festival Highlights</h2>
              <p className="text-muted-foreground">
                Experience the vibrancy of Tamil culture through our carefully curated events tailored for all age groups.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              Event Card 1
              <Card className="group overflow-hidden border-border/50 hover:border-primary/50 transition-colors">
                <div className="aspect-video bg-muted relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <Badge className="bg-primary text-primary-foreground border-none">Cultural</Badge>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="group-hover:text-primary transition-colors">Uri Adithal</CardTitle>
                  <CardDescription>The traditional pot breaking ceremony.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Test your strength and focus in this classic rural game that brings laughter and cheer.
                  </p>
                  <Link href="#" className="text-sm font-medium hover:underline flex items-center gap-1">
                    Register to Participate <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>

              Event Card 2
              <Card className="group overflow-hidden border-border/50 hover:border-primary/50 transition-colors">
                <div className="aspect-video bg-muted relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <Badge className="bg-primary text-primary-foreground border-none">Art</Badge>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="group-hover:text-primary transition-colors">Kolam Contest</CardTitle>
                  <CardDescription>Decorate the earth with colors.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Showcase your artistic skills in our grand Rangoli competition. Theme: "Harvest".
                  </p>
                  <Link href="#" className="text-sm font-medium hover:underline flex items-center gap-1">
                    Register to Participate <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>

              Event Card 3
              <Card className="group overflow-hidden border-border/50 hover:border-primary/50 transition-colors">
                <div className="aspect-video bg-muted relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <Badge className="bg-primary text-primary-foreground border-none">Music</Badge>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="group-hover:text-primary transition-colors">Parai Isai</CardTitle>
                  <CardDescription>Rhythm of the Tamils.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    An electrifying performance by renowned Parai artists that will make your heart beat in sync.
                  </p>
                  <Link href="#" className="text-sm font-medium hover:underline flex items-center gap-1">
                    View Performers <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section> */}
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-16 border-t border-primary-foreground/10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-16">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary-foreground">
                <Earth className="h-6 w-6 text-primary-foreground animate-spin-slow" />
                <span className="text-xl font-bold tracking-tight">RIFAH ANNUAL SUMMIT</span>
              </div>
              <p className="text-sm leading-relaxed text-primary-foreground/80">
                Rifah Annual Summit 2026 Together For Sustainable Future             
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-primary-foreground font-semibold tracking-tight">Quick Links</h3>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li><Link href="#" className="hover:text-primary-foreground transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-primary-foreground transition-colors">Events Schedule</Link></li>
                <li><Link href="#" className="hover:text-primary-foreground transition-colors">Gallery</Link></li>
                <li>
                  <button
                    onClick={handleRegistrationClick}
                    className="hover:text-primary-foreground transition-colors text-left"
                    disabled={loading || !eventStatus?.isActive}
                  >
                    {loading ? "Loading..." : eventStatus?.isActive ? "Register" : "Register (Closed)"}
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h3 className="text-primary-foreground font-semibold tracking-tight">Legal</h3>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li><Link href="#" className="hover:text-primary-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-primary-foreground transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-primary-foreground transition-colors">Cookie Policy</Link></li>
                <li><Link href="#" className="hover:text-primary-foreground transition-colors">Contact Support</Link></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="space-y-4">
              <h3 className="text-primary-foreground font-semibold tracking-tight">Stay Updated</h3>
              <p className="text-sm text-primary-foreground/80">Subscribe to our newsletter for the latest updates and announcements.</p>
              <div className="flex gap-2">
                <Input placeholder="Enter your email" className="bg-primary-foreground/10 border-primary-foreground/20 focus-visible:ring-primary-foreground placeholder:text-primary-foreground/50 text-primary-foreground" />
                <Button disabled size="icon" variant="secondary" className="shrink-0 text-primary hover:text-primary opacity-50 cursor-not-allowed">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Separator className="bg-primary-foreground/10 mb-8" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span>&copy; 2026 | SBBS. All rights reserved.</span>
            </div>

            <div className="flex items-center gap-4">
              <Link href="#" className="h-10 w-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground hover:text-primary transition-all duration-300">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="h-10 w-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground hover:text-primary transition-all duration-300">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="h-10 w-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground hover:text-primary transition-all duration-300">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="h-10 w-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground hover:text-primary transition-all duration-300">
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div >
  )
}
