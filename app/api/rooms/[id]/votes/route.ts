import { NextRequest, NextResponse } from 'next/server';
import { getVotes, submitVote, getVoterVote, getRoom, VOTES_PER_USER } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const voter = searchParams.get('voter');

  if (voter) {
    const vote = await getVoterVote(id, voter);
    return NextResponse.json({ vote });
  }

  const votes = await getVotes(id);
  return NextResponse.json({ votes, count: votes.length });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = await getRoom(id);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const { voterName, allocations } = await req.json();
  if (typeof voterName !== 'string' || !voterName.trim() || typeof allocations !== 'object' || Array.isArray(allocations)) {
    return NextResponse.json({ error: 'voterName and allocations object are required' }, { status: 400 });
  }

  const total = Object.values(allocations as Record<string, number>).reduce((s, n) => s + (n > 0 ? n : 0), 0);
  if (total > VOTES_PER_USER) {
    return NextResponse.json({ error: `Cannot use more than ${VOTES_PER_USER} tokens` }, { status: 400 });
  }

  const clean: Record<string, number> = {};
  for (const [k, v] of Object.entries(allocations as Record<string, number>)) {
    if (typeof v === 'number' && v > 0) clean[k] = Math.floor(v);
  }

  const vote = await submitVote(id, voterName.trim(), clean);
  return NextResponse.json({ vote });
}
