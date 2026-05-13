import { NextRequest, NextResponse } from 'next/server';
import { deleteIdea, updateIdea } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ideaId: string }> }
) {
  const { id, ideaId } = await params;
  const { title, description } = await req.json();

  if (typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  const idea = await updateIdea(
    id,
    ideaId,
    title.trim(),
    typeof description === 'string' ? description.trim() : ''
  );

  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  return NextResponse.json({ idea });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  const { ideaId } = await params;
  const result = await deleteIdea(ideaId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
