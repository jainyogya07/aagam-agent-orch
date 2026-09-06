// ============================================================
// Deterministic Benchmark Verification Suite
// Agent Resource Exchange — V1 -> V2 Mutation & Resource Reclaim
// ============================================================

const BASE_URL = 'http://localhost:3000';

function log(section, msg) {
  console.log(`\x1b[36m[${section}]\x1b[0m ${msg}`);
}

function success(msg) {
  console.log(`\x1b[32m  ✓ ${msg}\x1b[0m`);
}

function info(msg) {
  console.log(`\x1b[33m  ℹ ${msg}\x1b[0m`);
}

async function runBenchmarkMode(mode) {
  log('BENCHMARK', `Starting benchmark run in mode: ${mode}...`);

  const res = await fetch(`${BASE_URL}/api/benchmark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, async: true }),
  });

  if (!res.ok) {
    throw new Error(`Failed to start benchmark: HTTP ${res.status} - ${await res.text()}`);
  }

  const { runId, neatlogsUrl } = await res.json();
  success(`Benchmark started with runId: ${runId}`);
  if (neatlogsUrl) {
    info(`Neatlogs trace URL: ${neatlogsUrl}`);
  }

  // Poll for completion and inspect all events
  let completed = false;
  let attempts = 0;
  const maxAttempts = 160; // up to 5.3 minutes for full V1 + V2 run

  const recordedEvents = [];
  let pollData = null;

  while (!completed && attempts < maxAttempts) {
    attempts++;
    await new Promise(r => setTimeout(r, 2000));

    const pollRes = await fetch(`${BASE_URL}/api/runs/${runId}`);
    if (!pollRes.ok) continue;

    pollData = await pollRes.json();
    const run = pollData.run;

    if (run.status === 'COMPLETED' || run.status === 'FAILED') {
      completed = true;
      break;
    } else {
      process.stdout.write(`\r  ... Mode ${mode} executing (${attempts * 2}s elapsed)...`);
    }
  }

  console.log('');

  if (!completed || !pollData) {
    throw new Error(`Benchmark mode ${mode} timed out`);
  }

  const run = pollData.run;
  const evals = pollData.evaluations || [];
  const archs = pollData.architectures || [];
  const latestEval = evals[evals.length - 1];

  success(`Run finished with status: ${run.status} (Stop reason: ${run.stopReason})`);
  if (latestEval) {
    success(`Total cost spent: $${latestEval.constraintCompliance.budgetUsed.toFixed(4)} | Total latency: ${(latestEval.constraintCompliance.timeUsedMs / 1000).toFixed(1)}s`);
  }
  success(`Architectures generated: ${archs.length}`);
  for (const a of archs) {
    console.log(`    • Architecture V${a.version}: ${a.nodes.length} agents, ${a.edges.length} edges`);
    for (const n of a.nodes) {
      console.log(`        - [${n.name}] role: ${n.role}, model: ${n.model}, status: ${n.status}, cost: $${(n.cost || 0).toFixed(4)}`);
    }
  }

  success(`Evaluations recorded: ${evals.length}`);
  for (let i = 0; i < evals.length; i++) {
    const ev = evals[i];
    console.log(`    • Eval V${i + 1}: Quality=${(ev.qualityScore * 100).toFixed(1)}% | Reliability=${(ev.reliabilityScore * 100).toFixed(1)}% | Evidence=${(ev.evidenceScore * 100).toFixed(1)}% | BudgetMet=${ev.constraintCompliance.budgetMet}`);
  }

  const events = pollData.events || [];
  const reclaims = events.filter(e => e.type === 'resource.reclaimed');
  const reallocs = events.filter(e => e.type === 'resource.reallocated');
  const mutations = events.filter(e => e.type === 'mutation.accepted');
  const claimEvents = events.filter(e => e.type === 'claim.verified');
  const qualityGateEvents = events.filter(e => e.type === 'quality.gate.evaluated');
  const repairStarts = events.filter(e => e.type === 'repair.started');
  const repairDones = events.filter(e => e.type === 'repair.completed');

  // Quality Gate & 8-Dimension Rubric Breakdown
  if (qualityGateEvents.length > 0) {
    const latestQG = qualityGateEvents[qualityGateEvents.length - 1].payload;
    const qScore = latestQG.overallScore ?? latestQG.qualityScore ?? 0;
    console.log('\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  🛡️ QUALITY GATE: ${latestQG.passed ? '\x1b[32mPASSED (≥ 95% Target)\x1b[0m' : '\x1b[33mDEFECTS DETECTED (Target < 95%)\x1b[0m'}`);
    console.log(`     Overall Quality Score: ${(qScore * 100).toFixed(1)}% (Target: ≥95%)`);
    if (latestQG.dimensions) {
      console.log('     8-Dimension Rubric Breakdown:');
      for (const [k, v] of Object.entries(latestQG.dimensions)) {
        const num = Number(v) || 0;
        const bar = '█'.repeat(Math.round(num * 15)) + '░'.repeat(15 - Math.round(num * 15));
        console.log(`       • ${k.padEnd(16)} [${bar}] ${(num * 100).toFixed(1)}%`);
      }
    }
    if (latestQG.defects && latestQG.defects.length > 0) {
      console.log(`     Reported Defects (${latestQG.defects.length}):`);
      for (const d of latestQG.defects) {
        console.log(`       - [${d.severity}] ${d.dimension}: ${d.description} (Est. gain: +${(d.expectedQualityGain * 100).toFixed(0)}%)`);
      }
    }
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  // Claim Verification Stats
  if (claimEvents.length > 0) {
    const verified = claimEvents.filter(c => c.payload.status === 'VERIFIED').length;
    const critical = claimEvents.filter(c => c.payload.importance === 'CRITICAL');
    const criticalVerified = critical.filter(c => c.payload.status === 'VERIFIED').length;
    success(`Claim Verification: ${verified}/${claimEvents.length} claims verified (${((verified / claimEvents.length) * 100).toFixed(1)}%)`);
    if (critical.length > 0) {
      success(`Critical Claims: ${criticalVerified}/${critical.length} verified (${((criticalVerified / critical.length) * 100).toFixed(1)}%)`);
    }
  }

  // Targeted Repairs
  if (repairStarts.length > 0) {
    info(`Targeted Repairs: ${repairStarts.length} repair cycles executed.`);
    for (const rd of repairDones) {
      console.log(`      🔧 Repair Round ${rd.payload.round}: Post-repair Quality = ${(rd.payload.newQuality * 100).toFixed(1)}%`);
    }
  }

  if (mode === 'FULL') {
    info(`Recorded ${reclaims.length} resource reclaim events.`);
    for (const rc of reclaims) {
      console.log(`      🔻 RECLAIM: $${rc.payload.amount?.toFixed(4)} from ${rc.payload.fromAgentName} (${rc.payload.reason})`);
    }

    info(`Recorded ${reallocs.length} resource reallocation events.`);
    for (const ra of reallocs) {
      console.log(`      🟢 REALLOCATE: $${ra.payload.amount?.toFixed(4)} to ${ra.payload.toAgentName} (${ra.payload.reason})`);
    }

    info(`Recorded ${mutations.length} accepted mutations.`);
    for (const m of mutations) {
      console.log(`      ⚙ MUTATION: ${m.payload.type} -> ${m.payload.targetNodeId || m.payload.reason}`);
    }

    if (archs.length < 2) {
      console.warn('  ⚠️ Note: Mutation did not produce V2 or single iteration executed.');
    } else {
      success('V1 -> Mutation -> V2 architecture evolution verified!');
    }
  }

  // Architecture Comparison (V1 vs V2)
  const comparedEvents = events.filter(e => e.type === 'architecture.compared');
  if (comparedEvents.length > 0) {
    const comp = comparedEvents[comparedEvents.length - 1].payload;
    if (comp.versions && comp.versions.length >= 2) {
      const [v1, v2] = comp.versions;
      console.log('\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  📊 ARCHITECTURE EVOLUTION: V1 vs V2 MEASURED COMPARISON');
      console.log(`     • Quality:     V1: ${(v1.quality * 100).toFixed(1)}% → V2: ${(v2.quality * 100).toFixed(1)}% (${v2.quality >= v1.quality ? '+' : ''}${((v2.quality - v1.quality) * 100).toFixed(1)}%)`);
      console.log(`     • Cost:        V1: $${v1.cost.toFixed(4)} → V2: $${v2.cost.toFixed(4)} (${v2.cost <= v1.cost ? '-' : '+'}$${Math.abs(v2.cost - v1.cost).toFixed(4)})`);
      console.log(`     • Reliability: V1: ${(v1.reliability * 100).toFixed(1)}% → V2: ${(v2.reliability * 100).toFixed(1)}%`);
      console.log(`     • Agents:      V1: ${v1.agents} → V2: ${v2.agents}`);
      console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  }

  // Final Output Preview
  if (run.finalOutput) {
    console.log('\n  📋 Final Answer Preview (first 400 chars):');
    console.log(`     ${run.finalOutput.slice(0, 400).replace(/\n/g, '\n     ')}...\n`);
  }

  return pollData;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Agent Resource Exchange — Deterministic Benchmark Suite');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Run FULL benchmark mode (Dynamic allocation + Contribution analysis + Mutation + Comparison)
    const fullResult = await runBenchmarkMode('FULL');

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  BENCHMARK VERIFICATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('\x1b[31mBenchmark suite error:\x1b[0m', err);
    process.exit(1);
  }
}

main();
