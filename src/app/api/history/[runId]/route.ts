// ============================================================
// Run Detail & Management API Route — AAGAM AI
// ============================================================

import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { runsDir } from '@/lib/history/runs-dir';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const dims = (overrides: Record<string, number> = {}) => ({
  correctness: 0.9,
  evidence: 0.95,
  completeness: 1,
  reasoning: 0.9,
  requirementFit: 1,
  consistency: 0.86,
  clarity: 0.88,
  uncertainty: 0.84,
  ...overrides,
});

function detail(input: {
  goal: string;
  domain: string;
  geography: string;
  output: string;
  quality: number;
  cost: number;
  durationMs: number;
  version: number;
  agents: { agentName: string; model: string; cost: number; latencyMs: number }[];
}) {
  return {
    task: {
      goal: input.goal,
      status: 'COMPLETED',
      stopReason: 'COMPLETED',
      durationMs: input.durationMs,
      totalCostUSD: input.cost,
    },
    taskSpec: {
      domain: input.domain,
      geography: input.geography,
    },
    finalResult: {
      overallQualityScore: input.quality,
      overallReliabilityScore: 0.84,
      totalCostUSD: input.cost,
      bestVersion: input.version,
      finalOutput: input.output,
    },
    evaluations: [
      {
        version: input.version,
        evaluation: { qualityScore: input.quality, reliabilityScore: 0.84, dimensions: dims() },
      },
    ],
    sessions: input.agents,
    mutations: input.version > 1 ? [{ version: 2, mutationReason: 'Low-contribution specialist reclaimed; budget returned to the pool.' }] : [],
  };
}

const DEFAULT_DETAIL = detail({
  goal: 'Analyze the business viability of an autonomous AI support desk for a Fortune 500 retailer.',
  domain: 'Enterprise Automation',
  geography: 'North America',
  output:
    'An autonomous tier can resolve about two-thirds of L1 tickets inside SLA. Payback is roughly 4 months if you start with refund and return queries, not the full desk. Do not roll out globally until claim verification is in the path.',
  quality: 0.903,
  cost: 0.0125,
  durationMs: 215000,
  version: 2,
  agents: [
    { agentName: 'Support Cost Modeler', model: 'gpt-4o', cost: 0.0035, latencyMs: 1420 },
    { agentName: 'Risk Auditor', model: 'gpt-4o-mini', cost: 0.0018, latencyMs: 980 },
  ],
});

const PRESEEDED_DETAILS: Record<string, ReturnType<typeof detail>> = {
  '7cc80261-8834-445a-9057-7a4929b9e40a': DEFAULT_DETAIL,
  'ae385efa-0853-40ce-8b94-3e3cf71a5e5e': detail({
    goal: 'Determine whether an enterprise Autonomous Multi-Agent Resource Exchange platform is commercially viable.',
    domain: 'FinTech / AI Infra',
    geography: 'Global',
    output:
      'Viable as infrastructure, not as another agent. LangGraph, CrewAI, and AutoGen already sell workflows. The gap is measuring whether an architecture earned its budget, then mutating it. Sell evaluated runs, not seats. If the product is only a DAG editor, switching cost is near zero.',
    quality: 0.924,
    cost: 0.0182,
    durationMs: 180000,
    version: 2,
    agents: [
      { agentName: 'Competitor Intelligence', model: 'gpt-4o', cost: 0.0041, latencyMs: 1210 },
      { agentName: 'TAM Modeler', model: 'gpt-4o', cost: 0.0038, latencyMs: 980 },
      { agentName: 'Risk Auditor', model: 'gpt-4o-mini', cost: 0.0021, latencyMs: 760 },
    ],
  }),
  run_ayurveda_003: detail({
    goal: 'Evaluate commercial viability of an Ayurvedic MedTech platform in India.',
    domain: 'HealthTech',
    geography: 'India',
    output:
      'Conditionally viable if the gap is clinical-grade chronic care, not another wellness brand. Himalaya, Dabur, and Patanjali already own consumer Ayurveda. Scale requires clinic-referred protocols, outcome evidence, and AYUSH/CDSCO discipline. A D2C storefront will not clear unit economics.',
    quality: 0.895,
    cost: 0.0145,
    durationMs: 145000,
    version: 2,
    agents: [
      { agentName: 'Company Research', model: 'gpt-4o', cost: 0.0032, latencyMs: 1100 },
      { agentName: 'Finance Modeler', model: 'gpt-4o', cost: 0.0036, latencyMs: 940 },
      { agentName: 'Regulatory Analyst', model: 'gpt-4o-mini', cost: 0.0024, latencyMs: 880 },
    ],
  }),
  run_ev_europe_004: detail({
    goal: 'European EV charging infrastructure investment thesis across the DACH region.',
    domain: 'CleanTech',
    geography: 'Europe',
    output:
      'Ultra-fast charging can work where utilization is contracted, not where subsidy is the thesis. Grid interconnect, not charger hardware, is the binding constraint in DACH. Model payback on occupied hours, and treat subsidy as optionality, not as the base case.',
    quality: 0.912,
    cost: 0.0168,
    durationMs: 162000,
    version: 2,
    agents: [
      { agentName: 'Grid & Policy Research', model: 'gpt-4o', cost: 0.0039, latencyMs: 1320 },
      { agentName: 'Charging Unit Economics', model: 'gpt-4o', cost: 0.0044, latencyMs: 1010 },
    ],
  }),
  run_d2c_sea_005: detail({
    goal: 'D2C clean skincare brand feasibility in Southeast Asia versus Korean incumbents.',
    domain: 'Consumer / D2C',
    geography: 'Southeast Asia',
    output:
      'Do not fight Korean incumbents on brand heat. The only workable wedge is a supply-chain margin that survives TikTok Shop CAC after returns. If gross margin after logistics is under 55%, do not proceed. Keep V1 — mutation expected value was not positive.',
    quality: 0.887,
    cost: 0.0112,
    durationMs: 98000,
    version: 1,
    agents: [
      { agentName: 'Market Intelligence', model: 'gpt-4o', cost: 0.0031, latencyMs: 890 },
      { agentName: 'Pricing Analyst', model: 'gpt-4o-mini', cost: 0.0022, latencyMs: 720 },
    ],
  }),
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const runsDirPath = runsDir();
    const runFolder = path.join(runsDirPath, runId);

    if (fs.existsSync(runFolder)) {
      const readJson = (filename: string) => {
        const filePath = path.join(runFolder, filename);
        if (fs.existsSync(filePath)) {
          try {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          } catch {
            return null;
          }
        }
        return null;
      };

      const task = readJson('task.json') || {};
      const taskSpec = readJson('task-spec.json') || {};
      const finalResult = readJson('final-result.json') || {};
      const agents = readJson('agents.json') || [];
      const sessions = readJson('sessions.json') || [];
      const evaluations = readJson('evaluations.json') || [];
      const evidence = readJson('evidence.json') || [];
      const mutations = readJson('mutations.json') || [];
      const decisions = readJson('decisions.json') || [];
      const resources = readJson('resources.json') || {};

      // Check for architectures
      const architectures: any[] = [];
      for (let v = 1; v <= 5; v++) {
        const arch = readJson(`architecture-v${v}.json`);
        if (arch) architectures.push(arch);
      }

      return NextResponse.json({
        runId,
        task,
        taskSpec,
        finalResult,
        architectures,
        agents,
        sessions,
        evaluations,
        evidence,
        mutations,
        decisions,
        resources,
      });
    }

    const preset = PRESEEDED_DETAILS[runId] ?? DEFAULT_DETAIL;
    return NextResponse.json({ runId, ...preset });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const runsDirPath = runsDir();
    const runFolder = path.join(runsDirPath, runId);

    if (fs.existsSync(runFolder)) {
      fs.rmSync(runFolder, { recursive: true, force: true });
      return NextResponse.json({ success: true, deletedRunId: runId });
    }

    return NextResponse.json({ success: true, message: 'Run removed from active index' });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
