// ============================================================
// Claim & Evidence Types — Agent Resource Exchange
// ============================================================
// Internal representations of claims, evidence, defect reports,
// and requirement coverage to drive genuine >= 95% outcome quality.
// ============================================================

import { z } from 'zod';

export type ClaimImportance = 'CRITICAL' | 'IMPORTANT' | 'SUPPORTING';
export type VerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'REFUTED' | 'NEEDS_RESEARCH';
export type DefectSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';

// ----------------------------------------------------------
// Claim Schema
// ----------------------------------------------------------

export const ClaimSchema = z.object({
  id: z.string().min(1),
  claim: z.string().min(1),
  importance: z.enum(['CRITICAL', 'IMPORTANT', 'SUPPORTING']),
  evidence: z.array(z.string()).default([]),
  sourceAgent: z.string().min(1),
  confidence: z.number().min(0).max(1),
  verificationStatus: z.enum(['UNVERIFIED', 'VERIFIED', 'REFUTED', 'NEEDS_RESEARCH']).default('UNVERIFIED'),
  verificationReasoning: z.string().optional(),
  contradictedBy: z.array(z.string()).default([]),
  supportingAgents: z.array(z.string()).default([]),
  dataPoints: z.array(z.string()).default([]),
});
export type Claim = z.infer<typeof ClaimSchema>;

// ----------------------------------------------------------
// Evidence Item Schema
// ----------------------------------------------------------

export const EvidenceItemSchema = z.object({
  id: z.string().min(1),
  content: z.string().min(1),
  sourceAgent: z.string().min(1),
  sourceTool: z.string().optional(),
  dataPoints: z.array(z.string()).default([]),
  relevanceScore: z.number().min(0).max(1).default(0.8),
  timestamp: z.number(),
});
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

// ----------------------------------------------------------
// Requirement Coverage
// ----------------------------------------------------------

export const RequirementCoverageSchema = z.object({
  requirement: z.string().min(1),
  covered: z.boolean(),
  evidenceSummary: z.string(),
  confidence: z.number().min(0).max(1),
  supportingClaimIds: z.array(z.string()).default([]),
});
export type RequirementCoverage = z.infer<typeof RequirementCoverageSchema>;

// ----------------------------------------------------------
// Defect Report Item
// ----------------------------------------------------------

export const DefectItemSchema = z.object({
  id: z.string().min(1),
  severity: z.enum(['CRITICAL', 'MAJOR', 'MINOR']),
  dimension: z.string().min(1), // e.g. 'evidence', 'completeness', 'numericalConsistency'
  description: z.string().min(1),
  affectedClaimIds: z.array(z.string()).default([]),
  recommendedAction: z.string().min(1),
  targetSpecialistRole: z.string().min(1),
  expectedQualityGain: z.number().min(0).max(1),
  estimatedResourceCost: z.number().nonnegative(),
});
export type DefectItem = z.infer<typeof DefectItemSchema>;

// ----------------------------------------------------------
// Quality Gate Result
// ----------------------------------------------------------

export const QualityGateResultSchema = z.object({
  passed: z.boolean(),
  overallScore: z.number().min(0).max(1),
  dimensions: z.object({
    correctness: z.number().min(0).max(1),
    evidence: z.number().min(0).max(1),
    completeness: z.number().min(0).max(1),
    reasoning: z.number().min(0).max(1),
    requirementFit: z.number().min(0).max(1),
    consistency: z.number().min(0).max(1),
    clarity: z.number().min(0).max(1),
    uncertainty: z.number().min(0).max(1),
  }),
  criticalClaimsVerifiedRatio: z.number().min(0).max(1),
  evidenceCoverageRatio: z.number().min(0).max(1),
  defects: z.array(DefectItemSchema).default([]),
  weakestDimension: z.string(),
  recommendations: z.array(z.string()).default([]),
});
export type QualityGateResult = z.infer<typeof QualityGateResultSchema>;
