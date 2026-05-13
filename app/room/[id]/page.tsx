'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const VOTES_PER_USER = 5;

type Idea = {
  id: string;
  title: string;
  description: string;
  added_by: string;
  created_at: number;
};

type Room = {
  id: string;
  description: string;
};

function roomNameKey(roomId: string) {
  return `name_${roomId}`;
}

function readCachedName(roomId: string) {
  try {
    return (
      sessionStorage.getItem(roomNameKey(roomId)) ||
      localStorage.getItem(roomNameKey(roomId)) ||
      localStorage.getItem('name') ||
      ''
    ).trim();
  } catch {
    return '';
  }
}

function cacheName(roomId: string, name: string) {
  try {
    sessionStorage.setItem(roomNameKey(roomId), name);
    localStorage.setItem(roomNameKey(roomId), name);
    localStorage.setItem('name', name);
  } catch {
    // Private browsing or locked-down environments may reject storage writes.
  }
}

function TokenDots({ count, max }: { count: number; max: number }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-full transition-all"
          style={{ background: i < count ? 'linear-gradient(135deg,#6366f1,#a855f7)' : 'rgba(255,255,255,0.12)' }}
        />
      ))}
    </div>
  );
}

function IdeaCard({
  idea,
  tokens,
  remaining,
  onAdd,
  onRemove,
  onDelete,
}: {
  idea: Idea;
  tokens: number;
  remaining: number;
  onAdd: () => void;
  onRemove: () => void;
  onDelete: () => void;
}) {
  const canAdd = remaining > 0;
  const canRemove = tokens > 0;
  const [confirming, setConfirming] = useState(false);

  function handleDeleteClick() {
    if (!confirming) { setConfirming(true); return; }
    onDelete();
    setConfirming(false);
  }

  return (
    <div
      className="p-4 rounded-xl transition-all"
      style={{
        background: tokens > 0 ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
        border: tokens > 0 ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Vote controls */}
        <div className="flex flex-col items-center gap-1 pt-0.5">
          <button
            onClick={onAdd}
            disabled={!canAdd}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold transition-all disabled:opacity-25 disabled:cursor-not-allowed"
            style={{ background: canAdd ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)', color: canAdd ? '#818cf8' : '#4b5563' }}
            aria-label="Add vote"
          >
            +
          </button>
          <span className="text-lg font-bold" style={{ color: tokens > 0 ? '#a5b4fc' : '#4b5563', minWidth: '1.25rem', textAlign: 'center' }}>
            {tokens}
          </span>
          <button
            onClick={onRemove}
            disabled={!canRemove}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold transition-all disabled:opacity-25 disabled:cursor-not-allowed"
            style={{ background: canRemove ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)', color: canRemove ? '#f87171' : '#4b5563' }}
            aria-label="Remove vote"
          >
            −
          </button>
        </div>

        {/* Idea content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white">{idea.title}</p>
          {idea.description && (
            <p className="text-sm text-gray-400 mt-0.5">{idea.description}</p>
          )}
          <p className="text-xs text-gray-600 mt-2">Added by {idea.added_by}</p>
          {tokens > 0 && (
            <div className="mt-2">
              <TokenDots count={tokens} max={VOTES_PER_USER} />
            </div>
          )}
        </div>

        {/* Delete button */}
        <button
          onClick={handleDeleteClick}
          onBlur={() => setConfirming(false)}
          className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
          style={{
            background: confirming ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.04)',
            color: confirming ? '#f87171' : '#4b5563',
            border: confirming ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.07)',
          }}
          title={confirming ? 'Click again to confirm delete' : 'Delete idea'}
        >
          {confirming ? 'Confirm?' : '✕'}
        </button>
      </div>
    </div>
  );
}

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [myName, setMyName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [nameLoaded, setNameLoaded] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [adding, setAdding] = useState(false);

  const tokensUsed = Object.values(allocations).reduce((s, n) => s + n, 0);
  const tokensLeft = VOTES_PER_USER - tokensUsed;

  const loadData = useCallback(async () => {
    const [roomRes, ideasRes, votesRes] = await Promise.all([
      fetch(`/api/rooms?roomId=${id}`),
      fetch(`/api/rooms/${id}/ideas`),
      fetch(`/api/rooms/${id}/votes`),
    ]);
    if (!roomRes.ok) { router.push('/'); return; }

    const { room: r } = await roomRes.json();
    const { ideas: fetched } = await ideasRes.json();
    const { count } = await votesRes.json();

    setRoom(r);
    setVoteCount(count);
    setIdeas(fetched);
  }, [id, router]);

  // Load my prior vote
  useEffect(() => {
    if (!myName || !id) return;
    fetch(`/api/rooms/${id}/votes?voter=${encodeURIComponent(myName)}`)
      .then(r => r.json())
      .then(({ vote }) => {
        if (vote?.allocations) setAllocations(vote.allocations);
      });
  }, [myName, id]);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (cancelled) return;
      const cachedName = readCachedName(id);
      if (cachedName) {
        setMyName(cachedName);
        setNameInput(cachedName);
      }
      setNameLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) void loadData();
    });

    const t = setInterval(loadData, 10000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [loadData]);

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = nameInput.trim();
    if (!cleanName) return;
    cacheName(id, cleanName);
    setMyName(cleanName);
  }

  function addToken(ideaId: string) {
    if (tokensLeft <= 0) return;
    setAllocations(prev => ({ ...prev, [ideaId]: (prev[ideaId] ?? 0) + 1 }));
    setSubmitStatus('idle');
  }

  function removeToken(ideaId: string) {
    setAllocations(prev => {
      const cur = prev[ideaId] ?? 0;
      if (cur <= 1) { const next = { ...prev }; delete next[ideaId]; return next; }
      return { ...prev, [ideaId]: cur - 1 };
    });
    setSubmitStatus('idle');
  }

  async function handleSubmit() {
    if (tokensUsed === 0) return;
    setSubmitStatus('saving');
    const res = await fetch(`/api/rooms/${id}/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voterName: myName, allocations }),
    });
    if (res.ok) await loadData();
    setSubmitStatus('saved');
    setTimeout(() => setSubmitStatus('idle'), 3000);
  }

  async function handleDelete(ideaId: string) {
    setIdeas(prev => prev.filter(i => i.id !== ideaId));
    // Also remove any allocated tokens for that idea
    setAllocations(prev => {
      const next = { ...prev };
      delete next[ideaId];
      return next;
    });
    await fetch(`/api/rooms/${id}/ideas/${ideaId}`, { method: 'DELETE' });
  }

  async function handleAddIdea(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    const res = await fetch(`/api/rooms/${id}/ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim(), addedBy: myName }),
    });
    if (res.ok) {
      const { idea } = await res.json();
      setIdeas(prev => [...prev, idea]);
      setNewTitle('');
      setNewDesc('');
      setShowAddForm(false);
    }
    setAdding(false);
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f0f13, #1a1a2e, #0f0f13)' }}>
        <div className="text-gray-400">Loading room...</div>
      </div>
    );
  }

  if (!nameLoaded || !myName) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0f0f13 0%, #1a1a2e 50%, #0f0f13 100%)' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <path d="M8 24L16 8L24 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.5 19H21.5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Enter Room</h1>
            <p className="text-gray-400 mt-2">
              Join <span className="font-mono text-indigo-300">#{id}</span>
              {room?.description ? ` - ${room.description}` : ''}
            </p>
          </div>

          <form onSubmit={handleNameSubmit} className="rounded-2xl p-8 space-y-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="e.g. Alice"
                maxLength={40}
                required
                className="w-full px-4 py-3 rounded-xl text-white outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
                onFocus={e => (e.target.style.borderColor = '#6366f1')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">We will remember this name for future visits on this browser.</p>
            </div>

            <button
              type="submit"
              disabled={!nameInput.trim()}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
            >
              Join Room
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-32" style={{ background: 'linear-gradient(135deg, #0f0f13 0%, #1a1a2e 50%, #0f0f13 100%)' }}>
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
            {myName} · {voteCount} voter{voteCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href={`/room/${id}/dashboard`}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="8" width="3" height="7" rx="0.5"/>
            <rect x="6" y="4" width="3" height="11" rx="0.5"/>
            <rect x="11" y="1" width="3" height="14" rx="0.5"/>
          </svg>
          Results
        </Link>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        {/* Token meter */}
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-300">Your votes</span>
            <span className="text-sm font-bold" style={{ color: tokensLeft === 0 ? '#f59e0b' : '#a5b4fc' }}>
              {tokensLeft} / {VOTES_PER_USER} left
            </span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: VOTES_PER_USER }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-3 rounded-full transition-all duration-200"
                style={{ background: i < tokensUsed ? 'linear-gradient(90deg,#6366f1,#a855f7)' : 'rgba(255,255,255,0.1)' }}
              />
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {tokensLeft === 0
              ? 'All votes allocated — submit or remove some to adjust'
              : 'Click + on any idea to allocate votes. Stack them on your favourite!'}
          </p>
        </div>

        {/* Ideas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white">Ideas <span className="text-gray-500 text-sm font-normal">({ideas.length})</span></h2>
            <button
              onClick={() => setShowAddForm(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: showAddForm ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)',
                color: showAddForm ? '#c084fc' : '#9ca3af',
                border: `1px solid ${showAddForm ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              {showAddForm ? '✕ Cancel' : '+ Add Idea'}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddIdea} className="p-4 rounded-xl mb-4 space-y-3" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Idea title *"
                required
                maxLength={120}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}
                autoFocus
              />
              <input
                type="text"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Short description (optional)"
                maxLength={200}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}
              />
              <button
                type="submit"
                disabled={adding || !newTitle.trim()}
                className="w-full py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
              >
                {adding ? 'Adding...' : 'Add Idea'}
              </button>
            </form>
          )}

          {ideas.length === 0 ? (
            <div className="text-center py-14 text-gray-500">
              <p className="text-4xl mb-3">💡</p>
              <p>No ideas yet. Be the first to add one!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ideas.map(idea => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  tokens={allocations[idea.id] ?? 0}
                  remaining={tokensLeft}
                  onAdd={() => addToken(idea.id)}
                  onRemove={() => removeToken(idea.id)}
                  onDelete={() => handleDelete(idea.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky submit bar */}
      {ideas.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 py-4" style={{ background: 'rgba(15,15,19,0.9)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="max-w-xl mx-auto">
            <button
              onClick={handleSubmit}
              disabled={tokensUsed === 0 || submitStatus === 'saving' || submitStatus === 'saved'}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:cursor-not-allowed"
              style={{
                background:
                  submitStatus === 'saved'
                    ? 'rgba(34,197,94,0.2)'
                    : tokensUsed === 0
                    ? 'rgba(255,255,255,0.05)'
                    : submitStatus === 'saving'
                    ? '#4f46e5'
                    : 'linear-gradient(135deg,#6366f1,#a855f7)',
                color:
                  submitStatus === 'saved' ? '#4ade80' : tokensUsed === 0 ? '#4b5563' : 'white',
                border:
                  submitStatus === 'saved' ? '1px solid rgba(34,197,94,0.4)' : 'none',
              }}
            >
              {submitStatus === 'saving'
                ? 'Submitting...'
                : submitStatus === 'saved'
                ? `✓ Submitted — ${tokensUsed} vote${tokensUsed !== 1 ? 's' : ''} cast`
                : tokensUsed === 0
                ? 'Allocate votes above, then submit'
                : `Submit ${tokensUsed} vote${tokensUsed !== 1 ? 's' : ''} (${tokensLeft} left unspent)`}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
