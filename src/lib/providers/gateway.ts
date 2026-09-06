// ============================================================
// Provider Gateway — Agent Resource Exchange
// ============================================================
// Central routing layer between agents and LLM providers.
// Agents never call OpenAI/TensorMux directly — they go through here.
// This allows dynamic model selection during mutation.
// ============================================================

import type { LLMProvider, GenerateOptions, LLMResponse, ProviderUsage } from './types';
import { OpenAIProvider } from './openai';
import { TensorMuxProvider } from './tensormux';

// Model → Provider mapping
const MODEL_PROVIDER_MAP: Record<string, string> = {
  'gpt-5-nano': 'openai',
  'gpt-4o': 'openai',
  'gpt-4o-mini': 'openai',
  'gpt-4.1': 'openai',
  'gpt-4.1-mini': 'openai',
  'gpt-4.1-nano': 'openai',
  'glm-4': 'tensormux',
  'glm-4-flash': 'tensormux',
  'glm-4-7-flash': 'tensormux',
  'deepseek-v3': 'tensormux',
};

export class ProviderGateway {
  private providers = new Map<string, LLMProvider>();

  constructor() {
    const openai = new OpenAIProvider();
    const tensormux = new TensorMuxProvider();

    this.providers.set('openai', openai);
    this.providers.set('tensormux', tensormux);
  }

  /**
   * Generate text using the appropriate provider for the given model.
   * Falls back to an available provider if the requested one is unavailable.
   */
  async generate(model: string, prompt: string, options: GenerateOptions = {}): Promise<LLMResponse> {
    const providerId = MODEL_PROVIDER_MAP[model];
    if (!providerId) {
      throw new Error(`Unknown model: ${model}. Available: ${Object.keys(MODEL_PROVIDER_MAP).join(', ')}`);
    }

    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not registered`);
    }

    // If requested provider is unavailable, try fallback
    if (!provider.isAvailable()) {
      const fallback = this.findFallbackProvider(providerId);
      if (!fallback) {
        throw new Error(`Provider ${providerId} is unavailable and no fallback found`);
      }
      console.warn(`[Gateway] Provider ${providerId} unavailable, falling back to ${fallback.id}`);
      // Use a default model from the fallback provider
      const fallbackModel = fallback.availableModels[0];
      return fallback.generate(prompt, { ...options, maxTokens: options.maxTokens });
    }

    return provider.generate(prompt, { ...options, model });
  }

  /**
   * Estimate cost for a model call
   */
  estimateCost(model: string, tokensIn: number, tokensOut: number): number {
    const providerId = MODEL_PROVIDER_MAP[model];
    const provider = this.providers.get(providerId || 'openai');
    return provider?.estimateCost(tokensIn, tokensOut, model) ?? 0;
  }

  /**
   * Get cumulative usage across all providers
   */
  getTotalUsage(): ProviderUsage {
    const totals: ProviderUsage = {
      totalTokensIn: 0,
      totalTokensOut: 0,
      totalCost: 0,
      totalCalls: 0,
    };

    for (const provider of this.providers.values()) {
      const usage = provider.getUsage();
      totals.totalTokensIn += usage.totalTokensIn;
      totals.totalTokensOut += usage.totalTokensOut;
      totals.totalCost += usage.totalCost;
      totals.totalCalls += usage.totalCalls;
    }

    return totals;
  }

  /**
   * Get all available models across all available providers
   */
  getAvailableModels(): string[] {
    const models: string[] = [];
    for (const [providerId, provider] of this.providers) {
      if (provider.isAvailable()) {
        models.push(...provider.availableModels);
      }
    }
    return models;
  }

  /**
   * Check if a specific model is available
   */
  isModelAvailable(model: string): boolean {
    const providerId = MODEL_PROVIDER_MAP[model];
    if (!providerId) return false;
    const provider = this.providers.get(providerId);
    return provider?.isAvailable() ?? false;
  }

  private findFallbackProvider(excludeId: string): LLMProvider | null {
    for (const [id, provider] of this.providers) {
      if (id !== excludeId && provider.isAvailable()) {
        return provider;
      }
    }
    return null;
  }
}

// Singleton gateway
export const providerGateway = new ProviderGateway();
