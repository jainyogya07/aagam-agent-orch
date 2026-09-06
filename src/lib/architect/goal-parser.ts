// ============================================================
// Natural Language Goal Parser — Agent Resource Exchange
// ============================================================
// Transforms ordinary natural language into a structured TaskSpec.
// The user enters simple English without configuring agents, DAGs,
// tools, or technical budgets.
// Distinguishes explicit user constraints from system defaults.
// ============================================================

export interface UnderstandingPhase {
  status: 'analyzing' | 'completed';
  steps: {
    goalIdentified: boolean;
    domainIdentified: boolean;
    geographyIdentified: boolean;
    constraintsExtracted: boolean;
    successCriteriaGenerated: boolean;
  };
  extracted: {
    primaryObjective: string;
    domain: string;
    domainConfidence: 'high' | 'medium' | 'low';
    geography: string;
    geographyConfidence: 'high' | 'medium' | 'low';
    targetUsers: string;
    targetUsersConfidence: 'high' | 'medium' | 'low';
    constraints: {
      budget?: { value: number; source: 'explicit' | 'default' };
      deadline?: { value: number; source: 'explicit' | 'default' };
      reliability?: { value: number; source: 'explicit' | 'default' };
    };
    requiredAnalysis: string[];
    successCriteria: string[];
  };
  readyToArchitect: boolean;
}

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
  understanding: UnderstandingPhase;
}

export class GoalParser {
  /**
   * Parses a natural language user query into a formal TaskSpec.
   * Now includes detailed understanding phase for UI display.
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
    let domainConfidence: 'high' | 'medium' | 'low' = 'low';
    if (/edtech|tutor|student|college|school|teach|learn/i.test(trimmed)) {
      domain = 'EdTech / Higher Education';
      domainConfidence = 'high';
    } else if (/ayurved|ayurveda|medtech|med-tech/i.test(trimmed)) {
      domain = 'Healthcare / Ayurvedic MedTech';
      domainConfidence = 'high';
    } else if (/fintech|payment|bank|invest|crypto|loan|credit|resource exchange|langgraph|crewai/i.test(trimmed)) {
      domain = 'Fintech / Financial Services';
      domainConfidence = 'high';
    } else if (/health|med|clinic|patient|doctor|bio|dementia|care/i.test(trimmed)) {
      domain = 'Healthcare / HealthTech';
      domainConfidence = 'high';
    } else if (/b2b|saas|enterprise|workflow|crm|erp/i.test(trimmed)) {
      domain = 'B2B SaaS / Enterprise Software';
      domainConfidence = 'medium';
    } else if (/ecommerce|retail|shop|dtc|consumer/i.test(trimmed)) {
      domain = 'Consumer / E-Commerce';
      domainConfidence = 'medium';
    } else if (/ev|electric vehicle|charging|mobility|transport/i.test(trimmed)) {
      domain = 'Clean Energy / Electric Mobility';
      domainConfidence = 'high';
    }
    inferredAssumptions.push(`[Inferred Domain]: ${domain}`);

    // 5. Geography inference
    let geography = 'Global';
    let geographyConfidence: 'high' | 'medium' | 'low' = 'low';
    if (/india|indian|inr|bengaluru|delhi|mumbai/i.test(trimmed)) {
      geography = 'India';
      geographyConfidence = 'high';
    } else if (/us|usa|united states|america|silicon valley/i.test(trimmed)) {
      geography = 'United States';
      geographyConfidence = 'high';
    } else if (/europe|eu|uk|london|germany|european/i.test(trimmed)) {
      geography = 'Europe';
      geographyConfidence = 'high';
    } else if (/southeast asia|sea|singapore|indonesia/i.test(trimmed)) {
      geography = 'Southeast Asia';
      geographyConfidence = 'high';
    }
    inferredAssumptions.push(`[Inferred Geography]: ${geography}`);

    // 6. Target users
    let targetUsers = 'General Market';
    let targetUsersConfidence: 'high' | 'medium' | 'low' = 'low';
    if (/college student|undergrad|university|campus/i.test(trimmed)) {
      targetUsers = 'Undergraduate College Students (18-24)';
      targetUsersConfidence = 'high';
    } else if (/k12|high school|parent|child/i.test(trimmed)) {
      targetUsers = 'K-12 Students & Parents';
      targetUsersConfidence = 'high';
    } else if (/developer|engineer|coder/i.test(trimmed)) {
      targetUsers = 'Software Developers & Technical Leads';
      targetUsersConfidence = 'high';
    } else if (/small business|smb|retailer/i.test(trimmed)) {
      targetUsers = 'SMB Owners & Independent Retailers';
      targetUsersConfidence = 'high';
    } else if (/elderly|senior|aging|dementia|alzheimer/i.test(trimmed)) {
      targetUsers = 'Elderly Population & Caregivers';
      targetUsersConfidence = 'high';
    }
    inferredAssumptions.push(`[Inferred Target Cohort]: ${targetUsers}`);

    // 7. Analysis Pillars required
    const requiredAnalysis = [
      'Market Opportunity Analysis',
      'Competitive Landscape Research',
      'Financial Viability Assessment',
      'Regulatory & Risk Analysis',
      'Evidence Verification & Synthesis',
    ];

    // 8. Success Criteria
    const successCriteria = [
      'Comprehensive market size estimation (TAM/SAM/SOM)',
      'Competitor differentiation analysis',
      'Unit economics validation',
      'Regulatory compliance assessment',
      'Evidence-backed recommendation',
      `Quality score ≥ ${(explicitConstraints.reliabilityTarget ?? SYSTEM_DEFAULTS.reliabilityTarget) * 100}%`,
    ];

    // 9. Build Understanding Phase
    const understanding: UnderstandingPhase = {
      status: 'completed',
      steps: {
        goalIdentified: true,
        domainIdentified: true,
        geographyIdentified: true,
        constraintsExtracted: true,
        successCriteriaGenerated: true,
      },
      extracted: {
        primaryObjective: this.extractPrimaryObjective(trimmed),
        domain,
        domainConfidence,
        geography,
        geographyConfidence,
        targetUsers,
        targetUsersConfidence,
        constraints: {
          budget: {
            value: explicitConstraints.budgetUSD ?? SYSTEM_DEFAULTS.budgetUSD,
            source: explicitConstraints.budgetUSD ? 'explicit' : 'default',
          },
          deadline: {
            value: explicitConstraints.deadlineSeconds ?? SYSTEM_DEFAULTS.deadlineSeconds,
            source: explicitConstraints.deadlineSeconds ? 'explicit' : 'default',
          },
          reliability: {
            value: explicitConstraints.reliabilityTarget ?? SYSTEM_DEFAULTS.reliabilityTarget,
            source: explicitConstraints.reliabilityTarget ? 'explicit' : 'default',
          },
        },
        requiredAnalysis,
        successCriteria,
      },
      readyToArchitect: true,
    };

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
      understanding,
    };
  }

  /**
   * Extract the primary objective from the user prompt
   */
  private static extractPrimaryObjective(prompt: string): string {
    // Look for common objective patterns
    if (/viable|viability|feasible|feasibility/i.test(prompt)) {
      return 'Commercial Viability Assessment';
    } else if (/market opportunity|market size|tam|potential/i.test(prompt)) {
      return 'Market Opportunity Analysis';
    } else if (/compete|competitor|competition/i.test(prompt)) {
      return 'Competitive Analysis';
    } else if (/evaluate|assess|analyze|investigate/i.test(prompt)) {
      return 'Comprehensive Evaluation';
    } else if (/should|invest|worth/i.test(prompt)) {
      return 'Investment Decision Support';
    }
    
    return 'Business Analysis';
  }
}
