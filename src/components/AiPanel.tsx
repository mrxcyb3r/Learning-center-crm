import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppBackground } from './AppBackground';
import { AiHeader } from './AiHeader';
import { AiSidebar } from './AiSidebar';
import { AiInput } from './AiInput';
import { FormattedAIResponse } from './AI/FormattedAIResponse';
import { useAiMessages } from '../hooks/useAiMessages';
import { exportSessionToMarkdown, exportSessionToJSON, generateSocraticHint } from '../services/aiService';
import {
  Download,
  Sparkles,
  HelpCircle,
  Award,
  X,
  Bot,
  User,
  CheckCircle2,
  TrendingUp,
  FileText,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

export interface AiPanelProps {
  initialMode?: string;
  onBack?: () => void;
}

export const AiPanel: React.FC<AiPanelProps> = ({ initialMode = 'general', onBack }) => {
  const {
    threads,
    activeThreadId,
    activeThread,
    messages,
    isLoading,
    error,
    sendMessage,
    setActiveThreadId,
    createNewThread,
    deleteThread,
    clearMessages,
  } = useAiMessages('en', 'student');

  const [activeMode, setActiveMode] = useState<string>(initialMode);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [contextAnchors, setContextAnchors] = useState<string[]>(['IELTS Band 8.5 Descriptor Spec']);
  const [isGroundingActive, setIsGroundingActive] = useState<boolean>(false);
  const [showIeltsEvaluatorModal, setShowIeltsEvaluatorModal] = useState<boolean>(false);
  const [socraticHintLoadingIdx, setSocraticHintLoadingIdx] = useState<number | null>(null);
  const [copiedExport, setCopiedExport] = useState<boolean>(false);

  const toggleAnchor = (anchor: string) => {
    setContextAnchors((prev) =>
      prev.includes(anchor) ? prev.filter((a) => a !== anchor) : [...prev, anchor]
    );
  };

  // Export handlers
  const handleExportSession = (format: 'markdown' | 'json') => {
    const title = activeThread?.title || 'CenterFlow Neural Session';
    const content =
      format === 'markdown'
        ? exportSessionToMarkdown(title, messages)
        : exportSessionToJSON(title, messages);

    const blob = new Blob([content], { type: format === 'markdown' ? 'text/markdown' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `centerflow_session_${Date.now()}.${format === 'markdown' ? 'md' : 'json'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Socratic hint handler
  const handleRequestSocraticHint = async (msgIdx: number, msgText: string) => {
    setSocraticHintLoadingIdx(msgIdx);
    try {
      const hintText = await generateSocraticHint(msgText);
      await sendMessage(`💡 Socratic Hint requested for: "${msgText.slice(0, 40)}..."\n\n${hintText}`);
    } catch (e) {
      console.error(e);
    } finally {
      setSocraticHintLoadingIdx(null);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-white overflow-hidden p-3 sm:p-6 font-sans">
      {/* 1. Dominant Shifting Animated Background */}
      <AppBackground />

      {/* Main Glass Panel Container */}
      <div className="relative z-10 max-w-7xl mx-auto space-y-4">
        {/* Top Action Toolbar with Export & Band Evaluator Trigger */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 border border-slate-800 backdrop-blur-3xl rounded-2xl p-3 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black tracking-wider uppercase text-slate-300">
              CenterFlow Neural Copilot v2.5
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Interactive IELTS Band Evaluator Modal Trigger */}
            <button
              onClick={() => setShowIeltsEvaluatorModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-amber-500/10"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>IELTS Band Evaluator Overlay</span>
            </button>

            {/* Quick Export Session Dropdown */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 px-2 flex items-center gap-1">
                <Download className="w-3 h-3 text-amber-400" /> Export:
              </span>
              <button
                onClick={() => handleExportSession('markdown')}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-bold transition"
              >
                MD
              </button>
              <button
                onClick={() => handleExportSession('json')}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold transition"
              >
                JSON
              </button>
            </div>
          </div>
        </div>

        {/* Header */}
        <AiHeader />

        {/* Main Panel Content (Sidebar + Messages + Input) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <AiSidebar
              threads={threads}
              activeThreadId={activeThreadId}
              onSelectThread={setActiveThreadId}
              onNewThread={() => createNewThread(activeMode)}
              onDeleteThread={deleteThread}
              activeMode={activeMode}
              onSelectMode={setActiveMode}
              contextAnchors={contextAnchors}
              onToggleAnchor={toggleAnchor}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              onExportSession={handleExportSession}
            />
          </div>

          {/* Chat Workspace Canvas */}
          <div className="lg:col-span-3 flex flex-col h-[700px] bg-slate-950/70 border border-slate-800/90 rounded-3xl shadow-[0_0_80px_rgba(245,158,11,0.12)] backdrop-blur-3xl overflow-hidden p-4 sm:p-5 justify-between">
            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
              {messages.map((msg, idx) => {
                const isBot = msg.role === 'model';
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-start gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    {isBot && (
                      <div className="p-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0">
                        <Bot className="w-5 h-5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 border backdrop-blur-md shadow-lg ${
                        isBot
                          ? 'bg-slate-900/90 border-slate-800 text-slate-100'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-medium border-amber-400/40'
                      }`}
                    >
                      {/* Markdown formatted response */}
                      <FormattedAIResponse content={msg.text} />

                      {/* Socratic Hint Button inside AI Messages */}
                      {isBot && (
                        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          <button
                            onClick={() => handleRequestSocraticHint(idx, msg.text)}
                            disabled={socraticHintLoadingIdx === idx}
                            className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-bold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{socraticHintLoadingIdx === idx ? 'Generating Socratic Hint...' : 'Request Socratic Step Hint'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {!isBot && (
                      <div className="p-2 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-3 text-amber-400 font-bold text-xs p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 w-fit">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>CenterFlow Copilot is synthesizing response...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="pt-4 border-t border-slate-900">
              <AiInput
                onSendMessage={sendMessage}
                isLoading={isLoading}
                activeModeLabel={activeMode.toUpperCase().replace('_', ' ')}
                isGroundingActive={isGroundingActive}
                onToggleGrounding={() => setIsGroundingActive(!isGroundingActive)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE IELTS BAND EVALUATOR OVERLAY MODAL */}
      <AnimatePresence>
        {showIeltsEvaluatorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl p-6 text-white space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                      <span>IELTS Target Band 8.5+ Performance Evaluator</span>
                    </h3>
                    <p className="text-xs text-slate-400">Automated 4-Criteria Band Score Diagnostic & Mastery Roadmap</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIeltsEvaluatorModal(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Band Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { title: 'Listening', score: '8.5', color: 'from-amber-500 to-amber-600', text: 'Target Met' },
                  { title: 'Reading', score: '9.0', color: 'from-emerald-500 to-emerald-600', text: 'Perfect Score' },
                  { title: 'Writing', score: '8.0', color: 'from-cyan-500 to-cyan-600', text: 'Band 8+ Achieved' },
                  { title: 'Speaking', score: '8.5', color: 'from-indigo-500 to-indigo-600', text: 'High Fluency' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center text-center space-y-1"
                  >
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">{item.title}</span>
                    <span className={`text-2xl font-black bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                      {item.score}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 font-extrabold text-amber-300">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Detailed Actionable Tips to Reach Target Band 8.5+ */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/30 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>Actionable Roadmap to Target Band 8.5+</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Task Response (Writing)</strong>: Eliminate over-generalized statements in body paragraph 2. Use specific empirical evidence or academic case studies.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Lexical Resource (Speaking)</strong>: Replace standard connective fillers ("like", "you know") with formal discourse markers ("consequently", "furthermore").
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Coherence & Cohesion</strong>: Ensure strict paragraph unit continuity with topic sentence -&gt; supporting premise -&gt; counter-argument balance.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowIeltsEvaluatorModal(false)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer"
                >
                  Close &amp; Resume Conversation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
