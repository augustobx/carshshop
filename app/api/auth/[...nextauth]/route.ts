import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Auth manejado nativamente por OnlyCars SaaS' });
}

export async function POST() {
  return NextResponse.json({ message: 'Auth manejado nativamente por OnlyCars SaaS' });
}