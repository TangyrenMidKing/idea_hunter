import { NextRequest, NextResponse } from 'next/server';
import { createRoom, getRoom } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { roomId, description } = await req.json();

  if (!roomId || !description) {
    return NextResponse.json({ error: 'roomId and description are required' }, { status: 400 });
  }

  const clean = roomId.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (!clean) {
    return NextResponse.json({ error: 'Invalid room ID' }, { status: 400 });
  }

  const room = await createRoom(clean, description.trim());
  return NextResponse.json({ room });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');
  if (!roomId) return NextResponse.json({ error: 'roomId required' }, { status: 400 });
  const room = await getRoom(roomId.toUpperCase());
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  return NextResponse.json({ room });
}
