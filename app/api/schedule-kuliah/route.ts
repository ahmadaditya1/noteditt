import { NextResponse } from 'next/server';
import { ensureTablesExist, getDb } from '@/lib/db';
import { JadwalKuliah } from '@/lib/types';

export async function GET() {
  const sql = getDb();
  if (!sql) return NextResponse.json([]);
  await ensureTablesExist();

  try {
    const list = await sql`
      SELECT id, hari, jam_mulai as "jamMulai", jam_selesai as "jamSelesai", mata_kuliah as "mataKuliah", ruang, kelas
      FROM jadwal_kuliah;
    `;
    return NextResponse.json(list);
  } catch (error) {
    console.error('Error fetching jadwal kuliah:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false, mode: 'local', message: 'Database belum terhubung.' });
  await ensureTablesExist();

  try {
    const body = await request.json();

    // Check if bulk import (array of items)
    if (body.items && Array.isArray(body.items)) {
      for (const item of body.items as JadwalKuliah[]) {
        await sql`
          INSERT INTO jadwal_kuliah (id, hari, jam_mulai, jam_selesai, mata_kuliah, ruang, kelas)
          VALUES (${item.id}, ${item.hari}, ${item.jamMulai}, ${item.jamSelesai}, ${item.mataKuliah}, ${item.ruang || ''}, ${item.kelas || ''})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
      return NextResponse.json({ success: true, count: body.items.length });
    }

    // Single item insert
    const { id, hari, jamMulai, jamSelesai, mataKuliah, ruang = '', kelas = '' } = body;
    await sql`
      INSERT INTO jadwal_kuliah (id, hari, jam_mulai, jam_selesai, mata_kuliah, ruang, kelas)
      VALUES (${id}, ${hari}, ${jamMulai}, ${jamSelesai}, ${mataKuliah}, ${ruang}, ${kelas})
      ON CONFLICT (id) DO UPDATE SET
        hari = EXCLUDED.hari,
        jam_mulai = EXCLUDED.jam_mulai,
        jam_selesai = EXCLUDED.jam_selesai,
        mata_kuliah = EXCLUDED.mata_kuliah,
        ruang = EXCLUDED.ruang,
        kelas = EXCLUDED.kelas;
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving jadwal kuliah:', error);
    return NextResponse.json({ success: false, error: 'Gagal menyimpan jadwal kuliah.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ success: false, mode: 'local', message: 'Database belum terhubung.' });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });

  try {
    await sql`DELETE FROM jadwal_kuliah WHERE id = ${id};`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting jadwal kuliah:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
