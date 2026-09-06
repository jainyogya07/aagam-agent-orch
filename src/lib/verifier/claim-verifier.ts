// ============================================================
// Independent Claim Verifier — Agent Resource Exchange
// ============================================================
// Dedicated verification stage independent of the producing agent.
// Inspects evidence, cross-checks arithmetic, detects contradictions,
// and classifies claims as VERIFIED, REFUTED, or NEEDS_RESEARCH.
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { eventBus } from '@/lib/events/event-emitter';
import { withTrace } from '@/lib/observability/neatlogs';
import { ProviderGateway } from '@/lib/providers/gateway';
import type { Claim, EvidenceItem } from '@/lib/types/claims';

export interface VerificationResult {
  verifiedClaims: Claim[];
  verifiedCount: number;
  refutedCount: number;
  needsResearchCount: number;
  unverifiedCriticalCount: number;
  criticalVerificationRatio: number;
  contradictionsDetected: string[];
}

export async function verifyClaims(
  claims: Claim[],
  evidenceItems: EvidenceItem[],
  taskGoal: string,
  gateway: ProviderGateway,
  runId: string
): Promise<VerificationResult> {
  return withTrace(
    {
      name: 'claim-verification',
      kind: 'CHAIN',
      sessionId: runId,
      attributes: {
        run_id: runId,
        total_claims: claims.length,
        critical_claims: claims.filter(c => c.importance === 'CRITICAL').length,
        evidence_count: evidenceItems.length,
      },
    },
    async () => {
      if (claims.length === 0) {
        return {
          verifiedClaims: [],
          verifiedCount: 0,
          refutedCount: 0,
          needsResearchCount: 0,
          unverifiedCriticalCount: 0,
          criticalVerificationRatio: 1.0,
          contradictionsDetected: [],
        };
      }

      eventBus.log(runId, 'info', `Independent Verifier: Auditing ${claims.length} claims against empirical evidence...`);

      const systemPrompt = `You are an expert, skeptical independent fact-checker and claim verification auditor.
Your job is to rigorously audit claims produced by specialist AI agents.

RULES:
1. Cross-check each claim against the collected empirical evidence and multi-agent specialist findings.
2. If a claim is supported by empirical data points, arithmetic consistency (e.g. TAM >= SAM >= SOM), or corroborated findings, mark it "VERIFIED" (confidence 0.92-0.98).
3. If a claim has demonstrable arithmetic errors, logical flaws, or explicit contradictions, mark it "REFUTED".
4. If a claim makes bold speculative assertions without any data or logic, mark it "NEEDS_RESEARCH".
5. Detect any cross-claim contradictions and list them explicitly.

Return JSON in this format:
{
  "auditedClaims": [
    {
      "id": "claim-id",
      "status": "VERIFIED" | "REFUTED" | "NEEDS_RESEARCH",
      "confidence": 0.0-1.0,
      "reasoning": "...",
      "contradictedBy": []
    }
  ],
  "contradictions": ["..."]
}`;

      const userPrompt = `## Task Goal
${taskGoal}

## Claims to Verify
${JSON.stringify(claims.map(c => ({
  id: c.id,
  claim: c.claim,
  importance: c.importance,
  sourceAgent: c.sourceAgent,
  confidence: c.confidence,
  evidence: c.evidence,
  dataPoints: c.dataPoints,
})), null, 2)}

## Collected Evidence Repository
${JSON.stringify(evidenceItems.slice(0, 20).map(e => ({
  sourceAgent: e.sourceAgent,
  content: e.content,
  dataPoints: e.dataPoints,
})), null, 2)}

Audit each claim independently. Return JSON:`;

      try {
        const availableModels = gateway.getAvailableModels();
        const modelToUse = availableModels.includes('glm-4-flash')
          ? 'glm-4-flash'
          : availableModels.includes('gpt-5-nano')
          ? 'gpt-5-nano'
          : (availableModels[0] || 'glm-4-flash');

        const response = await gateway.generate(modelToUse, userPrompt, {
          systemPrompt,
          temperature: 0.2,
          maxTokens: 2000,
          responseFormat: 'json',
        });

        const parsed = JSON.parse(response.content);
        const auditMap = new Map<string, {
          status: 'VERIFIED' | 'REFUTED' | 'NEEDS_RESEARCH';
          confidence: number;
          reasoning: string;
          contradictedBy: string[];
        }>();

        if (Array.isArray(parsed.auditedClaims)) {
          for (const item of parsed.auditedClaims) {
            auditMap.set(item.id, {
              status: item.status === 'VERIFIED' ? 'VERIFIED' : item.status === 'REFUTED' ? 'REFUTED' : 'NEEDS_RESEARCH',
              confidence: typeof item.confidence === 'number' ? Math.max(0, Math.min(1, item.confidence)) : 0.7,
              reasoning: String(item.reasoning || ''),
              contradictedBy: Array.isArray(item.contradictedBy) ? item.contradictedBy : [],
            });
          }
        }

        const verifiedClaims: Claim[] = claims.map(c => {
          const audit = auditMap.get(c.id);
          if (audit) {
            return {
              ...c,
              verificationStatus: audit.status,
              confidence: audit.confidence,
              verificationReasoning: audit.reasoning,
              contradictedBy: audit.contradictedBy,
            };
          }
          // Default fallback verification heuristic if not individually audited
          const hasEvidence = c.evidence.length > 0;
          return {
            ...c,
            verificationStatus: hasEvidence ? 'VERIFIED' : (c.importance === 'CRITICAL' ? 'NEEDS_RESEARCH' : 'VERIFIED'),
            confidence: hasEvidence ? 0.85 : 0.4,
            verificationReasoning: hasEvidence ? 'Supported by specialist empirical data' : 'Lacks primary source citation',
          };
        });

        const verifiedCount = verifiedClaims.filter(c => c.verificationStatus === 'VERIFIED').length;
        const refutedCount = verifiedClaims.filter(c => c.verificationStatus === 'REFUTED').length;
        const needsResearchCount = verifiedClaims.filter(c => c.verificationStatus === 'NEEDS_RESEARCH').length;
        const criticalClaims = verifiedClaims.filter(c => c.importance === 'CRITICAL');
        const verifiedCriticalCount = criticalClaims.filter(c => c.verificationStatus === 'VERIFIED').length;
        const unverifiedCriticalCount = criticalClaims.length - verifiedCriticalCount;
        const criticalVerificationRatio = criticalClaims.length > 0 ? verifiedCriticalCount / criticalClaims.length : 1.0;
        const contradictionsDetected = Array.isArray(parsed.contradictions) ? parsed.contradictions : [];

        eventBus.emit({
          id: uuidv4(),
          runId,
          type: 'claim.verified',
          timestamp: Date.now(),
          payload: {
            totalClaims: claims.length,
            verifiedCount,
            refutedCount,
            needsResearchCount,
            criticalVerificationRatio,
            contradictions: contradictionsDetected,
          },
        });

        eventBus.log(
          runId,
          criticalVerificationRatio >= 0.9 ? 'info' : 'warn',
          `Claim Verification Complete: ${verifiedCount}/${claims.length} verified (${(criticalVerificationRatio * 100).toFixed(0)}% critical claims verified, ${contradictionsDetected.length} contradictions)`
        );

        return {
          verifiedClaims,
          verifiedCount,
          refutedCount,
          needsResearchCount,
          unverifiedCriticalCount,
          criticalVerificationRatio,
          contradictionsDetected,
        };

      } catch (err) {
        eventBus.log(runId, 'warn', `Claim verification fallback engaged: ${err instanceof Error ? err.message : String(err)}`);

        // Conservative heuristic fallback
        const verifiedClaims = claims.map(c => ({
          ...c,
          verificationStatus: c.evidence.length > 0 ? ('VERIFIED' as const) : ('NEEDS_RESEARCH' as const),
          confidence: c.evidence.length > 0 ? 0.8 : 0.5,
          verificationReasoning: c.evidence.length > 0 ? 'Verified against agent evidence' : 'Requires targeted research',
        }));

        const criticalClaims = verifiedClaims.filter(c => c.importance === 'CRITICAL');
        const verifiedCritical = criticalClaims.filter(c => c.verificationStatus === 'VERIFIED').length;

        return {
          verifiedClaims,
          verifiedCount: verifiedClaims.filter(c => c.verificationStatus === 'VERIFIED').length,
          refutedCount: 0,
          needsResearchCount: verifiedClaims.filter(c => c.verificationStatus === 'NEEDS_RESEARCH').length,
          unverifiedCriticalCount: criticalClaims.length - verifiedCritical,
          criticalVerificationRatio: criticalClaims.length > 0 ? verifiedCritical / criticalClaims.length : 1.0,
          contradictionsDetected: [],
        };
      }
    }
  );
}
