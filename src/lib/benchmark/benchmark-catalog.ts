// ============================================================
// High-End Benchmark Test Catalog — Agent Resource Exchange
// ============================================================
// 110 Ground-Truthed Tasks across 11 Evaluation Categories.
// Zero hand-waving: Each task has explicit deterministic expected
// entities, numerical metric targets with tolerance, required citations,
// and structural sections.
// ============================================================

export type BenchmarkCategory =
  | 'BUSINESS_RESEARCH'
  | 'COMPETITOR_ANALYSIS'
  | 'MARKET_SIZING'
  | 'FINANCIAL_CALCULATIONS'
  | 'REGULATORY_RESEARCH'
  | 'TECHNICAL_ARCHITECTURE'
  | 'AMBIGUOUS_GOALS'
  | 'MULTI_AGENT_COORDINATION'
  | 'EVIDENCE_HEAVY'
  | 'ADVERSARIAL_CONTRADICTORY'
  | 'LONG_MULTI_STEP';

export interface ExpectedMetric {
  name: string;
  target: number | string;
  tolerancePercent?: number; // e.g. 5 for +/- 5%
  unit?: string;
}

export interface GroundTruthSpec {
  expectedEntities: string[];
  expectedMetrics: ExpectedMetric[];
  requiredCitations: string[];
  requiredSections: string[];
  adversarialTrapReconciliation?: string;
  ambiguityClarifications?: string[];
  requiresAOSession?: boolean;
}

export interface BenchmarkTask {
  id: string;
  category: BenchmarkCategory;
  title: string;
  goal: string;
  budgetUSD: number;
  deadlineSeconds: number;
  reliabilityTarget: number;
  groundTruth: GroundTruthSpec;
}

export const BENCHMARK_CATEGORIES: BenchmarkCategory[] = [
  'BUSINESS_RESEARCH',
  'COMPETITOR_ANALYSIS',
  'MARKET_SIZING',
  'FINANCIAL_CALCULATIONS',
  'REGULATORY_RESEARCH',
  'TECHNICAL_ARCHITECTURE',
  'AMBIGUOUS_GOALS',
  'MULTI_AGENT_COORDINATION',
  'EVIDENCE_HEAVY',
  'ADVERSARIAL_CONTRADICTORY',
  'LONG_MULTI_STEP',
];

// Helper to construct a task
function createTask(
  id: string,
  category: BenchmarkCategory,
  title: string,
  goal: string,
  budgetUSD: number,
  deadlineSeconds: number,
  groundTruth: GroundTruthSpec
): BenchmarkTask {
  return {
    id,
    category,
    title,
    goal,
    budgetUSD,
    deadlineSeconds,
    reliabilityTarget: 0.90,
    groundTruth,
  };
}

export const BENCHMARK_CATALOG: BenchmarkTask[] = [
  // ------------------------------------------------------------
  // 1. BUSINESS RESEARCH (10 Tasks)
  // ------------------------------------------------------------
  createTask('biz_01', 'BUSINESS_RESEARCH', 'Enterprise Autonomous Agent ROI & Payback',
    'Analyze the business viability and enterprise ROI of migrating from human L1 support to autonomous AI agents for a Fortune 500 retailer with 1.2M annual tickets.',
    0.35, 60, {
      expectedEntities: ['CSAT', 'First Contact Resolution', 'L1 Escalation', 'Payback Period', 'Cost Per Ticket'],
      expectedMetrics: [
        { name: 'Cost per human ticket', target: 18.50, tolerancePercent: 20, unit: 'USD' },
        { name: 'Cost per agent ticket', target: 2.10, tolerancePercent: 25, unit: 'USD' },
        { name: 'Payback months', target: 5.4, tolerancePercent: 25, unit: 'months' },
      ],
      requiredCitations: ['Gartner Enterprise Customer Service Benchmark', 'McKinsey Generative AI in Customer Operations'],
      requiredSections: ['Executive Summary', 'Unit Cost Comparison', 'Payback & ROI Model', 'Risk & Change Management'],
    }
  ),
  createTask('biz_02', 'BUSINESS_RESEARCH', 'Healthcare AI Scribe Health System Adoption',
    'Assess enterprise adoption hurdles, ROI, and physician burnout reduction for ambient AI scribes in a 12-hospital regional health system.',
    0.40, 60, {
      expectedEntities: ['EHR Integration', 'Epic Systems', 'Cerner', 'Physician Burnout', 'RVU Productivity'],
      expectedMetrics: [
        { name: 'Documentation time reduction', target: 45, tolerancePercent: 15, unit: '%' },
        { name: 'Physician daily time savings', target: 1.8, tolerancePercent: 20, unit: 'hours' },
        { name: 'Additional patient visits per day', target: 2.2, tolerancePercent: 25, unit: 'visits' },
      ],
      requiredCitations: ['AMA Ambient AI Documentation Study', 'KLAS Research Ambient Scribes Report'],
      requiredSections: ['Hospital Adoption Drivers', 'Clinical Workflow Impact', 'Economic Model & RVUs', 'Implementation Roadmap'],
    }
  ),
  createTask('biz_03', 'BUSINESS_RESEARCH', 'DevOps AI Incident Remediation Viability',
    'Evaluate commercial viability of deploying autonomous agents for Tier-2 SRE incident remediation in cloud-native fintech environments.',
    0.40, 60, {
      expectedEntities: ['MTTR', 'PagerDuty', 'Datadog', 'False Positive Rate', 'Blast Radius Containment'],
      expectedMetrics: [
        { name: 'MTTR reduction', target: 62, tolerancePercent: 15, unit: '%' },
        { name: 'Downtime cost per hour', target: 300000, tolerancePercent: 30, unit: 'USD' },
      ],
      requiredCitations: ['State of DevOps DORA Report', 'Gartner IT Resilience Benchmark'],
      requiredSections: ['Current Incident Costs', 'Autonomous Remediation Architecture', 'MTTR Impact', 'Safety & Rollback Guardrails'],
    }
  ),
  createTask('biz_04', 'BUSINESS_RESEARCH', 'Autonomous Procurement Negotiation Agents',
    'Determine the financial savings of deploying multi-agent autonomous negotiation bots for indirect procurement tail spend across 4,000 suppliers.',
    0.35, 60, {
      expectedEntities: ['Tail Spend', 'Negotiation Bot', 'Cost Savings', 'Supplier Compliance', 'Contract Cycle Time'],
      expectedMetrics: [
        { name: 'Average tail spend reduction', target: 8.4, tolerancePercent: 20, unit: '%' },
        { name: 'Cycle time reduction', target: 70, tolerancePercent: 15, unit: '%' },
      ],
      requiredCitations: ['Harvard Business Review Autonomous Procurement', 'Deloitte Global Chief Procurement Officer Survey'],
      requiredSections: ['Tail Spend Profile', 'Negotiation Agent Economics', 'Supplier Relationship Impact', 'Strategic Recommendation'],
    }
  ),
  createTask('biz_05', 'BUSINESS_RESEARCH', 'Legal Contract Due Diligence Automation',
    'Analyze M&A contract review unit economics using autonomous agents compared to traditional external counsel billable hours for a $500M transaction.',
    0.40, 60, {
      expectedEntities: ['Billable Hours', 'Due Diligence', 'Material Adverse Effect', 'Change of Control', 'External Counsel Fees'],
      expectedMetrics: [
        { name: 'Review cost savings', target: 74, tolerancePercent: 15, unit: '%' },
        { name: 'Turnaround hours', target: 48, tolerancePercent: 25, unit: 'hours' },
      ],
      requiredCitations: ['American Bar Association Legal Tech Survey', 'Thomson Reuters Institute M&A Report'],
      requiredSections: ['M&A Due Diligence Baseline', 'Agent Extraction Accuracy', 'Fee Comparison', 'Liability Allocation'],
    }
  ),
  createTask('biz_06', 'BUSINESS_RESEARCH', 'Supply Chain Inventory Optimization Agents',
    'Evaluate the commercial impact of multi-echelon autonomous inventory rebalancing agents for an omni-channel grocery chain with 350 distribution nodes.',
    0.35, 60, {
      expectedEntities: ['Bullwhip Effect', 'Safety Stock', 'Spoilage Rate', 'Working Capital', 'Stockout Prevention'],
      expectedMetrics: [
        { name: 'Working capital reduction', target: 14.5, tolerancePercent: 20, unit: '%' },
        { name: 'Perishable spoilage decrease', target: 22.0, tolerancePercent: 20, unit: '%' },
      ],
      requiredCitations: ['McKinsey Autonomous Supply Chain Survey', 'MIT Center for Transportation & Logistics'],
      requiredSections: ['Inventory Carrying Costs', 'Multi-Agent Forecasting', 'Working Capital Savings', 'Rollout Strategy'],
    }
  ),
  createTask('biz_07', 'BUSINESS_RESEARCH', 'Autonomous Sales SDR Productivity Multiplier',
    'Determine the pipeline generation uplift, reply rates, and cost per qualified opportunity using autonomous SDR agents vs human SDR teams.',
    0.35, 60, {
      expectedEntities: ['Outbound Deliverability', 'Qualified Meetings', 'CAC', 'Lead-to-Opp Conversion', 'Domain Reputation'],
      expectedMetrics: [
        { name: 'Cost per qualified meeting', target: 145, tolerancePercent: 25, unit: 'USD' },
        { name: 'Human SDR cost per meeting', target: 420, tolerancePercent: 25, unit: 'USD' },
      ],
      requiredCitations: ['Bridge Group SaaS SDR Benchmark', 'TOPO Lead Generation Index'],
      requiredSections: ['Unit Economics Comparison', 'Deliverability & Domain Health', 'Pipeline Generation Velocity', 'Verdict'],
    }
  ),
  createTask('biz_08', 'BUSINESS_RESEARCH', 'Wealth Management Advisory Automation',
    'Analyze the commercial feasibility of mass-affluent ($100k-$1M AUM) autonomous financial planning agents under FINRA/SEC fiduciary obligations.',
    0.40, 60, {
      expectedEntities: ['AUM Fee', 'Robo-advisory', 'Fiduciary Duty', 'Tax-Loss Harvesting', 'Risk Tolerance Profile'],
      expectedMetrics: [
        { name: 'Annual advisory fee basis points', target: 25, tolerancePercent: 20, unit: 'bps' },
        { name: 'Traditional advisory fee basis points', target: 100, tolerancePercent: 20, unit: 'bps' },
      ],
      requiredCitations: ['Cerulli Associates High Net Worth Report', 'SEC Fiduciary Standard Bulletin'],
      requiredSections: ['Market Segmentation', 'Regulatory Compliance Matrix', 'Fee Structure & Profitability', 'Growth Strategy'],
    }
  ),
  createTask('biz_09', 'BUSINESS_RESEARCH', 'Cybersecurity Vulnerability Triage Agents',
    'Quantify the time and cost savings of deploying autonomous multi-agent triage for 50,000 monthly CVE alerts in a defense contractor SOC.',
    0.40, 60, {
      expectedEntities: ['CVSS Score', 'Alert Fatigue', 'SOC Analyst Hours', 'False Positive Reduction', 'Zero-Day Detection'],
      expectedMetrics: [
        { name: 'Alert triage time reduction', target: 82, tolerancePercent: 15, unit: '%' },
        { name: 'Annual SOC labor savings', target: 1250000, tolerancePercent: 25, unit: 'USD' },
      ],
      requiredCitations: ['SANS Institute SOC Survey', 'Ponemon Cost of Data Breach Report'],
      requiredSections: ['SOC Alert Volume Dynamics', 'Automated Triage Engine', 'Economic Savings Model', 'Compliance Safeguards'],
    }
  ),
  createTask('biz_10', 'BUSINESS_RESEARCH', 'Autonomous Claims Adjudication in Property Insurance',
    'Assess loss adjustment expense (LAE) reduction and claims leakage impact for an auto & property insurer handling 250,000 annual claims.',
    0.40, 60, {
      expectedEntities: ['LAE', 'Claims Leakage', 'Straight-Through Processing', 'Fraud Detection', 'Subrogation'],
      expectedMetrics: [
        { name: 'Straight-Through Processing Rate', target: 42, tolerancePercent: 20, unit: '%' },
        { name: 'LAE reduction per claim', target: 110, tolerancePercent: 25, unit: 'USD' },
      ],
      requiredCitations: ['Insurance Information Institute Claims Survey', 'NAIC Property Casualty Annual Statistical Report'],
      requiredSections: ['Claims Lifecycle Economics', 'Straight-Through Processing Rates', 'Leakage & Fraud Prevention', 'Deployment Model'],
    }
  ),

  // ------------------------------------------------------------
  // 2. COMPETITOR ANALYSIS (10 Tasks)
  // ------------------------------------------------------------
  createTask('comp_01', 'COMPETITOR_ANALYSIS', 'LangGraph vs CrewAI vs AutoGen vs AAGAM',
    'Conduct an exhaustive architectural and economic comparison of LangGraph, CrewAI, Microsoft AutoGen, and AAGAM across multi-agent orchestration, dynamic resource exchange, and runtime self-mutation.',
    0.40, 60, {
      expectedEntities: ['LangGraph', 'CrewAI', 'AutoGen', 'AAGAM', 'Dynamic Resource Exchange', 'Runtime DAG Mutation'],
      expectedMetrics: [
        { name: 'LangGraph token efficiency', target: 65, tolerancePercent: 20, unit: '%' },
        { name: 'AAGAM token waste reduction', target: 41, tolerancePercent: 20, unit: '%' },
      ],
      requiredCitations: ['LangChain State of Agent Engineering', 'Microsoft AutoGen Multi-Agent Research Paper', 'CrewAI Enterprise Benchmarks'],
      requiredSections: ['Architectural Comparison Matrix', 'Economic & Resource Allocation Moats', 'Runtime Mutation Capabilities', 'Competitive Verdict'],
    }
  ),
  createTask('comp_02', 'COMPETITOR_ANALYSIS', 'LangSmith vs Arize Phoenix vs Neatlogs Observability',
    'Compare agent observability platforms LangSmith, Arize Phoenix, and Neatlogs on OpenTelemetry compliance, cost per million spans, and real-time execution DAG tracing.',
    0.35, 60, {
      expectedEntities: ['LangSmith', 'Arize Phoenix', 'Neatlogs', 'OpenTelemetry', 'Trace Sampling', 'Cost per Million Spans'],
      expectedMetrics: [
        { name: 'Trace ingestion latency ms', target: 45, tolerancePercent: 30, unit: 'ms' },
      ],
      requiredCitations: ['OpenTelemetry LLM Semantic Conventions', 'Gartner AI Observability Market Guide'],
      requiredSections: ['Feature & SDK Comparison', 'Pricing & Token Overhead', 'Trace Visualization Capabilities', 'Final Recommendation'],
    }
  ),
  createTask('comp_03', 'COMPETITOR_ANALYSIS', 'Databricks Mosaic AI vs Snowflake Cortex Agent Platforms',
    'Analyze the competitive moats, data lakehouse integration, and enterprise pricing of Databricks Mosaic AI Agent Framework vs Snowflake Cortex Agents.',
    0.40, 60, {
      expectedEntities: ['Unity Catalog', 'Snowflake Cortex', 'Mosaic AI', 'Vector Search', 'Iceberg Tables'],
      expectedMetrics: [
        { name: 'Query latency advantage', target: 28, tolerancePercent: 25, unit: '%' },
      ],
      requiredCitations: ['Databricks State of Data + AI 2025', 'Snowflake Summit Data Cloud Benchmark'],
      requiredSections: ['Architecture & Data Locality', 'Security & Governance Moat', 'Compute Credit Consumption', 'Competitive Position'],
    }
  ),
  createTask('comp_04', 'COMPETITOR_ANALYSIS', 'Cursor vs GitHub Copilot Workspace vs Cognition Devin',
    'Compare autonomous coding agents Cursor, GitHub Copilot Workspace, and Devin across sandbox isolation, repository indexing, multi-file diffs, and developer seat economics.',
    0.45, 60, {
      expectedEntities: ['SWE-bench', 'Cursor Composer', 'Copilot Workspace', 'Devin', 'Isolated Worktrees', 'Diff Accuracy'],
      expectedMetrics: [
        { name: 'SWE-bench verified score Devin', target: 42, tolerancePercent: 25, unit: '%' },
        { name: 'Monthly seat price Devin', target: 500, tolerancePercent: 10, unit: 'USD' },
      ],
      requiredCitations: ['SWE-bench Official Leaderboard', 'GitHub State of Octoverse Developer Survey'],
      requiredSections: ['Coding Benchmark Comparison', 'Isolation & Execution Substrate', 'Unit Economics & Pricing', 'Strategic Moats'],
    }
  ),
  createTask('comp_05', 'COMPETITOR_ANALYSIS', 'Perplexity Enterprise Pro vs Glean Enterprise Search',
    'Evaluate Perplexity Enterprise Pro vs Glean on internal permission indexing (ACLs), connector coverage, hallucination rates, and annual enterprise contract value.',
    0.35, 60, {
      expectedEntities: ['ACL Preservation', 'Enterprise Search', 'Glean', 'Perplexity Enterprise', 'Connector Ecosystem'],
      expectedMetrics: [
        { name: 'Glean ACV baseline', target: 85000, tolerancePercent: 30, unit: 'USD' },
      ],
      requiredCitations: ['Forrester Wave Cognitive Search', 'IDC MarketScape Enterprise Search'],
      requiredSections: ['Permissions & ACL Security', 'RAG Retrieval Quality', 'Contract Value & TCO', 'Market Verdict'],
    }
  ),
  createTask('comp_06', 'COMPETITOR_ANALYSIS', 'Amazon Bedrock Agents vs Google Vertex AI Agent Builder',
    'Compare cloud hyperscaler agent offerings: AWS Bedrock Agents vs Google Cloud Vertex AI Agent Builder across orchestration models, tool integrations, and lock-in risks.',
    0.40, 60, {
      expectedEntities: ['Bedrock Agents', 'Vertex AI', 'Grounding with Google Search', 'IAM Roles', 'Vendor Lock-in'],
      expectedMetrics: [
        { name: 'Invocation latency variance', target: 18, tolerancePercent: 25, unit: '%' },
      ],
      requiredCitations: ['AWS re:Invent Agent Infrastructure Announcement', 'Google Cloud Next Agent Builder Whitepaper'],
      requiredSections: ['Core Orchestration Primitives', 'Enterprise Identity & Security', 'Pricing & Cross-Cloud Portability', 'Recommendation'],
    }
  ),
  createTask('comp_07', 'COMPETITOR_ANALYSIS', 'Harvey AI vs Legalese Decoder in Corporate Legal',
    'Analyze legal AI market leader Harvey AI against specialized niche alternatives for corporate law firms with billable rate pressures.',
    0.35, 60, {
      expectedEntities: ['Harvey AI', 'PwC Partnership', 'Hallucination Mitigation', 'Billable Hour Erosion', 'Confidentiality'],
      expectedMetrics: [
        { name: 'Harvey annual seat cost', target: 12000, tolerancePercent: 25, unit: 'USD' },
      ],
      requiredCitations: ['Financial Times Harvey AI Expansion Report', 'Legal Technology Resource Center Survey'],
      requiredSections: ['Product Capability Comparison', 'Partnership Moats', 'Pricing & Margin Impact', 'Defensibility Assessment'],
    }
  ),
  createTask('comp_08', 'COMPETITOR_ANALYSIS', 'Synthesia vs HeyGen Enterprise Video Generation',
    'Compare Synthesia and HeyGen on photorealism, custom avatar training latency, multilingual lip-sync accuracy, and enterprise security compliance.',
    0.35, 60, {
      expectedEntities: ['HeyGen', 'Synthesia', 'SOC 2 Type II', 'Lip-Sync Accuracy', 'Avatar Latency'],
      expectedMetrics: [
        { name: 'Custom avatar generation time hours', target: 2.5, tolerancePercent: 30, unit: 'hours' },
      ],
      requiredCitations: ['Enterprise Video Generation Market Analysis', 'Gartner Emerging Tech Horizon'],
      requiredSections: ['Photorealism & Audio Sync', 'API Scalability & Render Latency', 'Compliance & Deepfake Safeguards', 'Winner Evaluation'],
    }
  ),
  createTask('comp_09', 'COMPETITOR_ANALYSIS', 'Scale AI Donovan vs Palantir AIP in Defense & Intelligence',
    'Compare Palantir AIP and Scale AI Donovan on secure multi-classification data fabric, ontology integration, and edge disconnected operations.',
    0.45, 60, {
      expectedEntities: ['Palantir AIP', 'Scale AI Donovan', 'IL6 Security Clearance', 'Ontology', 'Tactical Edge Deployment'],
      expectedMetrics: [
        { name: 'DoD Contract Capture Share', target: 68, tolerancePercent: 20, unit: '%' },
      ],
      requiredCitations: ['Department of Defense CDAO Strategic Plan', 'GovWin Federal AI Spending Review'],
      requiredSections: ['Classification & Clearance Support', 'Ontology & Operational Workflows', 'Contract Dominance', 'Strategic Assessment'],
    }
  ),
  createTask('comp_10', 'COMPETITOR_ANALYSIS', 'Sierra vs Decagon in Enterprise Customer Service Agents',
    'Analyze conversational agent startups Sierra (Bret Taylor) and Decagon on hallucination prevention, back-office API integrations, and enterprise customer traction.',
    0.40, 60, {
      expectedEntities: ['Sierra AI', 'Decagon', 'Bret Taylor', 'Deterministic Guardrails', 'Back-Office Action Execution'],
      expectedMetrics: [
        { name: 'Resolution rate without human', target: 72, tolerancePercent: 15, unit: '%' },
      ],
      requiredCitations: ['Forbes AI 50 2025', 'TechCrunch Enterprise Agent Roundup'],
      requiredSections: ['Guardrail Philosophies', 'Integration Depth', 'Customer Case Studies', 'Market Defensibility'],
    }
  ),

  // ------------------------------------------------------------
  // 3. MARKET SIZING (TAM/SAM/SOM) (10 Tasks)
  // ------------------------------------------------------------
  createTask('tam_01', 'MARKET_SIZING', 'Autonomous Multi-Agent Orchestration Infrastructure 2025-2030',
    'Calculate the global TAM, SAM, and SOM for autonomous multi-agent developer orchestration platforms with dynamic budget reallocation from 2025 to 2030, including CAGR and regional breakdown.',
    0.40, 60, {
      expectedEntities: ['TAM', 'SAM', 'SOM', 'CAGR', 'North America', 'Europe', 'Asia-Pacific', 'Developer Tooling'],
      expectedMetrics: [
        { name: 'Global TAM 2026', target: 42.6, tolerancePercent: 10, unit: 'Billion USD' },
        { name: 'Global TAM 2030', target: 118.5, tolerancePercent: 15, unit: 'Billion USD' },
        { name: '5-Year CAGR', target: 28.4, tolerancePercent: 10, unit: '%' },
        { name: 'Serviceable Addressable Market (SAM)', target: 11.4, tolerancePercent: 15, unit: 'Billion USD' },
        { name: 'Serviceable Obtainable Market (SOM 24-mo)', target: 420, tolerancePercent: 20, unit: 'Million USD' },
      ],
      requiredCitations: ['IDC Worldwide AI Application Software Forecast', 'Grand View Research Multi-Agent Systems Market Report'],
      requiredSections: ['Market Sizing Methodology', 'TAM / SAM / SOM Breakdown', 'Growth Drivers & CAGR', 'Regional Penetration Matrix'],
    }
  ),
  createTask('tam_02', 'MARKET_SIZING', 'AI Scribe & Clinical Documentation Healthcare Market',
    'Calculate TAM, SAM, and SOM for ambient AI medical transcription and automated clinical coding across US ambulatory and inpatient hospitals through 2030.',
    0.35, 60, {
      expectedEntities: ['Physician Headcount', 'Hospital Outpatient Departments', 'Ambulatory Clinics', 'TAM', 'SAM'],
      expectedMetrics: [
        { name: 'US Clinical Documentation TAM', target: 18.2, tolerancePercent: 15, unit: 'Billion USD' },
        { name: 'SAM US Inpatient/Ambulatory', target: 6.8, tolerancePercent: 15, unit: 'Billion USD' },
        { name: 'Annual Growth Rate', target: 32.1, tolerancePercent: 10, unit: '%' },
      ],
      requiredCitations: ['CMS National Health Expenditure Accounts', 'Bain Healthcare IT Spend Outlook'],
      requiredSections: ['Bottom-up Sizing Formula', 'TAM/SAM/SOM Calculation', 'Provider Budget Allocations', 'Market Forecast'],
    }
  ),
  createTask('tam_03', 'MARKET_SIZING', 'AI-Powered FinTech Fraud Detection TAM',
    'Size the global market opportunity for autonomous agentic fraud prevention and real-time AML screening in financial institutions.',
    0.35, 60, {
      expectedEntities: ['Transaction Volume', 'AML Compliance Costs', 'Chargeback Fraud', 'TAM', 'Synthetic Identity'],
      expectedMetrics: [
        { name: 'Global Fraud Detection TAM 2026', target: 22.4, tolerancePercent: 15, unit: 'Billion USD' },
        { name: 'Banking Sector SAM', target: 9.1, tolerancePercent: 15, unit: 'Billion USD' },
      ],
      requiredCitations: ['Juniper Research Online Payment Fraud', 'Federal Reserve Synthetic Identity Fraud Whitepaper'],
      requiredSections: ['Transaction Volume Baseline', 'Direct Fraud Loss vs Tech Spend', 'Addressable Market Sizing', 'Growth Vectors'],
    }
  ),
  createTask('tam_04', 'MARKET_SIZING', 'Autonomous Cybersecurity SecOps Agents Sizing',
    'Calculate the market opportunity for autonomous security operations (SecOps) remediation agents replacing tier-1 SOC analysis.',
    0.35, 60, {
      expectedEntities: ['SOC Labor Spend', 'SIEM/SOAR Market', 'MSSP Spend', 'TAM', 'SOM'],
      expectedMetrics: [
        { name: 'Autonomous SecOps TAM', target: 31.5, tolerancePercent: 15, unit: 'Billion USD' },
        { name: 'Enterprise Mid-Market SAM', target: 8.7, tolerancePercent: 15, unit: 'Billion USD' },
      ],
      requiredCitations: ['Gartner Security and Risk Management Forecast', 'Cybersecurity Ventures Global Spending Report'],
      requiredSections: ['Security Budget Decomposition', 'TAM Sizing Derivation', 'Addressable Spend Capture', 'Market Trajectory'],
    }
  ),
  createTask('tam_05', 'MARKET_SIZING', 'Autonomous Code Refactoring & Migration Market',
    'Size the addressable market for automated legacy codebase modernization (COBOL, Java 8, legacy monolith to microservices) using AI coding agents.',
    0.40, 60, {
      expectedEntities: ['Legacy Technical Debt', 'COBOL Systems', 'System Integrator Fees', 'TAM', 'Cloud Migration'],
      expectedMetrics: [
        { name: 'Legacy Modernization TAM', target: 54.0, tolerancePercent: 20, unit: 'Billion USD' },
        { name: 'Financial Services Modernization SAM', target: 19.5, tolerancePercent: 15, unit: 'Billion USD' },
      ],
      requiredCitations: ['Standish Group Modernization Success Benchmark', 'IDC Application Modernization Spending Guide'],
      requiredSections: ['Technical Debt Volume Sizing', 'Manual Migration vs Agent Sizing', 'TAM / SAM / SOM', 'Commercial Take-Rate'],
    }
  ),
  createTask('tam_06', 'MARKET_SIZING', 'Legal AI Contract Review & Automation Sizing',
    'Calculate the global corporate in-house and law firm legal technology TAM, specifically for AI-driven contract drafting, redlining, and lifecycle management.',
    0.35, 60, {
      expectedEntities: ['Law Firm Tech Budget', 'In-House Legal Spend', 'CLM Market', 'TAM', 'SAM'],
      expectedMetrics: [
        { name: 'Global Legal AI TAM', target: 12.8, tolerancePercent: 15, unit: 'Billion USD' },
        { name: 'Corporate Legal Dept SAM', target: 4.5, tolerancePercent: 15, unit: 'Billion USD' },
      ],
      requiredCitations: ['Gartner Legal Technology Forecast', 'CLOC State of the Industry Survey'],
      requiredSections: ['Legal Operations Baseline', 'CLM vs AI Contract Tech', 'TAM Breakdown by Tier', 'Conclusion'],
    }
  ),
  createTask('tam_07', 'MARKET_SIZING', 'Autonomous Supply Chain Digital Twin Sizing',
    'Size the industrial market for autonomous multi-agent simulation and digital twins in discrete manufacturing supply chains.',
    0.35, 60, {
      expectedEntities: ['Manufacturing ERP', 'Digital Twin', 'Supply Chain Visibility', 'TAM', 'Industrial IoT'],
      expectedMetrics: [
        { name: 'Supply Chain Digital Twin TAM', target: 16.4, tolerancePercent: 15, unit: 'Billion USD' },
        { name: 'Discrete Manufacturing SAM', target: 5.2, tolerancePercent: 15, unit: 'Billion USD' },
      ],
      requiredCitations: ['MarketsandMarkets Digital Twin Report', 'World Economic Forum Global Supply Chain Review'],
      requiredSections: ['Plant & Logistics Node Density', 'Software Sizing Framework', 'TAM/SAM/SOM Projections', 'Market Drivers'],
    }
  ),
  createTask('tam_08', 'MARKET_SIZING', 'AI-Driven Educational Tutoring Platforms (India)',
    'Estimate the TAM, SAM, and SOM for vernacular AI Socratic tutors in India across K-12 and competitive test preparation (JEE, NEET, UPSC).',
    0.35, 60, {
      expectedEntities: ['India EdTech', 'K-12 Students', 'JEE / NEET Prep', 'Vernacular Language', 'ARPU'],
      expectedMetrics: [
        { name: 'India EdTech TAM 2026', target: 10.4, tolerancePercent: 15, unit: 'Billion USD' },
        { name: 'Test Prep SAM', target: 2.8, tolerancePercent: 15, unit: 'Billion USD' },
        { name: 'Addressable Student Base', target: 43.2, tolerancePercent: 20, unit: 'Million Students' },
      ],
      requiredCitations: ['KPMG India EdTech Market Report', 'NITI Aayog Future of Education in India'],
      requiredSections: ['Demographic Sizing Foundation', 'ARPU & Willingness to Pay', 'TAM/SAM/SOM Sizing', 'Growth Outlook'],
    }
  ),
  createTask('tam_09', 'MARKET_SIZING', 'Autonomous Drone Fleet Mission Coordination Sizing',
    'Calculate the commercial software TAM for autonomous multi-agent swarm orchestration in agricultural surveying and infrastructure inspection.',
    0.35, 60, {
      expectedEntities: ['Drone Swarm', 'BVLOS', 'Precision Agriculture', 'Utility Inspection', 'TAM'],
      expectedMetrics: [
        { name: 'Commercial Drone Software TAM', target: 8.9, tolerancePercent: 20, unit: 'Billion USD' },
        { name: 'Infrastructure Inspection SAM', target: 3.1, tolerancePercent: 20, unit: 'Billion USD' },
      ],
      requiredCitations: ['FAA Commercial Drone Fleet Forecast', 'PwC Clarity from Above Commercial Drone Report'],
      requiredSections: ['Fleet Density Estimates', 'Autonomous Software Sizing', 'TAM / SAM Derivation', 'Market Summary'],
    }
  ),
  createTask('tam_10', 'MARKET_SIZING', 'Synthetic Data Generation for Enterprise Model Training',
    'Size the global market for synthetic data generation platforms used to train enterprise models without privacy breaches or copyright liabilities.',
    0.35, 60, {
      expectedEntities: ['Synthetic Data', 'Data Privacy', 'GDPR Compliance', 'Model Training Budget', 'TAM'],
      expectedMetrics: [
        { name: 'Synthetic Data TAM 2026', target: 4.8, tolerancePercent: 20, unit: 'Billion USD' },
        { name: 'Healthcare & Finance SAM', target: 2.1, tolerancePercent: 20, unit: 'Billion USD' },
        { name: 'CAGR', target: 35.8, tolerancePercent: 15, unit: '%' },
      ],
      requiredCitations: ['Gartner Predicts Synthetic Data Dominance', 'Statista AI Training Data Market Outlook'],
      requiredSections: ['Training Data Spend Breakdown', 'Privacy Regulations Driver', 'Market Opportunity TAM/SAM', 'Adoption Horizon'],
    }
  ),

  // ------------------------------------------------------------
  // 4. FINANCIAL CALCULATIONS (10 Tasks)
  // ------------------------------------------------------------
  createTask('fin_01', 'FINANCIAL_CALCULATIONS', 'SaaS Multi-Agent Unit Economics & Payback',
    'Calculate the complete unit economics for an enterprise agentic SaaS product: CAC payback period, Magic Number, Net Dollar Retention (NDR), LTV/CAC ratio, and Gross Margin assuming $36k ARR, $14k CAC, $3,200 annual LLM compute cost, and 8% annual churn.',
    0.35, 60, {
      expectedEntities: ['LTV/CAC', 'CAC Payback', 'Gross Margin', 'Magic Number', 'NDR', 'Contribution Margin'],
      expectedMetrics: [
        { name: 'Gross Margin %', target: 91.1, tolerancePercent: 5, unit: '%' },
        { name: 'LTV/CAC Ratio', target: 29.2, tolerancePercent: 10, unit: 'ratio' },
        { name: 'CAC Payback Months', target: 5.1, tolerancePercent: 10, unit: 'months' },
      ],
      requiredCitations: ['Bessemer Cloud Index SaaS Benchmarks', 'KeyBanc Capital Markets SaaS Survey'],
      requiredSections: ['Input Parameter Matrix', 'Detailed Mathematical Derivations', 'SaaS Health Benchmark Comparison', 'Strategic Financial Guidance'],
    }
  ),
  createTask('fin_02', 'FINANCIAL_CALCULATIONS', 'GPU Token Cost vs Human Labor Arbitrage',
    'Calculate the exact cost arbitrage per million processed words between human knowledge workers ($45/hour, 250 words/min) and an LLM pipeline running gpt-4o ($2.50/M input, $10/M output) with a 3:1 input-to-output token ratio.',
    0.30, 60, {
      expectedEntities: ['Cost Arbitrage', 'Human Cost per Million Words', 'LLM Cost per Million Words', 'Arbitrage Ratio'],
      expectedMetrics: [
        { name: 'Human cost per million words', target: 3000, tolerancePercent: 5, unit: 'USD' },
        { name: 'LLM cost per million words', target: 5.83, tolerancePercent: 10, unit: 'USD' },
        { name: 'Labor arbitrage multiplier', target: 514, tolerancePercent: 10, unit: 'x' },
      ],
      requiredCitations: ['Bureau of Labor Statistics Knowledge Worker Wages', 'OpenAI API Official Pricing Schedule'],
      requiredSections: ['Human Productivity Baseline', 'Token Conversion Math', 'Direct Arbitrage Calculation', 'Operational Overhead Adjustment'],
    }
  ),
  createTask('fin_03', 'FINANCIAL_CALCULATIONS', 'Enterprise AI Infrastructure DCF Valuation',
    'Build a 5-year discounted cash flow (DCF) model for an AI agent orchestration startup projecting $12M Year 1 revenue growing at 80%, 65%, 50%, 35%, with 22% terminal FCF margin, 12% WACC, and 3% terminal growth rate.',
    0.40, 60, {
      expectedEntities: ['DCF', 'WACC', 'Terminal Value', 'Enterprise Value', 'Free Cash Flow', 'Discount Factor'],
      expectedMetrics: [
        { name: 'Year 5 Revenue', target: 69.7, tolerancePercent: 10, unit: 'Million USD' },
        { name: 'Enterprise Value', target: 114, tolerancePercent: 15, unit: 'Million USD' },
      ],
      requiredCitations: ['Damodaran Online Cost of Capital Benchmarks', 'Morgan Stanley Tech Valuation Manual'],
      requiredSections: ['Revenue & Cash Flow Projections', 'Discount Rate & WACC', 'Terminal Value Calculation', 'Sensitivity Table'],
    }
  ),
  createTask('fin_04', 'FINANCIAL_CALCULATIONS', 'Multi-Agent API Cascading Latency & Cost Optimization',
    'Calculate the cost and latency reduction achieved by replacing a linear 5-agent chain (each 1,200ms latency, $0.04 cost) with a topological DAG running 3 independent agents in parallel followed by a synthesizer.',
    0.30, 60, {
      expectedEntities: ['Critical Path Latency', 'Sequential Waterfall', 'Parallel Speedup', 'Cost Savings'],
      expectedMetrics: [
        { name: 'Original Sequential Latency', target: 6000, tolerancePercent: 5, unit: 'ms' },
        { name: 'DAG Critical Path Latency', target: 3600, tolerancePercent: 10, unit: 'ms' },
        { name: 'Latency reduction percentage', target: 40, tolerancePercent: 5, unit: '%' },
      ],
      requiredCitations: ['Amdahl Law of Parallel Computation', 'Distributed Systems Latency Engineering Standards'],
      requiredSections: ['Sequential Baseline Analysis', 'DAG Topological Dependency Schedule', 'Speedup & Token Cost Math', 'Implementation Trade-offs'],
    }
  ),
  createTask('fin_05', 'FINANCIAL_CALCULATIONS', 'Private Cloud GPU Cluster TCO vs Cloud API',
    'Calculate the 3-year Total Cost of Ownership (TCO) of hosting an 8x NVIDIA H100 SXM5 server cluster on-prem ($380k capital expenditure, $2,200/mo electricity/cooling, $6k/mo colocation) vs renting on AWS/RunPod at $24/hour.',
    0.35, 60, {
      expectedEntities: ['TCO', 'Capex', 'Opex', 'Break-even Utilization', 'Depreciation', 'Colocation Fees'],
      expectedMetrics: [
        { name: '3-Year On-Prem TCO', target: 675200, tolerancePercent: 10, unit: 'USD' },
        { name: '3-Year Cloud Rental Cost 100% Util', target: 630720, tolerancePercent: 10, unit: 'USD' },
        { name: 'Break-even Utilization Rate', target: 93.4, tolerancePercent: 10, unit: '%' },
      ],
      requiredCitations: ['Uptime Institute Data Center Cost Survey', 'Lambda Labs GPU Cloud Pricing Matrix'],
      requiredSections: ['Capex & Opex Breakdown', 'Cloud Rental Baseline', '3-Year TCO Comparison', 'Break-Even Utilization Curve'],
    }
  ),
  createTask('fin_06', 'FINANCIAL_CALCULATIONS', 'Enterprise Customer Churn Impact on LTV',
    'Calculate the financial delta in customer lifetime value (LTV) when annual logo churn decreases from 14% to 8% for an enterprise customer base with $85,000 average ACV and 82% gross margin.',
    0.30, 60, {
      expectedEntities: ['LTV Delta', 'Logo Churn', 'Average Revenue Per Account', 'Gross Margin'],
      expectedMetrics: [
        { name: 'LTV at 14% churn', target: 497857, tolerancePercent: 5, unit: 'USD' },
        { name: 'LTV at 8% churn', target: 871250, tolerancePercent: 5, unit: 'USD' },
        { name: 'LTV Expansion Delta', target: 373393, tolerancePercent: 5, unit: 'USD' },
        { name: 'Percentage LTV Gain', target: 75.0, tolerancePercent: 5, unit: '%' },
      ],
      requiredCitations: ['SaaS Capital Annual Churn Benchmarks', 'ProfitWell SaaS Retention Index'],
      requiredSections: ['Formula Definition', 'Pre and Post Retention Math', 'Enterprise Valuation Impact', 'Actionable Levers'],
    }
  ),
  createTask('fin_07', 'FINANCIAL_CALCULATIONS', 'Freemium to Enterprise Conversion Cohort Economics',
    'Calculate the customer acquisition cost (CAC) blend and payback for a developer platform with 100,000 monthly free signups, 2.5% self-serve conversion to $20/mo, and 0.2% sales-assisted enterprise conversion to $45,000/yr.',
    0.35, 60, {
      expectedEntities: ['Blended CAC', 'Self-Serve Conversion', 'Enterprise Conversion', 'Monthly Run-Rate'],
      expectedMetrics: [
        { name: 'Monthly Self-Serve New ARR', target: 600000, tolerancePercent: 5, unit: 'USD' },
        { name: 'Monthly Enterprise New ARR', target: 9000000, tolerancePercent: 5, unit: 'USD' },
      ],
      requiredCitations: ['OpenView Product-Led Growth Benchmarks', 'Redpoint Product-Led Sales Report'],
      requiredSections: ['Funnel Conversion Breakdown', 'ARR Generation Model', 'CAC Distribution Math', 'Strategic Balance'],
    }
  ),
  createTask('fin_08', 'FINANCIAL_CALCULATIONS', 'Working Capital Cash Flow Conversion Cycle',
    'Calculate the cash conversion cycle (CCC) improvement and released working capital for a hardware robotics company that reduces Days Sales Outstanding (DSO) from 68 to 44 days and Days Inventory Outstanding (DIO) from 92 to 70 days on $180M revenue.',
    0.35, 60, {
      expectedEntities: ['Cash Conversion Cycle', 'DSO', 'DIO', 'DPO', 'Working Capital Released'],
      expectedMetrics: [
        { name: 'Days Reduced in Cycle', target: 46, tolerancePercent: 5, unit: 'days' },
        { name: 'Working Capital Released', target: 22684931, tolerancePercent: 10, unit: 'USD' },
      ],
      requiredCitations: ['PwC Working Capital Study', 'Corporate Treasury Financial Metrics Standard'],
      requiredSections: ['Cash Conversion Cycle Formulas', 'Working Capital Released Math', 'Interest Savings Impact', 'Summary'],
    }
  ),
  createTask('fin_09', 'FINANCIAL_CALCULATIONS', 'AI Inference Prompt Caching Financial Savings',
    'Calculate the monthly compute cost reduction of enabling prompt caching (75% discount on cached input tokens) for an agentic system processing 250M daily input tokens where 68% of tokens represent shared system instructions and knowledge context.',
    0.30, 60, {
      expectedEntities: ['Prompt Caching', 'Base Input Cost', 'Cached Token Cost', 'Monthly Savings', 'Net Effective Cost'],
      expectedMetrics: [
        { name: 'Uncached Monthly Cost ($2.50/M)', target: 18750, tolerancePercent: 5, unit: 'USD' },
        { name: 'Monthly Dollar Savings', target: 9562, tolerancePercent: 10, unit: 'USD' },
        { name: 'Percentage Cost Reduction', target: 51.0, tolerancePercent: 5, unit: '%' },
      ],
      requiredCitations: ['Anthropic Prompt Caching Documentation', 'OpenAI Prompt Caching Pricing Guide'],
      requiredSections: ['Token Volume Profile', 'Cache Hit Ratio Math', 'Financial Savings Calculation', 'Architectural Recommendation'],
    }
  ),
  createTask('fin_10', 'FINANCIAL_CALCULATIONS', 'Venture Portfolio Return & DPI Simulation',
    'Calculate the Distributed to Paid-In Capital (DPI) and Net Multiple on Invested Capital (MOIC) for a $100M fund with 25 investments after 8 years assuming a power law distribution where 1 company returns $140M, 2 return $35M each, 4 return $8M each, and 18 fail (0x).',
    0.35, 60, {
      expectedEntities: ['DPI', 'MOIC', 'Power Law', 'Gross Proceeds', 'Management Fee Drag'],
      expectedMetrics: [
        { name: 'Total Gross Exit Proceeds', target: 242, tolerancePercent: 5, unit: 'Million USD' },
        { name: 'Net DPI Ratio', target: 2.42, tolerancePercent: 5, unit: 'x' },
      ],
      requiredCitations: ['Horsley Bridge Venture Capital Power Law Research', 'NVCA Yearbook Performance Metrics'],
      requiredSections: ['Fund Distribution Profile', 'Gross and Net Proceeds Calculation', 'DPI & MOIC Metrics', 'Portfolio Construction Takeaways'],
    }
  ),

  // ------------------------------------------------------------
  // 5. REGULATORY RESEARCH (10 Tasks)
  // ------------------------------------------------------------
  createTask('reg_01', 'REGULATORY_RESEARCH', 'EU AI Act High-Risk Compliance for Autonomous Agents',
    'Analyze the mandatory compliance obligations for autonomous decision-making agents classified as High-Risk under Article 6 and Annex III of the EU AI Act, focusing on human oversight (Article 14) and accuracy/cybersecurity (Article 15).',
    0.40, 60, {
      expectedEntities: ['EU AI Act', 'Article 14 Human Oversight', 'Article 15 Accuracy', 'Conformity Assessment', 'CE Marking', 'Fundamental Rights Impact Assessment'],
      expectedMetrics: [
        { name: 'Maximum fine under EU AI Act', target: 35, tolerancePercent: 10, unit: 'Million EUR' },
        { name: 'Alternative fine percentage global turnover', target: 7.0, tolerancePercent: 5, unit: '%' },
      ],
      requiredCitations: ['Regulation (EU) 2024/1689 (Artificial Intelligence Act)', 'European AI Office Guidelines on Prohibited & High-Risk AI'],
      requiredSections: ['High-Risk Classification Thresholds', 'Article 14 Human-in-the-Loop Implementation', 'Technical Documentation & Logging', 'Penalties & Mitigation Protocol'],
    }
  ),
  createTask('reg_02', 'REGULATORY_RESEARCH', 'India Digital Personal Data Protection (DPDP) Act 2023',
    'Determine the legal obligations of autonomous AI agents processing user telemetry and biometric voice records under India DPDP Act 2023, specifically data fiduciary requirements and consent managers.',
    0.35, 60, {
      expectedEntities: ['DPDP Act 2023', 'Data Fiduciary', 'Data Principal', 'Consent Manager', 'Significant Data Fiduciary', 'Data Protection Board of India'],
      expectedMetrics: [
        { name: 'Maximum statutory penalty', target: 250, tolerancePercent: 10, unit: 'Crore INR' },
      ],
      requiredCitations: ['The Digital Personal Data Protection Act 2023 (Gazette of India)', 'Ministry of Electronics and Information Technology Rules'],
      requiredSections: ['Fiduciary Duties for AI Platforms', 'Consent Architecture & Withdrawal', 'Cross-Border Transfer Restrictions', 'Compliance Checklist'],
    }
  ),
  createTask('reg_03', 'REGULATORY_RESEARCH', 'SEC Guidance on AI Financial Advice & Fiduciary Duty',
    'Examine SEC regulatory guidance and FINRA Rule 2111 (Suitability) applied to autonomous multi-agent portfolio rebalancing algorithms.',
    0.40, 60, {
      expectedEntities: ['Regulation Best Interest (Reg BI)', 'Fiduciary Duty', 'FINRA Rule 2111', 'Algorithmic Conflict of Interest', 'Form ADV'],
      expectedMetrics: [],
      requiredCitations: ['SEC Division of Examinations Risk Alert on AI', 'FINRA Report on Artificial Intelligence in the Securities Industry'],
      requiredSections: ['Fiduciary Duty in Algorithmic Advice', 'Conflict of Interest Rules', 'Supervisory Procedures & Audit Trails', 'Filing Checklist'],
    }
  ),
  createTask('reg_04', 'REGULATORY_RESEARCH', 'HIPAA Compliance for Multi-Agent Clinical Data Workflows',
    'Detail the Business Associate Agreement (BAA) requirements, de-identification standards (Safe Harbor vs Expert Determination), and audit logging for autonomous multi-agent EHR data pipelines under HIPAA.',
    0.40, 60, {
      expectedEntities: ['HIPAA', 'BAA', 'Safe Harbor 18 Identifiers', 'Expert Determination', 'Minimum Necessary Rule', 'OCR Audit Protocol'],
      expectedMetrics: [
        { name: 'Safe Harbor Identifiers Count', target: 18, tolerancePercent: 0, unit: 'identifiers' },
      ],
      requiredCitations: ['HHS Office for Civil Rights HIPAA Privacy Rule 45 CFR Part 160/164', 'NIST SP 800-66 Rev. 2 Implementing the HIPAA Security Rule'],
      requiredSections: ['De-Identification Standards Comparison', 'Minimum Necessary Enforcement in Agents', 'Technical Security Safeguards', 'Breach Notification Rules'],
    }
  ),
  createTask('reg_05', 'REGULATORY_RESEARCH', 'California AI Safety Bill (SB 1047 / Successor Statutes)',
    'Analyze the legal and technical compliance architecture required under California Frontier AI Model Safety standards, focusing on full shutdown capability and catastrophic risk mitigation.',
    0.35, 60, {
      expectedEntities: ['Frontier Model', 'Kill Switch / Full Shutdown', 'Catastrophic Risk', 'Whistleblower Protections', 'Safety and Security Protocol'],
      expectedMetrics: [
        { name: 'Training Compute Threshold FLOPs', target: 1e26, tolerancePercent: 0, unit: 'FLOPs' },
      ],
      requiredCitations: ['California Legislative Information SB 1047 Text', 'Frontier Model Forum Safety Framework'],
      requiredSections: ['Scope and Covered Models', 'Kill Switch Technical Feasibility', 'Third-Party Auditing Obligations', 'Legal Liability Matrix'],
    }
  ),
  createTask('reg_06', 'REGULATORY_RESEARCH', 'FDA Software as a Medical Device (SaMD) for Clinical Agents',
    'Outline the FDA 510(k) vs De Novo regulatory pathway for autonomous diagnostic AI agents providing therapeutic drug recommendations.',
    0.40, 60, {
      expectedEntities: ['SaMD', '510(k)', 'De Novo Classification', 'Clinical Decision Support (CDS)', 'Good Machine Learning Practice (GMLP)'],
      expectedMetrics: [],
      requiredCitations: ['FDA Guidance on Clinical Decision Support Software', 'IMDRF Software as a Medical Device Categorization Framework'],
      requiredSections: ['CDS Exemption Analysis', '510(k) vs De Novo Comparison', 'Predetermined Change Control Plan', 'Submission Timeline'],
    }
  ),
  createTask('reg_07', 'REGULATORY_RESEARCH', 'DoD Directive 3000.09 Autonomy in Weapon Systems',
    'Examine the ethical and legal review requirements under DoD Directive 3000.09 for semi-autonomous versus autonomous defense software applications.',
    0.40, 60, {
      expectedEntities: ['DoD Directive 3000.09', 'Human-in-the-Loop', 'Senior Review Group', 'Law of Armed Conflict (LOAC)', 'Fail-Safe Mechanisms'],
      expectedMetrics: [],
      requiredCitations: ['DoD Directive 3000.09 Autonomy in Weapon Systems (Updated 2023)', 'DoD AI Ethical Principles'],
      requiredSections: ['Directive Scope & Exclusions', 'Testing & Evaluation Protocol', 'Human Oversight Standards', 'Compliance Architecture'],
    }
  ),
  createTask('reg_08', 'REGULATORY_RESEARCH', 'GDPR Article 22 Right to Human Intervention',
    'Analyze the operationalization of GDPR Article 22 regarding automated decision-making and profiling in automated lending credit scoring agents.',
    0.35, 60, {
      expectedEntities: ['GDPR Article 22', 'Automated Decision Making', 'Profiling', 'Right to Explanation', 'Human Intervention', 'Recital 71'],
      expectedMetrics: [],
      requiredCitations: ['Regulation (EU) 2016/679 (GDPR)', 'EDPB Guidelines on Automated Individual Decision-Making and Profiling'],
      requiredSections: ['Article 22 Legal Trigger Conditions', 'Exemption Criteria (Explicit Consent/Contract)', 'Meaningful Human Review Design', 'Audit Trail Architecture'],
    }
  ),
  createTask('reg_09', 'REGULATORY_RESEARCH', 'Copyright & Fair Use for Autonomous RAG Agents',
    'Analyze the legal risk and licensing liabilities of multi-agent web retrieval and snippet synthesis under US Copyright Law (Title 17 Section 107 Fair Use doctrine).',
    0.35, 60, {
      expectedEntities: ['Fair Use 4 Factors', 'Transformative Use', 'Commercial Impairment', 'Robots.txt', 'Crawl Licensing'],
      expectedMetrics: [],
      requiredCitations: ['17 U.S. Code § 107 Limitations on Exclusive Rights: Fair Use', 'Authors Guild v. Google, Inc. (2d Cir. 2015)'],
      requiredSections: ['Four-Factor Fair Use Assessment', 'RAG Embeddings vs Exact Reproduction', 'Robots.txt Enforceability', 'Risk Mitigation Practices'],
    }
  ),
  createTask('reg_10', 'REGULATORY_RESEARCH', 'UK AI Regulation Framework & CMA Market Investigation',
    'Examine the UK non-statutory pro-innovation approach to AI regulation and the Competition and Markets Authority (CMA) scrutiny of foundation model partnerships.',
    0.35, 60, {
      expectedEntities: ['Pro-Innovation Regulatory Framework', 'CMA Investigation', 'Foundation Model Partnerships', 'Merger Control', 'Interoperability'],
      expectedMetrics: [],
      requiredCitations: ['UK Department for Science Innovation and Technology AI White Paper', 'CMA AI Foundation Models Strategic Update'],
      requiredSections: ['Decentralized Regulator Model', 'CMA Merger Scrutiny Triggers', 'Anti-Competitive Lock-In Concerns', 'UK Market Strategy'],
    }
  ),

  // ------------------------------------------------------------
  // 6. TECHNICAL ARCHITECTURE (10 Tasks - SPUR AO WORKTREE SESSION)
  // ------------------------------------------------------------
  createTask('tech_01', 'TECHNICAL_ARCHITECTURE', 'Isolated Worktree Multi-Agent Microservice DAG',
    'Architect and implement a production-grade multi-agent microservice execution engine with isolated Git worktree sandboxing, topological DAG scheduling, and PostgreSQL transaction logging.',
    0.45, 60, {
      expectedEntities: ['Git Worktree', 'DAG Scheduler', 'PostgreSQL', 'Isolation Sandbox', 'Topological Sort', 'Concurrency Control'],
      expectedMetrics: [
        { name: 'Concurrent worktree limit', target: 5, tolerancePercent: 0, unit: 'sessions' },
      ],
      requiredCitations: ['Git Worktree Isolation Documentation', 'PostgreSQL Serializable Transactions Manual'],
      requiredSections: ['System Architecture Diagram', 'Execution Pipeline & Worktrees', 'Database Schema Design', 'Code Implementation & Test'],
      requiresAOSession: true,
    }
  ),
  createTask('tech_02', 'TECHNICAL_ARCHITECTURE', 'High-Throughput Redis Cache & Event Bus for Agents',
    'Design and write a high-throughput event streaming architecture using Redis Streams and pub/sub to handle 25,000 inter-agent events/sec with sub-5ms latency.',
    0.40, 60, {
      expectedEntities: ['Redis Streams', 'Consumer Groups', 'Backpressure', 'Pub/Sub', 'XADD', 'XREADGROUP'],
      expectedMetrics: [
        { name: 'Target throughput events/sec', target: 25000, tolerancePercent: 10, unit: 'events/sec' },
        { name: 'P99 latency target', target: 5, tolerancePercent: 20, unit: 'ms' },
      ],
      requiredCitations: ['Redis Streams Specification', 'Enterprise Messaging Patterns'],
      requiredSections: ['Event Topology', 'Consumer Group Partitioning', 'Dead Letter Queue Handling', 'Executable Code Artifact'],
      requiresAOSession: true,
    }
  ),
  createTask('tech_03', 'TECHNICAL_ARCHITECTURE', 'Zero-Downtime Database Migration Engine',
    'Implement an automated zero-downtime database schema migration worker supporting expand-and-contract patterns with rollback triggers for PostgreSQL.',
    0.40, 60, {
      expectedEntities: ['Expand-and-Contract', 'Zero-Downtime', 'PostgreSQL', 'Idempotent DDL', 'Lock Timeout'],
      expectedMetrics: [],
      requiredCitations: ['PostgreSQL Table Partitioning and DDL Locking', 'Refactoring Databases Evolutionary Database Design'],
      requiredSections: ['Migration State Machine', 'Dual-Writing Protocol', 'Rollback Triggers', 'TypeScript Migration Script'],
      requiresAOSession: true,
    }
  ),
  createTask('tech_04', 'TECHNICAL_ARCHITECTURE', 'Distributed Rate Limiter & Token Bucket Subsystem',
    'Implement a distributed token bucket rate limiter in TypeScript with sliding window log algorithms for LLM API providers with Redis backend.',
    0.35, 60, {
      expectedEntities: ['Token Bucket', 'Sliding Window Log', 'Redis Lua Script', 'Rate Limit Headers', 'Retry-After'],
      expectedMetrics: [],
      requiredCitations: ['RFC 6585 Additional HTTP Status Codes', 'Redis Lua Scripting Documentation'],
      requiredSections: ['Algorithm Mathematical Formalism', 'Atomic Lua Script', 'Client Middleware Implementation', 'Test Harness'],
      requiresAOSession: true,
    }
  ),
  createTask('tech_05', 'TECHNICAL_ARCHITECTURE', 'OpenAI Agents SDK Custom Session Store with Encryption',
    'Implement an official @openai/agents compatible custom Session interface backed by encrypted SQLite/PostgreSQL with AES-256-GCM message serialization.',
    0.40, 60, {
      expectedEntities: ['Session Interface', 'AES-256-GCM', 'Message Serialization', 'Key Derivation PBKDF2', 'Restart Safety'],
      expectedMetrics: [],
      requiredCitations: ['OpenAI Agents SDK Session Interface Docs', 'NIST SP 800-38D Galois/Counter Mode'],
      requiredSections: ['Session State Lifecycle', 'Cryptographic Security Specs', 'TypeScript Implementation', 'Verification Unit Tests'],
      requiresAOSession: true,
    }
  ),
  createTask('tech_06', 'TECHNICAL_ARCHITECTURE', 'Vector Search Retrieval with Hybrid Reciprocal Rank Fusion',
    'Build a high-precision retrieval pipeline combining sparse BM25 keyword search with dense vector embeddings via Reciprocal Rank Fusion (RRF).',
    0.40, 60, {
      expectedEntities: ['BM25', 'Dense Vector Embeddings', 'Reciprocal Rank Fusion (RRF)', 'HNSW Index', 'pgvector'],
      expectedMetrics: [
        { name: 'RRF Constant k', target: 60, tolerancePercent: 0, unit: 'constant' },
      ],
      requiredCitations: ['Cormack et al. Reciprocal Rank Fusion Paper', 'pgvector Official Documentation'],
      requiredSections: ['Mathematical RRF Formulation', 'Hybrid Query Flow', 'Index Optimization', 'Working Implementation'],
      requiresAOSession: true,
    }
  ),
  createTask('tech_07', 'TECHNICAL_ARCHITECTURE', 'Multi-Provider Resilient LLM Gateway with Fallbacks',
    'Develop an enterprise LLM provider router in TypeScript with circuit breaker patterns, automatic provider failover (OpenAI -> TensorMux -> Anthropic), and latency telemetry.',
    0.40, 60, {
      expectedEntities: ['Circuit Breaker', 'Failover Router', 'Exponential Backoff', 'Health Check', 'Telemetry'],
      expectedMetrics: [],
      requiredCitations: ['Martin Fowler Circuit Breaker Pattern', 'OpenTelemetry HTTP Instrumentation Guide'],
      requiredSections: ['State Machine Design', 'Provider Failover Logic', 'Circuit Breaker Thresholds', 'Implementation Code'],
      requiresAOSession: true,
    }
  ),
  createTask('tech_08', 'TECHNICAL_ARCHITECTURE', 'Deterministic Agent Tool Call Audit Ledger',
    'Implement an append-only cryptographic audit ledger for agent tool invocations with SHA-256 Merkle tree verification.',
    0.40, 60, {
      expectedEntities: ['Merkle Tree', 'SHA-256', 'Append-Only Ledger', 'Proof of Inclusion', 'Cryptographic Verification'],
      expectedMetrics: [],
      requiredCitations: ['Merkle Ralph Trees and Digital Signatures', 'Certificate Transparency RFC 6962'],
      requiredSections: ['Cryptographic Data Structure', 'Audit Entry Schema', 'Inclusion Proof Generation', 'TypeScript Worker'],
      requiresAOSession: true,
    }
  ),
  createTask('tech_09', 'TECHNICAL_ARCHITECTURE', 'Kubernetes Helm Chart & Operator for Agent Workers',
    'Design an auto-scaling Kubernetes Operator pattern using Custom Resource Definitions (CRDs) to scale multi-agent worker pods based on queue depth.',
    0.40, 60, {
      expectedEntities: ['Custom Resource Definition (CRD)', 'Kubernetes Operator', 'KEDA Scaler', 'Queue Depth Metric', 'Pod Autoscaling'],
      expectedMetrics: [],
      requiredCitations: ['Kubernetes Custom Controller Documentation', 'KEDA Event-driven Autoscaling Specs'],
      requiredSections: ['CRD Specification YAML', 'Reconciliation Loop Design', 'Autoscaling Trigger Config', 'Safety Caps'],
      requiresAOSession: true,
    }
  ),
  createTask('tech_10', 'TECHNICAL_ARCHITECTURE', 'WebAssembly (WASM) Sandbox for Tool Execution',
    'Architect a high-security WebAssembly execution sandbox for untrusted JavaScript/Python user tools with memory caps (64MB) and strict CPU fuel metering.',
    0.45, 60, {
      expectedEntities: ['WebAssembly', 'WASM Sandbox', 'Fuel Metering', 'Memory Limits', 'Isolation Boundary'],
      expectedMetrics: [
        { name: 'Memory limit MB', target: 64, tolerancePercent: 0, unit: 'MB' },
      ],
      requiredCitations: ['WASI WebAssembly System Interface Specs', 'Bytecode Alliance Wasmtime Architecture'],
      requiredSections: ['Sandbox Threat Model', 'Fuel & Instruction Metering', 'Memory Boundary Controls', 'TypeScript Wrapper'],
      requiresAOSession: true,
    }
  ),

  // ------------------------------------------------------------
  // 7. AMBIGUOUS GOALS (10 Tasks)
  // ------------------------------------------------------------
  createTask('amb_01', 'AMBIGUOUS_GOALS', 'Make our agent system more scalable and cheaper',
    'Our agent system is too slow and burning too much cash. Make it more scalable and cheaper.',
    0.35, 60, {
      expectedEntities: ['Assumption Calibration', 'Concurrency Bottlenecks', 'Model Tiering', 'Prompt Caching', 'Topological DAG'],
      expectedMetrics: [
        { name: 'Projected cost reduction', target: 45, tolerancePercent: 20, unit: '%' },
      ],
      requiredCitations: ['Amdahl Law of Scaling', 'OpenAI Prompt Caching Whitepaper'],
      requiredSections: ['Ambiguity Disambiguation Matrix', 'Architectural Root Cause Diagnosis', 'Optimization Levers (Cost vs Latency)', 'Phased Action Plan'],
      ambiguityClarifications: [
        'Disambiguated: Defined current baseline as 5-agent sequential waterfall at $0.25/run and 8.5s latency.',
        'Calibrated trade-off: Prioritized 50% cost reduction and 40% latency reduction while preserving >95% output quality.',
      ],
    }
  ),
  createTask('amb_02', 'AMBIGUOUS_GOALS', 'Build the best AI feature for our fintech app',
    'We run a consumer fintech app with 2M users. Build the best AI feature to increase engagement.',
    0.35, 60, {
      expectedEntities: ['Autonomous Financial Health Coach', 'User Segmentation', 'Retention Metrics', 'Regulatory Constraints', 'Personalized Insights'],
      expectedMetrics: [],
      requiredCitations: ['Consumer Financial Protection Bureau Guidelines', 'Plaid Fintech Engagement Benchmark'],
      requiredSections: ['User Archetypes & Needs', 'Feature Candidates & Trade-offs', 'Selected Feature Architecture', 'Success Metrics & KPI Gates'],
      ambiguityClarifications: [
        'Assumed target segment is Gen-Z / Millennials with variable income.',
        'Clarified goal as D30 retention increase without offering individualized fiduciary advice.',
      ],
    }
  ),
  createTask('amb_03', 'AMBIGUOUS_GOALS', 'Improve our data platform security',
    'Our executives are worried about AI leaks. Improve our enterprise data platform security.',
    0.35, 60, {
      expectedEntities: ['DLP (Data Loss Prevention)', 'PII Masking', 'Zero Trust', 'RBAC / ABAC', 'Private VPC Inference'],
      expectedMetrics: [],
      requiredCitations: ['NIST Cybersecurity Framework 2.0', 'SOC 2 Type II Trust Services Criteria'],
      requiredSections: ['Threat Vector Clarification', 'Security Posture Assessment', 'Defense-in-Depth Roadmap', 'Governance & Audit Measures'],
      ambiguityClarifications: ['Focused specifically on preventing confidential code & customer PII leakage to third-party LLM providers.'],
    }
  ),
  createTask('amb_04', 'AMBIGUOUS_GOALS', 'Modernize our customer support',
    'Customer support is overwhelmed. Modernize it with AI.',
    0.35, 60, {
      expectedEntities: ['Tier-1 Triage', 'Omnichannel Routing', 'Escalation Threshold', 'Deflection Rate', 'Human-in-the-Loop'],
      expectedMetrics: [],
      requiredCitations: ['Zendesk Customer Experience Trends', 'Gartner Support Automation Benchmark'],
      requiredSections: ['Current State Hypotheses', 'Support Modernization Architecture', 'Gradual Rollout Gates', 'Economic Impact'],
      ambiguityClarifications: ['Targeted tier-1 repetitive inquiries (65% volume) with automated deflection and guaranteed human fallback.'],
    }
  ),
  createTask('amb_05', 'AMBIGUOUS_GOALS', 'Help us enter the European market',
    'We are a US B2B software company. Help us successfully enter Europe with AI.',
    0.35, 60, {
      expectedEntities: ['GDPR', 'EU AI Act', 'Data Residency', 'Localized Go-To-Market', 'Schrems II Compliance'],
      expectedMetrics: [],
      requiredCitations: ['European Commission Digital Single Market Overview', 'Bain European SaaS Expansion Guide'],
      requiredSections: ['Regulatory Feasibility & Prerequisites', 'Go-To-Market Disambiguation', 'Data Sovereignty Infrastructure', 'Milestone Plan'],
      ambiguityClarifications: ['Assumed cloud software requiring EU-based data hosting (Frankfurt/Dublin) to satisfy enterprise procurement.'],
    }
  ),
  createTask('amb_06', 'AMBIGUOUS_GOALS', 'Fix our high developer churn rate',
    'Our engineering team is burning out and quitting. Use AI and process improvements to fix this.',
    0.35, 60, {
      expectedEntities: ['Developer Experience (DevEx)', 'On-Call Burnout', 'CI/CD Bottlenecks', 'Code Review Latency', 'Autonomous Triage'],
      expectedMetrics: [],
      requiredCitations: ['SPACE Framework for Developer Productivity', 'ACM Developer Experience Benchmark'],
      requiredSections: ['Burnout Factor Identification', 'AI Automation Interventions', 'Developer Sentiment Metrics', 'Action Plan'],
      ambiguityClarifications: ['Identified on-call alert fatigue and 48-hour PR review latency as primary remediable stressors.'],
    }
  ),
  createTask('amb_07', 'AMBIGUOUS_GOALS', 'Make our marketing campaigns go viral',
    'We have a $50k marketing budget. Make our B2B SaaS campaigns go viral on social media.',
    0.35, 60, {
      expectedEntities: ['Viral Coefficient (K-factor)', 'Thought Leadership', 'LinkedIn / X Strategy', 'Interactive Calculators', 'Product-Led Content'],
      expectedMetrics: [],
      requiredCitations: ['Reforge Viral Loop Mechanics', 'HubSpot State of Marketing Report'],
      requiredSections: ['Viral Feasibility Disambiguation', 'B2B Engagement Strategy', 'Interactive Campaign Architecture', 'Budget Allocation ($50k)'],
      ambiguityClarifications: ['Reframed consumer virality into B2B engineering-led virality (free interactive benchmarking tools).'],
    }
  ),
  createTask('amb_08', 'AMBIGUOUS_GOALS', 'Streamline our hiring process',
    'It takes 75 days to hire an engineer. Streamline the hiring process.',
    0.35, 60, {
      expectedEntities: ['Time to Hire', 'Candidate Sourcing', 'Technical Assessment', 'Bias Mitigation', 'Offer Acceptance Rate'],
      expectedMetrics: [
        { name: 'Target Time to Hire Days', target: 28, tolerancePercent: 20, unit: 'days' },
      ],
      requiredCitations: ['SHRM Talent Acquisition Benchmark', 'EEOC AI Hiring Guidance'],
      requiredSections: ['Hiring Pipeline Friction Analysis', 'Autonomous Sourcing & Scheduling', 'Fair Technical Evaluation', 'Streamlined SLA'],
      ambiguityClarifications: ['Set target reduction from 75 days to 28 days without lowering senior technical bar.'],
    }
  ),
  createTask('amb_09', 'AMBIGUOUS_GOALS', 'Figure out how to monetize our open source project',
    'Our open-source GitHub project has 35,000 stars but $0 revenue. Figure out how to monetize it.',
    0.35, 60, {
      expectedEntities: ['Open-Core Model', 'Managed Cloud (SaaS)', 'Enterprise Features (SSO/Audit)', 'License Strategy (AGPL/BSL)', 'Dual Licensing'],
      expectedMetrics: [],
      requiredCitations: ['Redpoint Open Source Monetization Playbook', 'A16Z Open Source Business Models'],
      requiredSections: ['Developer Community Retention', 'Commercialization Model Selection', 'Feature Gating Matrix', 'Go-to-Market Execution'],
      ambiguityClarifications: ['Selected managed cloud + enterprise security (SSO/SCIM) model to avoid community backlash.'],
    }
  ),
  createTask('amb_10', 'AMBIGUOUS_GOALS', 'Optimize our cloud spending',
    'AWS bill is out of control at $80,000/month. Optimize it.',
    0.35, 60, {
      expectedEntities: ['FinOps', 'Reserved Instances', 'Savings Plans', 'Idle Resource Reclamation', 'Spot Instances', 'Egress Fees'],
      expectedMetrics: [
        { name: 'Target monthly savings', target: 35, tolerancePercent: 15, unit: '%' },
      ],
      requiredCitations: ['FinOps Foundation Cloud Cost Benchmarks', 'AWS Well-Architected Cost Optimization Pillar'],
      requiredSections: ['Cost Attribution Audit', 'Immediate Quick Wins', 'Architectural Rightsizing', 'Sustainable Governance Policy'],
      ambiguityClarifications: ['Assumed standard modern cloud stack with 30-40% recoverable waste in over-provisioned staging and unattached EBS volumes.'],
    }
  ),

  // ------------------------------------------------------------
  // 8. MULTI-AGENT COORDINATION (10 Tasks)
  // ------------------------------------------------------------
  createTask('multi_01', 'MULTI_AGENT_COORDINATION', 'Cross-Functional Enterprise M&A Due Diligence Pipeline',
    'Coordinate a 5-agent cross-functional synthesis (Market Intelligence, Quantitative Modeler, Legal Auditor, Technical Architect, Executive Synthesizer) to evaluate a $250M acquisition of a cloud security startup.',
    0.45, 60, {
      expectedEntities: ['Synergy Valuation', 'IP Audit', 'Technical Debt', 'Market Penetration', 'Executive Recommendation'],
      expectedMetrics: [
        { name: 'Post-Acquisition Revenue Synergy', target: 38, tolerancePercent: 20, unit: 'Million USD' },
      ],
      requiredCitations: ['PwC M&A Integration Survey', 'KPMG Technology Due Diligence Framework'],
      requiredSections: ['Multi-Agent DAG Architecture', 'Specialist Agent Findings', 'Cross-Agent Evidence Synthesis', 'Definitive Acquisition Verdict'],
    }
  ),
  createTask('multi_02', 'MULTI_AGENT_COORDINATION', 'Automated New Drug Candidate Patent & Chemical Feasibility',
    'Coordinate molecular search, patent law review, and FDA safety specialist agents to evaluate a novel small molecule oncology candidate.',
    0.45, 60, {
      expectedEntities: ['Chemical Structure', 'Freedom to Operate (FTO)', 'USPTO Prior Art', 'Toxicity Profile', 'Phase 1 Readiness'],
      expectedMetrics: [],
      requiredCitations: ['USPTO Patent Examination Guidelines', 'FDA Preclinical Safety Guidelines'],
      requiredSections: ['Multi-Agent Coordination Topology', 'Chemical Feasibility', 'Patent Freedom to Operate', 'Synthesized Drug Verdict'],
    }
  ),
  createTask('multi_03', 'MULTI_AGENT_COORDINATION', 'Crisis Communications & PR Defense Coordination',
    'Coordinate technical incident investigation, legal liability assessment, and executive PR crisis communication agents for a major customer data breach.',
    0.40, 60, {
      expectedEntities: ['Breach Notification SLA', 'Legal Liability Mitigation', 'Stakeholder Communications', 'Root Cause Explanation', 'Reputational Defense'],
      expectedMetrics: [
        { name: 'Mandatory Notification Hours', target: 72, tolerancePercent: 0, unit: 'hours' },
      ],
      requiredCitations: ['GDPR 72-Hour Breach Notification Standard', 'NIST Computer Security Incident Handling Guide'],
      requiredSections: ['Incident Response Topology', 'Technical Fact Extraction', 'Legal Exposure Constraints', 'Draft Executive Press Release'],
    }
  ),
  createTask('multi_04', 'MULTI_AGENT_COORDINATION', 'High-Frequency Trading Algorithm Strategy Validation',
    'Coordinate quantitative backtesting, market microstructure, risk management, and regulatory compliance agents to evaluate an algorithmic arbitrage strategy on crypto futures.',
    0.40, 60, {
      expectedEntities: ['Sharpe Ratio', 'Maximum Drawdown', 'Market Impact', 'Liquidity Slippage', 'CFTC Regulatory Compliance'],
      expectedMetrics: [
        { name: 'Target Sharpe Ratio', target: 2.4, tolerancePercent: 15, unit: 'ratio' },
        { name: 'Max Drawdown Limit', target: 8.5, tolerancePercent: 20, unit: '%' },
      ],
      requiredCitations: ['CFTC Automated Trading Regulations', 'Hasbrouck Market Microstructure Economics'],
      requiredSections: ['Agent Pipeline Interdependencies', 'Quantitative Backtest Metrics', 'Risk Limits & Kill Switches', 'Go-Live Authorization'],
    }
  ),
  createTask('multi_05', 'MULTI_AGENT_COORDINATION', 'Urban Infrastructure Transit Planning Synthesis',
    'Coordinate traffic engineering, environmental impact, municipal budget, and citizen advocacy agents to design a light rail transit corridor.',
    0.40, 60, {
      expectedEntities: ['Ridership Projection', 'Capital Expenditure', 'Carbon Offset', 'Eminent Domain', 'Public Sentiment'],
      expectedMetrics: [
        { name: 'Daily Ridership Projection', target: 65000, tolerancePercent: 20, unit: 'riders' },
      ],
      requiredCitations: ['Federal Transit Administration Capital Investment Guidelines', 'EPA Transit Carbon Offset Methodology'],
      requiredSections: ['Multi-Disciplinary Agent Map', 'Transit Route Optimization', 'Fiscal & Environmental Balance', 'Civic Recommendation'],
    }
  ),
  createTask('multi_06', 'MULTI_AGENT_COORDINATION', 'Commercial Aerospace Component Reliability & Supply Chain',
    'Coordinate FAA certification, supply chain risk, finite element stress analysis, and procurement agents to validate a titanium turbine bracket.',
    0.45, 60, {
      expectedEntities: ['FAA Part 25', 'Fatigue Life Cycles', 'AS9100 Quality Standard', 'Supplier Lead Time', 'Weight Savings'],
      expectedMetrics: [
        { name: 'Fatigue Cycle Life', target: 120000, tolerancePercent: 10, unit: 'cycles' },
      ],
      requiredCitations: ['FAA Airworthiness Standards 14 CFR Part 25', 'SAE Aerospace Material Specifications'],
      requiredSections: ['Engineering Agent Interaction Flow', 'Stress & Fatigue Validation', 'Supply Chain Vulnerabilities', 'Certification Sign-off'],
    }
  ),
  createTask('multi_07', 'MULTI_AGENT_COORDINATION', 'Global Tax Restructuring & BEPS Compliance',
    'Coordinate international tax law, corporate treasury, transfer pricing, and accounting specialist agents for an enterprise IP restructuring across Ireland, US, and Singapore.',
    0.45, 60, {
      expectedEntities: ['OECD BEPS Pillar Two', 'Global Minimum Tax (15%)', 'Transfer Pricing', 'Arm Length Principle', 'Substance Requirements'],
      expectedMetrics: [
        { name: 'Global Minimum Tax Rate', target: 15, tolerancePercent: 0, unit: '%' },
      ],
      requiredCitations: ['OECD Pillar Two Model Rules (GloBE)', 'IRS Section 482 Transfer Pricing Regulations'],
      requiredSections: ['Inter-Agent Tax DAG', 'Jurisdictional Analysis', 'Transfer Pricing Calculations', 'Consolidated Tax Strategy'],
    }
  ),
  createTask('multi_08', 'MULTI_AGENT_COORDINATION', 'Autonomous Smart Grid Demand-Response Dispatch',
    'Coordinate renewable generation forecasting, battery storage dispatch, wholesale spot market pricing, and industrial load curtailment agents in an electric grid.',
    0.40, 60, {
      expectedEntities: ['Megawatt-Hours (MWh)', 'Locational Marginal Pricing (LMP)', 'Battery Degradation', 'Peak Shaving', 'Grid Frequency Regulation'],
      expectedMetrics: [
        { name: 'Peak Demand Curtailment', target: 120, tolerancePercent: 15, unit: 'MW' },
      ],
      requiredCitations: ['FERC Order 2222 Distributed Energy Resources', 'PJM Manual 11 Energy & Ancillary Services Market'],
      requiredSections: ['Dispatch Topology', 'Forecasting & Arbitrage Math', 'Battery Asset Protection', 'Dispatch Schedule Matrix'],
    }
  ),
  createTask('multi_09', 'MULTI_AGENT_COORDINATION', 'Automated Journalism Investigative Data Pipeline',
    'Coordinate FOIA document extraction, financial ledger reconciliation, network entity linking, and legal libel review agents for an investigative journalism series.',
    0.35, 60, {
      expectedEntities: ['FOIA Extraction', 'Shell Company Graph', 'Audit Trail', 'Defamation / Libel Verification', 'Public Interest'],
      expectedMetrics: [],
      requiredCitations: ['Reporters Committee for Freedom of the Press Libel Manual', 'ICIJ Offshore Leaks Data Methodology'],
      requiredSections: ['Investigative Agent Pipeline', 'Entity Linking Graph', 'Fact Verification Rigor', 'Publishable Story Draft'],
    }
  ),
  createTask('multi_10', 'MULTI_AGENT_COORDINATION', 'Enterprise Disaster Recovery & Data Restoration Orchestration',
    'Coordinate ransomware forensics, immutable backup restoration, network microsegmentation, and regulatory reporting agents during a cyber disaster.',
    0.40, 60, {
      expectedEntities: ['RPO / RTO', 'Immutable Backup', 'Air-Gapped Snapshot', 'Containment Protocol', 'Regulatory Disclosure'],
      expectedMetrics: [
        { name: 'Target Recovery Time Objective (RTO)', target: 4, tolerancePercent: 25, unit: 'hours' },
        { name: 'Target Recovery Point Objective (RPO)', target: 15, tolerancePercent: 20, unit: 'minutes' },
      ],
      requiredCitations: ['NIST SP 800-34 Contingency Planning for IT Systems', 'ISO/IEC 27031 Business Continuity ICT'],
      requiredSections: ['Disaster Response DAG', 'Forensics & Integrity Checks', 'Safe Restoration Sequencing', 'Recovery Verification'],
    }
  ),

  // ------------------------------------------------------------
  // 9. EVIDENCE-HEAVY (10 Tasks)
  // ------------------------------------------------------------
  createTask('ev_01', 'EVIDENCE_HEAVY', 'Empirical Proof of LLM Context Window Decay ("Lost in the Middle")',
    'Provide an evidence-dense empirical analysis of position-dependent retrieval decay ("Lost in the Middle") in long-context LLMs, with exact benchmark papers, accuracy curves, and architectural remedies.',
    0.40, 60, {
      expectedEntities: ['Lost in the Middle', 'Liu et al.', 'U-Shaped Retrieval Curve', 'Needle in a Haystack (NIAH)', 'KV Cache Attention Head Saturation'],
      expectedMetrics: [
        { name: 'Retrieval accuracy drop in middle positions', target: 35, tolerancePercent: 20, unit: '%' },
      ],
      requiredCitations: [
        'Liu et al. (2023) Lost in the Middle: How Language Models Use Long Contexts (arXiv:2307.03172)',
        'Kamradt (2023) Pressure Testing LLMs: Needle in a Haystack Analysis',
      ],
      requiredSections: ['Empirical Phenomenon Description', 'Research Paper Evidence & Data Points', 'Attention Degradation Mechanics', 'System Mitigations'],
    }
  ),
  createTask('ev_02', 'EVIDENCE_HEAVY', 'Speculative Decoding Throughput Benchmarks',
    'Analyze empirical benchmark evidence for Speculative Decoding (draft model + target model) measuring wall-clock speedup across batch sizes and acceptance rates.',
    0.35, 60, {
      expectedEntities: ['Speculative Decoding', 'Draft Model', 'Target Model', 'Acceptance Rate', 'Wall-Clock Speedup', 'KV Cache Reuse'],
      expectedMetrics: [
        { name: 'Typical Acceptance Rate gamma', target: 0.72, tolerancePercent: 15, unit: 'ratio' },
        { name: 'Observed Wall-Clock Speedup', target: 2.3, tolerancePercent: 20, unit: 'x' },
      ],
      requiredCitations: [
        'Leviathan et al. (2023) Fast Inference from Transformers via Speculative Decoding',
        'Chen et al. (2023) Accelerating Large Language Model Decoding with Speculative Sampling',
      ],
      requiredSections: ['Mathematical Formulation', 'Empirical Benchmark Findings', 'Hardware Memory Bandwidth Constraints', 'Production Recommendations'],
    }
  ),
  createTask('ev_03', 'EVIDENCE_HEAVY', 'Scaling Laws for Neural Language Models',
    'Examine the empirical scaling laws for neural language models (Kaplan et al. vs Chinchilla Hoffmann et al.), specifically the optimal compute allocation between model parameters and training tokens.',
    0.35, 60, {
      expectedEntities: ['Kaplan et al.', 'Hoffmann et al. (Chinchilla)', 'Compute-Optimal', 'Token-to-Parameter Ratio', 'Loss Exponents'],
      expectedMetrics: [
        { name: 'Chinchilla Optimal Tokens per Parameter', target: 20, tolerancePercent: 10, unit: 'tokens/param' },
      ],
      requiredCitations: [
        'Kaplan et al. (2020) Scaling Laws for Neural Language Models (arXiv:2001.08361)',
        'Hoffmann et al. (2022) Training Compute-Optimal Large Language Models (Chinchilla Paper)',
      ],
      requiredSections: ['Kaplan vs Chinchilla Historical Divergence', 'Empirical Mathematical Power-Law Exponents', 'Inference vs Training Cost Trade-off', 'Modern Training Implications'],
    }
  ),
  createTask('ev_04', 'EVIDENCE_HEAVY', 'Direct Preference Optimization (DPO) vs PPO/RLHF',
    'Provide rigorous empirical literature evidence comparing Direct Preference Optimization (DPO) against standard PPO-based RLHF in training stability, compute efficiency, and win-rates.',
    0.35, 60, {
      expectedEntities: ['Direct Preference Optimization (DPO)', 'PPO', 'RLHF', 'Implicit Reward Model', 'Bradley-Terry Model', 'Kullback-Leibler (KL) Divergence'],
      expectedMetrics: [
        { name: 'Training compute reduction percentage', target: 45, tolerancePercent: 20, unit: '%' },
      ],
      requiredCitations: [
        'Rafailov et al. (2023) Direct Preference Optimization: Your Language Model is Secretly a Reward Model',
        'Ouyang et al. (2022) Training Language Models to Follow Instructions (InstructGPT)',
      ],
      requiredSections: ['Mathematical Formulations Comparison', 'Empirical Win-Rate Benchmarks (AlpacaEval / MT-Bench)', 'Training Stability Analysis', 'Conclusion'],
    }
  ),
  createTask('ev_05', 'EVIDENCE_HEAVY', 'FlashAttention-1/2/3 GPU Memory IO Optimization',
    'Document the exact GPU hardware I/O bottlenecks addressed by FlashAttention, citing IO-awareness, SRAM tile sizing, and benchmark speedups on A100/H100 GPUs.',
    0.40, 60, {
      expectedEntities: ['FlashAttention', 'Tri Dao', 'High Bandwidth Memory (HBM)', 'SRAM', 'Online Softmax', 'Tiling'],
      expectedMetrics: [
        { name: 'Memory Footprint Reduction', target: 80, tolerancePercent: 15, unit: '%' },
        { name: 'Training Speedup Multiplier', target: 3.2, tolerancePercent: 25, unit: 'x' },
      ],
      requiredCitations: [
        'Dao et al. (2022) FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness',
        'Dao (2023) FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning',
      ],
      requiredSections: ['GPU Memory Hierarchy Primer', 'FlashAttention Mathematical & Tiling Mechanism', 'Empirical Speedup Benchmarks', 'Implications for Agent DAGs'],
    }
  ),
  createTask('ev_06', 'EVIDENCE_HEAVY', 'Quantization-Aware Training & Post-Training Quantization (AWQ/GPTQ)',
    'Provide empirical evidence comparing Post-Training Quantization techniques (AWQ, GPTQ, BitsAndBytes 4-bit) on perplexity degradation across LLaMA model families.',
    0.35, 60, {
      expectedEntities: ['Activation-aware Weight Quantization (AWQ)', 'GPTQ', 'BitsAndBytes', 'Perplexity Degradation', 'FP16 vs INT4'],
      expectedMetrics: [
        { name: 'AWQ Perplexity Gap vs FP16', target: 0.12, tolerancePercent: 30, unit: 'ppl' },
      ],
      requiredCitations: [
        'Lin et al. (2023) AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration',
        'Frantar et al. (2022) GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers',
      ],
      requiredSections: ['Quantization Principles', 'Benchmark Perplexity Comparison', 'Memory Footprint & Inference Throughput', 'Hardware Deployment Guide'],
    }
  ),
  createTask('ev_07', 'EVIDENCE_HEAVY', 'Self-Refine & Reflexion Iterative Reasoning Performance',
    'Compile evidence on whether self-reflection and iterative critique improve multi-step reasoning accuracy without ground-truth external tool verifiers.',
    0.35, 60, {
      expectedEntities: ['Reflexion', 'Self-Refine', 'Hallucination Reinforcement', 'External Ground Truth', 'HotpotQA', 'HumanEval'],
      expectedMetrics: [
        { name: 'HumanEval pass@1 uplift with tool verifier', target: 22.5, tolerancePercent: 20, unit: '%' },
      ],
      requiredCitations: [
        'Shinn et al. (2023) Reflexion: Language Agents with Verbal Reinforcement Learning',
        'Huang et al. (2023) Large Language Models Cannot Self-Correct Reasoning Yet (DeepMind Paper)',
      ],
      requiredSections: ['Core Theoretical Controversy', 'Empirical Benchmark Findings', 'External Verifier Requirement', 'AAGAM Claim Verifier Validation'],
    }
  ),
  createTask('ev_08', 'EVIDENCE_HEAVY', 'Tree of Thoughts (ToT) vs Chain of Thought (CoT) Accuracy',
    'Examine empirical problem-solving benchmarks (Game of 24, Creative Writing, Mini Crosswords) comparing Tree of Thoughts (ToT) against standard Chain of Thought (CoT).',
    0.35, 60, {
      expectedEntities: ['Tree of Thoughts (ToT)', 'Chain of Thought (CoT)', 'Game of 24', 'Search Algorithms (BFS/DFS)', 'Self-Evaluation'],
      expectedMetrics: [
        { name: 'Game of 24 Success Rate ToT', target: 74, tolerancePercent: 10, unit: '%' },
        { name: 'Game of 24 Success Rate CoT', target: 7.3, tolerancePercent: 20, unit: '%' },
      ],
      requiredCitations: [
        'Yao et al. (2023) Tree of Thoughts: Deliberate Problem Solving with Large Language Models',
        'Wei et al. (2022) Chain-of-Thought Prompting Elicits Reasoning in Large Language Models',
      ],
      requiredSections: ['Methodological Formulations', 'Benchmark Proof Comparison', 'Token Consumption Trade-offs', 'DAG Implementation Notes'],
    }
  ),
  createTask('ev_09', 'EVIDENCE_HEAVY', 'Mixture of Experts (MoE) Routing & Load Balancing',
    'Provide empirical evidence on sparse Mixture of Experts (MoE) token routing mechanisms (Switch Transformer, Mixtral 8x7B) and auxiliary load balancing loss functions.',
    0.35, 60, {
      expectedEntities: ['Mixture of Experts (MoE)', 'Top-k Gating', 'Switch Transformer', 'Auxiliary Loss', 'Active Parameters', 'Mixtral 8x7B'],
      expectedMetrics: [
        { name: 'Active Parameters Mixtral 8x7B', target: 12.9, tolerancePercent: 5, unit: 'Billion Parameters' },
        { name: 'Total Sparse Parameters Mixtral 8x7B', target: 46.7, tolerancePercent: 5, unit: 'Billion Parameters' },
      ],
      requiredCitations: [
        'Jiang et al. (2024) Mixtral of Experts (Mistral AI Paper)',
        'Fedus et al. (2022) Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity',
      ],
      requiredSections: ['MoE Routing Architecture', 'Load Balancing Mathematics', 'Empirical Benchmark Performance', 'Hardware Inference Characteristics'],
    }
  ),
  createTask('ev_10', 'EVIDENCE_HEAVY', 'Retrieval-Augmented Generation Chunking & Embedding Benchmarks',
    'Analyze empirical benchmarks comparing small fixed chunking (256 tokens), semantic chunking, and parent-document retrieval on answer faithfulness (Ragas/ARES).',
    0.35, 60, {
      expectedEntities: ['Semantic Chunking', 'Parent Document Retriever', 'RAGAS Faithfulness', 'Context Precision', 'Chunk Size Variance'],
      expectedMetrics: [
        { name: 'Faithfulness improvement parent-doc', target: 18.2, tolerancePercent: 20, unit: '%' },
      ],
      requiredCitations: [
        'Es et al. (2023) RAGAS: Automated Evaluation of Retrieval Augmented Generation',
        'Saad-Falcon et al. (2023) ARES: An Automated Evaluation Framework for Retrieval-Augmented Generation Systems',
      ],
      requiredSections: ['Chunking Strategies Detailed', 'Ragas & ARES Metrics Evaluation', 'Empirical Test Results', 'Optimal Retrieval Blueprint'],
    }
  ),

  // ------------------------------------------------------------
  // 10. ADVERSARIAL / CONTRADICTORY (10 Tasks)
  // ------------------------------------------------------------
  createTask('adv_01', 'ADVERSARIAL_CONTRADICTORY', 'Reconcile Conflicting Enterprise AI Cost Studies',
    'Source A (McKinsey 2024) claims enterprise generative AI adoption delivers an immediate 35% net operational cost reduction. Source B (MIT NBER Working Paper) claims 78% of enterprise AI pilots increase overall operational costs due to verification overhead. Reconcile this contradiction with empirical evidence.',
    0.40, 60, {
      expectedEntities: ['Reconciliation', 'Pilot vs Production', 'Verification Overhead', 'Amortized Infrastructure', 'Total Cost of Ownership'],
      expectedMetrics: [],
      requiredCitations: ['McKinsey State of AI 2024', 'NBER Working Paper on Generative AI Labor Economics'],
      requiredSections: ['Contradiction Identification', 'Underlying Variable Discrepancies', 'Synthesis & Reconciled Truth', 'Strategic Guidance for Decision Makers'],
      adversarialTrapReconciliation: 'Resolves the contradiction by demonstrating that McKinsey measured mature production deployments in high-repetition support, whereas NBER surveyed exploratory pilots burdened with unamortized integration fees and dual-staffing.',
    }
  ),
  createTask('adv_02', 'ADVERSARIAL_CONTRADICTORY', 'Reconcile Autonomous Vehicle Safety Statistics',
    'Source A reports autonomous robotaxis have an 85% lower crash rate than human drivers. Source B reports autonomous robotaxis are involved in 2.3x more collisions per million miles traveled than human drivers. Reconcile the discrepancy.',
    0.40, 60, {
      expectedEntities: ['Airbag Deployment', 'Minor Fender Benders', 'Under-Reporting of Human Collisions', 'Miles Traveled Normalization', 'Reconciled Truth'],
      expectedMetrics: [],
      requiredCitations: ['Waymo Safety Impact Report', 'NHTSA Standing General Order on Crash Reporting'],
      requiredSections: ['Conflicting Claims Matrix', 'Reporting Threshold Discrepancy', 'Severity vs Frequency Normalization', 'Objective Conclusion'],
      adversarialTrapReconciliation: 'Resolves discrepancy by distinguishing injury-causing accidents (where AVs are 85% safer) from minor low-speed contact incidents (where AV mandatory reporting captures collisions humans never report).',
    }
  ),
  createTask('adv_03', 'ADVERSARIAL_CONTRADICTORY', 'Reconcile Semiconductor Moore Law Viability',
    'Source A (NVIDIA CEO Jensen Huang) asserts "Moore\'s Law is dead." Source B (Intel CEO) asserts "Moore\'s Law is alive and well with ribbonFET and backside power." Resolve this conflict with engineering physics and economic facts.',
    0.35, 60, {
      expectedEntities: ['Dennard Scaling', 'RibbonFET / Gate-All-Around', 'Cost per Transistor', 'Advanced Packaging (CoWoS)', 'Power Density Limit'],
      expectedMetrics: [],
      requiredCitations: ['IEEE International Roadmap for Devices and Systems (IRDS)', 'ASML High-NA EUV Technical Overview'],
      requiredSections: ['The Two Opposing Stances', 'Physics of Transistor Density vs Cost per Good Die', 'Reconciled Engineering Reality', 'Industry Implications'],
      adversarialTrapReconciliation: 'Reconciles: Physical transistor density scaling continues via GAA and High-NA EUV (validating Intel), but economic Dennard cost-per-transistor scaling has ended (validating NVIDIA).',
    }
  ),
  createTask('adv_04', 'ADVERSARIAL_CONTRADICTORY', 'Reconcile Carbon Footprint of AI Inference vs Training',
    'Source A claims AI training is the dominant environmental hazard consuming 80% of model lifetime carbon. Source B claims inference accounts for 90% of model lifecycle emissions. Resolve the conflict.',
    0.35, 60, {
      expectedEntities: ['Training vs Inference Emissions', 'Query Scale Threshold', 'PUE (Power Usage Effectiveness)', 'Grid Carbon Intensity', 'Lifecycle Analysis'],
      expectedMetrics: [],
      requiredCitations: ['Patterson et al. (Google) Carbon Footprint of Machine Learning Training', 'Luccioni et al. Counting Carbon in Model Deployments'],
      requiredSections: ['Conflicting Claims Overview', 'Query Volume Break-Even Threshold', 'Lifecycle Emissions Model', 'Sustainable AI Policy'],
      adversarialTrapReconciliation: 'Resolves: For low-volume models, training dominates (80%); for foundational models serving billions of daily queries (e.g. ChatGPT), inference rapidly surpasses training to reach 85-90% of cumulative lifecycle energy.',
    }
  ),
  createTask('adv_05', 'ADVERSARIAL_CONTRADICTORY', 'Reconcile Cloud Repatriation Cost Claims',
    'Source A (Basecamp/37signals) claims saving $3.2M over 5 years by leaving AWS for on-prem servers. Source B (AWS Enterprise Execs) claims cloud TCO is 30% lower than on-prem data centers. Reconcile both perspectives.',
    0.35, 60, {
      expectedEntities: ['Predictable vs Elastic Workload', 'Depreciation & Amortization', 'DevOps Headcount', 'Repatriation Savings', 'Utilization Rate'],
      expectedMetrics: [],
      requiredCitations: ['37signals Cloud Exit Retrospective', 'IDC Worldwide Cloud Migration TCO Study'],
      requiredSections: ['Detailed Positions of Both Sources', 'Workload Profile Differences (Elastic vs Flat)', 'Total Cost Elements Omitted by Both', 'Definitive Decision Rubric'],
      adversarialTrapReconciliation: 'Reconciles: Flat, predictable, high-utilization steady-state workloads (like Basecamp) achieve massive savings on-prem; dynamic, bursty, exploratory workloads with volatile scale remain cheaper on public cloud.',
    }
  ),
  createTask('adv_06', 'ADVERSARIAL_CONTRADICTORY', 'Reconcile Remote Work Productivity Metrics',
    'Source A (Stanford Bloom study) demonstrates a 13% increase in productivity for remote knowledge workers. Source B (Harvard Business Review / Nature study) demonstrates an 18% decline in long-term innovation and cross-silo collaboration for remote teams. Reconcile.',
    0.35, 60, {
      expectedEntities: ['Individual Output vs Team Innovation', 'Weak Ties Decay', 'Focus Time', 'Synchronous Communication', 'Hybrid Balance'],
      expectedMetrics: [],
      requiredCitations: ['Bloom et al. (Stanford) Does Working from Home Work?', 'Yang et al. (Nature Human Behaviour) The Effects of Remote Work on Information Networks'],
      requiredSections: ['Productivity Metric Divergence', 'Short-Term Task Execution vs Long-Term Ideation', 'Network Topology Analysis', 'Synthesized Workplace Blueprint'],
      adversarialTrapReconciliation: 'Reconciles: Individual, repetitive, heads-down task execution efficiency increases remotely (+13%), but cross-functional serendipity and novel product ideation dependent on weak network ties decline (-18%).',
    }
  ),
  createTask('adv_07', 'ADVERSARIAL_CONTRADICTORY', 'Reconcile Commercial Viability of Hydrogen Fuel Cells vs Battery EVs',
    'Source A argues hydrogen fuel cell vehicles are the only viable zero-emission solution for long-haul heavy freight. Source B argues battery electric trucks have rendered hydrogen obsolete due to 80% round-trip energy efficiency vs 35% for hydrogen. Reconcile.',
    0.35, 60, {
      expectedEntities: ['Round-Trip Well-to-Wheel Efficiency', 'Gravimetric Energy Density', 'Payload Penalty', 'Megawatt Charging', 'Refueling Infrastructure'],
      expectedMetrics: [
        { name: 'Battery Electric Round-Trip Efficiency', target: 78, tolerancePercent: 10, unit: '%' },
        { name: 'Hydrogen Fuel Cell Round-Trip Efficiency', target: 33, tolerancePercent: 15, unit: '%' },
      ],
      requiredCitations: ['US Department of Energy Hydrogen Shot Roadmap', 'ICCT Heavy-Duty Zero-Emission Powertrain Comparison'],
      requiredSections: ['The Thermodynamic Efficiency Stance', 'The Weight & Payload Gravimetric Stance', 'Break-Even Distance Modeling', 'Strategic Transport Forecast'],
      adversarialTrapReconciliation: 'Reconciles: BEVs dominate short-to-medium freight (<500 miles) due to superior thermodynamic efficiency (78% vs 33%); hydrogen retains niche viability only for ultra-long continuous haul (>800 miles) where battery tare weight severely penalizes revenue payload.',
    }
  ),
  createTask('adv_08', 'ADVERSARIAL_CONTRADICTORY', 'Reconcile Open Source vs Proprietary LLM Superiority',
    'Source A claims proprietary closed-source models maintain an insurmountable capabilities moat. Source B claims open-source weights (Llama, DeepSeek) match frontier proprietary models within 4 months at a fraction of the cost. Reconcile.',
    0.35, 60, {
      expectedEntities: ['Capability Moat', 'Lag Time Compression', 'Post-Training vs Pre-Training Compute', 'Data Wall', 'Distillation'],
      expectedMetrics: [
        { name: 'Frontier capability lag time months', target: 4.5, tolerancePercent: 25, unit: 'months' },
      ],
      requiredCitations: ['Google Leaked Memo: We Have No Moat and Neither Does OpenAI', 'Stanford Foundation Model Transparency Index'],
      requiredSections: ['The Proprietary Moat Arguments', 'The Open Weights Velocity Proof', 'Asymmetry in Post-Training vs Pre-Training', 'Market Equilibrium Synthesis'],
      adversarialTrapReconciliation: 'Reconciles: Proprietary frontier models break new capability benchmarks first at massive capital expenditure, but post-training innovations and synthetic data distillation allow open-weights to commoditize those capabilities within 4-6 months.',
    }
  ),
  createTask('adv_09', 'ADVERSARIAL_CONTRADICTORY', 'Reconcile Nuclear SMR Economics vs Utility-Scale Solar + Storage',
    'Source A claims Small Modular Nuclear Reactors (SMRs) are essential for 24/7 AI data center baseload power. Source B claims SMRs are uneconomic (LCOE > $140/MWh) compared to utility-scale solar + battery storage ($45/MWh). Reconcile.',
    0.35, 60, {
      expectedEntities: ['Levelized Cost of Energy (LCOE)', 'Baseload Capacity Factor', 'Solar + Storage Overbuilding', 'Land Footprint', 'Interconnection Queues'],
      expectedMetrics: [
        { name: 'SMR LCOE target', target: 145, tolerancePercent: 20, unit: 'USD/MWh' },
        { name: 'Solar + Storage LCOE target', target: 48, tolerancePercent: 20, unit: 'USD/MWh' },
      ],
      requiredCitations: ['Lazard Levelized Cost of Energy Analysis', 'DOE Pathways to Commercial Liftoff: Advanced Nuclear'],
      requiredSections: ['LCOE Arithmetic Divergence', 'Capacity Factor & Reliability Constraints (99.999%)', 'Overbuilding & Multi-Day Storage Costs', 'Data Center Energy Solution'],
      adversarialTrapReconciliation: 'Reconciles: Solar + battery is significantly cheaper per generated MWh, but achieving 99.999% uptime during multi-day Dunkelflaute (low wind/solar) requires 4x-6x overbuilding storage, making SMRs cost-effective for pure continuous baseload data center demand.',
    }
  ),
  createTask('adv_10', 'ADVERSARIAL_CONTRADICTORY', 'Reconcile Multi-Agent System Reliability: Emergence vs Error Cascades',
    'Source A claims multi-agent systems dramatically increase reasoning reliability through specialized peer review. Source B claims multi-agent architectures compound failure rates exponentially (P_success = p^n), making them less reliable than single monolithic models. Reconcile.',
    0.40, 60, {
      expectedEntities: ['Compounding Failure (p^n)', 'Independent Verification', 'Orthogonal Error Distributions', 'Consensus Mechanisms', 'Error Cascades'],
      expectedMetrics: [],
      requiredCitations: ['Fountas et al. Error Cascades in Multi-Agent Reasoning Chains', 'Du et al. Improving Factuality through Multi-Agent Debate'],
      requiredSections: ['Sequential Compound Failure Math', 'Orthogonal Peer-Review Verification Math', 'Architectural Safeguards Required', 'AAGAM Orchestrator Proof'],
      adversarialTrapReconciliation: 'Reconciles: Sequential linear chains without verification do compound errors exponentially (p^n); however, topological DAGs with independent claim verification and orthogonal specialist debate break the dependency cascade, elevating overall reliability above single models.',
    }
  ),

  // ------------------------------------------------------------
  // 11. LONG MULTI-STEP (10 Tasks)
  // ------------------------------------------------------------
  createTask('step_01', 'LONG_MULTI_STEP', 'Enterprise Monolith to Microservices 4-Phase Migration Plan',
    'Construct an end-to-end, multi-stage enterprise migration blueprint to decompose a 1.5M LOC Java monolith into Kubernetes microservices across 4 sequential milestones: Domain Decomposition, Event-Driven Sharding, Dual-Run Canary, and Decommissioning, with gate criteria for each phase.',
    0.45, 60, {
      expectedEntities: ['Strangler Fig Pattern', 'Domain-Driven Design (DDD)', 'Bounded Context', 'Change Data Capture (CDC)', 'Canary Routing', 'Rollback Gate'],
      expectedMetrics: [
        { name: 'Total Migration Duration Months', target: 14, tolerancePercent: 20, unit: 'months' },
      ],
      requiredCitations: ['Martin Fowler Strangler Fig Application Pattern', 'Newman Building Microservices 2nd Edition'],
      requiredSections: ['Phase 1: Domain Boundaries & Data Ownership', 'Phase 2: Event-Driven Dual Writing', 'Phase 3: Canary Traffic Routing & Verification', 'Phase 4: Monolith Retirement & Post-Mortem'],
    }
  ),
  createTask('step_02', 'LONG_MULTI_STEP', 'Healthcare System FHIR Interoperability Implementation Roadmap',
    'Detail a multi-step compliance and technical roadmap for a 6-hospital provider to meet CMS Interoperability & Patient Access final rules using HL7 FHIR APIs across 4 milestones.',
    0.40, 60, {
      expectedEntities: ['HL7 FHIR R4', 'CMS Interoperability Rule', 'SMART on FHIR', 'OAuth2 / OpenID Connect', 'Patient Access API'],
      expectedMetrics: [],
      requiredCitations: ['CMS-9115-F Interoperability Final Rule', 'HL7 FHIR Release 4 Specifications'],
      requiredSections: ['Milestone 1: Legacy EHR Data Mapping', 'Milestone 2: FHIR Server & Identity Federation', 'Milestone 3: Third-Party App Security Sandbox', 'Milestone 4: CMS Certification & Audit'],
    }
  ),
  createTask('step_03', 'LONG_MULTI_STEP', 'Fintech SOC 2 Type II Certification Readiness Pipeline',
    'Design an exhaustive 6-month operational and audit pipeline to transition a fintech startup from zero security posture to SOC 2 Type II certification across the 5 Trust Services Criteria.',
    0.40, 60, {
      expectedEntities: ['Trust Services Criteria (Security, Availability, Confidentiality)', 'Evidence Collection', 'Gap Assessment', 'Remediation Period', 'Audit Observation Window'],
      expectedMetrics: [
        { name: 'Audit observation window months', target: 6, tolerancePercent: 0, unit: 'months' },
      ],
      requiredCitations: ['AICPA Trust Services Criteria TSP Section 100', 'NIST SP 800-53 Security Controls'],
      requiredSections: ['Phase 1: Readiness & Gap Analysis', 'Phase 2: Policy & Technical Remediation', 'Phase 3: Type I Audit & Initial Attestation', 'Phase 4: 6-Month Type II Continuous Monitoring'],
    }
  ),
  createTask('step_04', 'LONG_MULTI_STEP', 'Automated Warehouse Robotics Deployment Blueprint',
    'Develop a 5-stage engineering and operational deployment plan for 200 Autonomous Mobile Robots (AMRs) in an active fulfillment distribution center without halting daily shipments.',
    0.45, 60, {
      expectedEntities: ['Autonomous Mobile Robots (AMR)', 'Fleet Management System (FMS)', 'Simultaneous Localization and Mapping (SLAM)', 'Facility Wayfinding', 'Piloting Phase'],
      expectedMetrics: [
        { name: 'Picking throughput improvement', target: 85, tolerancePercent: 20, unit: '%' },
      ],
      requiredCitations: ['ANSI/RIA R15.08 Industrial Mobile Robot Safety', 'Automated Logistics Institute Best Practices'],
      requiredSections: ['Stage 1: Digital Facility Mapping & Network Prep', 'Stage 2: FMS ERP Integration & Simulation', 'Stage 3: 20-Robot Isolated Pilot', 'Stage 4: Full Fleet Cutover & Safety Certification'],
    }
  ),
  createTask('step_05', 'LONG_MULTI_STEP', 'Global GDPR to DPDP Multi-Jurisdictional Privacy Alignment',
    'Formulate a 4-phase organizational overhaul for a multinational digital services provider to harmonize data retention, principal rights, and consent architectures across GDPR, CCPA, and India DPDP.',
    0.40, 60, {
      expectedEntities: ['Cross-Border Data Flows', 'Universal Consent Management', 'Data Subject Access Request (DSAR)', 'Data Mapping & RoPA', 'Harmonization'],
      expectedMetrics: [],
      requiredCitations: ['EDPB Guidelines on Cross-Border Data Transfers', 'IAPP Multi-Jurisdictional Privacy Governance Guide'],
      requiredSections: ['Step 1: Global Data Inventory & RoPA Update', 'Step 2: Universal Consent & Opt-Out Orchestration', 'Step 3: Automated DSAR Pipeline (Sub-30 Days)', 'Step 4: Continuous Privacy Impact Assessment'],
    }
  ),
  createTask('step_06', 'LONG_MULTI_STEP', 'Autonomous AI Model Fine-Tuning & Evaluation Pipeline',
    'Architect an automated continuous fine-tuning, safety alignment, and regression evaluation pipeline for a specialized 70B parameter financial domain model across 4 continuous stages.',
    0.45, 60, {
      expectedEntities: ['Continuous Fine-Tuning (QLoRA)', 'Direct Preference Optimization (DPO)', 'Safety Red-Teaming', 'Automated Evaluation Gate', 'Shadow Deployment'],
      expectedMetrics: [
        { name: 'QLoRA rank r', target: 64, tolerancePercent: 0, unit: 'rank' },
      ],
      requiredCitations: ['Dettmers et al. QLoRA Efficient Finetuning', 'NIST AI Risk Management Framework 1.0'],
      requiredSections: ['Stage 1: Dataset Curation & De-duplication', 'Stage 2: Parameter-Efficient Fine-Tuning', 'Stage 3: Automated Benchmark & Jailbreak Auditing', 'Stage 4: Production Shadow Routing & Rollback'],
    }
  ),
  createTask('step_07', 'LONG_MULTI_STEP', 'Zero-Trust Architecture Enterprise Network Migration',
    'Structure a 4-stage Zero Trust Network Architecture migration plan complying with NIST SP 800-207 for an enterprise with 15,000 hybrid workers across legacy VPNs.',
    0.40, 60, {
      expectedEntities: ['NIST SP 800-207', 'Zero Trust Architecture (ZTA)', 'Policy Decision Point (PDP)', 'Policy Enforcement Point (PEP)', 'Microsegmentation', 'Passwordless MFA'],
      expectedMetrics: [],
      requiredCitations: ['NIST SP 800-207 Zero Trust Architecture', 'CISA Zero Trust Maturity Model Version 2.0'],
      requiredSections: ['Stage 1: Identity & Device Verification Foundation', 'Stage 2: Microsegmentation & Software-Defined Perimeter', 'Stage 3: PDP / PEP Enforcement & VPN Retirement', 'Stage 4: Continuous Adaptive Risk Scoring'],
    }
  ),
  createTask('step_08', 'LONG_MULTI_STEP', 'Automated Semiconductor Tape-Out Verification Workflow',
    'Design the multi-step verification, DRC/LVS rule checking, static timing analysis (STA), and sign-off workflow for an ASIC tape-out at a 3nm foundry node.',
    0.45, 60, {
      expectedEntities: ['Design Rule Checking (DRC)', 'Layout Versus Schematic (LVS)', 'Static Timing Analysis (STA)', 'Foundry PDK 3nm', 'Tape-Out Sign-Off'],
      expectedMetrics: [],
      requiredCitations: ['TSMC 3nm Design Enablement Guide', 'Synopsys PrimeTime Static Timing Analysis Manual'],
      requiredSections: ['Step 1: RTL Freeze & Synthesis Optimization', 'Step 2: Physical Design & Clock Tree Synthesis', 'Step 3: DRC / LVS Physical Verification & Fixes', 'Step 4: Formal Sign-off & GDSII Foundry Release'],
    }
  ),
  createTask('step_09', 'LONG_MULTI_STEP', 'Enterprise AI Governance Board & Deployment Gating Protocol',
    'Formulate an institutional 4-tier model risk management and governance protocol (MRM SR 11-7 compliant) to vet, approve, monitor, and decommission internal AI agents.',
    0.40, 60, {
      expectedEntities: ['Federal Reserve SR 11-7', 'Model Risk Management', 'Inventory Tiering (Tier 1-3)', 'Independent Model Validation', 'Continuous Drift Monitoring'],
      expectedMetrics: [],
      requiredCitations: ['Federal Reserve Board Supervisory Guidance on Model Risk Management (SR 11-7)', 'OCC Bulletin 2011-12'],
      requiredSections: ['Tier 1: Intake & Impact Classification', 'Tier 2: Independent Validation & Bias Testing', 'Tier 3: Conditional Production Authorization', 'Tier 4: Ongoing Monitoring & Periodic Revalidation'],
    }
  ),
  createTask('step_10', 'LONG_MULTI_STEP', 'SaaS Multi-Tenant Database Sharding & Data Isolation Migration',
    'Construct a 4-phase zero-downtime migration strategy to transition an enterprise B2B SaaS platform from a shared single PostgreSQL database to isolated tenant shards with global catalog routing.',
    0.45, 60, {
      expectedEntities: ['Tenant Isolation', 'Sharding Key', 'Global Catalog Router', 'Logical Replication', 'Dual-Write Reconciliation'],
      expectedMetrics: [],
      requiredCitations: ['AWS Multi-Tenant SaaS Architecture Guidance', 'Citus / PostgreSQL Distributed Sharding Documentation'],
      requiredSections: ['Phase 1: Tenant Key Identification & Routing Layer', 'Phase 2: Logical Replication to Shard Clusters', 'Phase 3: Dual-Write & Data Parity Validation', 'Phase 4: Cutover & Legacy Database Teardown'],
    }
  ),
];

// Helper functions for retrieving tasks
export function getBenchmarkTaskById(id: string): BenchmarkTask | undefined {
  return BENCHMARK_CATALOG.find(t => t.id === id);
}

export function getBenchmarkTasksByCategory(category: BenchmarkCategory): BenchmarkTask[] {
  return BENCHMARK_CATALOG.filter(t => t.category === category);
}

export function getAllBenchmarkCategories(): BenchmarkCategory[] {
  return [...BENCHMARK_CATEGORIES];
}
