import { NextResponse } from 'next/server';
import { ensureTablesExist, getDb, formatDbError } from '@/lib/db';

export const preferredRegion = 'sin1';

export async function GET() {
  const sql = getDb();
  if (!sql) return NextResponse.json([]);

  try {
    await ensureTablesExist();
    const list = await sql`
      SELECT id, title, cat, deadline, done
      FROM tugas;
    `;
    return NextResponse.json(list);
  } catch (error) {
    const { message, code } = formatDbError(error);
    console.error('[api/tasks] GET failed:', { message, code });
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false, mode: 'local', message: 'Database belum terhubung.' });

  try {
    await ensureTablesExist();
    const { id, title, cat, deadline = '', done = false } = await request.json();
    await sql`
      INSERT INTO tugas (id, title, cat, deadline, done)
      VALUES (${id}, ${title}, ${cat}, ${deadline}, ${done})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        cat = EXCLUDED.cat,
        deadline = EXCLUDED.deadline,
        done = EXCLUDED.done;
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, code } = formatDbError(error);
    console.error('[api/tasks] POST failed:', { message, code });
    return NextResponse.json({ success: false, error: message, code }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false, mode: 'local', message: 'Database belum terhubung.' });

  try {
    await ensureTablesExist();
    const { id, done } = await request.json();
    await sql`UPDATE tugas SET done = ${done} WHERE id = ${id};`;
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, code } = formatDbError(error);
    console.error('[api/tasks] PATCH failed:', { message, code });
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
    await sql`DELETE FROM tugas WHERE id = ${id};`;
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, code } = formatDbError(error);
    console.error('[api/tasks] DELETE failed:', { message, code });
    return NextResponse.json({ success: false, error: message, code }, { status: 500 });
  }
}
