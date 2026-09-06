import path from 'path';

export function runsDir() {
  if (process.env.VERCEL) return path.join('/tmp', 'aagam-runs');
  return path.join(process.cwd(), 'runs');
}
