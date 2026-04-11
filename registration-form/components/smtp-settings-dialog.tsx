"use client"

import { useState, useEffect } from "react"
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
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { saveSmtpConfig, getSmtpConfig } from "@/app/actions/user-actions"
import { toast } from "sonner"
import { Settings } from "lucide-react"

interface ISmtpConfig {
    host: string
    port: number
    user: string
    pass: string
    fromEmail: string
}

export function SmtpSettingsDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [config, setConfig] = useState<ISmtpConfig>({
        host: "",
        port: 587,
        user: "",
        pass: "",
        fromEmail: "",
    })

    useEffect(() => {
        if (open) {
            loadConfig()
        }
    }, [open])

    const loadConfig = async () => {
        const data = await getSmtpConfig()
        if (data) {
            setConfig(data)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const formData = new FormData()
            Object.entries(config).forEach(([key, value]) => {
                formData.append(key, String(value))
            })

            const result = await saveSmtpConfig(null, formData)
            if (result.success) {
                toast.success("SMTP settings saved successfully")
                setOpen(false)
            } else {
                toast.error(result.error || "Failed to save settings")
            }
        } catch {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    SMTP Settings
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>SMTP Configuration</DialogTitle>
                    <DialogDescription>
                        Configure email settings for sending invites.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="host" className="text-right">
                                Host
                            </Label>
                            <Input
                                id="host"
                                value={config.host}
                                onChange={(e) => setConfig({ ...config, host: e.target.value })}
                                className="col-span-3"
                                placeholder="smtp.gmail.com"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="port" className="text-right">
                                Port
                            </Label>
                            <Input
                                id="port"
                                type="number"
                                value={config.port}
                                onChange={(e) => setConfig({ ...config, port: Number(e.target.value) })}
                                className="col-span-3"
                                placeholder="587"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="user" className="text-right">
                                User
                            </Label>
                            <Input
                                id="user"
                                value={config.user}
                                onChange={(e) => setConfig({ ...config, user: e.target.value })}
                                className="col-span-3"
                                placeholder="email@example.com"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="pass" className="text-right">
                                Password
                            </Label>
                            <PasswordInput
                                id="pass"
                                value={config.pass}
                                onChange={(e) => setConfig({ ...config, pass: e.target.value })}
                                className="col-span-3"
                                placeholder="App Password"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="fromEmail" className="text-right">
                                From Email
                            </Label>
                            <Input
                                id="fromEmail"
                                value={config.fromEmail}
                                onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                                className="col-span-3"
                                placeholder="noreply@example.com"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
