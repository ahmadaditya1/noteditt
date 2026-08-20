import { NextResponse } from 'next/server';
import { ensureTablesExist, getDb, formatDbError } from '@/lib/db';

export async function GET() {
  const sql = getDb();
  if (!sql) return NextResponse.json([]);

  try {
    await ensureTablesExist();
    const list = await sql`
      SELECT id, tanggal, jam, judul, catatan
      FROM jadwal_tambahan
      ORDER BY tanggal ASC;
    `;
    return NextResponse.json(list);
  } catch (error) {
    const { message, code } = formatDbError(error);
    console.error('[api/schedule-tambahan] GET failed:', { message, code });
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false, mode: 'local', message: 'Database belum terhubung.' });

  try {
    await ensureTablesExist();
    const { id, tanggal, jam = '', judul, catatan = '' } = await request.json();
    await sql`
      INSERT INTO jadwal_tambahan (id, tanggal, jam, judul, catatan)
      VALUES (${id}, ${tanggal}, ${jam}, ${judul}, ${catatan})
      ON CONFLICT (id) DO UPDATE SET
        tanggal = EXCLUDED.tanggal,
        jam = EXCLUDED.jam,
        judul = EXCLUDED.judul,
        catatan = EXCLUDED.catatan;
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, code } = formatDbError(error);
    console.error('[api/schedule-tambahan] POST failed:', { message, code });
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
    await sql`DELETE FROM jadwal_tambahan WHERE id = ${id};`;
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, code } = formatDbError(error);
    console.error('[api/schedule-tambahan] DELETE failed:', { message, code });
    return NextResponse.json({ success: false, error: message, code }, { status: 500 });
  }
}
