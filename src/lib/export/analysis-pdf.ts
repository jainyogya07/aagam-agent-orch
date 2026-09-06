import { exportReportPdf, escapeHtml, type PdfSection } from '@/lib/export/print-pdf';
import type { UnderstandingPhase } from '@/lib/architect/goal-parser';
import type { QualityGateResult } from '@/lib/types/claims';
import type { AnalysisSynthesis } from '@/lib/analysis/demo-run';

export function exportAnalysisPdf(opts: {
  goal?: string;
  understanding?: UnderstandingPhase | null;
  synthesis?: AnalysisSynthesis | null;
  qualityResult?: QualityGateResult | null;
}) {
  const { goal = '', understanding, synthesis, qualityResult } = opts;
  const extracted = understanding?.extracted;

  if (!goal && !synthesis && !qualityResult) {
    exportReportPdf('AAGAM', 'Give us a problem, not a workflow', [
      {
        heading: 'What this is',
        html: `<p>You write a problem in ordinary English. AAGAM decides who should work, how much they may spend, and whether the team should change after the result.</p>
          <p>AO (Agent Orchestrator) runs coding in an isolated folder. Look at AO sessions, not only the Board — the Board fills when a worker opens a pull request.</p>
          <p>Neatlogs watches traces. It does not pick the architecture.</p>`,
      },
      {
        heading: 'How to use',
        html: `<ol>
          <li>Type or speak a problem</li>
          <li>Analyze — the system designs the workflow</li>
          <li>One real AO coding session runs if it is worth the spend</li>
          <li>Quality is scored from this goal, then V2 only if it is worth it</li>
          <li>Export this PDF again after the run for the full memo</li>
        </ol>`,
      },
    ]);
    return;
  }

  const sections: PdfSection[] = [
    goal
      ? { heading: 'Goal', html: `<p>${escapeHtml(goal)}</p>` }
      : { heading: 'Goal', html: '<p>No goal captured yet.</p>' },
    extracted
      ? {
          heading: 'Understanding',
          html: `<p><strong>Objective:</strong> ${escapeHtml(extracted.primaryObjective)}</p>
            <p><strong>Domain:</strong> ${escapeHtml(extracted.domain)} · ${escapeHtml(extracted.geography)}</p>
            <p><strong>Required analysis:</strong> ${extracted.requiredAnalysis.map(escapeHtml).join(', ')}</p>`,
        }
      : null,
    synthesis
      ? {
          heading: 'Verdict',
          html: `<p><strong>${escapeHtml(synthesis.verdict)}</strong></p><p>${escapeHtml(synthesis.verdictDetail)}</p>
            <p><strong>Market gap:</strong> ${escapeHtml(synthesis.marketGap)}</p>`,
        }
      : null,
    synthesis
      ? {
          heading: 'Findings',
          html: synthesis.findings
            .map(
              (f) =>
                `<div class="card"><p><strong>${escapeHtml(f.title)}</strong></p><p>${escapeHtml(f.body)}</p><p class="meta">${escapeHtml(f.source)}</p></div>`
            )
            .join(''),
        }
      : null,
    qualityResult
      ? {
          heading: 'Quality',
          html: `<p>Overall ${(qualityResult.overallScore * 100).toFixed(1)}% · Evidence coverage ${(qualityResult.evidenceCoverageRatio * 100).toFixed(0)}%</p>`,
        }
      : null,
    synthesis
      ? {
          heading: 'Recommendation',
          html: `<p>${escapeHtml(synthesis.recommendation)}</p><ul>${synthesis.nextSteps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`,
        }
      : null,
  ].filter(Boolean) as PdfSection[];

  exportReportPdf(
    'AAGAM analysis',
    extracted ? `${extracted.domain} · ${extracted.geography}` : 'Decision report',
    sections
  );
}
