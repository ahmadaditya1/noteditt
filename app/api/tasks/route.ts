import { NextResponse } from 'next/server';
import { ensureTablesExist, getDb } from '@/lib/db';

export async function GET() {
  const sql = getDb();
  if (!sql) return NextResponse.json([]);
  await ensureTablesExist();

  try {
    const list = await sql`
      SELECT id, title, cat, deadline, done
      FROM tugas;
    `;
    return NextResponse.json(list);
  } catch (error) {
    console.error('Error fetching tugas:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false, error: 'Database belum terhubung.' }, { status: 400 });
  await ensureTablesExist();

  try {
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
    console.error('Error saving tugas:', error);
    return NextResponse.json({ success: false, error: 'Gagal menyimpan tugas.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false }, { status: 400 });
  await ensureTablesExist();

  try {
    const { id, done } = await request.json();
    await sql`UPDATE tugas SET done = ${done} WHERE id = ${id};`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error toggling tugas:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false }, { status: 400 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });

  try {
    await sql`DELETE FROM tugas WHERE id = ${id};`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tugas:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
