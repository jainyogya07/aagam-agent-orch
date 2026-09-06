// ============================================================
// End-to-End Orchestrator + AO Validation Script
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import { AgentOrchestrator } from '../src/lib/orchestrator/agent-orchestrator';

async function main() {
  console.log('🚀 Launching AgentOrchestrator with AO execution routing...');

  const result = await AgentOrchestrator.execute({
    goal: 'Build an autonomous microservice deployment strategy with automated security verification and isolated codebase testing.',
    budget: 0.50,
    deadlineSeconds: 45,
    maxIterations: 2,
    benchmarkMode: 'FULL',
  });

  console.log('\n📊 Orchestrator Run Result Summary:');
  console.log(`- Run ID: ${result.runId}`);
  console.log(`- Stop Reason: ${result.stopReason}`);
  console.log(`- Best Version: V${result.bestArchitecture.version}`);
  console.log(`- Quality Score: ${(result.bestEvaluation.qualityScore * 100).toFixed(1)}%`);
  console.log(`- Total Cost: $${result.totalCost.toFixed(4)}`);
  console.log(`- Total Time: ${(result.totalTimeMs / 1000).toFixed(1)}s`);

  // Verify review artifacts directory
  const runDir = path.join(process.cwd(), 'runs', result.runId);
  console.log(`\n📁 Checking Review Artifacts in ${runDir}:`);

  const expectedFiles = [
    'task.json',
    'task-spec.json',
    'architecture-v1.json',
    'agents.json',
    'sessions.json',
    'capabilities.json',
    'resources.json',
    'decisions.json',
    'evidence.json',
    'evaluations.json',
    'mutations.json',
    'final-result.json',
  ];

  let allFound = true;
  for (const f of expectedFiles) {
    const exists = fs.existsSync(path.join(runDir, f));
    console.log(`  ${exists ? '✓' : '✗'} ${f}`);
    if (!exists) allFound = false;
  }

  if (allFound) {
    console.log('\n✅ All 12 Review Artifacts successfully persisted to disk!');
  } else {
    throw new Error('Some review artifacts were missing');
  }
}

main().catch((err) => {
  console.error('❌ E2E run failed:', err);
  process.exit(1);
});
