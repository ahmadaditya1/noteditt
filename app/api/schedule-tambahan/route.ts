import { NextResponse } from 'next/server';
import { ensureTablesExist, getDb } from '@/lib/db';

export async function GET() {
  const sql = getDb();
  if (!sql) return NextResponse.json([]);
  await ensureTablesExist();

  try {
    const list = await sql`
      SELECT id, tanggal, jam, judul, catatan
      FROM jadwal_tambahan
      ORDER BY tanggal ASC;
    `;
    return NextResponse.json(list);
  } catch (error) {
    console.error('Error fetching jadwal tambahan:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false, mode: 'local', message: 'Database belum terhubung.' });
  await ensureTablesExist();

  try {
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
    console.error('Error saving jadwal tambahan:', error);
    return NextResponse.json({ success: false, error: 'Gagal menyimpan acara tambahan.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false, mode: 'local', message: 'Database belum terhubung.' });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });

  try {
    await sql`DELETE FROM jadwal_tambahan WHERE id = ${id};`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting jadwal tambahan:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
