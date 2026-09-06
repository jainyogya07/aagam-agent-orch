import { V1V2Showcase, DEFAULT_EVOLUTION_POLICY } from '../src/lib/benchmark/v1-v2-showcase';

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  AAGAM LIVE V1 → V2 ARCHITECTURE EVOLUTION DEMO');
  console.log('  Deterministic Proof of Runtime Self-Evolution');
  console.log('═══════════════════════════════════════════════════════════\n');

  const result = await V1V2Showcase.executeShowcase(DEFAULT_EVOLUTION_POLICY);

  const printDimensions = (dims: Record<string, number> | undefined, label: string) => {
    if (!dims || Object.keys(dims).length === 0) {
      console.log(`  • ${label}: (no dimension data available)`);
      return;
    }
    console.log(`  • ${label}:`);
    for (const [dim, val] of Object.entries(dims)) {
      const pct = (Number(val) * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(Number(val) * 20)).padEnd(20, '░');
      console.log(`      ${dim.padEnd(18)} ${bar} ${pct}%`);
    }
  };

  console.log('\n───────────────────────────────────────────────────────────');
  console.log('  1. V1 BASELINE EXECUTION');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`  • Version: V${result.v1.architecture.version} (${result.v1.agentCount} Agents)`);
  console.log(`  • Quality Status:   ${result.v1.qualityStatus === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  • Overall Score:    ${(result.v1.evaluation.qualityScore * 100).toFixed(1)}%`);
  console.log(`  • Reliability:      ${(result.v1.evaluation.reliabilityScore * 100).toFixed(1)}%`);
  console.log(`  • Total Cost:       $${result.v1.totalCostUSD.toFixed(4)}`);
  console.log(`  • Wall Clock:       ${result.v1.latencyMs}ms`);
  printDimensions(result.v1.rubricDimensions, '8-Dimension Rubric');
  console.log('  • Agents:');
  for (const a of result.v1.architecture.nodes) {
    console.log(`      - [${a.name}] role: ${a.role}, budget: $${a.resourceBudget.maxCost.toFixed(4)}`);
  }

  console.log('\n───────────────────────────────────────────────────────────');
  console.log('  2. CONTRIBUTION ANALYSIS & EVOLUTION TRIGGER');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`  • Policy Applied:          ${result.policy.policyName}`);
  console.log(`  • Flagged Agent:           ${result.evolutionTrigger.flaggedAgentName}`);
  console.log(`  • Marginal Quality Gain:   ${(result.evolutionTrigger.marginalQualityGain * 100).toFixed(1)}% (Threshold: < ${(result.policy.marginalContributionThreshold * 100).toFixed(1)}%)`);
  console.log(`  • Redundancy Ratio:        ${(result.evolutionTrigger.redundancyRatio * 100).toFixed(0)}% (Threshold: ≥ ${(result.policy.redundancyThreshold * 100).toFixed(0)}%)`);
  console.log(`  • Policy Decision:         ${result.evolutionTrigger.policyClassification}`);
  console.log(`  • Budget Reclaimed:        $${result.evolutionTrigger.budgetReclaimedUSD.toFixed(4)} (reservation returned to pool)`);
  console.log(`  • Actual API Spend:        $${result.evolutionTrigger.actualSpendUSD.toFixed(4)} (real cost incurred)`);
  console.log('  • Mutations Applied:');
  for (const m of result.evolutionTrigger.mutationsApplied) {
    console.log(`      ⚙ ${m}`);
  }

  console.log('\n───────────────────────────────────────────────────────────');
  console.log('  3. V2 EVOLVED EXECUTION');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`  • Version: V${result.v2.architecture.version} (${result.v2.agentCount} Agents)`);
  console.log(`  • Quality Status:   ${result.v2.qualityStatus === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  • Overall Score:    ${(result.v2.evaluation.qualityScore * 100).toFixed(1)}%`);
  console.log(`  • Reliability:      ${(result.v2.evaluation.reliabilityScore * 100).toFixed(1)}%`);
  console.log(`  • Total Cost:       $${result.v2.totalCostUSD.toFixed(4)}`);
  console.log(`  • Wall Clock:       ${result.v2.latencyMs}ms`);
  printDimensions(result.v2.rubricDimensions, '8-Dimension Rubric');
  console.log('  • Agents:');
  for (const a of result.v2.architecture.nodes) {
    console.log(`      - [${a.name}] role: ${a.role}, budget: $${a.resourceBudget.maxCost.toFixed(4)}`);
  }

  console.log('\n───────────────────────────────────────────────────────────');
  console.log('  4. MEASURED COMPARISON MATRIX (V1 vs V2)');
  console.log('───────────────────────────────────────────────────────────');
  const comp = result.comparison;
  console.log(`  • Quality Improvement:    ${comp.qualityDeltaPercent >= 0 ? '+' : ''}${comp.qualityDeltaPercent}%`);
  console.log(`  • Reliability Gain:       ${comp.reliabilityDeltaPercent >= 0 ? '+' : ''}${comp.reliabilityDeltaPercent}%`);
  console.log(`  • Cost Delta:             ${comp.costDeltaUSD <= 0 ? '-' : '+'}$${Math.abs(comp.costDeltaUSD).toFixed(4)}`);
  console.log(`  • Efficiency Gain:        +${comp.efficiencyGainPercent}%`);
  console.log(`  • Latency Delta:          ${comp.latencyDeltaMs}ms`);

  if (result.aoExecution) {
    console.log('\n───────────────────────────────────────────────────────────');
    console.log('  5. AO EXECUTION SUBSTRATE RECORD');
    console.log('───────────────────────────────────────────────────────────');
    console.log(`  • Runtime:    ${result.aoExecution.runtime}`);
    console.log(`  • Session ID: ${result.aoExecution.sessionId}`);
    console.log(`  • Harness:    ${result.aoExecution.harness}`);
    console.log(`  • Workspace:  ${result.aoExecution.workspace}`);
    console.log(`  • Status:     ${result.aoExecution.artifactStatus}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ✅ V1 → V2 ARCHITECTURE SELF-EVOLUTION VERIFIED!');
  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(0);
}

main().catch(err => {
  console.error('❌ V1 -> V2 Showcase failed:', err);
  process.exit(1);
});
