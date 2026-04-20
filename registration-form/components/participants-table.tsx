"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, Download, Search, Pencil } from "lucide-react"
import { EditParticipantDialog } from "@/components/edit-participant-dialog"
import { DateRange } from "react-day-picker"
import { isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns"
import { IParticipant } from "@/lib/types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-range-picker"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    userRole?: string
}

export function ParticipantsTable<TData, TValue>({
    columns,
    data,
    userRole,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [globalFilter, setGlobalFilter] = React.useState("")
    const [editingParticipant, setEditingParticipant] = React.useState<IParticipant | null>(null)

    // Custom Filters State
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
    const [locationFilter, setLocationFilter] = React.useState<string>("all")

    // Calculate Location Counts
    const locationOptions = React.useMemo(() => {
        const locations: Record<string, number> = {};
        (data as unknown as IParticipant[]).forEach((item: IParticipant) => {
            const loc = item.location || "Unassigned"
            locations[loc] = (locations[loc] || 0) + 1
        })
        return Object.entries(locations).sort((a, b) => a[0].localeCompare(b[0]))
    }, [data])

    // Filter Logic
    const filteredData = React.useMemo(() => {
        let processedData = data;

        // Location Filter
        if (locationFilter !== "all") {
            processedData = processedData.filter((item) =>
                ((item as unknown as IParticipant).location || "Unassigned").toString() === locationFilter
            )
        }

        // Date Range Filter
        if (dateRange?.from) {
            processedData = processedData.filter((item) => {
                const p = item as unknown as IParticipant
                const createdAtStr = typeof p.createdAt === 'string' ? p.createdAt : p.createdAt.toISOString()
                const createdDate = parseISO(createdAtStr)
                const from = startOfDay(dateRange.from!)
                const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!)

                return isWithinInterval(createdDate, { start: from, end: to })
            })
        }

        return processedData
    }, [data, dateRange, locationFilter])

    const tableColumns = React.useMemo(() => {
        if (userRole !== 'super-admin') return columns;

        return [
            ...columns,
            {
                id: "actions",
                enableHiding: false,
                cell: ({ row }: { row: { original: TData } }) => {
                    return (
                        <div className="flex justify-end">
                            <Button variant="ghost" size="icon" onClick={() => setEditingParticipant(row.original as unknown as IParticipant)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </div>
                    )
                }
            }
        ]
    }, [columns, userRole])


    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: filteredData as TData[],
        columns: tableColumns as ColumnDef<TData, unknown>[],
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
        },
    })

    // Export to CSV function
    const downloadCSV = () => {
        const headers = [
            "Name", "Mobile", "Email", "Business", "Location",
            "Amount", "Secondary Members", "Payment",
            "Payment Status", "Approval Status", "Status",
            "Registered At"
        ]

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + (filteredData as unknown as IParticipant[]).map((row) => {
                const secondaryMembersCount = row.secondaryMembers?.length || 0

                return [
                    `"${row.name || ''}"`,
                    `"${row.mobileNumber}"`,
                    `"${row.email || ''}"`,
                    `"${row.businessName || ''}"`,
                    `"${row.location || ''}"`,
                    `"${row.totalAmount || 0}"`,
                    secondaryMembersCount,
                    `"${row.paymentMethod || ''}"`,
                    `"${row.paymentStatus || ''}"`,
                    `"${row.approvalStatus || ''}"`,
                    row.isRegistered ? "Registered" : "Pending",
                    `"${new Date(row.createdAt).toLocaleDateString()}"`
                ].join(",")
            }).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "participants_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /*
    const downloadPDF = async () => {
        try {
            const doc = new jsPDF()

            // Load font for Tamil characters
            let fontLoaded = false
            try {
                doc.addFileToVFS("NotoSansTamil-Regular.ttf", "")
                doc.addFont("NotoSansTamil-Regular.ttf", "NotoSansTamil", "normal")
                fontLoaded = true
            } catch (fontError) {
                console.error("Font load error:", fontError)
            }

            // Metadata
            doc.setFont("helvetica") // Ensure standard font for headers
            const title = "Pongal Vizha 2025 - Participants Report"
            const generatedDate = `Generated: ${new Date().toLocaleString()}`
            const filterInfo = locationFilter !== 'all' ? `Filter: Location ${locationFilter}` : "Filter: All Locations"

            // Header
            doc.setFontSize(16)
            doc.text(title, 14, 20)

            doc.setFontSize(10)
            doc.setTextColor(100)
            doc.text(generatedDate, 14, 28)
            doc.text(filterInfo, 14, 33)

            // Table Data
            const tableBody = (filteredData as unknown as IParticipant[]).map((row) => [
                row.name || "",
                row.mobileNumber || "",
                row.location || "-",
                row.ageGroups?.guest || 0,
                new Date(row.createdAt).toLocaleDateString()
            ])

            autoTable(doc, {
                head: [['Name', 'Mobile', 'Loc', 'Guests', 'Reg Date']],
                body: tableBody,
                startY: 40,
                styles: {
                    fontSize: 8,
                    cellPadding: 3,
                    font: "helvetica" // Default font for all cells
                },
                columnStyles: {
                    0: { font: fontLoaded ? "NotoSansTamil" : "helvetica" } // Only apply Tamil font to Name column
                },
                headStyles: {
                    fillColor: [22, 163, 74],
                    font: "helvetica" // Ensure headers are Helvetica
                },
                alternateRowStyles: { fillColor: [240, 253, 244] },
            })

            doc.save("participants_report.pdf")
        } catch (error) {
            console.error("PDF Export failed:", error)
            alert("Failed to export PDF")
        }
    }
    */

    return (
        <div className="w-full space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between py-4">
                <div className="flex flex-1 flex-col md:flex-row gap-4 w-full md:items-center">
                    {/* Unified Search */}
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search all columns..."
                            value={globalFilter ?? ""}
                            onChange={(event) => setGlobalFilter(event.target.value)}
                            className="pl-8 w-full"
                        />
                    </div>

                    {/* Location Filter */}
                    <div className="w-[180px]">
                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by Location" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Locations ({data.length})</SelectItem>
                                {locationOptions.map(([loc, count]) => (
                                    <SelectItem key={loc} value={loc}>
                                        {loc} ({count})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Range Picker */}
                    <DatePickerWithRange date={dateRange} setDate={setDateRange} />

                    {/* Morning Food Switch */}
                    {/* <div className="flex items-center space-x-2 border p-2 rounded-md h-10 px-3 bg-background">
                        <Switch
                            id="morning-food"
                            checked={showMorningFoodOnly}
                            onCheckedChange={setShowMorningFoodOnly}
                        />
                        <Label htmlFor="morning-food" className="whitespace-nowrap cursor-pointer">Morning Food</Label>
                    </div> */}
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                Columns <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" onClick={downloadCSV}>
                        <Download className="h-4 w-4 mr-2" /> Excel
                    </Button>
                    {/* <Button variant="outline" onClick={downloadPDF}>
                        <FileText className="h-4 w-4 mr-2" /> PDF
                    </Button> */}
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between px-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium hidden sm:block">Rows per page</p>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value) => {
                                table.setPageSize(Number(value))
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={table.getState().pagination.pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 50, 100, 200, 500].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
            {
                editingParticipant && (
                    <EditParticipantDialog
                        open={!!editingParticipant}
                        onOpenChange={(open) => !open && setEditingParticipant(null)}
                        participant={editingParticipant}
                        onSuccess={() => {
                            // Optionally refresh data - revalidatePath handles logic, but local state?
                            // If revalidatePath works, router.refresh() might be needed?
                            // Next.js Server Action revalidatePath updates server data, Client Router Refresh updates client view.
                            // I'll call router.refresh() if I had router.
                            // But I don't have router here.
                            // Actually, I can rely on auto-refresh or add router.
                            setEditingParticipant(null)
                        }}
                    />
                )
            }
        </div >
    )
}
