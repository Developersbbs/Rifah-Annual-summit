import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Participant from '@/models/Participant';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isSponsor = searchParams.get('isSponsor');

  try {
    await dbConnect();
    
    const query: any = {
      approvalStatus: 'approved'
    };

    if (isSponsor !== null) {
      query.isSponsor = isSponsor === 'true';
    }

    const participants = await Participant.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json(participants);
  } catch (error) {
    console.error('Filter participants error:', error);
    return NextResponse.json({ error: 'Failed to fetch filtered participants' }, { status: 500 });
  }
}
