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
import { ArrowUpDown, ChevronDown, Search, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { addDays, format } from "date-fns"
import { DateRange } from "react-day-picker"

interface ApprovalRecord {
    participantName: string
    participantPhone: string
    participantEmail: string
    approvedBy: string
    approvedByEmail: string
    role: "admin" | "super-admin"
    status: "approved" | "rejected"
    date: string
    participantId: string
}

export function ApprovalHistoryTable() {
    const [data, setData] = React.useState<ApprovalRecord[]>([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [sorting, setSorting] = React.useState<SortingState>([{ id: "date", desc: true }])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 20,
    })
    const [totalPages, setTotalPages] = React.useState(0)
    const [total, setTotal] = React.useState(0)
    const [roleFilter, setRoleFilter] = React.useState("all")
    const [statusFilter, setStatusFilter] = React.useState("all")
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    })

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const params = new URLSearchParams({
                page: (pagination.pageIndex + 1).toString(),
                limit: pagination.pageSize.toString(),
                search: columnFilters.find(f => f.id === "global")?.value?.toString() || "",
                role: roleFilter,
                status: statusFilter,
            })

            if (dateRange?.from) {
                params.append("startDate", format(dateRange.from, "yyyy-MM-dd"))
            }
            if (dateRange?.to) {
                params.append("endDate", format(dateRange.to, "yyyy-MM-dd"))
            }

            const response = await fetch(`/api/admin/approval-history?${params}`)
            if (!response.ok) {
                throw new Error("Failed to fetch approval history")
            }

            const result = await response.json()
            setData(result.records || [])
            setTotalPages(result.pagination?.totalPages || 0)
            setTotal(result.pagination?.total || 0)
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setLoading(false)
        }
    }, [pagination.pageIndex, pagination.pageSize, columnFilters, roleFilter, statusFilter, dateRange])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const columns: ColumnDef<ApprovalRecord>[] = [
        {
            accessorKey: "participantName",
            header: "Participant",
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue("participantName")}</div>
            ),
        },
        {
            accessorKey: "participantPhone",
            header: "Phone",
            cell: ({ row }) => (
                <div className="text-sm">{row.getValue("participantPhone")}</div>
            ),
        },
        {
            accessorKey: "approvedBy",
            header: "Approved By",
            cell: ({ row }) => (
                <div className="font-medium">{row.original.approvedByEmail}</div>
            ),
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }) => (
                <div className="capitalize">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.getValue("role") === "super-admin" 
                            ? "bg-purple-100 text-purple-800" 
                            : "bg-blue-100 text-blue-800"
                    }`}>
                        {row.getValue("role")}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <div className="capitalize">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.getValue("status") === "approved" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                    }`}>
                        {row.getValue("status")}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "date",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="text-sm">
                    {new Date(row.getValue("date")).toLocaleString()}
                </div>
            ),
        },
    ]

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onPaginationChange: setPagination,
        manualPagination: true,
        pageCount: totalPages,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination,
        },
    })

    const handleExport = async () => {
        try {
            const searchValue = table.getColumn("participantName")?.getFilterValue() as string || ""
            const params = new URLSearchParams({
                search: searchValue,
                role: roleFilter,
                status: statusFilter,
            })

            if (dateRange?.from) {
                params.append("startDate", format(dateRange.from, "yyyy-MM-dd"))
            }
            if (dateRange?.to) {
                params.append("endDate", format(dateRange.to, "yyyy-MM-dd"))
            }

            const response = await fetch(`/api/admin/approval-history/export?${params}`)
            if (!response.ok) {
                throw new Error("Failed to export data")
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `approval-history-${format(new Date(), "yyyy-MM-dd")}.xlsx`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to export data")
        }
    }

    if (loading && data.length === 0) {
        return <div className="flex items-center justify-center h-64">Loading approval history...</div>
    }

    if (error) {
        return <div className="text-red-500 text-center p-4">Error: {error}</div>
    }

    return (
        <div className="space-y-4">
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search participants, approvers..."
                        value={(table.getColumn("participantName")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("participantName")?.setFilterValue(event.target.value)
                        }
                        className="pl-9"
                    />
                </div>
                
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super-admin">Super Admin</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>

                <DatePickerWithRange date={dateRange} setDate={setDateRange} />

                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>

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
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
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
                                    No approval history found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                    Showing {pagination.pageIndex * pagination.pageSize + 1} to{" "}
                    {Math.min((pagination.pageIndex + 1) * pagination.pageSize, total)} of {total} results
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
    )
}
