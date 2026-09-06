// ============================================================
// TensorMux Provider (Stub) — Agent Resource Exchange
// ============================================================
// Stub implementation — returns "provider unavailable" until
// a real TensorMux API key and SDK are configured.
// ============================================================

import type { LLMProvider, GenerateOptions, LLMResponse, ProviderUsage } from './types';

export class TensorMuxProvider implements LLMProvider {
  readonly id = 'tensormux';
  readonly name = 'TensorMux';
  readonly availableModels = ['glm-4', 'glm-4-flash', 'deepseek-v3'];

  private usage: ProviderUsage = {
    totalTokensIn: 0,
    totalTokensOut: 0,
    totalCost: 0,
    totalCalls: 0,
  };

  isAvailable(): boolean {
    return !!process.env.TENSORMUX_API_KEY;
  }

  estimateCost(tokensIn: number, tokensOut: number, _model: string): number {
    // Approximate: TensorMux models are generally cheaper
    return (tokensIn * 0.1 + tokensOut * 0.3) / 1_000_000;
  }

  getUsage(): ProviderUsage {
    return { ...this.usage };
  }

  async generate(_prompt: string, _options: GenerateOptions = {}): Promise<LLMResponse> {
    if (!this.isAvailable()) {
      throw new Error('TensorMux provider is not available — TENSORMUX_API_KEY not set');
    }

    // TODO: Implement actual TensorMux API call when SDK is available
    throw new Error('TensorMux provider is not yet implemented — API integration pending');
  }
}
