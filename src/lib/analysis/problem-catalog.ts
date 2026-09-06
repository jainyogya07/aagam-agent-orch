export type ProblemCard = {
  id: string;
  title: string;
  category: string;
  prompt: string;
  what: string;
  why: string;
  extra: string;
  aoAngle: string;
  neatlogsAngle: string;
  specialists: string[];
  claims: { claim: string; source: string }[];
  aoExpect: string[];
  neatlogsSpans: string[];
};

export const PROBLEM_CARDS: ProblemCard[] = [
  {
    id: 'multi-agent-buy',
    title: 'Should a company buy a multi-agent platform?',
    category: 'Finance / AI',
    prompt:
      'Determine whether an enterprise Autonomous Multi-Agent Resource Exchange platform with dynamic budget reallocation and runtime DAG mutation is commercially viable ($42.6B TAM, 28.4% CAGR). Identify competitors (LangGraph, CrewAI, AutoGen), validate empirical claims, and assess API latency risks.',
    what: 'A buy-or-build question for multi-agent infrastructure — not “can we make another agent.”',
    why: 'Workflow SDKs already exist. The open question is whether paying for a closed loop (who works, what they cost, whether V2 is better) is worth it versus LangGraph / CrewAI / AutoGen.',
    extra: 'Audit this card after a run: V1 vs V2 contribution, AO coding worker, Neatlogs competitor + TAM traces.',
    aoAngle: 'Spawn an isolated coding worker only if a CODE artifact (unit economics) is worth $0.02. Sessions live in AO’s sidebar, not only on the Board.',
    neatlogsAngle: 'Watch competitor-intel and TAM agents. Neatlogs shows tool calls. AAGAM decides whether those calls were worth keeping.',
    specialists: ['Competitor Intelligence', 'TAM / SAM Modeler', 'Adversarial Risk Auditor', 'Pricing & Unit Economics', 'AO Coding Worker', 'Executive Synthesizer'],
    claims: [
      { claim: 'Workflow primitives already exist; economic evolution does not', source: 'Competitor Intelligence' },
      { claim: 'Beachhead is wasted agent spend, not greenfield chatbots', source: 'TAM / SAM Modeler' },
    ],
    aoExpect: ['Architecture session (orchestrator)', 'Agent session: AAGAM-code worker', 'Worktree ao/<session>/root'],
    neatlogsSpans: ['WORKFLOW buy-or-build', 'AGENT competitor-intel', 'AGENT tam-modeler', 'TOOL web-search', 'EVALUATOR quality-gate'],
  },
  {
    id: 'l1-support',
    title: 'Can AI replace L1 support at a retailer?',
    category: 'Enterprise',
    prompt:
      'Analyze the business viability and enterprise ROI of migrating from human L1 support to autonomous AI agents for a Fortune 500 retailer with 1.2M annual tickets. Calculate resolution rate, payback period, and escalation risk.',
    what: 'An operations decision: replace human L1 tickets with agents, or do not.',
    why: 'A list of chatbot vendors is not the answer. You need resolution rate, escalation risk, and payback — then whether the team that produced those numbers was worth paying for.',
    extra: 'After a run, compare the finance agent’s contribution against a low-value scraper that V2 should drop.',
    aoAngle: 'A coding worker can implement the payback calculator in an isolated worktree so the claim is a CODE artifact, not a paragraph.',
    neatlogsAngle: 'Trace finance and risk agents. Latency or tool failures are evidence — not a fake “thinking” spinner.',
    specialists: ['Market Intelligence', 'Quantitative Modeler', 'Adversarial Risk Auditor', 'AO Coding Worker', 'Executive Synthesizer'],
    claims: [
      { claim: 'Payback must clear at conservative resolution rate', source: 'Quantitative Modeler' },
      { claim: 'Escalation risk is the killer metric, not demo accuracy', source: 'Risk Auditor' },
    ],
    aoExpect: ['Task session = this L1 goal', 'Agent session for payback CODE', 'No Board card until a PR exists'],
    neatlogsSpans: ['AGENT finance-modeler', 'TOOL calculator', 'AGENT risk-auditor', 'GUARDRAIL quality'],
  },
  {
    id: 'ayurveda',
    title: 'Ayurvedic MedTech in India',
    category: 'Health',
    prompt:
      'I want to build an Ayurvedic MedTech platform in India. Find existing companies, market opportunity, business models, costs, regulatory risks and tell me whether it can scale.',
    what: 'A one-sentence founder goal. You do not pick researchers, lawyers, or a budget.',
    why: 'The crowded layer is wellness brands. The gap is clinical-grade chronic care a doctor or insurer will pay for.',
    extra: 'Audit: company research vs regulatory vs finance vs AO unit-economics CODE. The output must name the gap, not dump brand names.',
    aoAngle: 'AO runs the LTV/CAC/payback helper in a private folder. Board stays empty until a PR exists. The session still counts.',
    neatlogsAngle: 'Regulatory and finance traces prove the recommendation is not a single generated paragraph.',
    specialists: ['Company Research', 'Market Sizing', 'Regulatory Analyst', 'Finance Modeler', 'AO Coding Worker', 'Executive Synthesizer'],
    claims: [
      { claim: 'Consumer Ayurveda is crowded; clinical Ayurvedic MedTech is not', source: 'Company Research' },
      { claim: 'Clinic-referred LTV/CAC is the path that can clear payback', source: 'Finance Modeler' },
      { claim: 'Unvalidated health claims will not survive AYUSH rules', source: 'Regulatory Analyst' },
    ],
    aoExpect: ['Worker named AAGAM-code', 'Isolated worktree for unit-economics.ts', 'Harness: Codex / Cursor / Kiro'],
    neatlogsSpans: ['AGENT company-research', 'AGENT regulatory', 'AGENT finance', 'TOOL ao_coding_worker', 'CHAIN synthesizer'],
  },
  {
    id: 'ev-europe',
    title: 'European EV charging — invest or wait?',
    category: 'Climate',
    prompt:
      'European EV charging infrastructure investment thesis: Assess grid capacity constraints, ultra-fast charging unit economics, and subsidy exposure across DACH region.',
    what: 'An invest-or-wait thesis for DACH ultra-fast charging.',
    why: 'Grid, subsidy, and utilization decide the outcome. A slide of TAM does not.',
    extra: 'Use V1 vs V2 to see if a low-contribution scraper was reclaimed after the first pass.',
    aoAngle: 'Coding worker can score utilization / payback in isolation so the finance claim is checkable.',
    neatlogsAngle: 'Policy and grid tool calls belong in Neatlogs. AAGAM still decides whether to keep that specialist.',
    specialists: ['Grid & Policy Research', 'Charging Unit Economics', 'Infrastructure Competitors', 'AO Coding Worker', 'Investment Synthesizer'],
    claims: [
      { claim: 'Utilization, not TAM, decides ultra-fast charging', source: 'Charging Unit Economics' },
      { claim: 'Subsidy exposure is a first-class risk in DACH', source: 'Grid & Policy Research' },
    ],
    aoExpect: ['Agent session for utilization model', 'Architecture session V1 then maybe V2'],
    neatlogsSpans: ['AGENT grid-research', 'AGENT unit-economics', 'TOOL forecasting', 'EVALUATOR evidence-coverage'],
  },
  {
    id: 'ao-coding',
    title: 'Spawn a real isolated coding worker',
    category: 'Coding / AO',
    prompt:
      'Build a technical coding task: spawn an isolated AO worktree that implements a unit-economics calculator (LTV, CAC, payback) for an Ayurvedic MedTech protocol business, then verify the CODE artifact.',
    what: 'A live AO session — a real isolated folder, not a drawn Board card.',
    why: 'Judges need to see AO working. The Board is for pull requests. Sessions show in the AO sidebar and in this app’s live list.',
    extra: 'This card’s audit is the session list itself: name, harness, worktree, Neatlogs run id.',
    aoAngle: 'Expect a new worker after Analyze. If the daemon is down, we will not invent a fake card.',
    neatlogsAngle: 'This run’s trace is the proof of execution. Neatlogs observes; it does not pick the team.',
    specialists: ['AO Coding Worker', 'Executive Synthesizer'],
    claims: [
      { claim: 'A CODE artifact exists in an isolated worktree', source: 'AO session get' },
      { claim: 'Status is read from ao session ls — never invented', source: '/api/ao/status' },
    ],
    aoExpect: ['New worker AAGAM-code', 'ao/<id>/root worktree', 'Harness authorized (codex/cursor/kiro)'],
    neatlogsSpans: ['TOOL ao_coding_worker', 'AGENT implementer', 'TASK coding-run'],
  },
  {
    id: 'beauty-apac',
    title: 'Clean beauty D2C in Southeast Asia',
    category: 'Consumer',
    prompt:
      'Evaluate the viability of a D2C clean skincare brand in Southeast Asia: competitive moats against Korean incumbents, supply chain margin tolerance, and TikTok Shop CAC.',
    what: 'A D2C viability question against Korean incumbents and TikTok CAC.',
    why: 'If CAC only works at heroic conversion, the honest output is “do not proceed,” not a hopeful brand story.',
    extra: 'Inspect who earned budget: market vs finance vs a scraper that should be reclaimed.',
    aoAngle: 'A small CODE artifact can encode CAC payback so the claim is verifiable.',
    neatlogsAngle: 'Market and pricing traces show whether sources were actually fetched.',
    specialists: ['Market Intelligence', 'Quantitative Modeler', 'Adversarial Risk Auditor', 'AO Coding Worker', 'Executive Synthesizer'],
    claims: [
      { claim: 'TikTok CAC must clear payback at conservative conversion', source: 'Quantitative Modeler' },
      { claim: 'Korean incumbents already own the shelf; the job-to-be-done must be different', source: 'Market Intelligence' },
    ],
    aoExpect: ['Worker for CAC model', 'Task session for this D2C goal'],
    neatlogsSpans: ['AGENT market-intel', 'AGENT pricing', 'TOOL web-search', 'EVALUATOR contribution'],
  },
];

export function findProblem(idOrTitle: string | null) {
  if (!idOrTitle) return null;
  return PROBLEM_CARDS.find((p) => p.id === idOrTitle || p.title === idOrTitle) ?? null;
}
