"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, CheckCircle2, FileUp, Loader2, Trash2, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import * as XLSX from "xlsx"
import { bulkRegisterParticipants } from "@/app/actions/bulk-register"
import { toast } from "sonner"

interface BulkUploadViewProps {
    onComplete: () => void
}

export function BulkUploadView({ onComplete }: BulkUploadViewProps) {
    const [file, setFile] = useState<File | null>(null)
    const [data, setData] = useState<any[]>([])
    const [isParsing, setIsParsing] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            parseFile(selectedFile)
        }
    }

    const parseFile = async (file: File) => {
        setIsParsing(true)
        setError(null)
        setResult(null)

        try {
            const extension = file.name.split('.').pop()?.toLowerCase()

            if (extension === 'json') {
                const text = await file.text()
                const json = JSON.parse(text)
                if (Array.isArray(json)) {
                    setData(json)
                } else {
                    throw new Error("JSON file must contain an array of participants")
                }
            } else if (['xlsx', 'xls', 'csv'].includes(extension || '')) {
                const reader = new FileReader()
                reader.onload = (e) => {
                    try {
                        const binaryStr = e.target?.result
                        const workbook = XLSX.read(binaryStr, { type: 'binary' })
                        const sheetName = workbook.SheetNames[0]
                        const worksheet = workbook.Sheets[sheetName]
                        const json = XLSX.utils.sheet_to_json(worksheet)
                        setData(json)
                    } catch (err) {
                        setError("Failed to parse Excel file")
                        console.error(err)
                    }
                }
                reader.readAsBinaryString(file)
            } else {
                throw new Error("Unsupported file format. Please upload .xlsx, .xls, .csv, or .json")
            }
        } catch (err: any) {
            setError(err.message || "An error occurred while parsing the file")
            setData([])
        } finally {
            setIsParsing(false)
        }
    }

    const clearFile = () => {
        setFile(null)
        setData([])
        setError(null)
        setResult(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleSubmit = async () => {
        if (data.length === 0) return

        setIsSubmitting(true)
        try {
            // Map the parsed data to the expected format if needed
            const formattedData = data.map(item => ({
                mobileNumber: String(item["Mobile Number"] || item.mobileNumber || "").trim(),
                name: String(item["Name"] || item.name || "").trim(),
                email: String(item["Email"] || item.email || "").trim() || undefined,
                businessName: String(item["Business Name"] || item.businessName || "").trim(),
                businessCategory: String(item["Business Category"] || item.businessCategory || "").trim(),
                location: String(item["Location"] || item.location || "").trim(),
                gender: String(item["Gender"] || item.gender || "").toLowerCase().trim(),
                ticketType: String(item["Ticket Type"] || item.ticketType || "").trim(),
                isSponsor: Boolean(item["Is Sponsor"] || item.isSponsor === "true" || item.isSponsor === true),
                paymentMethod: "cash" // Default for bulk upload
            }))

            const res = await bulkRegisterParticipants(formattedData)
            setResult(res)
            
            if (res.failed === 0) {
                toast.success(`Successfully registered ${res.success} participants`)
                setTimeout(onComplete, 2000)
            } else {
                toast.error(`Registered ${res.success} with ${res.failed} failures`)
            }
        } catch (err) {
            setError("Bulk registration failed")
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 transition-colors hover:border-muted-foreground/50">
                        <FileUp className="h-10 w-10 text-muted-foreground mb-4" />
                        <div className="text-center">
                            <h3 className="text-lg font-semibold">Upload File</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Supports Excel (.xlsx, .xls), CSV, or JSON
                            </p>
                            <Input
                                type="file"
                                accept=".xlsx,.xls,.csv,.json"
                                onChange={handleFileChange}
                                className="hidden"
                                ref={fileInputRef}
                                id="bulk-upload-input"
                            />
                            <Label
                                htmlFor="bulk-upload-input"
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 cursor-pointer"
                            >
                                Select File
                            </Label>
                        </div>
                    </div>

                    {file && (
                        <div className="mt-4 flex items-center justify-between p-3 bg-muted rounded-md">
                            <div className="flex items-center gap-2">
                                <FileUp className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">{file.name}</span>
                                <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={clearFile} className="h-8 w-8">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {result && (
                <Alert variant={result.failed === 0 ? "default" : "destructive"}>
                    {result.failed === 0 ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <AlertTitle>{result.failed === 0 ? "Success" : "Upload Summary"}</AlertTitle>
                    <AlertDescription>
                        Successfully registered: {result.success} <br />
                        Failed registrations: {result.failed}
                        {result.errors.length > 0 && (
                            <ul className="mt-2 text-xs list-disc pl-4 max-h-32 overflow-y-auto">
                                {result.errors.map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                            </ul>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            {data.length > 0 && !result && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Preview Data ({data.length} records)</h3>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={clearFile}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Clear
                            </Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Registering...
                                    </>
                                ) : (
                                    "Register All Participants"
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-md border max-h-[400px] overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Mobile</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Ticket</TableHead>
                                    <TableHead>Sponsor</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.slice(0, 10).map((item, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{item["Name"] || item.name || "-"}</TableCell>
                                        <TableCell>{item["Mobile Number"] || item.mobileNumber || "-"}</TableCell>
                                        <TableCell>{item["Email"] || item.email || "-"}</TableCell>
                                        <TableCell>{item["Location"] || item.location || "-"}</TableCell>
                                        <TableCell>{item["Ticket Type"] || item.ticketType || "-"}</TableCell>
                                        <TableCell>{String(item["Is Sponsor"] || item.isSponsor || "false")}</TableCell>
                                    </TableRow>
                                ))}
                                {data.length > 10 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                            And {data.length - 10} more records...
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {isParsing && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3 text-lg">Parsing file...</span>
                </div>
            )}
        </div>
    )
}
