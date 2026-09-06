// ============================================================
// AO Integration & Validation Script
// ============================================================

import { AOClient } from '../src/lib/runtime/ao/ao-client';
import { aoCodingWorkerCapability } from '../src/lib/runtime/ao/ao-capability';
import { AOSessionAdapter } from '../src/lib/runtime/ao/ao-session-adapter';

async function runTest() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 1. Testing AO Desktop Daemon Health');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const health = await AOClient.checkDaemonHealth();
  console.log('Daemon Health Status:', JSON.stringify(health, null, 2));

  if (health.status !== 'ok') {
    throw new Error('AO desktop daemon is not responding with ok');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 2. Testing Harness Discovery');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const harnesses = await AOClient.listSupportedHarnesses();
  console.log('Supported Harnesses:', harnesses.supported.map(h => h.id).join(', '));
  console.log('Installed Harnesses:', harnesses.installed.map(h => h.id).join(', '));
  console.log('Authorized Harnesses:', harnesses.authorized.map(h => h.id).join(', '));

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 3. Testing Marketplace Capability: ao_coding_worker');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const capResult = await aoCodingWorkerCapability.execute({
    instruction: 'Validate AAGAM codebase TypeScript compilation and export definitions.',
  });
  console.log('Capability Execution Result:', JSON.stringify(capResult, null, 2));

  if (!capResult.success) {
    throw new Error(`Capability execution failed: ${capResult.error}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ ALL AO RUNTIME INTEGRATION CHECKS PASSED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
