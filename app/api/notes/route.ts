import { NextResponse } from 'next/server';
import { ensureTablesExist, getDb } from '@/lib/db';

export async function GET() {
  const sql = getDb();
  if (!sql) return NextResponse.json([]);
  await ensureTablesExist();

  try {
    const list = await sql`
      SELECT id, content, created_at as "createdAt"
      FROM catatan;
    `;
    return NextResponse.json(list);
  } catch (error) {
    console.error('Error fetching catatan:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false, mode: 'local', message: 'Database belum terhubung.' });
  await ensureTablesExist();

  try {
    const { id, content, createdAt } = await request.json();
    await sql`
      INSERT INTO catatan (id, content, created_at)
      VALUES (${id}, ${content}, ${createdAt})
      ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content;
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving catatan:', error);
    return NextResponse.json({ success: false, error: 'Gagal menyimpan catatan.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false, mode: 'local', message: 'Database belum terhubung.' });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });

  try {
    await sql`DELETE FROM catatan WHERE id = ${id};`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting catatan:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
