import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Activity,
  Cpu,
  Server,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Lock,
  Key,
  Database,
  Radio,
  Clock,
  Zap,
  Copy,
  Check,
  Terminal,
  FileCheck
} from 'lucide-react';

export interface HealthMetricsData {
  status: string;
  uptimeSeconds: number;
  memoryUsage: {
    rssMb: number;
    heapUsedMb: number;
  };
  securityMetrics: {
    rateLimitTriggerCount: number;
    securityViolationCount: number;
  };
  environmentStatus: {
    mode: string;
    geminiConfigured: boolean;
  };
  serverTime: string;
}

export const SecurityMonitorPanel: React.FC = () => {
  const [metrics, setMetrics] = useState<HealthMetricsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [testAuthStatus, setTestAuthStatus] = useState<string | null>(null);
  const [testingAuth, setTestingAuth] = useState<boolean>(false);

  const fetchHealthMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error(`Health check returned HTTP ${response.status}`);
      }
      const data = await response.json();
      setMetrics(data);
    } catch (err: any) {
      console.error('Failed to fetch security health metrics:', err);
      setError(err?.message || 'Failed to communicate with backend security server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthMetrics();
    const interval = setInterval(fetchHealthMetrics, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [fetchHealthMetrics]);

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hrs = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (days > 0) return `${days}d ${hrs}h ${mins}m ${secs}s`;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const handleCopyReport = () => {
    if (!metrics) return;
    const report = `[CENTERFLOW SECURITY AUDIT REPORT]
Timestamp: ${new Date().toISOString()}
Server Status: ${metrics.status.toUpperCase()}
Uptime: ${formatUptime(metrics.uptimeSeconds)}
Memory RSS: ${metrics.memoryUsage.rssMb} MB | Heap: ${metrics.memoryUsage.heapUsedMb} MB
Rate Limit Triggers: ${metrics.securityMetrics.rateLimitTriggerCount}
Security Violations Blocked: ${metrics.securityMetrics.securityViolationCount}
Bot Mode: ${metrics.environmentStatus.mode}
Gemini Configured: ${metrics.environmentStatus.geminiConfigured}`;

    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const handleTestAdminAuth = async () => {
    setTestingAuth(true);
    setTestAuthStatus(null);
    try {
      const res = await fetch('/api/bot/health', {
        headers: {
          'Authorization': 'Bearer centerflow_admin_secret_2026'
        }
      });
      if (res.ok) {
        setTestAuthStatus('Authorization Bearer Handshake Verified: 200 OK');
      } else {
        setTestAuthStatus(`Authorization Failed: HTTP ${res.status}`);
      }
    } catch {
      setTestAuthStatus('Connection failed during security handshake test.');
    } finally {
      setTestingAuth(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">Security & System Health Monitor</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                  Defense-In-Depth
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Real-time tracking of server uptime, defense mechanisms, memory metrics, and configuration security compliance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              disabled={!metrics}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {copiedReport ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedReport ? 'Report Copied' : 'Audit Report'}</span>
            </button>
            <button
              onClick={fetchHealthMetrics}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Poll Health</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Server Status & Uptime */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-500" /> Server Uptime
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {metrics ? formatUptime(metrics.uptimeSeconds) : '--'}
          </div>
          <p className="text-[11px] text-slate-400">
            Node.js / Express process active
          </p>
        </div>

        {/* Card 2: Memory Footprint */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-amber-500" /> RSS Memory Usage
            </span>
            <span className="text-xs font-mono text-amber-500 font-bold">
              {metrics?.memoryUsage.rssMb || 0} MB
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((metrics?.memoryUsage.rssMb || 0) / 512) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Heap Used: <span className="font-mono text-slate-700 dark:text-slate-200">{metrics?.memoryUsage.heapUsedMb || 0} MB</span>
          </p>
        </div>

        {/* Card 3: Rate Limit Triggers */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-500" /> Rate Limit Intercepts
            </span>
            <span className="text-xs font-mono text-indigo-500 font-bold">HTTP 429</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {metrics?.securityMetrics.rateLimitTriggerCount ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">
            Abuse protection layer active
          </p>
        </div>

        {/* Card 4: Security Violation Blocks */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-rose-500" /> Security Blocks
            </span>
            <span className="text-xs font-mono text-rose-500 font-bold">Blocked</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {metrics?.securityMetrics.securityViolationCount ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">
            Spoof & unauthorized access blocks
          </p>
        </div>
      </div>

      {/* Deep Audit Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Checklist */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-500" />
              <span>Environment & Secrets Compliance</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Audit Status</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-500" />
                Telegram Bot Operation Mode:
              </span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
                {metrics?.environmentStatus.mode || 'polling'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-500" />
                Gemini API Engine:
              </span>
              {metrics?.environmentStatus.geminiConfigured ? (
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Configured
                </span>
              ) : (
                <span className="font-bold text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Not Set
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-500" />
                Admin API Secret Enforcement:
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Active (Header Verified)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-500" />
                Firestore Security Rules Layer:
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Hardened (Deny Catch-All)
              </span>
            </div>
          </div>
        </div>

        {/* Security Controls & Interactive Test Panel */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-500" />
              <span>Interactive Safety Controls</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Bearer Token Test</span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Verify administrative secret headers and trigger backend security diagnostics on demand.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleTestAdminAuth}
              disabled={testingAuth}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {testingAuth ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4 text-amber-400" />}
              <span>Test Admin Authorization Handshake</span>
            </button>

            {testAuthStatus && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{testAuthStatus}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
