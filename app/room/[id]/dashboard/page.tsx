'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type Idea = {
  id: string;
  title: string;
  description: string;
  added_by: string;
};

type RankedResult = {
  idea: Idea;
  totalTokens: number;
  voterCount: number;
};

type Room = {
  id: string;
  description: string;
};

const MEDAL = ['🥇', '🥈', '🥉'];

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [ranked, setRanked] = useState<RankedResult[]>([]);
  const [voterCount, setVoterCount] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [votesPerUser, setVotesPerUser] = useState(5);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/rooms/${id}/dashboard`);
    if (!res.ok) return;
    const data = await res.json();
    setRoom(data.room);
    setRanked(data.ranked);
    setVoterCount(data.voterCount);
    setTotalTokens(data.totalTokens);
    setVotesPerUser(data.votesPerUser);
    setLastUpdated(new Date());
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) void load();
    });

    const t = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [load]);

  const maxTokens = ranked.length > 0 ? Math.max(...ranked.map(r => r.totalTokens), 1) : 1;

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f0f13, #1a1a2e, #0f0f13)' }}>
        <div className="text-gray-400">Loading results...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f0f13 0%, #1a1a2e 50%, #0f0f13 100%)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between" style={{ background: 'rgba(15,15,19,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm px-3 py-1 rounded-full" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
              #{id}
            </span>
            <span className="text-gray-400 text-sm hidden sm:inline">{room.description}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Live · {voterCount} voter{voterCount !== 1 ? 's' : ''} · {totalTokens} votes cast
            {lastUpdated && ` · ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <Link
          href={`/room/${id}`}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          ← Room
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Results</h1>
          <p className="text-gray-400 mt-2 text-sm">
            {voterCount === 0
              ? 'No votes yet — share the room code with your group!'
              : `${voterCount} voter${voterCount !== 1 ? 's' : ''} · ${votesPerUser} votes each · ${totalTokens} total`}
          </p>
        </div>

        {/* Winner spotlight */}
        {ranked.length > 0 && ranked[0].totalTokens > 0 && (
          <div className="mb-6 p-6 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))', border: '1px solid rgba(99,102,241,0.3)' }}>
            <p className="text-4xl mb-2">🏆</p>
            <p className="text-sm text-indigo-300 font-medium mb-1">Group&apos;s Top Pick</p>
            <p className="text-2xl font-bold text-white">{ranked[0].idea.title}</p>
            {ranked[0].idea.description && (
              <p className="text-gray-400 mt-1 text-sm">{ranked[0].idea.description}</p>
            )}
            <div className="flex items-center justify-center gap-8 mt-4">
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {ranked[0].totalTokens}
                </p>
                <p className="text-xs text-gray-500">votes</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-300">{ranked[0].voterCount}</p>
                <p className="text-xs text-gray-500">supporters</p>
              </div>
              {voterCount > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-indigo-300">
                    {Math.round((ranked[0].totalTokens / (voterCount * votesPerUser)) * 100)}%
                  </p>
                  <p className="text-xs text-gray-500">of all votes</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ranked list */}
        {ranked.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-5xl mb-4">💡</p>
            <p>No ideas yet. Go back and add some!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ranked.map((item, index) => {
              const pct = maxTokens > 0 ? (item.totalTokens / maxTokens) * 100 : 0;
              return (
                <div
                  key={item.idea.id}
                  className="p-4 rounded-xl"
                  style={{
                    background: index === 0 && item.totalTokens > 0 ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)',
                    border: index === 0 && item.totalTokens > 0 ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Medal / rank */}
                    <div className="flex-shrink-0 w-10 flex items-center justify-center pt-0.5">
                      {index < 3 ? (
                        <span className="text-2xl">{MEDAL[index]}</span>
                      ) : (
                        <span className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold text-gray-500" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <p className="font-semibold text-white">{item.idea.title}</p>
                        <span className="text-xl font-bold flex-shrink-0" style={{ color: index === 0 ? '#818cf8' : '#6b7280' }}>
                          {item.totalTokens} <span className="text-xs font-normal">vote{item.totalTokens !== 1 ? 's' : ''}</span>
                        </span>
                      </div>
                      {item.idea.description && (
                        <p className="text-sm text-gray-400 mt-0.5">{item.idea.description}</p>
                      )}
                      <p className="text-xs text-gray-600 mt-1">
                        By {item.idea.added_by}
                        {item.voterCount > 0 && ` · ${item.voterCount} supporter${item.voterCount !== 1 ? 's' : ''}`}
                      </p>

                      {/* Progress bar */}
                      <div className="mt-2.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6366f1, #a855f7)' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats */}
        {ranked.length > 0 && (
          <div className="mt-8 grid grid-cols-4 gap-3">
            {[
              { label: 'Ideas', value: ranked.length },
              { label: 'Voters', value: voterCount },
              { label: 'Votes cast', value: totalTokens },
              { label: 'Per person', value: votesPerUser },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-gray-700 text-xs mt-6">Auto-refreshes every 5 seconds</p>
      </div>
    </main>
  );
}
