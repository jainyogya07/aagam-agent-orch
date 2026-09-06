// ============================================================
// Comprehensive Orchestrator Unit & Component Test Suite
// Agent Resource Exchange
// ============================================================

import { GoalParser } from '../src/lib/architect/goal-parser.ts';
import { getAllCapabilities, getCapabilityById } from '../src/lib/capabilities/capability-catalog.ts';
import { CapabilitySelector } from '../src/lib/capabilities/capability-selector.ts';
import { ResourceExchange } from '../src/lib/resource/resource-exchange.ts';
import { DecisionLogger } from '../src/lib/orchestrator/decision-logger.ts';
import { CheckpointEngine } from '../src/lib/orchestrator/checkpoint-engine.ts';
import { PersistentDBSession } from '../src/lib/runtime/persistent-session.ts';
import { SessionManager } from '../src/lib/runtime/session-manager.ts';
import { createArtifactEnvelope } from '../src/lib/types/artifacts.ts';
import { v4 as uuidv4 } from 'uuid';

function log(section, msg) {
  console.log(`\x1b[36m[${section}]\x1b[0m ${msg}`);
}

function success(msg) {
  console.log(`\x1b[32m  ✓ ${msg}\x1b[0m`);
}

function fail(msg, err) {
  console.error(`\x1b[31m  ✗ ${msg}\x1b[0m`, err || '');
  process.exit(1);
}

function assert(cond, msg) {
  if (!cond) throw new Error(`Assertion failed: ${msg}`);
}

// ------------------------------------------------------------
// TEST 1: GoalParser & Natural Language Intake
// ------------------------------------------------------------
async function testGoalParser() {
  log('TEST 1', 'Testing GoalParser with natural language prompts...');

  const prompt = 'Analyze enterprise AI agent adoption in European healthcare under the EU AI Act with a budget of $2.50 within 60 seconds.';
  const spec = await GoalParser.parse(prompt);

  assert(spec.domain === 'Healthcare / HealthTech', `Expected Healthcare / HealthTech domain, got ${spec.domain}`);
  assert(spec.geography === 'Europe', `Expected Europe geography, got ${spec.geography}`);
  assert(spec.effectiveBudgetUSD === 2.50, `Expected budget 2.50, got ${spec.effectiveBudgetUSD}`);
  assert(spec.effectiveDeadlineSeconds === 60, `Expected deadline 60, got ${spec.effectiveDeadlineSeconds}`);
  assert(spec.requiredAnalysis.some(a => a.includes('Regulatory')), 'Expected Regulatory in analysis');
  success(`GoalParser correctly extracted structured TaskSpec: Domain=${spec.domain}, Geography=${spec.geography}, Budget=$${spec.effectiveBudgetUSD}`);

  // Test default tagging when not specified
  const sparsePrompt = 'Compare Redis vs Memcached for session caching.';
  const sparseSpec = await GoalParser.parse(sparsePrompt);
  assert(sparseSpec.effectiveBudgetUSD === 0.50, `Expected default budget 0.50, got ${sparseSpec.effectiveBudgetUSD}`);
  assert(sparseSpec.systemDefaults.budgetUSD === 0.50, 'Expected budget to match system default');
  success('GoalParser accurately flags defaulted values with System Default values.');
}

// ------------------------------------------------------------
// TEST 2: Capability Marketplace (37 Capabilities across 6 Classes)
// ------------------------------------------------------------
async function testCapabilityMarketplace() {
  log('TEST 2', 'Testing Capability Marketplace catalog & selector...');

  const allCaps = getAllCapabilities();
  assert(allCaps.length === 37, `Expected exactly 37 capabilities, found ${allCaps.length}`);

  const classes = new Set(allCaps.map(c => c.metadata.class));
  assert(classes.size === 6, `Expected 6 capability classes, found ${classes.size}`);
  assert(classes.has('INFORMATION'), 'Missing INFORMATION class');
  assert(classes.has('COMPUTATION'), 'Missing COMPUTATION class');
  assert(classes.has('BUSINESS_INTELLIGENCE'), 'Missing BUSINESS_INTELLIGENCE class');
  assert(classes.has('VERIFICATION'), 'Missing VERIFICATION class');
  assert(classes.has('COMMUNICATION'), 'Missing COMMUNICATION class');
  assert(classes.has('EXECUTION'), 'Missing EXECUTION class');
  success(`Capability Marketplace verified: 37 capabilities across all 6 classes: ${[...classes].join(', ')}`);

  // Test Capability Execution
  const calc = getCapabilityById('calculator');
  assert(calc !== undefined, 'Calculator capability not found');
  const calcResult = await calc.execute({ expression: '(12000000000 * 0.15) - 500000000' });
  assert(calcResult.output.result === 1300000000, `Expected calculation 1300000000, got ${calcResult.output?.result}`);
  success(`Capability execution verified: calculator evaluated '${calcResult.output.expression}' = ${calcResult.output.result}`);

  // Test Capability Selector planning
  const decisions = CapabilitySelector.planCapabilities({
    agentRole: 'Financial Modeler',
    agentObjective: 'Compute customer unit economics and LTV/CAC',
    taskGoal: 'Evaluate SaaS enterprise margins',
    availableBudgetUSD: 0.50,
    remainingTimeMs: 5000,
  });
  assert(decisions.length > 0, 'Expected capability planning decisions');
  const buyDecision = decisions.find(d => d.action === 'BUY');
  assert(buyDecision !== undefined, 'Expected at least one BUY decision');
  success(`Capability Selector successfully planned capabilities: ${decisions.map(d => `${d.capabilityId} (${d.action}: $${d.costUSD.toFixed(3)})`).join(', ')}`);
}

// ------------------------------------------------------------
// TEST 3: Atomic Resource Exchange & Reservation Pipeline
// ------------------------------------------------------------
async function testAtomicResourceExchange() {
  log('TEST 3', 'Testing Atomic Resource Exchange with reservation & reclaim...');

  const exchange = new ResourceExchange('test-run-1', 1.00, 60000);
  const initialPool = exchange.getPool();
  assert(initialPool.moneyTotal === 1.00, 'Initial pool total must be $1.00');
  assert(initialPool.moneyRemaining === 1.00, 'Initial pool remaining must be $1.00');
  assert(initialPool.moneyReserved === 0, 'Initial pool reserved must be $0.00');

  // Step 1: Request resources
  const reqDecision = exchange.requestResources({
    agentId: 'agent-1',
    agentName: 'Market Researcher',
    estimatedCost: 0.10,
    estimatedTokens: 2500,
    estimatedToolCalls: 2,
    estimatedLatencyMs: 3000,
  });

  assert(reqDecision.type === 'APPROVE', `Expected APPROVE, got ${reqDecision.type}`);
  const poolAfterReserve = exchange.getPool();
  assert(Math.abs(poolAfterReserve.moneyReserved - 0.10) < 0.0001, `Expected reserved $0.10, got ${poolAfterReserve.moneyReserved}`);
  success('Atomic reservation confirmed: $0.10 reserved in pool.');

  // Step 2: Record spending and reclaim unused funds
  // Agent only spent $0.06 of the $0.10 reserved
  exchange.recordSpending('agent-1', 0.06, 1800, 1);
  const poolAfterSpending = exchange.getPool();
  assert(poolAfterSpending.moneySpent === 0.06, `Expected money spent $0.06, got ${poolAfterSpending.moneySpent}`);
  assert(poolAfterSpending.moneyReserved === 0, `Expected money reserved 0 after consumption, got ${poolAfterSpending.moneyReserved}`);
  assert(Math.abs(poolAfterSpending.moneyRemaining - 0.94) < 0.0001, `Expected money remaining $0.94, got ${poolAfterSpending.moneyRemaining}`);
  success('Spending recorded & unused reservation ($0.04) atomically returned to pool.');

  // Step 3: Reallocate low marginal contribution funds
  const contributions = [
    {
      agentId: 'agent-low',
      agentName: 'Low Contributor',
      marginalQualityGain: 0.01,
      reliabilityGain: 0.0,
      cost: 0.15,
      latencyMs: 2000,
      evidenceGain: 0.01,
      confidence: 0.8,
      uniqueInsights: 0,
      redundancyRatio: 0.85,
      costEfficiency: 0.06,
    },
    {
      agentId: 'agent-high',
      agentName: 'High Contributor',
      marginalQualityGain: 0.35,
      reliabilityGain: 0.2,
      cost: 0.15,
      latencyMs: 3000,
      evidenceGain: 0.40,
      confidence: 0.95,
      uniqueInsights: 5,
      redundancyRatio: 0.05,
      costEfficiency: 2.33,
    },
  ];

  const agentNames = new Map([['agent-low', 'Low Contributor'], ['agent-high', 'High Contributor']]);
  const reallocs = exchange.reallocate(contributions, agentNames);
  assert(reallocs.length > 0, 'Expected at least one reallocation event');
  assert(reallocs[0].amount > 0, 'Reclaimed amount must be positive');
  success(`Resource Exchange reallocated $${reallocs[0].amount.toFixed(4)} from Low Contributor to central pool.`);
}

// ------------------------------------------------------------
// TEST 4: Persistent Scoped Sessions & Artifact Lineage
// ------------------------------------------------------------
async function testSessionsAndArtifacts() {
  log('TEST 4', 'Testing Persistent Scoped Sessions & Artifact Lineage...');

  const taskId = 'task-42';
  const runId = uuidv4();

  // Create Iteration session
  const iterSession = SessionManager.getOrCreateSession({
    taskId,
    runId,
    architectureVersion: 1,
  });
  assert(iterSession !== null, 'Iteration session must be created');

  // Create Agent session
  const agentSession = SessionManager.getOrCreateSession({
    taskId,
    runId,
    architectureVersion: 1,
    agentId: 'financial-analyst',
  });
  assert(agentSession !== null, 'Agent session must be created');

  // Create Typed Artifact
  const artifact = createArtifactEnvelope(
    uuidv4(),
    'RESEARCH',
    'European Cloud Migration Market Data',
    'Comprehensive analysis of enterprise cloud migration spend in EU',
    { tamUSD: 45000000000, growthRate: 0.22, leadVendors: ['AWS', 'Azure'] },
    {
      parentArtifactIds: [],
      sourceToolCallIds: ['tool-web-1', 'tool-calc-1'],
      sourceClaimIds: ['claim-1'],
      producerAgentId: 'market-researcher',
      producerAgentName: 'Market Researcher',
      producerSessionId: iterSession.sessionId,
      architectureVersion: 1,
    },
    'VERIFIED'
  );

  assert(artifact.contentHash.length === 64, `Content hash must be SHA-256 (64 chars), got ${artifact.contentHash.length}`);
  assert(artifact.verificationStatus === 'VERIFIED', 'Verification status must be VERIFIED');
  success(`Typed Artifact created with verifiable SHA-256 hash: ${artifact.contentHash.slice(0, 16)}...`);

  // Inject artifact into agent session
  await SessionManager.injectArtifactsIntoAgentSession(agentSession, [artifact], 'Analyze cloud migration economics');
  const items = await agentSession.getItems();
  assert(items.length > 0, 'Agent session should have items after artifact injection');
  const itemStr = JSON.stringify(items[0]);
  assert(itemStr.includes('European Cloud Migration Market Data'), 'Agent session must contain injected upstream artifact context');
  success('Session Manager verified: Hierarchical 3-tier persistent sessions with clean upstream artifact injection.');
}

// ------------------------------------------------------------
// TEST 5: Decision Provenance & Checkpoint Engine
// ------------------------------------------------------------
async function testProvenanceAndCheckpoints() {
  log('TEST 5', 'Testing Decision Provenance & Checkpoint Engine...');

  const runId = uuidv4();

  // Log structured mathematical decision
  DecisionLogger.logDecision(runId, 1, {
    decisionType: 'MUTATION_ACCEPTANCE',
    targetAgentId: 'competitor-analyst',
    targetAgentName: 'Competitor Analyst',
    inputState: { currentQuality: 0.65, defectCount: 3 },
    candidateActions: ['ADD_AGENT', 'CHANGE_MODEL', 'DO_NOTHING'],
    selectedAction: 'ADD_AGENT',
    expectedValue: 0.25,
    estimatedCostUSD: 0.05,
    estimatedLatencyMs: 3000,
    marginalValue: 5.0,
    confidence: 0.92,
    reason: 'Critical defect detected in competitive moat analysis; adding specialist agent.',
    evidenceIds: ['defect-1', 'defect-2'],
  });

  const provenance = DecisionLogger.getDecisions(runId);
  assert(provenance.length === 1, `Expected 1 provenance record, got ${provenance.length}`);
  assert(provenance[0].marginalValue === 5.0, `Expected marginalValue 5.0, got ${provenance[0].marginalValue}`);
  const explanation = DecisionLogger.formatExplanation(provenance[0]);
  assert(explanation.includes('Expected Outcome Gain'), 'Expected formatted explanation');
  success(`Decision Logger verified: Logged mathematical provenance for ${provenance[0].selectedAction} with marginal value = ${provenance[0].marginalValue}`);

  // Save and load checkpoint
  CheckpointEngine.saveCheckpoint({
    runId,
    architectureVersion: 1,
    lastTransition: 'EVALUATION_COMPLETED',
    completedAgentIds: ['market-researcher', 'financial-analyst'],
    persistedArtifactIds: ['art-1', 'art-2'],
    totalMoneySpentUSD: 0.12,
    totalTokensUsed: 3500,
    timestamp: Date.now(),
  });

  const latestCp = CheckpointEngine.loadCheckpoint(runId);
  assert(latestCp !== null, 'Checkpoint must be retrieved');
  assert(latestCp.lastTransition === 'EVALUATION_COMPLETED', `Expected EVALUATION_COMPLETED, got ${latestCp.lastTransition}`);
  assert(latestCp.completedAgentIds.length === 2, `Expected 2 completed agents, got ${latestCp.completedAgentIds.length}`);
  success(`Checkpoint Engine verified: Successfully persisted and retrieved checkpoint at state "${latestCp.lastTransition}".`);
}

// ------------------------------------------------------------
// MAIN EXECUTION
// ------------------------------------------------------------
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Orchestrator Unit & Component Verification Suite');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    await testGoalParser();
    await testCapabilityMarketplace();
    await testAtomicResourceExchange();
    await testSessionsAndArtifacts();
    await testProvenanceAndCheckpoints();

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ALL 5 COMPONENT SUITES PASSED (100% PASS RATE)');
    console.log('═══════════════════════════════════════════════════════════\n');
  } catch (err) {
    fail('Component test suite failed', err);
  }
}

main();
