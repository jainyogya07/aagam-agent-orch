// ============================================================
// Live V1 → V2 Architecture Evolution API Route
// ============================================================
// Triggers deterministic V1 (5 agents) → Contribution Analysis
// → Resource Reclaim → Mutation → V2 (4 agents) execution.
// Returns complete comparison matrix.
// ============================================================

import { V1V2Showcase, DEFAULT_EVOLUTION_POLICY, type EvolutionPolicyConfig } from '@/lib/benchmark/v1-v2-showcase';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const policy: EvolutionPolicyConfig = {
      policyName: body.policyName || DEFAULT_EVOLUTION_POLICY.policyName,
      marginalContributionThreshold: body.marginalContributionThreshold ?? DEFAULT_EVOLUTION_POLICY.marginalContributionThreshold,
      redundancyThreshold: body.redundancyThreshold ?? DEFAULT_EVOLUTION_POLICY.redundancyThreshold,
      reclaimPercentage: body.reclaimPercentage ?? DEFAULT_EVOLUTION_POLICY.reclaimPercentage,
      explanation: body.explanation || DEFAULT_EVOLUTION_POLICY.explanation,
    };

    const result = await V1V2Showcase.executeShowcase(policy);
    return Response.json(result);

  } catch (err) {
    return Response.json({
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    description: 'Deterministic V1 → V2 Live Architecture Evolution Showcase',
    defaultPolicy: DEFAULT_EVOLUTION_POLICY,
    v1AgentTopology: [
      'Market Intelligence Specialist (ANALYSIS)',
      'Quantitative Financial Modeler (COMPUTATION)',
      'Redundant Raw Web Scraper (LOW_VALUE_BRANCH)',
      'Adversarial Risk & Defensibility Auditor (VERIFICATION)',
      'Lead Executive Decision Synthesizer (SYNTHESIS)',
    ],
    v2EvolvedTopology: [
      'Market Intelligence Specialist (ANALYSIS)',
      'Quantitative Financial Modeler (COMPUTATION - Upgraded Budget)',
      'Adversarial Risk & Defensibility Auditor (VERIFICATION - Upgraded Budget)',
      'Lead Executive Decision Synthesizer (SYNTHESIS)',
    ],
  });
}
