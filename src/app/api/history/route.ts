// ============================================================
// Dynamic History API Route — AAGAM AI
// ============================================================
// Reads runs from the local RunArtifactStore (./runs/) and DB,
// with search, status filtering, and fallback pre-seeded runs.
// ============================================================

import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { runsDir } from '@/lib/history/runs-dir';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface HistoryItem {
  runId: string;
  taskId: string;
  goal: string;
  status: 'completed' | 'failed' | 'timeout';
  quality: number;
  reliability: number;
  cost: number;
  domain: string;
  geography: string;
  finalVersion: number;
  agentCount: number;
  sessionCount: number;
  createdAt: string;
  completedAt: string | null;
  durationMs: number;
  aoSessionId?: string;
  stopReason?: string;
}

const PRESEEDED_RUNS: HistoryItem[] = [
  {
    runId: '7cc80261-8834-445a-9057-7a4929b9e40a',
    taskId: 'task_7cc80261',
    goal: 'Analyze the business viability and enterprise ROI of migrating from human L1 support to autonomous AI agents for a Fortune 500 retailer with 1.2M annual tickets.',
    status: 'completed',
    quality: 0.903,
    reliability: 0.840,
    cost: 0.0125,
    domain: 'Enterprise Automation',
    geography: 'North America',
    finalVersion: 2,
    agentCount: 4,
    sessionCount: 12,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 2 + 215000).toISOString(),
    durationMs: 215135,
    aoSessionId: 'AO-3',
    stopReason: 'COMPLETED',
  },
  {
    runId: 'ae385efa-0853-40ce-8b94-3e3cf71a5e5e',
    taskId: 'task_ae385efa',
    goal: 'Determine whether an enterprise Autonomous Multi-Agent Resource Exchange platform with dynamic budget reallocation is commercially viable ($42.6B TAM by 2026).',
    status: 'completed',
    quality: 0.924,
    reliability: 0.880,
    cost: 0.0182,
    domain: 'FinTech / AI Infra',
    geography: 'Global',
    finalVersion: 2,
    agentCount: 5,
    sessionCount: 15,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 5 + 180000).toISOString(),
    durationMs: 180000,
    aoSessionId: 'AO-2',
    stopReason: 'COMPLETED',
  },
  {
    runId: 'run_ayurveda_003',
    taskId: 'task_ayurveda',
    goal: 'Evaluate commercial viability and regulatory approval path of an Ayurvedic MedTech platform targeting chronic lifestyle disorders in Tier 1 Indian metros.',
    status: 'completed',
    quality: 0.895,
    reliability: 0.852,
    cost: 0.0145,
    domain: 'HealthTech',
    geography: 'India',
    finalVersion: 2,
    agentCount: 4,
    sessionCount: 10,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 12 + 145000).toISOString(),
    durationMs: 145000,
    aoSessionId: 'AO-1',
    stopReason: 'COMPLETED',
  },
  {
    runId: 'run_ev_europe_004',
    taskId: 'task_ev_europe',
    goal: 'European EV charging infrastructure investment thesis: Assess grid capacity constraints, ultra-fast charging unit economics, and subsidy exposure across DACH region.',
    status: 'completed',
    quality: 0.912,
    reliability: 0.865,
    cost: 0.0168,
    domain: 'CleanTech',
    geography: 'Europe',
    finalVersion: 2,
    agentCount: 5,
    sessionCount: 14,
    createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 1.5 + 162000).toISOString(),
    durationMs: 162000,
    aoSessionId: 'AO-4',
    stopReason: 'COMPLETED',
  },
  {
    runId: 'run_d2c_sea_005',
    taskId: 'task_d2c_sea',
    goal: 'D2C clean skincare brand market feasibility in Southeast Asia: competitive moats against Korean incumbents, supply chain margin tolerance, and TikTok Shop CAC.',
    status: 'completed',
    quality: 0.887,
    reliability: 0.835,
    cost: 0.0112,
    domain: 'Consumer / D2C',
    geography: 'Southeast Asia',
    finalVersion: 1,
    agentCount: 4,
    sessionCount: 8,
    createdAt: new Date(Date.now() - 86400000 * 2.5).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 2.5 + 98000).toISOString(),
    durationMs: 98000,
    stopReason: 'COMPLETED',
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('status') || 'all';
    const search = (searchParams.get('search') || '').toLowerCase().trim();
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const runsDirPath = runsDir();
    const diskRuns: HistoryItem[] = [];

    if (fs.existsSync(runsDirPath)) {
      const entries = fs.readdirSync(runsDirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === 'benchmarks') continue;

        const runFolder = path.join(runsDirPath, entry.name);
        const taskPath = path.join(runFolder, 'task.json');
        const finalResultPath = path.join(runFolder, 'final-result.json');
        const taskSpecPath = path.join(runFolder, 'task-spec.json');
        const sessionsPath = path.join(runFolder, 'sessions.json');
        const evalsPath = path.join(runFolder, 'evaluations.json');

        if (fs.existsSync(taskPath)) {
          try {
            const taskData = JSON.parse(fs.readFileSync(taskPath, 'utf-8'));
            const finalResult = fs.existsSync(finalResultPath)
              ? JSON.parse(fs.readFileSync(finalResultPath, 'utf-8'))
              : {};
            const taskSpec = fs.existsSync(taskSpecPath)
              ? JSON.parse(fs.readFileSync(taskSpecPath, 'utf-8'))
              : {};
            const sessions = fs.existsSync(sessionsPath)
              ? JSON.parse(fs.readFileSync(sessionsPath, 'utf-8'))
              : [];
            const evals = fs.existsSync(evalsPath)
              ? JSON.parse(fs.readFileSync(evalsPath, 'utf-8'))
              : [];

            const aoSession = Array.isArray(sessions)
              ? sessions.find((s: any) => s.aoSession?.aoSessionId)?.aoSession?.aoSessionId
              : undefined;

            const bestEval = evals.length > 0 ? evals[evals.length - 1] : null;

            const stats = fs.statSync(taskPath);

            diskRuns.push({
              runId: entry.name,
              taskId: taskData.taskId || `task_${entry.name.slice(0, 8)}`,
              goal:
                typeof taskData.goal === 'string'
                  ? taskData.goal
                  : typeof taskData.goal?.rawGoal === 'string'
                    ? taskData.goal.rawGoal
                    : 'Orchestration run',
              status: (String(taskData.status || 'completed').toLowerCase() === 'failed' ? 'failed' : 'completed') as HistoryItem['status'],
              quality: Number(finalResult.overallQualityScore ?? bestEval?.evaluation?.qualityScore ?? 0),
              reliability: Number(finalResult.overallReliabilityScore ?? bestEval?.evaluation?.reliabilityScore ?? 0),
              cost: Number(finalResult.totalCostUSD ?? taskData.totalCostUSD ?? 0),
              domain:
                typeof taskSpec.domain === 'string'
                  ? taskSpec.domain
                  : taskSpec.understanding?.extracted?.domain || 'Strategy',
              geography:
                typeof taskSpec.geography === 'string'
                  ? taskSpec.geography
                  : taskSpec.understanding?.extracted?.geography || 'Global',
              finalVersion: finalResult.bestVersion ?? 2,
              agentCount: Array.isArray(sessions) ? sessions.length : 4,
              sessionCount: Array.isArray(sessions) ? sessions.length : 10,
              createdAt: stats.birthtime.toISOString(),
              completedAt: stats.mtime.toISOString(),
              durationMs: taskData.durationMs || 120000,
              aoSessionId: aoSession,
              stopReason: taskData.stopReason || 'COMPLETED',
            });
          } catch (e) {
            // Ignore malformed run folders
          }
        }
      }
    }

    // Merge disk runs with preseeded runs (ensuring no duplicate runIds)
    const existingIds = new Set(diskRuns.map((r) => r.runId));
    const combined = [...diskRuns];
    for (const pre of PRESEEDED_RUNS) {
      if (!existingIds.has(pre.runId)) {
        combined.push(pre);
      }
    }

    // Filter by status
    let filtered = combined;
    if (filter !== 'all') {
      filtered = filtered.filter((r) => r.status === filter);
    }

    // Filter by search
    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.goal.toLowerCase().includes(search) ||
          r.domain.toLowerCase().includes(search) ||
          r.geography.toLowerCase().includes(search) ||
          r.runId.toLowerCase().includes(search)
      );
    }

    // Sort descending by creation date
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      runs: paginated,
      total,
      offset,
      limit,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      runId?: string;
      goal?: string;
      domain?: string;
      geography?: string;
      quality?: number;
      reliability?: number;
      confidence?: number;
      cost?: number;
      version?: number;
      memo?: string;
      dimensions?: Record<string, number>;
      agents?: { agentName: string; model?: string; cost?: number }[];
    };

    const runId = body.runId || `run_${Date.now()}`;
    const runsDirPath = runsDir();
    const runFolder = path.join(runsDirPath, runId);
    fs.mkdirSync(runFolder, { recursive: true });

    const quality = Number(body.quality ?? 0);
    const reliability = Number(body.reliability ?? 0);
    const write = (name: string, data: unknown) =>
      fs.writeFileSync(path.join(runFolder, name), JSON.stringify(data, null, 2), 'utf-8');

    write('task.json', {
      runId,
      taskId: `task_${runId.slice(0, 12)}`,
      goal: body.goal || 'Orchestration run',
      status: 'COMPLETED',
      stopReason: 'COMPLETED',
      durationMs: 0,
      totalCostUSD: Number(body.cost ?? 0),
    });
    write('task-spec.json', {
      domain: body.domain || 'Strategy',
      geography: body.geography || 'Global',
      rawGoal: body.goal || '',
    });
    write('final-result.json', {
      overallQualityScore: quality,
      overallReliabilityScore: reliability,
      evidenceCoverageRatio: Number(body.confidence ?? 0),
      totalCostUSD: Number(body.cost ?? 0),
      bestVersion: body.version ?? 1,
      finalOutput: body.memo || '',
    });
    write('evaluations.json', [
      {
        version: body.version ?? 1,
        evaluation: {
          qualityScore: quality,
          reliabilityScore: reliability,
          dimensions: body.dimensions || {},
        },
      },
    ]);
    write('sessions.json', body.agents || []);

    return NextResponse.json({ ok: true, runId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
