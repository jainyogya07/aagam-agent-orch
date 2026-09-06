// ============================================================
// Typed Artifact Contracts — Agent Resource Exchange
// ============================================================
// Artifacts form the formal communication contract between agents.
// Downstream agents consume validated, typed artifacts rather than
// unstructured or unvetted conversational history.
// Full lineage is tracked from source citations to final claim.
// ============================================================

import { createHash } from 'crypto';

export type ArtifactType =
  | 'RESEARCH'
  | 'FINANCIAL'
  | 'COMPETITOR'
  | 'REGULATORY'
  | 'SYNTHESIS'
  | 'REPORT'
  | 'AUDIT';

export interface ArtifactLineage {
  parentArtifactIds: string[];
  sourceToolCallIds: string[];
  sourceClaimIds: string[];
  producerAgentId: string;
  producerAgentName: string;
  producerSessionId: string;
  architectureVersion: number;
}

export interface ArtifactEnvelope<T = unknown> {
  id: string;
  type: ArtifactType;
  title: string;
  summary: string;
  data: T;
  lineage: ArtifactLineage;
  contentHash: string;
  verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'DISPUTED';
  createdAt: number;
  metadata: Record<string, unknown>;
}

// ----------------------------------------------------------
// Specialist Artifact Schemas
// ----------------------------------------------------------

export interface ResearchArtifactData {
  marketSegment: string;
  geography: string;
  tamBillion: number;
  samBillion: number;
  somBillion: number;
  projectedCagr: number;
  forecastPeriod: string;
  macroTailwinds: string[];
  empiricalDataPoints: string[];
  primarySources: Array<{
    title: string;
    url?: string;
    credibilityScore: number;
    year: number;
  }>;
  identifiedRisks: string[];
}

export interface FinancialArtifactData {
  currency: string;
  unitEconomics: {
    cac: number;
    ltv: number;
    ltvCacRatio: number;
    grossMarginPercent: number;
    paybackMonths: number;
    monthlyBurnRate: number;
  };
  revenueProjectionYears: Array<{
    year: number;
    arrProjected: number;
    growthRatePercent: number;
    grossProfit: number;
  }>;
  capitalRequirement: {
    minimumSeedRunwayMonths: number;
    estimatedRunwayNeedUSD: number;
  };
  breakEvenHorizonMonths: number;
  financialRisks: string[];
}

export interface CompetitorArtifactData {
  primaryIncumbents: Array<{
    name: string;
    marketSharePercent: number;
    pricingModel: string;
    coreMoat: string;
    vulnerabilities: string[];
  }>;
  emergingChallengers: Array<{
    name: string;
    differentiation: string;
  }>;
  moatComparisonMatrix: Record<string, {
    incumbentsScore: number;
    proposedVentureScore: number;
    evaluation: string;
  }>;
  recommendedPricingStrategy: string;
}

export interface RegulatoryArtifactData {
  jurisdiction: string;
  applicableFrameworks: string[];
  complianceRequirements: Array<{
    regulation: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    complianceAction: string;
    estimatedCostUSD: number;
  }>;
  policyHazards: string[];
  defensibilityScore: number;
}

export interface SynthesisArtifactData {
  taskGoal: string;
  executiveVerdict: 'HIGHLY_VIABLE' | 'MODERATELY_VIABLE' | 'HIGH_RISK_CONDITIONAL' | 'UNVIABLE';
  confidenceScore: number;
  reconciledClaims: Array<{
    claim: string;
    sourceAgent: string;
    status: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'UNVERIFIED';
    empiricalBacking: string;
  }>;
  requirementCoverage: Array<{
    requirement: string;
    covered: boolean;
    evidence: string;
  }>;
  identifiedDefects: string[];
  strategicRecommendation: string;
}

// ----------------------------------------------------------
// Helper: Build Envelope with SHA-256 Content Hash
// ----------------------------------------------------------

export function createArtifactEnvelope<T>(
  id: string,
  type: ArtifactType,
  title: string,
  summary: string,
  data: T,
  lineage: ArtifactLineage,
  verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'DISPUTED' = 'UNVERIFIED',
  metadata: Record<string, unknown> = {}
): ArtifactEnvelope<T> {
  const contentString = JSON.stringify({ type, data, lineage });
  const contentHash = createHash('sha256').update(contentString).digest('hex');

  return {
    id,
    type,
    title,
    summary,
    data,
    lineage,
    contentHash,
    verificationStatus,
    createdAt: Date.now(),
    metadata,
  };
}
