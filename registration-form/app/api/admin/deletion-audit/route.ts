import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import DeletionAudit from '@/models/DeletionAudit'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        // Check if user is authenticated and is admin
        const currentUser = await getCurrentUser()
        
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user has admin role
        if (!['admin', 'super-admin'].includes(currentUser.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        await dbConnect()

        // Get query parameters for pagination and filtering
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const search = searchParams.get('search') || ''
        const role = searchParams.get('role') || ''

        // Build query
        const query: any = {}
        
        if (search) {
            query.$or = [
                { 'deletedParticipant.name': { $regex: search, $options: 'i' } },
                { 'deletedParticipant.email': { $regex: search, $options: 'i' } },
                { 'deletedParticipant.mobileNumber': { $regex: search, $options: 'i' } },
                { deletedByEmail: { $regex: search, $options: 'i' } }
            ]
        }

        if (role) {
            query.deletedByRole = role
        }

        // Calculate skip for pagination
        const skip = (page - 1) * limit

        // Fetch deletion audit logs with pagination
        const [deletionLogs, total] = await Promise.all([
            DeletionAudit.find(query)
                .sort({ deletedAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('deletedBy', 'name email')
                .populate('eventId', 'eventName eventDate'),
            DeletionAudit.countDocuments(query)
        ])

        return NextResponse.json({
            success: true,
            data: deletionLogs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })

    } catch (error) {
        console.error('Error fetching deletion audit logs:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // Check if user is authenticated and is super-admin
        const currentUser = await getCurrentUser()
        
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (currentUser.role !== 'super-admin') {
            return NextResponse.json({ error: 'Only super-admin can delete audit logs' }, { status: 403 })
        }

        await dbConnect()

        const { auditId } = await request.json()

        if (!auditId) {
            return NextResponse.json({ error: 'Audit ID is required' }, { status: 400 })
        }

        // Delete the audit log
        await DeletionAudit.findByIdAndDelete(auditId)

        return NextResponse.json({ 
            success: true, 
            message: 'Audit log deleted successfully' 
        })

    } catch (error) {
        console.error('Error deleting audit log:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
