import { NextResponse } from 'next/server';
import { ensureTablesExist, getDb, formatDbError } from '@/lib/db';

export const preferredRegion = 'sin1';

export async function GET() {
  const sql = getDb();
  if (!sql) return NextResponse.json([]);

  try {
    await ensureTablesExist();
    const list = await sql`
      SELECT id, content, created_at as "createdAt"
      FROM catatan;
    `;
    return NextResponse.json(list);
  } catch (error) {
    const { message, code } = formatDbError(error);
    console.error('[api/notes] GET failed:', { message, code });
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false, mode: 'local', message: 'Database belum terhubung.' });

  try {
    await ensureTablesExist();
    const { id, content, createdAt } = await request.json();
    await sql`
      INSERT INTO catatan (id, content, created_at)
      VALUES (${id}, ${content}, ${createdAt})
      ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content;
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, code } = formatDbError(error);
    console.error('[api/notes] POST failed:', { message, code });
    return NextResponse.json({ success: false, error: message, code }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false, mode: 'local', message: 'Database belum terhubung.' });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });

  try {
    await ensureTablesExist();
    await sql`DELETE FROM catatan WHERE id = ${id};`;
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, code } = formatDbError(error);
    console.error('[api/notes] DELETE failed:', { message, code });
    return NextResponse.json({ success: false, error: message, code }, { status: 500 });
  }
}
