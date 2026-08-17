import { NextResponse } from 'next/server';
import { ensureTablesExist, getDb } from '@/lib/db';

export async function GET() {
  const sql = getDb();
  if (!sql) return NextResponse.json([]);
  await ensureTablesExist();

  try {
    const list = await sql`
      SELECT id, tanggal, platform, status, caption
      FROM konten_calendar
      ORDER BY tanggal ASC;
    `;
    return NextResponse.json(list);
  } catch (error) {
    console.error('Error fetching content calendar:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false, mode: 'local', message: 'Database belum terhubung.' });
  await ensureTablesExist();

  try {
    const { id, tanggal, platform, status, caption } = await request.json();
    await sql`
      INSERT INTO konten_calendar (id, tanggal, platform, status, caption)
      VALUES (${id}, ${tanggal}, ${platform}, ${status}, ${caption})
      ON CONFLICT (id) DO UPDATE SET
        tanggal = EXCLUDED.tanggal,
        platform = EXCLUDED.platform,
        status = EXCLUDED.status,
        caption = EXCLUDED.caption;
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving content calendar:', error);
    return NextResponse.json({ success: false, error: 'Gagal menyimpan konten.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false, mode: 'local', message: 'Database belum terhubung.' });
  await ensureTablesExist();

  try {
    const { id, status } = await request.json();
    await sql`UPDATE konten_calendar SET status = ${status} WHERE id = ${id};`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating content status:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false, mode: 'local', message: 'Database belum terhubung.' });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });

  try {
    await sql`DELETE FROM konten_calendar WHERE id = ${id};`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
