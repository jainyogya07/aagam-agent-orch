'use client';

// ============================================================
// Execution Log Drawer Component
// ============================================================
// Resizable, collapsible bottom drawer showing live orchestrator
// decisions and events. Users can drag to resize, collapse,
// search/filter logs, and toggle auto-scroll.
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter, 
  Download,
  X,
  Circle,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  category?: 'orchestrator' | 'agent' | 'resource' | 'quality' | 'mutation';
  metadata?: Record<string, unknown>;
}

interface ExecutionLogDrawerProps {
  logs: LogEntry[];
  isLive?: boolean;
  onClear?: () => void;
}

export function ExecutionLogDrawer({
  logs,
  isLive = false,
  onClear,
}: ExecutionLogDrawerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [height, setHeight] = useState(240);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  
  const logContainerRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const dragStartHeight = useRef<number>(0);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = height;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const delta = dragStartY.current - e.clientY;
      const newHeight = Math.min(Math.max(150, dragStartHeight.current + delta), 600);
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, height]);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (levelFilter.length > 0 && !levelFilter.includes(log.level)) {
      return false;
    }
    return true;
  });

  // Export logs
  const handleExport = () => {
    const logText = logs
      .map(log => `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] ${log.message}`)
      .join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-log-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isCollapsed) {
    return (
      <div className="border-t border-[#24242C] bg-[#0B0B0F]">
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full px-4 py-2 flex items-center justify-between hover:bg-[#111116] transition-colors"
        >
          <div className="flex items-center gap-2">
            <ChevronUp className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-400">Execution Log</span>
            {isLive && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
                <span className="text-xs text-violet-400">LIVE</span>
              </div>
            )}
          </div>
          <span className="text-xs text-gray-600">{logs.length} events</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="border-t border-[#24242C] bg-[#0B0B0F] flex flex-col"
      style={{ height: `${height}px` }}
    >
      {/* Drag Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`h-1 bg-[#24242C] hover:bg-violet-500/30 cursor-ns-resize transition-colors ${
          isDragging ? 'bg-violet-500/50' : ''
        }`}
      />

      {/* Header */}
      <div className="px-4 py-2 border-b border-[#24242C] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">Execution Log</span>
            {isLive && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-violet-500/10 rounded border border-violet-500/20">
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
                <span className="text-xs text-violet-400 font-medium">LIVE</span>
              </div>
            )}
          </div>
          <span className="text-xs text-gray-600">{filteredLogs.length} events</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-600 absolute left-2 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 h-7 pl-7 pr-2 bg-[#111116] border border-[#24242C] rounded text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 transform -translate-y-1/2 p-0.5 hover:bg-[#18181f] rounded"
              >
                <X className="w-3 h-3 text-gray-600" />
              </button>
            )}
          </div>

          {/* Level Filter */}
          <LevelFilterButton
            levelFilter={levelFilter}
            setLevelFilter={setLevelFilter}
          />

          {/* Auto-scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              autoScroll
                ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                : 'bg-[#111116] text-gray-500 border border-transparent hover:bg-[#18181f]'
            }`}
          >
            Auto-scroll
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            className="p-1.5 hover:bg-[#111116] rounded transition-colors"
            title="Export logs"
          >
            <Download className="w-4 h-4 text-gray-500" />
          </button>

          {/* Clear */}
          {onClear && (
            <button
              onClick={onClear}
              className="px-2 py-1 hover:bg-[#111116] rounded text-xs text-gray-500 transition-colors"
            >
              Clear
            </button>
          )}

          {/* Collapse */}
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 hover:bg-[#111116] rounded transition-colors"
          >
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Log Content */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto px-4 py-2 font-mono text-xs"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-600">
            {searchQuery || levelFilter.length > 0 ? 'No matching logs' : 'No logs yet'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log) => (
              <LogLine key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Supporting Components

function LogLine({ log }: { log: LogEntry }) {
  const levelIcons = {
    info: <Info className="w-3.5 h-3.5 text-blue-400" />,
    success: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
    warn: <AlertCircle className="w-3.5 h-3.5 text-amber-400" />,
    error: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
  };

  const levelColors = {
    info: 'text-gray-300',
    success: 'text-emerald-300',
    warn: 'text-amber-300',
    error: 'text-red-300',
  };

  const categoryBadges = {
    orchestrator: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    agent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    resource: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    quality: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    mutation: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <div className="flex items-start gap-2 py-1 hover:bg-[#111116] -mx-2 px-2 rounded group">
      <span className="text-gray-600 flex-shrink-0">
        {log.timestamp.toLocaleTimeString('en-US', { 
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </span>
      
      <div className="flex-shrink-0 mt-0.5">
        {levelIcons[log.level]}
      </div>
      
      {log.category && (
        <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs border ${categoryBadges[log.category]}`}>
          {log.category}
        </span>
      )}
      
      <span className={`flex-1 ${levelColors[log.level]}`}>
        {log.message}
      </span>
    </div>
  );
}

function LevelFilterButton({
  levelFilter,
  setLevelFilter,
}: {
  levelFilter: string[];
  setLevelFilter: (filter: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleLevel = (level: string) => {
    if (levelFilter.includes(level)) {
      setLevelFilter(levelFilter.filter(l => l !== level));
    } else {
      setLevelFilter([...levelFilter, level]);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
          levelFilter.length > 0
            ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
            : 'bg-[#111116] text-gray-500 border border-transparent hover:bg-[#18181f]'
        }`}
      >
        <Filter className="w-3.5 h-3.5" />
        {levelFilter.length > 0 && <span>{levelFilter.length}</span>}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-40 bg-[#111116] border border-[#24242C] rounded-lg shadow-lg z-20 py-1">
            {['info', 'success', 'warn', 'error'].map((level) => (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#18181f] transition-colors flex items-center justify-between"
              >
                <span className="text-gray-300 capitalize">{level}</span>
                {levelFilter.includes(level) && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
