// ============================================================
// Natural Language Goal Parser — Agent Resource Exchange
// ============================================================
// Transforms ordinary natural language into a structured TaskSpec.
// The user enters simple English without configuring agents, DAGs,
// tools, or technical budgets.
// Distinguishes explicit user constraints from system defaults.
// ============================================================

export interface TaskSpec {
  rawGoal: string;
  objective: string;
  domain: string;
  geography: string;
  targetUsers: string;
  requiredAnalysis: string[];
  explicitConstraints: {
    budgetUSD?: number;
    deadlineSeconds?: number;
    reliabilityTarget?: number;
  };
  systemDefaults: {
    budgetUSD: number;
    deadlineSeconds: number;
    reliabilityTarget: number;
  };
  effectiveBudgetUSD: number;
  effectiveDeadlineSeconds: number;
  effectiveReliabilityTarget: number;
  inferredAssumptions: string[];
}

export class GoalParser {
  /**
   * Parses a natural language user query into a formal TaskSpec.
   */
  public static parse(userPrompt: string): TaskSpec {
    const trimmed = userPrompt.trim();

    // Default configuration values
    const SYSTEM_DEFAULTS = {
      budgetUSD: 0.50,
      deadlineSeconds: 60,
      reliabilityTarget: 0.90,
    };

    const inferredAssumptions: string[] = [];
    const explicitConstraints: TaskSpec['explicitConstraints'] = {};

    // 1. Extract explicit budget if stated in natural language (e.g. "under $0.40", "budget of $5")
    const budgetMatch = trimmed.match(/(?:budget\s*(?:of|is)?\s*|under\s*|within\s*)\$?(\d+(?:\.\d+)?)/i);
    if (budgetMatch && budgetMatch[1]) {
      const parsedBudget = parseFloat(budgetMatch[1]);
      if (parsedBudget > 0 && parsedBudget < 1000) {
        explicitConstraints.budgetUSD = parsedBudget;
      }
    }

    // 2. Extract explicit deadline if stated (e.g. "within 45s", "under 1 minute", "finish in 30 seconds")
    const deadlineSecMatch = trimmed.match(/(?:within|under|in)\s*(\d+)\s*(?:s|sec|seconds)/i);
    const deadlineMinMatch = trimmed.match(/(?:within|under|in)\s*(\d+(?:\.\d+)?)\s*(?:min|minute|minutes)/i);
    if (deadlineSecMatch && deadlineSecMatch[1]) {
      explicitConstraints.deadlineSeconds = parseInt(deadlineSecMatch[1], 10);
    } else if (deadlineMinMatch && deadlineMinMatch[1]) {
      explicitConstraints.deadlineSeconds = Math.round(parseFloat(deadlineMinMatch[1]) * 60);
    }

    // 3. Extract explicit reliability if stated (e.g. "95% accuracy", "target 85%")
    const reliabilityMatch = trimmed.match(/(?:reliability|accuracy|target)\s*(?:of|is)?\s*(\d+)%/i);
    if (reliabilityMatch && reliabilityMatch[1]) {
      explicitConstraints.reliabilityTarget = parseInt(reliabilityMatch[1], 10) / 100;
    }

    // 4. Domain inference
    let domain = 'General Technology / Venture';
    if (/edtech|tutor|student|college|school|teach|learn/i.test(trimmed)) {
      domain = 'EdTech / Higher Education';
    } else if (/fintech|payment|bank|invest|crypto|loan|credit/i.test(trimmed)) {
      domain = 'Fintech / Financial Services';
    } else if (/health|med|clinic|patient|doctor|bio/i.test(trimmed)) {
      domain = 'Healthcare / HealthTech';
    } else if (/b2b|saas|enterprise|workflow|crm|erp/i.test(trimmed)) {
      domain = 'B2B SaaS / Enterprise Software';
    } else if (/ecommerce|retail|shop|dtc|consumer/i.test(trimmed)) {
      domain = 'Consumer / E-Commerce';
    }
    inferredAssumptions.push(`[Inferred Domain]: ${domain}`);

    // 5. Geography inference
    let geography = 'Global';
    if (/india|indian|inr|bengaluru|delhi|mumbai/i.test(trimmed)) {
      geography = 'India';
    } else if (/us|usa|united states|america|silicon valley/i.test(trimmed)) {
      geography = 'United States';
    } else if (/europe|eu|uk|london|germany/i.test(trimmed)) {
      geography = 'Europe';
    } else if (/southeast asia|sea|singapore|indonesia/i.test(trimmed)) {
      geography = 'Southeast Asia';
    }
    inferredAssumptions.push(`[Inferred Geography]: ${geography}`);

    // 6. Target users
    let targetUsers = 'General Market';
    if (/college student|undergrad|university|campus/i.test(trimmed)) {
      targetUsers = 'Undergraduate College Students (18-24)';
    } else if (/k12|high school|parent|child/i.test(trimmed)) {
      targetUsers = 'K-12 Students & Parents';
    } else if (/developer|engineer|coder/i.test(trimmed)) {
      targetUsers = 'Software Developers & Technical Leads';
    } else if (/small business|smb|retailer/i.test(trimmed)) {
      targetUsers = 'SMB Owners & Independent Retailers';
    }
    inferredAssumptions.push(`[Inferred Target Cohort]: ${targetUsers}`);

    // 7. Analysis Pillars required
    const requiredAnalysis = [
      'Macro Market Sizing (TAM/SAM/SOM)',
      'Direct Competitor Matrix & Moats',
      'Unit Economics & Customer Payback Horizon',
      'Regulatory Compliance & Policy Hazards',
      'Evidence-First Investment Synthesis',
    ];

    return {
      rawGoal: userPrompt,
      objective: trimmed,
      domain,
      geography,
      targetUsers,
      requiredAnalysis,
      explicitConstraints,
      systemDefaults: SYSTEM_DEFAULTS,
      effectiveBudgetUSD: explicitConstraints.budgetUSD ?? SYSTEM_DEFAULTS.budgetUSD,
      effectiveDeadlineSeconds: explicitConstraints.deadlineSeconds ?? SYSTEM_DEFAULTS.deadlineSeconds,
      effectiveReliabilityTarget: explicitConstraints.reliabilityTarget ?? SYSTEM_DEFAULTS.reliabilityTarget,
      inferredAssumptions,
    };
  }
}
