// ============================================================
// Demo run builder — domain-aware architecture + readable synthesis
// ============================================================

import type { Architecture } from '@/lib/types/architecture';
import type { TaskSpec } from '@/lib/architect/goal-parser';

export interface AnalysisFinding {
  title: string;
  body: string;
  source: string;
}

export interface AnalysisSynthesis {
  verdict: string;
  verdictDetail: string;
  marketGap: string;
  findings: AnalysisFinding[];
  recommendation: string;
  nextSteps: string[];
  evidenceLineage: { claim: string; source: string }[];
}

export interface AgentContribution {
  agentId: string;
  name: string;
  role: string;
  contribution: number;
  status: 'running' | 'completed';
  cost: number;
  summary: string;
}

function specialistSet(domain: string, includeScraper = true) {
  const d = domain.toLowerCase();
  const scraper = includeScraper
    ? [{ id: 'raw-scraper', name: 'Raw Web Scraper', role: 'researcher', objective: 'Unfiltered page scrape with low marginal contribution', tools: ['web-search'], maxCost: 0.08 }]
    : [];

  const coding = {
    id: 'ao-coder',
    name: 'AO Coding Worker',
    role: 'implementer',
    objective: 'Spawn an isolated AO worktree and return a CODE artifact for verification',
    tools: ['ao_coding_worker'],
    maxCost: 0.02,
  };

  if (d.includes('health') || d.includes('med') || d.includes('ayur')) {
    return [
      ...scraper,
      { id: 'company-research', name: 'Company Research', role: 'researcher', objective: 'Find existing Ayurvedic / MedTech companies, products, and funding trails', tools: ['web-search', 'company-research'], maxCost: 0.10 },
      { id: 'market-sizing', name: 'Market Sizing', role: 'analyst', objective: 'Estimate TAM/SAM/SOM for chronic-care Ayurvedic MedTech in India', tools: ['market-research', 'calculator'], maxCost: 0.12 },
      { id: 'regulatory', name: 'Regulatory Analyst', role: 'critic', objective: 'Map CDSCO, AYUSH, and clinical-validation constraints', tools: ['regulatory-research', 'claim-verifier'], maxCost: 0.08 },
      { id: 'unit-economics', name: 'Finance Modeler', role: 'analyst', objective: 'Build CAC, unit economics, and payback under India pricing', tools: ['financial-model', 'calculator'], maxCost: 0.12 },
      coding,
      { id: 'synthesizer', name: 'Executive Synthesizer', role: 'synthesizer', objective: 'Combine evidence into a go / no-go recommendation with lineage', tools: ['evidence-synthesizer'], maxCost: 0.15 },
    ];
  }

  if (d.includes('fintech') || d.includes('financial') || d.includes('bank') || d.includes('infra')) {
    return [
      ...scraper,
      { id: 'competitor-intel', name: 'Competitor Intelligence', role: 'researcher', objective: 'Map LangGraph, CrewAI, AutoGen, and adjacent orchestration vendors', tools: ['web-search', 'competitor-analysis'], maxCost: 0.10 },
      { id: 'tam-modeler', name: 'TAM / SAM Modeler', role: 'analyst', objective: 'Validate the stated TAM, CAGR, and addressable spend', tools: ['market-research', 'financial-model'], maxCost: 0.12 },
      { id: 'risk-auditor', name: 'Adversarial Risk Auditor', role: 'critic', objective: 'Stress-test latency, switching cost, and API-risk claims', tools: ['claim-verifier', 'risk-analysis'], maxCost: 0.08 },
      { id: 'pricing', name: 'Pricing & Unit Economics', role: 'analyst', objective: 'Model pay-per-use budgets, wallet economics, and gross margin', tools: ['pricing-analysis', 'calculator'], maxCost: 0.10 },
      coding,
      { id: 'synthesizer', name: 'Executive Synthesizer', role: 'synthesizer', objective: 'Produce an investment-grade recommendation with evidence lineage', tools: ['evidence-synthesizer'], maxCost: 0.15 },
    ];
  }

  if (d.includes('clean') || d.includes('electric') || d.includes('mobility')) {
    return [
      ...scraper,
      { id: 'grid-research', name: 'Grid & Policy Research', role: 'researcher', objective: 'Assess DACH grid capacity, subsidy regimes, and permitting', tools: ['regulatory-research', 'web-search'], maxCost: 0.10 },
      { id: 'unit-economics', name: 'Charging Unit Economics', role: 'analyst', objective: 'Model ultra-fast charging capex, utilization, and payback', tools: ['financial-model', 'forecasting'], maxCost: 0.12 },
      { id: 'competitor', name: 'Infrastructure Competitors', role: 'researcher', objective: 'Compare Ionity, Fastned, Tesla Supercharger, and local MNOs', tools: ['competitor-analysis'], maxCost: 0.08 },
      coding,
      { id: 'synthesizer', name: 'Investment Synthesizer', role: 'synthesizer', objective: 'Write the investment thesis with evidence-backed caveats', tools: ['evidence-synthesizer'], maxCost: 0.14 },
    ];
  }

  return [
    ...scraper,
    { id: 'market-intel', name: 'Market Intelligence', role: 'researcher', objective: 'Research market landscape, competitors, and industry TAM', tools: ['web-search', 'market-research'], maxCost: 0.10 },
    { id: 'financial-modeler', name: 'Quantitative Modeler', role: 'analyst', objective: 'Build financial forecast, CAC, and payback model', tools: ['calculator', 'financial-model'], maxCost: 0.12 },
    { id: 'risk-auditor', name: 'Adversarial Risk Auditor', role: 'critic', objective: 'Audit risk factors, failure modes, and claim validity', tools: ['claim-verifier', 'risk-analysis'], maxCost: 0.08 },
    coding,
    { id: 'synthesizer', name: 'Executive Synthesizer', role: 'synthesizer', objective: 'Synthesize a decision-ready recommendation', tools: ['evidence-synthesizer'], maxCost: 0.15 },
  ];
}

export function buildDemoArchitecture(taskSpec: TaskSpec, runId = 'demo_run', version: 1 | 2 = 1): Architecture {
  const specialists = specialistSet(taskSpec.domain, version === 1);
  const nodes = specialists.map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role,
    objective: s.objective,
    model: s.id === 'ao-coder' ? 'ao:codex' : s.role === 'critic' ? 'gpt-4o-mini' : 'gpt-4o',
    tools: s.tools,
    resourceBudget: { maxCost: s.maxCost, maxTokens: 2800, maxToolCalls: 4 },
    status: 'PENDING' as const,
  }));

  const edges = specialists.slice(0, -1).flatMap((s) => {
    const last = specialists[specialists.length - 1];
    if (s.id === last.id) return [];
    return [{ source: s.id, target: last.id }];
  });

  if (specialists.length > 2) {
    edges.push({ source: specialists[0].id, target: specialists[1].id });
  }

  return {
    id: `arch_v${version}`,
    version,
    taskId: runId,
    runId,
    parentArchitectureId: version === 2 ? 'arch_v1' : null,
    nodes,
    edges,
    resourcePolicy: {
      totalBudget: taskSpec.effectiveBudgetUSD,
      maxConcurrency: 4,
      reserveRatio: 0.8,
      reallocationEnabled: true,
    },
    score: null,
    mutationReason:
      version === 2
        ? 'Removed Raw Web Scraper after low marginal contribution; reclaimed budget to AO coding + verification'
        : 'Initial architecture generated from task specification',
  };
}

export function buildAgentContributions(architecture: Architecture): AgentContribution[] {
  return architecture.nodes.map((node, i) => {
    const contribution =
      node.id === 'raw-scraper'
        ? 0.04
        : node.id === 'ao-coder'
          ? 0.71
          : node.role === 'synthesizer'
            ? 0.88
            : node.role === 'critic'
              ? 0.46
              : Math.max(0.34, 0.81 - i * 0.05);
    return {
      agentId: node.id,
      name: node.name,
      role: node.role,
      contribution,
      status: 'completed' as const,
      cost: node.resourceBudget.maxCost * (node.id === 'raw-scraper' ? 0.95 : 0.62),
      summary:
        node.id === 'raw-scraper'
          ? 'Low marginal contribution. Budget reclaimed into the pool.'
          : node.id === 'ao-coder'
            ? 'Allocated AO coding capability. Isolated worktree + CODE artifact returned for verification.'
            : node.role === 'synthesizer'
              ? 'Combined specialist artifacts into a decision memo with evidence lineage.'
              : node.role === 'critic'
                ? 'Verified claims; contribution is real but below research and finance.'
                : 'Produced sourced findings used in the final recommendation.',
    };
  });
}

export function buildDemoSynthesis(taskSpec: TaskSpec): AnalysisSynthesis {
  const d = taskSpec.domain.toLowerCase();
  const geo = taskSpec.geography;

  if (d.includes('health') || d.includes('med') || d.includes('ayur')) {
    return {
      verdict: 'Conditionally viable — if the gap is clinical-grade chronic care, not another wellness brand',
      verdictDetail: `An Ayurvedic MedTech platform in ${geo} can scale only if it sits between AYUSH wellness products and regulated digital therapeutics. The crowded Dabur / Himalaya / Patanjali layer is not the gap. The gap is evidence-backed, clinician-distributed protocols for chronic lifestyle disorders with measurable outcomes.`,
      marketGap: 'Existing players sell branded Ayurvedic SKUs. Few combine diagnostics, protocol personalization, clinician network, and outcome tracking that a hospital or insurer will pay for. That is the commercially interesting gap — not “another Ayurvedic brand.”',
      findings: [
        { title: 'Who already exists', body: 'Himalaya, Dabur, Patanjali, Kapiva, and newer D2C brands occupy consumer Ayurveda. Digital clinics (e.g. chronic-care startups) occupy allopathy. Almost nobody owns the regulated middle: Ayurvedic protocols with device or diagnostic wrap that a doctor can prescribe.', source: 'Company Research → web + filings' },
        { title: 'Market shape', body: `${geo} chronic lifestyle disease burden (diabetes, metabolic, musculoskeletal) is large enough for a focused SAM. Mass-market wellness TAM is noisy and low-margin. SAM should be urban chronic-care patients plus clinic/hospital distribution, not pan-India D2C.`, source: 'Market Sizing → industry reports' },
        { title: 'Unit economics', body: 'D2C CAC on wellness SKUs is hostile. Clinic-referred subscriptions and B2B2C (hospitals, insurers, corporates) show a path to CAC payback under 12 months if LTV is protocol + refill + diagnostics, not a single product sale.', source: 'Finance Modeler → unit model' },
        { title: 'Regulatory reality', body: 'AYUSH advertising rules, CDSCO if a device is involved, and clinical-claim language are the binding constraints. Scale without clinical validation is a brand, not MedTech — and brands in this category already exist.', source: 'Regulatory Analyst → AYUSH / CDSCO' },
      ],
      recommendation: 'Do not build a consumer Ayurvedic storefront. Build a clinically validated chronic-care protocol layer with diagnostics, doctor distribution, and outcome evidence. If you cannot fund clinical validation, the architecture should recommend “do not proceed” rather than a hopeful brand launch.',
      nextSteps: [
        'Pick one chronic indication (e.g. metabolic or MSK) instead of a platform-for-everything.',
        'Map 8–12 existing products and clinics that already touch that indication.',
        'Price a clinic-referred 90-day protocol, not a D2C SKU.',
        'Budget a validation study before any national marketing spend.',
      ],
      evidenceLineage: [
        { claim: 'Consumer Ayurveda is crowded; clinical Ayurvedic MedTech is not', source: 'Company Research artifact' },
        { claim: 'Clinic-referred LTV/CAC is the only path that clears payback', source: 'Finance Modeler artifact' },
        { claim: 'Unvalidated health claims will not survive AYUSH advertising rules', source: 'Regulatory Analyst artifact' },
      ],
    };
  }

  if (d.includes('fintech') || d.includes('financial') || d.includes('infra')) {
    return {
      verdict: 'Viable as infrastructure — not as “another agent”',
      verdictDetail: `The stated TAM is real at the orchestration / evaluation layer, not at chatbot wrappers. Competitors (LangGraph, CrewAI, AutoGen) sell workflows. The gap is a closed loop that measures whether an architecture was worth the resources it consumed, then mutates it.`,
      marketGap: 'Teams can already build agents. They cannot yet answer: which specialist earned its budget, which claim is evidenced, and whether V2 is actually better than V1. That measurement + allocation loop is the product, not another SDK.',
      findings: [
        { title: 'Competitive frame', body: 'LangGraph, CrewAI, and AutoGen own graph/runtime primitives. Observability tools own traces. Marketplaces own discovery. Nobody owns “fund the architecture, evaluate contribution, reclaim, mutate.” That is the wedge.', source: 'Competitor Intelligence' },
        { title: 'TAM discipline', body: 'Treat $42.6B as the broader AI-infra envelope, not the beachhead. Beachhead is enterprise teams already running multi-agent workflows who overspend on low-contribution agents.', source: 'TAM / SAM Modeler' },
        { title: 'Risk that kills the thesis', body: 'If the product is only a prettier DAG editor, switching cost is near zero versus LangGraph. The lock-in must be the evidence store, contribution ledger, and evolution history.', source: 'Adversarial Risk Auditor' },
        { title: 'Pricing', body: 'Wallet + reserved budget + reclaim maps cleanly to pay-per-use. Charge on evaluated runs, not on seats. Gross margin works if cheap models handle low-stakes specialists and expensive models are allocated only when contribution justifies it.', source: 'Pricing & Unit Economics' },
      ],
      recommendation: 'Proceed, but only if the first product is the closed-loop substrate (understand → allocate → execute → measure → mutate), not a workflow canvas. The canvas is a surface. The ledger is the business.',
      nextSteps: [
        'Sell to teams who already have 3+ agents in production and can show wasted spend.',
        'Instrument contribution and reclaim as the demo, not “agent thinking” animations.',
        'Keep OpenAI / AO as execution, keep AAGAM as organization.',
        'Price a run, not a seat.',
      ],
      evidenceLineage: [
        { claim: 'Workflow primitives already exist; economic evolution does not', source: 'Competitor Intelligence artifact' },
        { claim: 'Beachhead is wasted agent spend, not greenfield chatbots', source: 'TAM / SAM Modeler artifact' },
        { claim: 'Editor-only products will not hold vs LangGraph', source: 'Risk Auditor artifact' },
      ],
    };
  }

  return {
    verdict: 'Proceed with a narrow wedge — not a broad platform story',
    verdictDetail: `${taskSpec.understanding.extracted.primaryObjective} in ${geo} is decision-ready only if the output names the gap, the buyer, and the unit economics. A list of companies is not the answer.`,
    marketGap: 'The interesting question is not who exists. It is which job is still unserved at a price a real buyer will pay, and whether that job can scale without linear headcount.',
    findings: [
      { title: 'Market', body: `Domain ${taskSpec.domain} in ${geo} has incumbents. The analysis should isolate a SAM where incumbents are structurally weak.`, source: 'Market Intelligence' },
      { title: 'Economics', body: 'Unit economics must clear CAC payback under conservative conversion. If they only work at heroic conversion, do not proceed.', source: 'Quantitative Modeler' },
      { title: 'Risk', body: 'Regulatory, distribution, and switching-cost risks were audited. Weak claims were marked rather than padded.', source: 'Risk Auditor' },
    ],
    recommendation: 'Define one buyer, one job-to-be-done, and one measurable outcome. Expand only after that wedge shows contribution-positive unit economics.',
    nextSteps: [
      'Name the buyer and the budget they already spend.',
      'List 5 incumbents and the job they fail.',
      'Model conservative CAC and payback.',
      'Decide keep V1 vs mutate only if expected value is positive.',
    ],
    evidenceLineage: [
      { claim: 'Incumbents exist; the gap is the unserved job', source: 'Market Intelligence artifact' },
      { claim: 'Economics must work at conservative conversion', source: 'Quantitative Modeler artifact' },
    ],
  };
}
