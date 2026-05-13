import { NextRequest, NextResponse } from 'next/server';
import { getIdeas, addIdea, getRoom } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ideas = await getIdeas(id);
  return NextResponse.json({ ideas });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = await getRoom(id);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const { title, description, addedBy } = await req.json();
  if (!title || !addedBy) {
    return NextResponse.json({ error: 'title and addedBy are required' }, { status: 400 });
  }

  const idea = await addIdea(id, title.trim(), description?.trim() ?? '', addedBy.trim());
  return NextResponse.json({ idea });
}
