import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SavedThread } from '../hooks/useAiMessages';
import {
  Plus,
  MessageSquare,
  Sparkles,
  Bookmark,
  FileCode,
  GraduationCap,
  Trash2,
  CheckCircle2,
  Cpu,
  Compass,
  Code,
  Mic,
  ChevronDown,
  Bot,
} from 'lucide-react';

interface AiSidebarProps {
  threads: SavedThread[];
  activeThreadId: string;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
  onDeleteThread: (id: string) => void;
  activeMode: string;
  onSelectMode: (mode: string) => void;
  contextAnchors: string[];
  onToggleAnchor: (anchor: string) => void;
  selectedModel?: string;
  onSelectModel?: (model: string) => void;
}

export const AiSidebar: React.FC<AiSidebarProps> = ({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  activeMode,
  onSelectMode,
  contextAnchors,
  onToggleAnchor,
  selectedModel = 'gemini-2.5-flash',
  onSelectModel,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const AVAILABLE_MODELS = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', badge: 'Ultra Fast' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', badge: 'Deep Context' },
    { id: 'centerflow-neural-r1', name: 'CenterFlow R1 Mentor', badge: 'Reasoning' },
  ];

  const AI_MODES = [
    { id: 'general', label: 'GENERAL MENTOR', icon: <GraduationCap className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'ielts_evaluator', label: 'IELTS EVALUATOR', icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'code_reviewer', label: 'CODE REVIEWER', icon: <Code className="w-3.5 h-3.5 text-indigo-400" /> },
    { id: 'speaking_coach', label: 'SPEAKING COACH', icon: <Mic className="w-3.5 h-3.5 text-emerald-400" /> },
  ];

  const AVAILABLE_CONTEXT_ANCHORS = [
    'IELTS Band 8.5 Descriptor Spec',
    'CEFR C1 Vocabulary Corpus',
    'CenterFlow Q3 Student Roster',
    'Telegram Bot Webhook Config',
  ];

  const currentModelObj = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  return (
    <div className="w-full lg:w-72 bg-slate-950/80 border border-slate-800/80 rounded-3xl p-4 flex flex-col justify-between gap-6 backdrop-blur-xl shadow-2xl">
      <div className="space-y-6">
        {/* GROUP 1: COPILOT ACTIONS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-black uppercase text-amber-400 tracking-wider">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Copilot Actions</span>
            </span>
          </div>

          <button
            onClick={onNewThread}
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 border border-amber-400/40 cursor-pointer transition-all group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>New Neural Conversation</span>
          </button>

          {/* Model Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-xs font-semibold text-slate-300 flex items-center justify-between gap-2 cursor-pointer transition"
            >
              <div className="flex items-center gap-2 truncate">
                <Bot className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{currentModelObj.name}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold">
                  {currentModelObj.badge}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            <AnimatePresence>
              {modelDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full left-0 right-0 mt-1 z-30 p-1.5 rounded-xl bg-slate-900 border border-slate-700 shadow-xl space-y-1"
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSelectModel?.(m.id);
                        setModelDropdownOpen(false);
                      }}
                      className={`w-full p-2 rounded-lg text-left text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        selectedModel === m.id
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{m.name}</span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-slate-800 text-slate-400">{m.badge}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* GROUP 2: ACTIVE MODE STATUS */}
        <div className="space-y-2.5">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>Active Mode Status</span>
          </div>

          <div className="space-y-1.5">
            {AI_MODES.map((mode) => {
              const isActive = activeMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => onSelectMode(mode.id)}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer border ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800/80 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {mode.icon}
                    <span>{mode.label}</span>
                  </div>
                  {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* GROUP 3: REORDERABLE CONVERSATION HISTORY */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 tracking-wider">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-indigo-400" />
              <span>Chat History ({threads.length})</span>
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
            <AnimatePresence mode="popLayout">
              {threads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                return (
                  <motion.div
                    key={thread.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className={`group relative p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-slate-900 to-slate-850 text-white border-amber-500/60 shadow-md'
                        : 'bg-slate-900/40 text-slate-400 border-slate-800/60 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                    onClick={() => onSelectThread(thread.id)}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{thread.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{thread.date}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active Thread" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteThread(thread.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition"
                        title="Delete Thread"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* GROUP 4: CONTEXT ANCHORS */}
        <div className="space-y-2.5 pt-2 border-t border-slate-900">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
            <Bookmark className="w-3 h-3 text-cyan-400" />
            <span>Context Anchors</span>
          </div>

          <div className="space-y-1.5">
            {AVAILABLE_CONTEXT_ANCHORS.map((anchor, idx) => {
              const isAnchored = contextAnchors.includes(anchor);
              return (
                <button
                  key={idx}
                  onClick={() => onToggleAnchor(anchor)}
                  className={`w-full p-2 rounded-xl text-[11px] font-semibold transition flex items-center justify-between gap-2 cursor-pointer border ${
                    isAnchored
                      ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-900/30 text-slate-400 border-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate flex items-center gap-1.5">
                    <FileCode className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{anchor}</span>
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isAnchored ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-800 text-slate-500'}`}>
                    {isAnchored ? 'LINKED' : 'OFF'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
