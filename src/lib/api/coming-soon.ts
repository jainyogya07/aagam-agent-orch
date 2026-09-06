import { NextResponse } from 'next/server';

/** Public surface is reserved. Do not document paths in the product UI. */
export function comingSoon(resource: string) {
  return NextResponse.json(
    {
      status: 'coming soon',
      resource,
      open: false,
    },
    { status: 503, headers: { 'Cache-Control': 'no-store' } }
  );
}
