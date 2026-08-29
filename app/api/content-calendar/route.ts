import { NextResponse } from 'next/server';
import { ensureTablesExist, getDb, formatDbError } from '@/lib/db';

export const preferredRegion = 'sin1';

export async function GET() {
  const sql = getDb();
  if (!sql) return NextResponse.json([]);

  try {
    await ensureTablesExist();
    const list = await sql`
      SELECT id, tanggal, platform, status, caption
      FROM konten_calendar
      ORDER BY tanggal ASC;
    `;
    return NextResponse.json(list);
  } catch (error) {
    const { message, code } = formatDbError(error);
    console.error('[api/content-calendar] GET failed:', { message, code });
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false, mode: 'local', message: 'Database belum terhubung.' });

  try {
    await ensureTablesExist();
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
    const { message, code } = formatDbError(error);
    console.error('[api/content-calendar] POST failed:', { message, code });
    return NextResponse.json({ success: false, error: message, code }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false, mode: 'local', message: 'Database belum terhubung.' });

  try {
    await ensureTablesExist();
    const { id, status } = await request.json();
    await sql`UPDATE konten_calendar SET status = ${status} WHERE id = ${id};`;
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, code } = formatDbError(error);
    console.error('[api/content-calendar] PATCH failed:', { message, code });
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
    await sql`DELETE FROM konten_calendar WHERE id = ${id};`;
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, code } = formatDbError(error);
    console.error('[api/content-calendar] DELETE failed:', { message, code });
    return NextResponse.json({ success: false, error: message, code }, { status: 500 });
  }
}
