// ============================================================
// TensorMux Provider — Agent Resource Exchange
// ============================================================
// Live implementation connecting to TensorMux API.
// Provides fast inference for GLM-4 and DeepSeek models.
// ============================================================

import type { LLMProvider, GenerateOptions, LLMResponse, ProviderUsage } from './types';

const BASE_URL = 'https://api.tensormux.com/v1';

// Normalize model names to the actual TensorMux model ID
const MODEL_MAPPING: Record<string, string> = {
  'glm-4': 'glm-4-7-flash',
  'glm-4-flash': 'glm-4-7-flash',
  'glm-4-7-flash': 'glm-4-7-flash',
  'deepseek-v3': 'glm-4-7-flash', // Fallback to available flash model
};

export class TensorMuxProvider implements LLMProvider {
  readonly id = 'tensormux';
  readonly name = 'TensorMux';
  readonly availableModels = ['glm-4', 'glm-4-flash', 'glm-4-7-flash', 'deepseek-v3'];

  private usage: ProviderUsage = {
    totalTokensIn: 0,
    totalTokensOut: 0,
    totalCost: 0,
    totalCalls: 0,
  };

  isAvailable(): boolean {
    return Boolean(process.env.TENSORMUX_API_KEY && process.env.TENSORMUX_API_KEY.length > 5);
  }

  estimateCost(tokensIn: number, tokensOut: number, _model: string): number {
    // TensorMux high-efficiency pricing (~$0.05 / 1M in, $0.15 / 1M out)
    return (tokensIn * 0.05 + tokensOut * 0.15) / 1_000_000;
  }

  getUsage(): ProviderUsage {
    return { ...this.usage };
  }

  async generate(prompt: string, options: GenerateOptions = {}): Promise<LLMResponse> {
    if (!this.isAvailable()) {
      throw new Error('TensorMux provider is not available — TENSORMUX_API_KEY not set');
    }

    const apiKey = process.env.TENSORMUX_API_KEY!;
    const requestedModel = options.model || 'glm-4-flash';
    const targetModel = MODEL_MAPPING[requestedModel] || 'glm-4-7-flash';
    const startTime = Date.now();

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const requestBody: Record<string, unknown> = {
      model: targetModel,
      messages,
      max_tokens: Math.min(options.maxTokens ?? 1500, 2000),
      temperature: options.temperature ?? 0.3,
    };

    if (options.responseFormat === 'json') {
      requestBody.response_format = { type: 'json_object' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);



    try {
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`TensorMux API returned HTTP ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const latencyMs = Date.now() - startTime;
      const choice = data.choices?.[0];
      const content = choice?.message?.content ?? '';

      const tokensIn = data.usage?.prompt_tokens ?? Math.ceil(prompt.length / 4);
      const tokensOut = data.usage?.completion_tokens ?? Math.ceil(content.length / 4);
      const cost = this.estimateCost(tokensIn, tokensOut, targetModel);

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
        model: targetModel,
      };
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }
}

