import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    const validCode = process.env.ACCESS_CODE || '1234';

    if (!code || String(code) !== String(validCode)) {
      return NextResponse.json(
        { success: false, message: 'Kode akses salah.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });

    // Set cookie persisten 30 hari
    response.cookies.set('auth_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 hari
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server.' },
      { status: 500 }
    );
  }
}
