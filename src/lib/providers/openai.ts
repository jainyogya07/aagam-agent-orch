// ============================================================
// OpenAI Provider — Agent Resource Exchange
// ============================================================

import OpenAI from 'openai';
import type { LLMProvider, GenerateOptions, LLMResponse, ProviderUsage } from './types';
import { instrumentOpenAIClient } from '@/lib/observability/neatlogs';

// Cost per 1M tokens (USD)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-5-nano': { input: 0.15, output: 0.6 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4.1': { input: 2.0, output: 8.0 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
  'gpt-4.1-nano': { input: 0.1, output: 0.4 },
};

export class OpenAIProvider implements LLMProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';
  readonly availableModels = Object.keys(MODEL_PRICING);

  private client: OpenAI | null = null;
  private usage: ProviderUsage = {
    totalTokensIn: 0,
    totalTokensOut: 0,
    totalCost: 0,
    totalCalls: 0,
  };

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }
      const rawClient = new OpenAI({ apiKey, timeout: 15000 });
      this.client = instrumentOpenAIClient(rawClient);
    }
    return this.client;
  }

  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  estimateCost(tokensIn: number, tokensOut: number, model: string): number {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-5-nano'];
    return (tokensIn * pricing.input + tokensOut * pricing.output) / 1_000_000;
  }

  getUsage(): ProviderUsage {
    return { ...this.usage };
  }

  async generate(prompt: string, options: GenerateOptions = {}): Promise<LLMResponse> {
    const client = this.getClient();
    let targetModel = options.model || 'gpt-5-nano';
    const startTime = Date.now();

    const doCall = async (modelToUse: string): Promise<LLMResponse> => {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const isReasoningModel = modelToUse.includes('nano') || modelToUse.startsWith('o1') || modelToUse.startsWith('o3');

      const requestParams: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
        model: modelToUse,
        messages,
        max_completion_tokens: isReasoningModel
          ? Math.max(options.maxTokens ?? 2500, 4500)
          : Math.min(options.maxTokens ?? 2000, 4000),
        ...(options.seed !== undefined && { seed: options.seed }),
      };

      if (isReasoningModel) {
        (requestParams as unknown as Record<string, unknown>).reasoning_effort = 'low';
      } else {
        requestParams.temperature = options.temperature ?? 0.7;
      }

      if (options.responseFormat === 'json') {
        requestParams.response_format = { type: 'json_object' };
      }

      const response = await client.chat.completions.create(requestParams);

      const latencyMs = Date.now() - startTime;
      const tokensIn = response.usage?.prompt_tokens ?? 0;
      const tokensOut = response.usage?.completion_tokens ?? 0;
      const cost = this.estimateCost(tokensIn, tokensOut, modelToUse);
      const choice = response.choices[0];
      const content = choice?.message?.content ?? '';

      if (!content && choice?.finish_reason === 'length') {
        console.warn(`[OpenAI] ${modelToUse} hit length limit with empty visible content (reasoning exhausted completion tokens).`);
      }

      // Update cumulative usage
      this.usage.totalTokensIn += tokensIn;
      this.usage.totalTokensOut += tokensOut;
      this.usage.totalCost += cost;
      this.usage.totalCalls += 1;

      return {
        content,
        tokensIn,
        tokensOut,
        cost,
        latencyMs,
        model: modelToUse,
      };
    };

    try {
      return await doCall(targetModel);
    } catch (err) {
      const errStr = err instanceof Error ? err.message : String(err);
      // If 403 or model permission denied and target was not gpt-5-nano, retry with gpt-5-nano
      if (targetModel !== 'gpt-5-nano' && (errStr.includes('403') || errStr.includes('does not have access to model'))) {
        console.warn(`[OpenAI] ${targetModel} not accessible, retrying with gpt-5-nano`);
        targetModel = 'gpt-5-nano';
        return await doCall('gpt-5-nano');
      }
      const latencyMs = Date.now() - startTime;
      throw new Error(`OpenAI generation failed (${latencyMs}ms): ${errStr}`);
    }
  }
}
