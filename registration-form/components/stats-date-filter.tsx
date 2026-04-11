"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { DateRange } from "react-day-picker"

import { DatePickerWithRange } from "./date-range-picker"

export function StatsDateFilter() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Initialize state from URL params
    const initialDate: DateRange | undefined = React.useMemo(() => {
        const from = searchParams.get("from")
        const to = searchParams.get("to")
        if (from && to) {
            return {
                from: new Date(from),
                to: new Date(to),
            }
        }
        return undefined
    }, [searchParams])

    const [date, setDate] = React.useState<DateRange | undefined>(initialDate)

    // Update URL when date changes
    React.useEffect(() => {
        const params = new URLSearchParams(searchParams)
        if (date?.from) {
            params.set("from", date.from.toISOString())
            if (date.to) {
                params.set("to", date.to.toISOString())
            } else {
                params.delete("to")
            }
        } else {
            params.delete("from")
            params.delete("to")
        }

        // Only push if params changed
        const queryString = params.toString()
        const currentQuery = searchParams.toString()

        if (queryString !== currentQuery) {
            router.push(`${pathname}?${queryString}`)
        }
    }, [date, router, pathname, searchParams])

    return (
        <div className="flex items-center space-x-2">
            <DatePickerWithRange date={date} setDate={setDate} />
        </div>
    )
}
