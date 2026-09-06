import { comingSoon } from '@/lib/api/coming-soon';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return comingSoon('runs');
}
