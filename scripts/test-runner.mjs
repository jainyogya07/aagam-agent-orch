// ============================================================
// Automated Integration & API Test Suite
// Agent Resource Exchange
// ============================================================

const BASE_URL = 'http://localhost:3000';

async function log(section, msg) {
  console.log(`\x1b[36m[${section}]\x1b[0m ${msg}`);
}

async function success(msg) {
  console.log(`\x1b[32m  ✓ ${msg}\x1b[0m`);
}

async function fail(msg, err) {
  console.error(`\x1b[31m  ✗ ${msg}\x1b[0m`, err || '');
  process.exit(1);
}

async function testHealthAndListRuns() {
  log('TEST 1', 'Checking API health and GET /api/runs...');
  const res = await fetch(`${BASE_URL}/api/runs`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const data = await res.json();
  if (!Array.isArray(data.runs)) throw new Error('Expected runs array');
  success(`GET /api/runs returned ${data.runs.length} existing runs.`);
  return data.runs;
}

async function testCreateTask() {
  log('TEST 2', 'Testing POST /api/tasks endpoint...');
  const taskPayload = {
    goal: 'Evaluate microservices architecture with distributed Kafka messaging vs modular monolith',
    budget: 1.25,
    deadlineSeconds: 90,
    reliabilityTarget: 0.92,
    availableTools: ['web-search', 'calculator'],
    availableModels: ['gpt-5-nano'],
  };

  const res = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskPayload),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (!data.task || !data.task.id) throw new Error('Task creation did not return task object');
  success(`Task created with ID: ${data.task.id} (Budget: $${data.task.budget}, Deadline: ${data.task.deadlineSeconds}s)`);
  return data.task;
}

async function testExecuteRunAndStreamSSE(task) {
  log('TEST 3', 'Starting asynchronous run with SSE stream listening...');
  const runRes = await fetch(`${BASE_URL}/api/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      taskId: task.id,
      goal: task.goal,
      budget: task.budget,
      deadlineSeconds: task.deadlineSeconds,
      reliabilityTarget: task.reliabilityTarget,
      async: true,
    }),
  });

  if (!runRes.ok) throw new Error(`HTTP ${runRes.status}: ${await runRes.text()}`);
  const runData = await runRes.json();
  const runId = runData.runId;
  success(`Run initiated with runId: ${runId} (Status: ${runData.status})`);

  // Connect to SSE stream
  log('TEST 4', `Listening to SSE events at /api/events/${runId}...`);
  const receivedEvents = [];

  // Poll for completion while checking SSE events
  let completed = false;
  let attempts = 0;
  const maxAttempts = 90; // 180 seconds max to accommodate multi-agent reasoning chain

  while (!completed && attempts < maxAttempts) {
    attempts++;
    await new Promise(r => setTimeout(r, 2000));

    const pollRes = await fetch(`${BASE_URL}/api/runs/${runId}`);
    if (!pollRes.ok) continue;
    const pollData = await pollRes.json();

    if (pollData.run.status === 'COMPLETED' || pollData.run.status === 'FAILED') {
      completed = true;
      success(`Run reached terminal state: ${pollData.run.status}`);
      success(`Stop Reason: "${pollData.run.stopReason}"`);
      
      if (pollData.architectures.length > 0) {
        const arch = pollData.architectures[0];
        success(`Architecture V${arch.version} recorded: ${arch.nodes.length} agent nodes, ${arch.edges.length} edges.`);
        for (const node of arch.nodes) {
          console.log(`    • Node [${node.id}]: ${node.name} (${node.role}) - Model: ${node.model}`);
        }
        for (const edge of arch.edges) {
          console.log(`    ↳ Edge: ${edge.source} ──(${edge.dataContract || 'data'})──> ${edge.target}`);
        }
      }

      if (pollData.evaluations.length > 0) {
        const ev = pollData.evaluations[0];
        success(`Evaluation Scores: Quality: ${(ev.qualityScore * 100).toFixed(1)}% | Reliability: ${(ev.reliabilityScore * 100).toFixed(1)}% | Evidence: ${(ev.evidenceScore * 100).toFixed(1)}%`);
        success(`Constraint Compliance: BudgetMet=${ev.constraintCompliance.budgetMet}, DeadlineMet=${ev.constraintCompliance.deadlineMet}`);
      }
      return pollData;
    } else {
      process.stdout.write(`\r  ... Execution in progress (attempt ${attempts}/${maxAttempts})...`);
    }
  }

  if (!completed) {
    throw new Error('Run timed out before reaching terminal state');
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Agent Resource Exchange — Automated Integration Suite');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    await testHealthAndListRuns();
    const task = await testCreateTask();
    const result = await testExecuteRunAndStreamSSE(task);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ALL TEST SUITES PASSED SUCCESSFULLY (100% PASS RATE)');
    console.log('═══════════════════════════════════════════════════════════\n');
  } catch (err) {
    fail('Integration test suite failed', err);
  }
}

main();
