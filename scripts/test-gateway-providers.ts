import { ProviderGateway } from '../src/lib/providers/gateway';

async function main() {
  console.log('Testing ProviderGateway with live models...');
  const gw = new ProviderGateway();
  console.log('Available models:', gw.getAvailableModels());

  // Test TensorMux GLM-4-Flash
  console.log('\n--- 1. Testing TensorMux (glm-4-flash) ---');
  const tmRes = await gw.generate('glm-4-flash', 'Return a JSON with message "TensorMux working": {"message": "TensorMux working"}', {
    responseFormat: 'json',
  });
  console.log('TensorMux Response:', tmRes.content.trim());
  console.log(`Tokens: in=${tmRes.tokensIn}, out=${tmRes.tokensOut} | Cost: $${tmRes.cost.toFixed(6)} | Latency: ${tmRes.latencyMs}ms`);

  // Test OpenAI gpt-5-nano
  console.log('\n--- 2. Testing OpenAI (gpt-5-nano) ---');
  const oaiRes = await gw.generate('gpt-5-nano', 'Return a JSON with message "OpenAI working": {"message": "OpenAI working"}', {
    responseFormat: 'json',
    maxTokens: 500,
  });
  console.log('OpenAI Response:', oaiRes.content.trim());
  console.log(`Tokens: in=${oaiRes.tokensIn}, out=${oaiRes.tokensOut} | Cost: $${oaiRes.cost.toFixed(6)} | Latency: ${oaiRes.latencyMs}ms`);

  console.log('\nTotal Gateway Usage:', gw.getTotalUsage());
  console.log('✅ Both providers verified successfully!');
}

main().catch(err => {
  console.error('❌ Provider test failed:', err);
  process.exit(1);
});
