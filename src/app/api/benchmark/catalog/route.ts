// ============================================================
// Benchmark Catalog API Route — Agent Resource Exchange
// ============================================================
// GET: Returns 110 benchmark tasks, 11 categories, and latest run report.
// POST: Executes benchmark runs across selected tasks/categories with repetition.
// ============================================================

import {
  BENCHMARK_CATALOG,
  BENCHMARK_CATEGORIES,
  getBenchmarkTasksByCategory,
  type BenchmarkCategory,
} from '@/lib/benchmark/benchmark-catalog';
import { BenchmarkRunner, type BenchmarkRunOptions } from '@/lib/benchmark/benchmark-runner';

export async function GET() {
  const latestReport = BenchmarkRunner.getLatestReport();

  const categoryStats = BENCHMARK_CATEGORIES.map(category => {
    const tasks = getBenchmarkTasksByCategory(category);
    return {
      category,
      taskCount: tasks.length,
      sampleTasks: tasks.slice(0, 3).map(t => ({ id: t.id, title: t.title })),
    };
  });

  return Response.json({
    totalTasks: BENCHMARK_CATALOG.length,
    categoriesCount: BENCHMARK_CATEGORIES.length,
    categories: categoryStats,
    tasks: BENCHMARK_CATALOG.map(t => ({
      id: t.id,
      category: t.category,
      title: t.title,
      goal: t.goal,
      expectedEntities: t.groundTruth.expectedEntities,
      expectedMetrics: t.groundTruth.expectedMetrics,
      requiredCitations: t.groundTruth.requiredCitations,
      requiresAOSession: t.groundTruth.requiresAOSession,
    })),
    latestReport,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const options: BenchmarkRunOptions = {
      taskIds: body.taskIds,
      categories: body.categories as BenchmarkCategory[],
      limitTasks: body.limitTasks,
      runsPerTask: body.runsPerTask ?? 1,
      benchmarkMode: body.benchmarkMode ?? 'FULL',
    };

    const isAsync = body.async !== false;

    if (isAsync) {
      // Run in background
      BenchmarkRunner.runBenchmark(options).catch(err => {
        console.error('[Benchmark Catalog API] Background run failed:', err);
      });

      return Response.json({
        status: 'RUNNING',
        message: 'Benchmark suite execution started in background.',
        tasksSelected: options.limitTasks || options.taskIds?.length || 'category/all',
        runsPerTask: options.runsPerTask,
      }, { status: 202 });
    }

    const report = await BenchmarkRunner.runBenchmark(options);
    return Response.json(report);

  } catch (err) {
    return Response.json({
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
