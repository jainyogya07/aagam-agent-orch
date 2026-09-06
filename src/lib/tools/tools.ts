// ============================================================
// Tool System — Agent Resource Exchange
// ============================================================

export interface ToolResult {
  output: unknown;
  success: boolean;
  error?: string;
  cost: number;
  latencyMs: number;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  execute(input: unknown): Promise<ToolResult>;
  estimateCost(): number;
}

// ----------------------------------------------------------
// Web Search Tool (mock for demo — replace with real API)
// ----------------------------------------------------------

export class WebSearchTool implements Tool {
  id = 'web-search';
  name = 'Web Search';
  description = 'Search the web for information on a given query';

  estimateCost(): number {
    return 0.001; // ~$0.001 per search
  }

  async execute(input: unknown): Promise<ToolResult> {
    const startTime = Date.now();
    const query = typeof input === 'string' ? input : (input as { query?: string })?.query || '';

    try {
      // If a search API key is available, use it
      // For now, return a structured mock that indicates the search was attempted
      if (!process.env.SEARCH_API_KEY) {
        return {
          output: {
            query,
            results: [],
            note: 'Search API not configured — SEARCH_API_KEY not set. Using LLM knowledge only.',
          },
          success: true,
          cost: 0,
          latencyMs: Date.now() - startTime,
        };
      }

      // TODO: Implement real search API (Brave, SerpAPI, Tavily)
      return {
        output: { query, results: [], note: 'Search API integration pending' },
        success: true,
        cost: this.estimateCost(),
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        output: null,
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
        cost: 0,
        latencyMs: Date.now() - startTime,
      };
    }
  }
}

// ----------------------------------------------------------
// Calculator Tool
// ----------------------------------------------------------

export class CalculatorTool implements Tool {
  id = 'calculator';
  name = 'Calculator';
  description = 'Evaluate mathematical expressions safely';

  estimateCost(): number {
    return 0; // Free — runs locally
  }

  async execute(input: unknown): Promise<ToolResult> {
    const startTime = Date.now();
    const expression = typeof input === 'string' ? input : (input as { expression?: string })?.expression || '';

    try {
      // Safe math evaluation — no eval()
      const result = this.safeEvaluate(expression);
      return {
        output: { expression, result },
        success: true,
        cost: 0,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        output: null,
        success: false,
        error: error instanceof Error ? error.message : 'Calculation failed',
        cost: 0,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  private safeEvaluate(expr: string): number {
    // Basic safe math parser — supports +, -, *, /, (), numbers
    const sanitized = expr.replace(/[^0-9+\-*/().%\s]/g, '');
    if (!sanitized.trim()) throw new Error('Invalid expression');

    // Use Function constructor with restricted scope
    try {
      const fn = new Function(`"use strict"; return (${sanitized});`);
      const result = fn();
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Result is not a finite number');
      }
      return result;
    } catch {
      throw new Error(`Cannot evaluate: ${expr}`);
    }
  }
}

// ----------------------------------------------------------
// Text Analyzer Tool
// ----------------------------------------------------------

export class TextAnalyzerTool implements Tool {
  id = 'text-analyzer';
  name = 'Text Analyzer';
  description = 'Analyze text for length, readability, and key statistics';

  estimateCost(): number {
    return 0; // Free — runs locally
  }

  async execute(input: unknown): Promise<ToolResult> {
    const startTime = Date.now();
    const text = typeof input === 'string' ? input : (input as { text?: string })?.text || '';

    const words = text.split(/\s+/).filter(Boolean);
    const sentences = text.split(/[.!?]+/).filter(Boolean);

    return {
      output: {
        characterCount: text.length,
        wordCount: words.length,
        sentenceCount: sentences.length,
        averageWordLength: words.length > 0
          ? +(words.reduce((sum, w) => sum + w.length, 0) / words.length).toFixed(1)
          : 0,
        averageSentenceLength: sentences.length > 0
          ? +(words.length / sentences.length).toFixed(1)
          : 0,
      },
      success: true,
      cost: 0,
      latencyMs: Date.now() - startTime,
    };
  }
}

// ----------------------------------------------------------
// Tool Registry
// ----------------------------------------------------------

const ALL_TOOLS: Tool[] = [
  new WebSearchTool(),
  new CalculatorTool(),
  new TextAnalyzerTool(),
];

export function getToolById(id: string): Tool | undefined {
  return ALL_TOOLS.find(t => t.id === id);
}

export function getAvailableTools(): Tool[] {
  return [...ALL_TOOLS];
}

export function getToolIds(): string[] {
  return ALL_TOOLS.map(t => t.id);
}
