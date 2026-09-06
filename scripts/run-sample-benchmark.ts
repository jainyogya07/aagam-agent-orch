import { BenchmarkRunner } from '../src/lib/benchmark/benchmark-runner';
import { BENCHMARK_CATEGORIES } from '../src/lib/benchmark/benchmark-catalog';

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  AAGAM EMPIRICAL BENCHMARK EXECUTION');
  console.log('  11 Ground-Truthed Tasks across 11 Categories');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Select 1 task from each of the 11 categories
  const taskIds = [
    'biz_01',    // BUSINESS_RESEARCH
    'comp_01',   // COMPETITOR_ANALYSIS
    'tam_01',    // MARKET_SIZING
    'fin_01',    // FINANCIAL_CALCULATIONS
    'reg_01',    // REGULATORY_RESEARCH
    'tech_01',   // TECHNICAL_ARCHITECTURE (AO isolated worktree)
    'amb_01',    // AMBIGUOUS_GOALS
    'multi_01',  // MULTI_AGENT_COORDINATION
    'ev_01',     // EVIDENCE_HEAVY
    'adv_01',    // ADVERSARIAL_CONTRADICTORY
    'step_01',   // LONG_MULTI_STEP
  ];

  console.log(`Executing ${taskIds.length} benchmark tasks across all 11 categories...\n`);

  const report = await BenchmarkRunner.runBenchmark({
    taskIds,
    runsPerTask: 1,
    benchmarkMode: 'FULL',
    onProgress: (completed, total, latest) => {
      console.log(`  [${completed}/${total}] ${latest.taskId.padEnd(10)} | Score: ${(latest.overallScore * 100).toFixed(1)}% | Cost: $${latest.operationalMetrics.costUSD.toFixed(4)} | Latency: ${latest.operationalMetrics.latencyMs}ms | Passed: ${latest.passed ? '✓' : '✗'}`);
    },
  });

  console.log('\n───────────────────────────────────────────────────────────');
  console.log('  AAGAM EMPIRICAL VALIDATION RESULTS');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`  Total Tasks Evaluated:  ${report.tasksEvaluated}`);
  console.log(`  Total Runs Executed:    ${report.totalRunsExecuted}`);
  console.log(`  Overall Accuracy:       ${(report.overallAccuracy * 100).toFixed(1)}%`);
  console.log(`  Reliability Rate:       ${(report.reliabilityRate * 100).toFixed(1)}%`);
  console.log(`  Failure Rate:           ${(report.failureRate * 100).toFixed(1)}%`);
  console.log(`  Median Cost:            $${report.operational.medianCostUSD.toFixed(4)}`);
  console.log(`  Median Latency:         ${(report.operational.medianLatencyMs / 1000).toFixed(1)}s`);
  console.log(`  AO Worktrees Verified:  ${report.operational.aoWorktreesVerified}`);

  console.log('\n───────────────────────────────────────────────────────────');
  console.log('  INDEPENDENT RUBRIC DIMENSIONS');
  console.log('───────────────────────────────────────────────────────────');
  const d = report.dimensions;
  console.log(`  • Correctness:            ${(d.correctness * 100).toFixed(1)}%`);
  console.log(`  • Evidence Validity:      ${(d.evidenceValidity * 100).toFixed(1)}%`);
  console.log(`  • Citation Completeness:  ${(d.citationCompleteness * 100).toFixed(1)}%`);
  console.log(`  • Requirement Fit:        ${(d.requirementFit * 100).toFixed(1)}%`);
  console.log(`  • Reasoning:              ${(d.reasoning * 100).toFixed(1)}%`);
  console.log(`  • Consistency:            ${(d.consistency * 100).toFixed(1)}%`);
  console.log(`  • Uncertainty Handling:   ${(d.uncertaintyHandling * 100).toFixed(1)}%`);
  console.log(`  • Completeness:           ${(d.completeness * 100).toFixed(1)}%`);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ✅ BENCHMARK SUITE COMPLETE — SAVED TO LATEST REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(0);
}

main().catch(err => {
  console.error('Benchmark execution error:', err);
  process.exit(1);
});
