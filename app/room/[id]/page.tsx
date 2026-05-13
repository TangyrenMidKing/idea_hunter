'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MarkdownText } from '@/lib/MarkdownText';

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
  onUpdate,
  onDelete,
}: {
  idea: Idea;
  tokens: number;
  remaining: number;
  onAdd: () => void;
  onRemove: () => void;
  onUpdate: (title: string, description: string) => Promise<void>;
  onDelete: () => void;
}) {
  const canAdd = remaining > 0;
  const canRemove = tokens > 0;
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(idea.title);
  const [editDesc, setEditDesc] = useState(idea.description);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  function handleDeleteClick() {
    if (!confirming) { setConfirming(true); return; }
    onDelete();
    setConfirming(false);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTitle.trim()) return;
    setSavingEdit(true);
    setEditError('');

    try {
      await onUpdate(editTitle.trim(), editDesc.trim());
      setEditing(false);
    } catch {
      setEditError('Unable to update idea. Please try again.');
    } finally {
      setSavingEdit(false);
    }
  }

  function handleCancelEdit() {
    setEditTitle(idea.title);
    setEditDesc(idea.description);
    setEditError('');
    setEditing(false);
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
          {editing ? (
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Idea title *"
                required
                maxLength={120}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}
              />
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Markdown body (optional), e.g. **Core:** ..."
                maxLength={1200}
                rows={4}
                className="w-full resize-y px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}
              />
              {editError && <p className="text-xs text-red-400">{editError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={savingEdit || !editTitle.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
                >
                  {savingEdit ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={savingEdit}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <p className="font-medium text-white">{idea.title}</p>
              {idea.description && (
                <MarkdownText className="mt-1">{idea.description}</MarkdownText>
              )}
              <p className="text-xs text-gray-600 mt-2">Added by {idea.added_by}</p>
              {tokens > 0 && (
                <div className="mt-2">
                  <TokenDots count={tokens} max={VOTES_PER_USER} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Edit/delete actions */}
        {!editing && (
          <div className="flex gap-1">
            <button
              onClick={() => {
                setEditTitle(idea.title);
                setEditDesc(idea.description);
                setEditError('');
                setEditing(true);
                setConfirming(false);
              }}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.07)' }}
              aria-label="Edit idea"
              title="Edit idea"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9.5 3.5L12.5 6.5" />
                <path d="M2.5 13.5L5.25 13L13 5.25C13.41 4.84 13.41 4.16 13 3.75L12.25 3C11.84 2.59 11.16 2.59 10.75 3L3 10.75L2.5 13.5Z" />
              </svg>
            </button>
            <button
              onClick={handleDeleteClick}
              onBlur={() => setConfirming(false)}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all"
              style={{
                background: confirming ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.04)',
                color: confirming ? '#f87171' : '#4b5563',
                border: confirming ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.07)',
              }}
              aria-label={confirming ? 'Confirm delete idea' : 'Delete idea'}
              title={confirming ? 'Click again to confirm delete' : 'Delete idea'}
            >
              {confirming ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 8.5L6.25 11.5L13 4.5" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2.5 4H13.5" />
                  <path d="M6.5 2.5H9.5" />
                  <path d="M4.25 4L5 13C5.05 13.56 5.49 14 6.05 14H9.95C10.51 14 10.95 13.56 11 13L11.75 4" />
                  <path d="M6.75 6.5V11.5" />
                  <path d="M9.25 6.5V11.5" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RulesPanel() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed bottom-6 right-4 z-20 rounded-2xl shadow-2xl transition-all sm:right-6 ${collapsed ? 'w-36' : 'left-4 sm:left-auto sm:w-80'}`}
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
      aria-label="Room rules"
    >
      <button
        type="button"
        onClick={() => setCollapsed(v => !v)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
        aria-expanded={!collapsed}
      >
        <span className="text-sm font-semibold text-white">Rules / 规则</span>
        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {collapsed ? '+' : '−'}
        </span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-3 text-xs leading-relaxed text-gray-400">
          <p>
            <span className="text-gray-300">投票：</span>
            每人有 {VOTES_PER_USER} 票，可分散投给多个 idea，也可集中投给一个。调整后会自动保存，不需要点提交。
            <br />
            <span className="text-gray-500">Voting: each person gets {VOTES_PER_USER} votes. Changes auto-save, no submit button needed.</span>
          </p>
          <p>
            <span className="text-gray-300">Idea：</span>
            标题是纯文本，正文支持 Markdown。房间内所有人都可以编辑或删除 idea。
            <br />
            <span className="text-gray-500">Ideas: title is plain text; body supports Markdown. Everyone can edit or delete ideas.</span>
          </p>
          <p>
            <span className="text-gray-300">排行榜：</span>
            按总票数排名，并自动刷新。
            <br />
            <span className="text-gray-500">Leaderboard: ideas are ranked by total votes and refresh automatically.</span>
          </p>
        </div>
      )}
    </aside>
  );
}

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [room, setRoom] = useState<Room | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [myName, setMyName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [nameLoaded, setNameLoaded] = useState(false);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveSeq = useRef(0);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [adding, setAdding] = useState(false);

  const tokensUsed = Object.values(allocations).reduce((s, n) => s + n, 0);
  const tokensLeft = VOTES_PER_USER - tokensUsed;
  const isLight = theme === 'light';

  const loadData = useCallback(async () => {
    const [roomRes, ideasRes] = await Promise.all([
      fetch(`/api/rooms?roomId=${id}`),
      fetch(`/api/rooms/${id}/ideas`),
    ]);
    if (!roomRes.ok) { router.push('/'); return; }

    const { room: r } = await roomRes.json();
    const { ideas: fetched } = await ideasRes.json();

    setRoom(r);
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

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (cancelled) return;
      const savedTheme = localStorage.getItem('room_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function toggleTheme() {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('room_theme', next);
      return next;
    });
  }

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = nameInput.trim();
    if (!cleanName) return;
    cacheName(id, cleanName);
    setMyName(cleanName);
  }

  const saveAllocations = useCallback(async (nextAllocations: Record<string, number>) => {
    if (!myName) return;

    const seq = autoSaveSeq.current + 1;
    autoSaveSeq.current = seq;

    try {
      const res = await fetch(`/api/rooms/${id}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterName: myName, allocations: nextAllocations }),
      });

      if (!res.ok) throw new Error('Unable to save votes');
      if (seq !== autoSaveSeq.current) return;

      await loadData();
    } catch {
      // Keep the optimistic UI; the next vote change will retry auto-save.
    }
  }, [id, loadData, myName]);

  const queueAutoSave = useCallback((nextAllocations: Record<string, number>) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      void saveAllocations(nextAllocations);
    }, 500);
  }, [saveAllocations]);

  function addToken(ideaId: string) {
    if (tokensLeft <= 0) return;
    const next = { ...allocations, [ideaId]: (allocations[ideaId] ?? 0) + 1 };
    setAllocations(next);
    queueAutoSave(next);
  }

  function removeToken(ideaId: string) {
    const cur = allocations[ideaId] ?? 0;
    if (cur <= 0) return;

    const next = { ...allocations };
    if (cur <= 1) delete next[ideaId];
    else next[ideaId] = cur - 1;

    setAllocations(next);
    queueAutoSave(next);
  }

  async function handleDelete(ideaId: string) {
    setIdeas(prev => prev.filter(i => i.id !== ideaId));
    // Also remove any allocated tokens for that idea
    const next = { ...allocations };
    delete next[ideaId];
    setAllocations(next);
    queueAutoSave(next);
    await fetch(`/api/rooms/${id}/ideas/${ideaId}`, { method: 'DELETE' });
  }

  async function handleUpdateIdea(ideaId: string, title: string, description: string) {
    const res = await fetch(`/api/rooms/${id}/ideas/${ideaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });

    if (!res.ok) throw new Error('Unable to update idea');

    const { idea } = await res.json();
    setIdeas(prev => prev.map(item => item.id === idea.id ? idea : item));
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
    <main
      className={`min-h-screen pb-16 ${isLight ? 'room-theme-light' : ''}`}
      style={{ background: isLight ? 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #ffffff 100%)' : 'linear-gradient(135deg, #0f0f13 0%, #1a1a2e 50%, #0f0f13 100%)' }}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-4" style={{ background: isLight ? 'rgba(255,255,255,0.82)' : 'rgba(15,15,19,0.85)', backdropFilter: 'blur(12px)', borderBottom: isLight ? '1px solid rgba(15,23,42,0.1)' : '1px solid rgba(255,255,255,0.08)' }}>
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm px-3 py-1 rounded-full" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
              #{id}
            </span>
            <span className="text-gray-400 text-sm hidden sm:inline">{room.description}</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-white sm:text-2xl">{myName}</p>
        </div>
        <div className="justify-self-end flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{ background: isLight ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.05)', color: isLight ? '#334155' : '#cbd5e1', border: isLight ? '1px solid rgba(15,23,42,0.1)' : '1px solid rgba(255,255,255,0.1)' }}
            aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
            title={isLight ? 'Dark mode' : 'Light mode'}
          >
            {isLight ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M13.5 9.2A5.5 5.5 0 0 1 6.8 2.5a5.8 5.8 0 1 0 6.7 6.7Z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="8" cy="8" r="3" />
                <path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1" />
              </svg>
            )}
          </button>
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
            Leaderboard
          </Link>
        </div>
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
              ? 'All votes allocated. Changes save automatically.'
              : 'Click + on any idea to allocate votes. Changes save automatically.'}
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
              <textarea
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Markdown body (optional), e.g. **Core:** ..., lists, links"
                maxLength={1200}
                rows={4}
                className="w-full resize-y px-3 py-2.5 rounded-lg text-sm outline-none"
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
                  onUpdate={(title, description) => handleUpdateIdea(idea.id, title, description)}
                  onDelete={() => handleDelete(idea.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <RulesPanel />
    </main>
  );
}
