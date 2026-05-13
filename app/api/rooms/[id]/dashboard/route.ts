import { NextRequest, NextResponse } from 'next/server';
import { getIdeas, getVotes, getRoom, computeRankings, VOTES_PER_USER } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = await getRoom(id);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const [ideas, votes] = await Promise.all([getIdeas(id), getVotes(id)]);
  const ranked = computeRankings(ideas, votes);
  const totalTokens = votes.reduce(
    (s, v) => s + Object.values(v.allocations).reduce((a, b) => a + b, 0),
    0
  );

  return NextResponse.json({ room, ranked, voterCount: votes.length, totalTokens, votesPerUser: VOTES_PER_USER });
}
