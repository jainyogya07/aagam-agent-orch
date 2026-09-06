'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Search,
  RefreshCw,
  Trash2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { HistoryDetailView } from './history-detail-view';

export interface HistoryItem {
  runId: string;
  taskId: string;
  goal: string;
  status: 'completed' | 'failed' | 'timeout';
  quality: number;
  reliability: number;
  cost: number;
  domain: string;
  geography: string;
  finalVersion: number;
  agentCount: number;
  sessionCount: number;
  createdAt: string;
  completedAt: string | null;
  durationMs: number;
  aoSessionId?: string;
  stopReason?: string;
}

function scorePct(n: number) {
  if (!Number.isFinite(n)) return '—';
  const ratio = n > 1.5 ? n / 100 : n;
  return `${(ratio * 100).toFixed(1)}%`;
}

export function HistoryPanel() {
  const [runs, setRuns] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed'>('all');
  const [search, setSearch] = useState('');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/history?${params.toString()}`);
      const data = await res.json();
      if (data.runs) setRuns(data.runs);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (e: React.MouseEvent, runId: string) => {
    e.stopPropagation();
    if (!confirm('Delete this run?')) return;
    try {
      setDeletingId(runId);
      const res = await fetch(`/api/history/${runId}`, { method: 'DELETE' });
      if (res.ok) {
        setRuns((prev) => prev.filter((r) => r.runId !== runId));
        if (selectedRunId === runId) setSelectedRunId(null);
      }
    } catch (err) {
      console.error('Failed to delete run:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (selectedRunId) {
    return <HistoryDetailView runId={selectedRunId} onBack={() => setSelectedRunId(null)} />;
  }

  return (
    <div className="h-full flex flex-col space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold">History & trends</h1>
        <p className="text-base text-zinc-400 mt-1">Every run as a decision record — not a JSON dump.</p>
      </div>

      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search goals, domains, geography…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25"
          />
        </div>
        <button
          onClick={() => fetchHistory()}
          className="btn-ghost px-3 py-2.5 rounded-xl"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          {(['all', 'completed', 'failed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                filter === tab ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab === 'all' ? 'All' : tab === 'completed' ? 'Completed' : 'Failed'}
            </button>
          ))}
        </div>
      </div>

      {loading && runs.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl glass-card animate-pulse" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-2">
          <Sparkles className="w-6 h-6 mx-auto text-zinc-400" />
          <h3 className="text-xl font-semibold">No runs yet</h3>
          <p className="text-base text-zinc-400">Run a new analysis to record a decision here.</p>
        </div>
      ) : (
        <AnimatePresence>
          {runs.map((run, idx) => (
            <motion.button
              key={run.runId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => setSelectedRunId(run.runId)}
              className="glass-card rounded-2xl p-5 text-left w-full group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                    <span className="px-2.5 py-0.5 rounded-full border border-white/12 bg-white/5 text-zinc-200">
                      {run.domain}
                    </span>
                    <span>{run.geography}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(run.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium leading-snug">{run.goal}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-base text-zinc-400">
                    <span>Quality {scorePct(run.quality)}</span>
                    <span>Reliability {scorePct(run.reliability)}</span>
                    <span>Cost ${Number(run.cost || 0).toFixed(3)}</span>
                    <span>V{run.finalVersion} · {run.agentCount} agents</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm px-2.5 py-1 rounded-full border border-white/12 capitalize">
                    {run.status}
                  </span>
                  <span
                    role="button"
                    onClick={(e) => handleDelete(e, run.runId)}
                    className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5"
                  >
                    <Trash2 className={`w-4 h-4 ${deletingId === run.runId ? 'opacity-40' : ''}`} />
                  </span>
                  <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white" />
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
