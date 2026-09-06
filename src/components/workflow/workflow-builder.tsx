'use client';

// ============================================================
// Workflow Builder — AAGAM AI
// ============================================================
// Kinetic AI-inspired visual workflow editor with AAGAM AI branding:
// Node canvas, property drawer, AI assistant chat, and execution logs.
// ============================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Layers,
  Database,
  Search,
  Calculator,
  MessageSquare,
  ShieldCheck,
  Send,
  Copy,
  Check,
  Maximize2,
  Undo2,
  Trash2,
  Plus,
  Play,
  Save,
  Share2,
  CheckCircle2,
  Cpu,
  Settings,
  ChevronDown,
  Terminal,
  Zap,
  Globe,
  FileText,
  Activity,
  X,
  ChevronRight,
} from 'lucide-react';

interface WorkflowBuilderProps {
  onRunWorkflow?: () => void;
  onNavigateToOrchestrator?: () => void;
}

export function WorkflowBuilder({ onRunWorkflow, onNavigateToOrchestrator }: WorkflowBuilderProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'executions' | 'test'>('editor');
  const [isActive, setIsActive] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('agent_main');
  const [copiedLog, setCopiedLog] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: 'I reviewed your workflow and verified the topological graph. Adding an Adversarial Claim Verifier node after the AI Agent ensures all quantitative citations match empirical ground truth. Shall I auto-wire this node?',
    },
  ]);

  const [tools, setTools] = useState([
    { id: 't1', name: 'Tool #1: CRM / Data lookup', icon: Database, type: 'lookup' },
    { id: 't2', name: 'Tool #2: Web search', icon: Search, type: 'search' },
    { id: 't3', name: 'Tool #3: Calculator', icon: Calculator, type: 'math' },
    { id: 't4', name: 'Tool #4: Claim Verifier & Citations', icon: ShieldCheck, type: 'verify' },
  ]);

  const [nodeConfig, setNodeConfig] = useState({
    name: 'AAGAM AI Agent',
    description: 'Autonomous orchestrator agent capable of selecting capabilities, spawning AO worktrees, and self-mutating its DAG.',
    model: 'gpt-4o',
    maxIterations: 10,
    memoryLimit: '50k tokens',
  });

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { sender: 'user', text: chatMessage },
      {
        sender: 'ai',
        text: `Applying modification to workflow: Configured node [${nodeConfig.name}] with active budget policy and live AO execution substrate.`,
      },
    ]);
    setChatMessage('');
  };

  const copyLogText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  const sampleJsonLog = `Procecing node: Quality Gate & Notify
{
  "sentiment": "positive",
  "score": 0.9032,
  "summary": "Rubric passed across 8 dimensions. Marginal contribution verified.",
  "aoSessionId": "AO-3",
  "tags": [ "verified", "quality_pass", "v2_mutation" ]
}`;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#0b0b10] text-white overflow-hidden rounded-xl border border-violet-500/20 shadow-2xl">
      {/* Top Workflow Bar */}
      <div className="h-12 border-b border-violet-500/15 bg-[#101017] px-4 flex items-center justify-between z-20">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs">
          <Layers className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-slate-400">Workflows</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">Autonomous Orchestrators</span>
          <span className="text-slate-600">/</span>
          <span className="px-2 py-0.5 rounded bg-violet-950/60 border border-violet-700/40 text-violet-300 font-medium text-[11px]">
            AAGAM Enterprise Bot
          </span>
        </div>

        {/* Center: Tabs */}
        <div className="flex items-center bg-[#181822] p-0.5 rounded-lg border border-violet-500/15">
          {(['editor', 'executions', 'test'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeTab === tab
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Active Switch */}
          <div className="flex items-center gap-2 mr-2">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                isActive ? 'bg-violet-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-[11px] font-medium text-slate-300">
              {isActive ? 'Active' : 'Draft'}
            </span>
          </div>

          <button className="px-2.5 py-1 rounded-lg bg-[#181822] hover:bg-[#20202e] border border-violet-500/20 text-[11px] text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors">
            <Share2 className="w-3 h-3 text-slate-400" />
            <span>Share</span>
          </button>

          <button className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-[11px] font-medium text-white flex items-center gap-1.5 shadow-sm shadow-violet-500/30 transition-all">
            <Save className="w-3 h-3" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Canvas + Properties */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Visual Graph Canvas */}
        <div className="flex-1 relative bg-[#09090e] overflow-hidden flex items-center justify-center select-none">
          {/* Dot Grid Background */}
          <div
            className="absolute inset-0 opacity-[0.12] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#8b5cf6 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* SVG Connection Curves */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <linearGradient id="violetGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            {/* Trigger -> AI Agent */}
            <path
              d="M 280 230 C 350 230, 350 230, 420 230"
              fill="none"
              stroke="url(#violetGradient)"
              strokeWidth="2"
              strokeDasharray="4 3"
              className="animate-pulse"
            />
            {/* AI Agent -> Action 1 */}
            <path
              d="M 720 170 C 780 170, 780 120, 840 120"
              fill="none"
              stroke="#6d28d9"
              strokeWidth="2"
            />
            {/* AI Agent -> Action 2 */}
            <path
              d="M 720 230 C 780 230, 780 230, 840 230"
              fill="none"
              stroke="#7c3aed"
              strokeWidth="2"
            />
            {/* AI Agent -> Action 3 */}
            <path
              d="M 720 290 C 780 290, 780 340, 840 340"
              fill="none"
              stroke="#6d28d9"
              strokeWidth="2"
            />
          </svg>

          {/* Floating Controls (Bottom Left of Canvas) */}
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 bg-[#12121b]/90 backdrop-blur-md p-1 rounded-lg border border-violet-500/20 shadow-lg">
            <button
              className="p-1.5 rounded hover:bg-violet-950/50 text-slate-400 hover:text-white transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-violet-950/50 text-slate-400 hover:text-white transition-colors"
              title="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-violet-950/50 text-slate-400 hover:text-rose-400 transition-colors"
              title="Clear Canvas"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Canvas Nodes Container */}
          <div className="relative z-10 flex items-center gap-14 px-8 py-6">
            {/* Node 1: TRIGGER */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="w-56 p-3.5 rounded-xl bg-[#14141e] border border-violet-500/30 shadow-lg shadow-violet-950/20 space-y-2 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
                  <Send className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[9px] uppercase font-bold text-violet-400 tracking-wider">
                    TRIGGER
                  </div>
                  <div className="text-xs font-semibold text-white">Goal Ingestion / Webhook</div>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">
                Receives enterprise task spec & parses natural language into DAG objectives.
              </div>
            </motion.div>

            {/* Node 2: MAIN AI AGENT (Highlighted) */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              onClick={() => setSelectedNodeId('agent_main')}
              className="w-72 p-4 rounded-xl bg-[#13131d] border-2 border-emerald-500/70 shadow-xl shadow-emerald-950/20 space-y-3 cursor-pointer relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{nodeConfig.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">AI orchestration node</div>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  MAIN
                </span>
              </div>

              {/* Tools Section */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  AI Agent Tools
                </div>
                <div className="space-y-1">
                  {tools.map((t) => {
                    const Icon = t.icon;
                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg bg-[#1a1a27] border border-violet-500/10 text-[11px] text-slate-200"
                      >
                        <Icon className="w-3 h-3 text-violet-400 shrink-0" />
                        <span className="truncate">{t.name}</span>
                      </div>
                    );
                  })}
                </div>
                <button className="w-full py-1.5 rounded-lg border border-dashed border-violet-500/30 hover:border-violet-500/60 bg-violet-950/20 hover:bg-violet-950/40 text-[10px] text-violet-300 flex items-center justify-center gap-1 transition-all">
                  <Plus className="w-3 h-3" />
                  <span>Add tool</span>
                </button>
              </div>
            </motion.div>

            {/* Node Group 3: Connected Actions */}
            <div className="flex flex-col gap-3">
              {/* Action 1 */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="w-56 p-3 rounded-xl bg-[#14141e] border border-violet-500/30 shadow-md space-y-1.5 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-violet-600/20 flex items-center justify-center text-violet-400">
                    <Plus className="w-3 h-3" />
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-bold text-violet-400 tracking-wider">
                      ACTION
                    </div>
                    <div className="text-xs font-semibold text-white">Create new task</div>
                  </div>
                </div>
              </motion.div>

              {/* Action 2 */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="w-56 p-3 rounded-xl bg-[#14141e] border border-violet-500/30 shadow-md space-y-1.5 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <Zap className="w-3 h-3" />
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-bold text-amber-400 tracking-wider">
                      ACTION
                    </div>
                    <div className="text-xs font-semibold text-white">Quality Gate Audit</div>
                  </div>
                </div>
              </motion.div>

              {/* Action 3 */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="w-56 p-3 rounded-xl bg-[#14141e] border border-violet-500/30 shadow-md space-y-1.5 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <FileText className="w-3 h-3" />
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider">
                      ACTION
                    </div>
                    <div className="text-xs font-semibold text-white">Synthesize Result</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Right Properties Panel */}
        <div className="w-72 border-l border-violet-500/15 bg-[#101017] p-4 flex flex-col space-y-4 overflow-y-auto z-10">
          <div className="flex items-center justify-between border-b border-violet-500/15 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Properties</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-violet-950/60 text-violet-300 border border-violet-800/40">
                ID: agent_923
              </span>
            </div>
            <button className="text-slate-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Properties Form */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Node Name
              </label>
              <input
                type="text"
                value={nodeConfig.name}
                onChange={(e) => setNodeConfig({ ...nodeConfig, name: e.target.value })}
                className="w-full bg-[#171722] border border-violet-500/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Description
              </label>
              <textarea
                value={nodeConfig.description}
                onChange={(e) => setNodeConfig({ ...nodeConfig, description: e.target.value })}
                rows={3}
                className="w-full bg-[#171722] border border-violet-500/20 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Chat Model
              </label>
              <select
                value={nodeConfig.model}
                onChange={(e) => setNodeConfig({ ...nodeConfig, model: e.target.value })}
                className="w-full bg-[#171722] border border-violet-500/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="gpt-4o">GPT-4o (High-Precision)</option>
                <option value="gpt-4o-mini">GPT-4o-mini (Cost-Efficient)</option>
                <option value="tensormux-router">TensorMux Fast Router</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-violet-500/10">
              <span className="text-[11px] text-slate-400">Max Iterations</span>
              <span className="text-xs font-mono font-medium text-white">
                {nodeConfig.maxIterations}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-violet-500/10 pt-1">
              <span className="text-[11px] text-slate-400">Memory limit</span>
              <span className="text-xs font-mono font-medium text-white">
                {nodeConfig.memoryLimit}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Split Panels: AI Collaboration Chat & Live Execution Logs */}
      <div className="h-48 border-t border-violet-500/15 bg-[#0e0e15] grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-violet-500/15 z-20">
        {/* Left: AI Collaboration Chat */}
        <div className="flex flex-col h-full p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              AI collaboration chat
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg ${
                  msg.sender === 'ai'
                    ? 'bg-[#151522] border border-violet-500/15 text-slate-300'
                    : 'bg-violet-600 text-white ml-6 text-right'
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask AAGAM AI to adapt workflow or add nodes..."
              className="w-full bg-[#171722] border border-violet-500/20 rounded-lg pl-3 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
            <button
              onClick={handleSendMessage}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-violet-400 hover:text-white"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Live Execution Logs */}
        <div className="flex flex-col h-full p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-violet-400" />
              Live execution logs
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400 font-mono">status: running v3.2.1</span>
              <button
                onClick={() => copyLogText(sampleJsonLog)}
                className="text-slate-500 hover:text-white"
                title="Copy log payload"
              >
                {copiedLog ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="flex-1 flex gap-3 overflow-hidden">
            {/* Step Pills */}
            <div className="w-32 flex flex-col gap-1.5 shrink-0">
              <div className="p-1.5 rounded-lg bg-[#14141e] border border-emerald-500/30 flex items-center gap-1.5 text-[10px] text-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>TRIGGER</span>
              </div>
              <div className="p-1.5 rounded-lg bg-[#14141e] border border-emerald-500/30 flex items-center gap-1.5 text-[10px] text-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>AI AGENT</span>
              </div>
              <div className="p-1.5 rounded-lg bg-[#1a152e] border border-violet-500/40 flex items-center gap-1.5 text-[10px] text-violet-300 animate-pulse">
                <Activity className="w-3 h-3 text-violet-400" />
                <span>AUDIT GATE</span>
              </div>
            </div>

            {/* JSON Log Terminal */}
            <div className="flex-1 bg-[#08080d] rounded-lg p-2 font-mono text-[10px] text-slate-300 overflow-y-auto leading-relaxed border border-violet-500/10">
              <pre className="text-violet-300/90 whitespace-pre-wrap">{sampleJsonLog}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
