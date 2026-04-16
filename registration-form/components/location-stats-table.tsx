"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from "@/components/ui/table"
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card"

interface LocationStatsTableProps {
    data: Array<{
        _id: string
        primaryReg: number
        secondaryReg: number
        totalReg: number
        primaryIn: number
        secondaryIn: number
        totalIn: number
    }>
}

export function LocationStatsTable({ data }: LocationStatsTableProps) {
    const total = data.reduce((acc, curr) => ({
        primaryReg: acc.primaryReg + curr.primaryReg,
        secondaryReg: acc.secondaryReg + curr.secondaryReg,
        totalReg: acc.totalReg + curr.totalReg,
        primaryIn: acc.primaryIn + curr.primaryIn,
        secondaryIn: acc.secondaryIn + curr.secondaryIn,
        totalIn: acc.totalIn + curr.totalIn,
    }), { primaryReg: 0, secondaryReg: 0, totalReg: 0, primaryIn: 0, secondaryIn: 0, totalIn: 0 })

    return (
        <Card>
            <CardHeader>
                <CardTitle>Location Participation Breakdown</CardTitle>
                <CardDescription>Detailed count of primary and secondary members by location.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-center font-bold border-l bg-muted/20">Primary (Reg)</TableHead>
                            <TableHead className="text-center bg-muted/20">Secondary (Reg)</TableHead>
                            <TableHead className="text-center border-r bg-muted/20">Total (Reg)</TableHead>

                            <TableHead className="text-center font-bold text-green-700 bg-green-50/50">Primary (In)</TableHead>
                            <TableHead className="text-center text-green-700 bg-green-50/50">Secondary (In)</TableHead>
                            <TableHead className="text-right font-bold text-green-700 bg-green-50/50">Total (In)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item) => (
                            <TableRow key={item._id}>
                                <TableCell className="font-medium">{item._id || "Unknown"}</TableCell>
                                <TableCell className="text-center text-muted-foreground border-l bg-muted/10">{item.primaryReg}</TableCell>
                                <TableCell className="text-center text-muted-foreground bg-muted/10">{item.secondaryReg}</TableCell>
                                <TableCell className="text-center font-medium border-r bg-muted/10">{item.totalReg}</TableCell>

                                <TableCell className="text-center text-green-600 bg-green-50/30 font-medium">{item.primaryIn}</TableCell>
                                <TableCell className="text-center text-green-600 bg-green-50/30">{item.secondaryIn}</TableCell>
                                <TableCell className="text-right font-bold text-green-700 bg-green-50/30">{item.totalIn}</TableCell>
                            </TableRow>
                        ))}

                        {data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
                                    No data available.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell className="font-bold">Grand Total</TableCell>
                            <TableCell className="text-center font-bold border-l bg-muted/20">{total.primaryReg}</TableCell>
                            <TableCell className="text-center font-bold bg-muted/20">{total.secondaryReg}</TableCell>
                            <TableCell className="text-center font-bold border-r bg-muted/20">{total.totalReg}</TableCell>

                            <TableCell className="text-center font-bold text-green-700 bg-green-50/50">{total.primaryIn}</TableCell>
                            <TableCell className="text-center font-bold text-green-700 bg-green-50/50">{total.secondaryIn}</TableCell>
                            <TableCell className="text-right font-bold text-green-700 bg-green-50/50">{total.totalIn}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </CardContent>
        </Card>
    )
}
