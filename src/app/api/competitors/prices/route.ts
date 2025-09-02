import { NextResponse } from 'next/server';
import { getLatestBySource } from '../../../../lib/competitors/store';

export async function GET() {
  try {
    const [cerini, mala] = await Promise.all([
      getLatestBySource('cerini'),
      getLatestBySource('mala'),
    ]);
    return NextResponse.json({ cerini, mala });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 });
  }
}


