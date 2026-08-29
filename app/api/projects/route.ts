import { NextResponse } from 'next/server';
import { ensureTablesExist, getDb, formatDbError } from '@/lib/db';

export const preferredRegion = 'sin1';

export async function GET() {
  const sql = getDb();
  if (!sql) return NextResponse.json([]);

  try {
    await ensureTablesExist();
    const list = await sql`
      SELECT id, nama, status, deskripsi
      FROM proyek;
    `;
    return NextResponse.json(list);
  } catch (error) {
    const { message, code } = formatDbError(error);
    console.error('[api/projects] GET failed:', { message, code });
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false, mode: 'local', message: 'Database belum terhubung.' });

  try {
    await ensureTablesExist();
    const { id, nama, status, deskripsi = '' } = await request.json();
    await sql`
      INSERT INTO proyek (id, nama, status, deskripsi)
      VALUES (${id}, ${nama}, ${status}, ${deskripsi})
      ON CONFLICT (id) DO UPDATE SET
        nama = EXCLUDED.nama,
        status = EXCLUDED.status,
        deskripsi = EXCLUDED.deskripsi;
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, code } = formatDbError(error);
    console.error('[api/projects] POST failed:', { message, code });
    return NextResponse.json({ success: false, error: message, code }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false, mode: 'local', message: 'Database belum terhubung.' });

  try {
    await ensureTablesExist();
    const { id, status } = await request.json();
    await sql`UPDATE proyek SET status = ${status} WHERE id = ${id};`;
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, code } = formatDbError(error);
    console.error('[api/projects] PATCH failed:', { message, code });
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
    await sql`DELETE FROM proyek WHERE id = ${id};`;
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, code } = formatDbError(error);
    console.error('[api/projects] DELETE failed:', { message, code });
    return NextResponse.json({ success: false, error: message, code }, { status: 500 });
  }
}
