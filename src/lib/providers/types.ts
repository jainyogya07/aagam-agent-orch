// ============================================================
// Provider Types — Agent Resource Exchange
// ============================================================

export interface GenerateOptions {
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
  tools?: ToolDefinition[];
  seed?: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LLMResponse {
  content: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  latencyMs: number;
  model: string;
  toolCalls?: LLMToolCall[];
}

export interface LLMToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface ProviderUsage {
  totalTokensIn: number;
  totalTokensOut: number;
  totalCost: number;
  totalCalls: number;
}

export interface LLMProvider {
  id: string;
  name: string;
  availableModels: string[];
  generate(prompt: string, options: GenerateOptions): Promise<LLMResponse>;
  estimateCost(tokensIn: number, tokensOut: number, model: string): number;
  getUsage(): ProviderUsage;
  isAvailable(): boolean;
}
