import { getSupabase } from './supabase';

// Alias so every call site reads naturally
const sb = () => getSupabase();

export const VOTES_PER_USER = 5;

export type Room = {
  id: string;
  description: string;
  created_at: string;
};

export type Idea = {
  id: string;
  room_id: string;
  title: string;
  description: string;
  added_by: string;
  created_at: string;
};

export type Vote = {
  id: string;
  room_id: string;
  voter_name: string;
  allocations: Record<string, number>;
  submitted_at: string;
};

export type RankedResult = {
  idea: Idea;
  totalTokens: number;
  voterCount: number;
};

// ── Rooms ────────────────────────────────────────────────────────────────────

export async function getRoom(id: string): Promise<Room | null> {
  const { data } = await sb().from('rooms').select('*').eq('id', id).single();
  return data ?? null;
}

export async function createRoom(id: string, description: string): Promise<Room> {
  const { data, error } = await sb()
    .from('rooms')
    .insert({ id, description })
    .select()
    .single();

  if (error) throw error;
  return data as Room;
}

// ── Ideas ────────────────────────────────────────────────────────────────────

export async function getIdeas(roomId: string): Promise<Idea[]> {
  const { data } = await sb()
    .from('ideas')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });
  return (data ?? []) as Idea[];
}

export async function deleteIdea(ideaId: string): Promise<{ error?: string }> {
  const { error } = await sb().from('ideas').delete().eq('id', ideaId);
  if (error) return { error: error.message };
  return {};
}

export async function updateIdea(
  roomId: string,
  ideaId: string,
  title: string,
  description: string
): Promise<Idea | null> {
  const { data, error } = await sb()
    .from('ideas')
    .update({ title, description })
    .eq('id', ideaId)
    .eq('room_id', roomId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as Idea | null;
}

export async function addIdea(
  roomId: string,
  title: string,
  description: string,
  addedBy: string
): Promise<Idea> {
  const id = `idea_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const { data, error } = await sb()
    .from('ideas')
    .insert({ id, room_id: roomId, title, description, added_by: addedBy })
    .select()
    .single();
  if (error) throw error;
  return data as Idea;
}

// ── Votes ────────────────────────────────────────────────────────────────────

function normalizeVoterName(name: string) {
  return name.trim().toLocaleLowerCase();
}

export async function getVotes(roomId: string): Promise<Vote[]> {
  const { data } = await sb()
    .from('votes')
    .select('*')
    .eq('room_id', roomId)
    .order('submitted_at', { ascending: true });
  return (data ?? []) as Vote[];
}

export async function getVoterVote(roomId: string, voterName: string): Promise<Vote | null> {
  const normalizedName = normalizeVoterName(voterName);

  const { data: exact } = await sb()
    .from('votes')
    .select('*')
    .eq('room_id', roomId)
    .eq('voter_name', normalizedName)
    .maybeSingle();

  if (exact) return exact as Vote;

  const { data } = await sb()
    .from('votes')
    .select('*')
    .eq('room_id', roomId)
    .ilike('voter_name', normalizedName)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export async function deleteVote(roomId: string, voterName: string): Promise<void> {
  const existing = await getVoterVote(roomId, voterName);
  if (!existing) return;

  const { error } = await sb()
    .from('votes')
    .delete()
    .eq('id', existing.id);

  if (error) throw error;
}

export async function submitVote(
  roomId: string,
  voterName: string,
  allocations: Record<string, number>
): Promise<Vote> {
  const normalizedName = normalizeVoterName(voterName);
  const submittedAt = new Date().toISOString();
  const existing = await getVoterVote(roomId, normalizedName);

  if (existing) {
    const { data, error } = await sb()
      .from('votes')
      .update({ voter_name: normalizedName, allocations, submitted_at: submittedAt })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data as Vote;
  }

  const id = `vote_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const { data, error } = await sb()
    .from('votes')
    .upsert(
      { id, room_id: roomId, voter_name: normalizedName, allocations, submitted_at: submittedAt },
      { onConflict: 'room_id,voter_name' }
    )
    .select()
    .single();
  if (error) throw error;
  return data as Vote;
}

// ── Compute rankings ──────────────────────────────────────────────────────────

export function computeRankings(ideas: Idea[], votes: Vote[]): RankedResult[] {
  const stats: Record<string, { totalTokens: number; voterCount: number }> = {};
  ideas.forEach(idea => {
    stats[idea.id] = { totalTokens: 0, voterCount: 0 };
  });

  for (const vote of votes) {
    for (const [ideaId, count] of Object.entries(vote.allocations)) {
      if (stats[ideaId] && count > 0) {
        stats[ideaId].totalTokens += count;
        stats[ideaId].voterCount += 1;
      }
    }
  }

  return ideas
    .map(idea => ({
      idea,
      totalTokens: stats[idea.id].totalTokens,
      voterCount: stats[idea.id].voterCount,
    }))
    .sort((a, b) => b.totalTokens - a.totalTokens || b.voterCount - a.voterCount);
}
