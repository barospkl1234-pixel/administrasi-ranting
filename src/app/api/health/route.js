import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    name: 'SIAD IPNU IPPNU Next.js API',
    timestamp: new Date().toISOString()
  });
}
