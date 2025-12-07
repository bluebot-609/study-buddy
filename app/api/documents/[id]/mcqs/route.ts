import { NextRequest, NextResponse } from 'next/server';
import { getMCQsByDocument } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const mcqs = await getMCQsByDocument(id, user.id);
    return NextResponse.json({ mcqs });
  } catch (error) {
    console.error('Error fetching MCQs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MCQs' },
      { status: 500 }
    );
  }
}

