'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleEnter(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId.trim() || !name.trim()) return;
    setLoading(true);
    setError('');

    const cleanId = roomId.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');

    try {
      await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: cleanId,
          description: description.trim() || `Room ${cleanId}`,
        }),
      });

      sessionStorage.setItem(`name_${cleanId}`, name.trim());
      router.push(`/room/${cleanId}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0f0f13 0%, #1a1a2e 50%, #0f0f13 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M8 24L16 8L24 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10.5 19H21.5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">IdeaRank</h1>
          <p className="text-gray-400 mt-2">Collect ideas. Rank together. See what wins.</p>
        </div>

        {/* Card */}
        <form onSubmit={handleEnter} className="rounded-2xl p-8 space-y-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Room Number</label>
            <input
              type="text"
              value={roomId}
              onChange={e => setRoomId(e.target.value.toUpperCase())}
              placeholder="e.g. HACKATHON-42"
              maxLength={20}
              required
              className="w-full px-4 py-3 rounded-xl text-white font-mono text-lg tracking-widest outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
              onFocus={e => (e.target.style.borderColor = '#6366f1')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
            />
            <p className="text-xs text-gray-500 mt-1">Share this code with your group. A new room is created automatically.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Alice"
              maxLength={40}
              required
              className="w-full px-4 py-3 rounded-xl text-white outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
              onFocus={e => (e.target.style.borderColor = '#6366f1')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Room Description <span className="text-gray-500">(optional)</span></label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Hackathon idea voting session"
              maxLength={100}
              className="w-full px-4 py-3 rounded-xl text-white outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
              onFocus={e => (e.target.style.borderColor = '#6366f1')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !roomId.trim() || !name.trim()}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: loading ? '#4f46e5' : 'linear-gradient(135deg, #6366f1, #a855f7)' }}
          >
            {loading ? 'Entering room...' : 'Enter Room →'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-6">
          Same room code = same room. Share it with your team.
        </p>
      </div>
    </main>
  );
}
