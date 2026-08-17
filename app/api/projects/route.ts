import { NextResponse } from 'next/server';
import { ensureTablesExist, getDb } from '@/lib/db';

export async function GET() {
  const sql = getDb();
  if (!sql) return NextResponse.json([]);
  await ensureTablesExist();

  try {
    const list = await sql`
      SELECT id, nama, status, deskripsi
      FROM proyek;
    `;
    return NextResponse.json(list);
  } catch (error) {
    console.error('Error fetching proyek:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false, error: 'Database belum terhubung.' }, { status: 400 });
  await ensureTablesExist();

  try {
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
    console.error('Error saving proyek:', error);
    return NextResponse.json({ success: false, error: 'Gagal menyimpan proyek.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false }, { status: 400 });
  await ensureTablesExist();

  try {
    const { id, status } = await request.json();
    await sql`UPDATE proyek SET status = ${status} WHERE id = ${id};`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating project status:', error);
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
    await sql`DELETE FROM proyek WHERE id = ${id};`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
