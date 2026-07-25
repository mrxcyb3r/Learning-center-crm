import React, { useState, useRef, useEffect } from 'react';
import { FormattedAIResponse } from './FormattedAIResponse';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  askAICoach,
  analyzeStudyDocument,
  evaluateSpeakingAudio,
  gradeIELTSEssay,
  UserLanguage,
  ChatMessage,
  FileAttachment
} from '../../services/gemini';
import {
  Sparkles,
  Send,
  Mic,
  Paperclip,
  X,
  Bot,
  User,
  Loader2,
  ShieldCheck,
  Globe,
  Maximize2,
  Minimize2,
  FileText,
  Image as ImageIcon,
  Volume2,
  Info,
  Sparkle
} from 'lucide-react';

interface PrimeAIAssistantProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialMode?: 'chat' | 'speaking' | 'essay';
}

export const PrimeAIAssistant: React.FC<PrimeAIAssistantProps> = ({
  isOpen = true,
  onClose,
  initialMode = 'chat'
}) => {
  const { activeRole } = useAuth();
  const { language } = useLanguage();

  const [userLang, setUserLang] = useState<UserLanguage>(language === 'EN' ? 'en' : 'uz');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text:
        userLang === 'uz'
          ? "Salom! Men CenterFlow'ning multimodal AI yordamchisiman. Darslar, IELTS Speaking/Writing, Python yoki matematika bo'yicha qanday yordam bera olaman?"
          : userLang === 'ru'
          ? "Здравствуйте! Я ИИ-помощник CenterFlow. Чем могу помочь по IELTS, предметам или программированию?"
          : "Hello! I am CenterFlow's Prime AI Assistant. How can I assist you with your studies, IELTS, or coding today?"
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'speaking' | 'essay'>(initialMode);
  const [isExpanded, setIsExpanded] = useState(false);

  // File Attachment State
  const [attachedFile, setAttachedFile] = useState<FileAttachment | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Essay State
  const [essayText, setEssayText] = useState('');
  const [taskType, setTaskType] = useState<'task1' | 'task2'>('task2');
  const [essayPrompt, setEssayPrompt] = useState('');

  // Speaking Part State
  const [speakingPart, setSpeakingPart] = useState<1 | 2 | 3>(1);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleChipClick = (chipText: string) => {
    setInputPrompt(chipText);
  };

  const getQuickChips = () => {
    if (activeRole === 'teacher') {
      return [
        { label: "📝 Draft Lesson Plan", text: "Draft a comprehensive 60-minute IELTS Writing Task 2 lesson plan outline on environmental topics." },
        { label: "📊 Evaluate Essay", text: "Evaluate an IELTS Writing Task 2 essay against official Band Descriptors (Task Response, Coherence, Lexical Resource, Grammar) with .0 or .5 band scores." },
        { label: "📢 Draft Parent Notice", text: "Draft a professional broadcast notification for parents regarding upcoming mock exam dates and student progress updates." }
      ];
    }

    if (activeRole === 'admin' || activeRole === 'superadmin') {
      return [
        { label: "📢 Telegram Announcement", text: "Draft an engaging Telegram channel post announcing a new IELTS 7.5+ Intensive Batch starting next Monday." },
        { label: "📊 Center Summary Report", text: "Write a professional weekly summary report for teacher attendance, active courses, and tuition payment statuses." }
      ];
    }

    return [
      { label: "💡 Explain Grammar Rule", text: "Explain the difference between Present Perfect and Past Simple tenses with clear rules and examples." },
      { label: "🔍 Review My Draft", text: "Review my paragraph draft, point out specific grammatical or lexical errors, and guide me on how to improve without rewriting it for me." },
      { label: "🎧 IELTS Tips", text: "Give me top strategies and Socratic guidance for improving my score in IELTS Listening and Speaking Part 2." },
      { label: "💻 Coding Assistance", text: "Explain how list comprehensions work in Python with a clean step-by-step breakdown." }
    ];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Fayl hajmi 10MB dan oshmasligi kerak.");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      setAttachedFile({
        inlineData: {
          data: base64Data,
          mimeType: file.type || 'image/jpeg'
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Microphone ga ruxsat berilmadi yoki qurilmada mikrofon topilmadi.");
    }
  };

  const stopRecordingAndEvaluate = async () => {
    if (!mediaRecorderRef.current) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        const base64Audio = result.split(',')[1];

        const userMsg: ChatMessage = {
          role: 'user',
          text: `[🎙️ Audio Recording - IELTS Speaking Part ${speakingPart} (${recordingSeconds}s)]`
        };
        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);

        try {
          const evalResult = await evaluateSpeakingAudio(base64Audio, 'audio/webm', speakingPart, userLang);
          setMessages((prev) => [...prev, { role: 'model', text: evalResult }]);
        } catch (err: any) {
          setMessages((prev) => [
            ...prev,
            { role: 'model', text: `❌ Audio evaluation error: ${err?.message || 'Error'}` }
          ]);
        } finally {
          setIsLoading(false);
          setRecordingSeconds(0);
          setActiveTab('chat');
        }
      };
      reader.readAsDataURL(audioBlob);
    };
  };

  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputPrompt.trim() && !attachedFile) || isLoading) return;

    const userQuery = inputPrompt.trim() || (attachedFile ? "Please analyze this study file." : "");
    const userMsg: ChatMessage = {
      role: 'user',
      text: userQuery,
      attachment: attachedFile || undefined
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    const currentAttachment = attachedFile;
    setAttachedFile(null);
    setFileName('');
    setIsLoading(true);

    try {
      let aiResponseText = '';
      if (currentAttachment && currentAttachment.inlineData.mimeType.startsWith('image/')) {
        aiResponseText = await analyzeStudyDocument(
          currentAttachment.inlineData.data,
          currentAttachment.inlineData.mimeType,
          userQuery,
          userLang
        );
      } else {
        aiResponseText = await askAICoach(
          userQuery,
          messages,
          userLang,
          currentAttachment || undefined,
          activeRole
        );
      }

      setMessages((prev) => [...prev, { role: 'model', text: aiResponseText }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: `❌ Error receiving AI response: ${err?.message || 'Error'}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeEssaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!essayText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: `[📝 Essay Submitted - IELTS Writing ${taskType.toUpperCase()}]\nTopic: ${essayPrompt}\n\nEssay:\n${essayText}`
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const result = await gradeIELTSEssay(essayText, taskType, essayPrompt, userLang);
      setMessages((prev) => [...prev, { role: 'model', text: result }]);
      setEssayText('');
      setEssayPrompt('');
      setActiveTab('chat');
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: `❌ Essay evaluation error: ${err?.message}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isExpanded
          ? 'inset-4 md:inset-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col'
          : 'bottom-4 right-4 w-full max-w-lg h-[620px] max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col'
      }`}
    >
      {/* HEADER BAR */}
      <div className="p-4 bg-slate-900 text-white rounded-t-3xl border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white tracking-tight">
                CenterFlow Prime AI
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                2.5 / 3.6 Multimodal
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Renessans LC Socratic Tutor & Academic Coach
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <Globe className="w-3 h-3 text-amber-400 ml-1" />
            <button
              onClick={() => setUserLang('uz')}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition ${
                userLang === 'uz' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              UZ
            </button>
            <button
              onClick={() => setUserLang('en')}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition ${
                userLang === 'en' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setUserLang('ru')}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition ${
                userLang === 'ru' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              RU
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            title={isExpanded ? 'Restore size' : 'Expand full window'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* MODE TABS */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1 overflow-x-auto shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Coach Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('speaking')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'speaking'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>IELTS Speaking</span>
          </button>

          <button
            onClick={() => setActiveTab('essay')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'essay'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Essay Grader</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
          <span>Academic Socratic Coach</span>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* VIEW 1: IELTS SPEAKING AUDIO EVALUATOR */}
        {activeTab === 'speaking' ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-amber-500" />
                <span>IELTS Speaking Voice Evaluator</span>
              </h4>
              <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => setSpeakingPart(num as 1 | 2 | 3)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      speakingPart === num ? 'bg-amber-500 text-slate-950' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Part {num}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Record your response to receive instant IELTS band scores and audio feedback on Fluency, Lexical Resource, Grammar, and Pronunciation.
            </p>

            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              {isRecording ? (
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center animate-ping">
                    <Mic className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-500">
                    Recording audio... {recordingSeconds}s
                  </span>
                  <button
                    onClick={stopRecordingAndEvaluate}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition cursor-pointer"
                  >
                    Stop Recording & Analyze AI
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={startRecording}
                    disabled={isLoading}
                    className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    <Mic className="w-8 h-8" />
                  </button>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Click Microphone to Record
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'essay' ? (
          /* VIEW 2: ESSAY GRADERSHIP PANEL */
          <form onSubmit={handleGradeEssaySubmit} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>IELTS Writing Essay Evaluator</span>
              </h4>
              <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTaskType('task1')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${taskType === 'task1' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  Task 1
                </button>
                <button
                  type="button"
                  onClick={() => setTaskType('task2')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${taskType === 'task2' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  Task 2
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Essay Topic / Prompt:
              </label>
              <input
                type="text"
                value={essayPrompt}
                onChange={(e) => setEssayPrompt(e.target.value)}
                placeholder="e.g. Some people think universities should offer practical skills..."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Essay Text:
              </label>
              <textarea
                rows={5}
                required
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                placeholder="In today's modern world, education plays a vital role..."
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !essayText.trim()}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Grade Essay & Get Band Score</span>
            </button>
          </form>
        ) : (
          /* VIEW 3: CHAT MESSAGES THREAD (REACT-MARKDOWN FORMATTED) */
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Academic Guardrail:</span> CenterFlow AI does not solve homework directly. It provides hints, Socratic questions, and similar examples to coach your learning!
              </div>
            </div>

            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-none'
                    }`}
                  >
                    {msg.attachment && (
                      <div className="mb-2 p-2 bg-black/10 dark:bg-white/10 rounded-xl text-[10px] font-mono flex items-center gap-2">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>Attached File ({msg.attachment.inlineData.mimeType})</span>
                      </div>
                    )}

                    {isUser ? (
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    ) : (
                      <FormattedAIResponse content={msg.text} />
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-xl bg-slate-800 text-white font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-amber-500 font-bold animate-pulse p-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gemini AI is analyzing & generating...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* QUICK CHIPS (Only in Chat Mode) */}
      {activeTab === 'chat' && (
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkle className="w-3 h-3 text-amber-500" />
            Chips:
          </span>
          {getQuickChips().map((chip, i) => (
            <button
              key={i}
              onClick={() => handleChipClick(chip.text)}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-amber-500 hover:text-amber-500 transition cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* INPUT FORM (Chat Mode) */}
      {activeTab === 'chat' && (
        <form
          onSubmit={handleSendChat}
          className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-b-3xl shrink-0 space-y-2"
        >
          {attachedFile && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-2 truncate">
                <ImageIcon className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate font-mono text-[11px]">{fileName}</span>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-slate-400 hover:text-rose-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,application/pdf,text/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
              title="Upload study document / exercise image"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={
                userLang === 'uz'
                  ? "Savol bering yoki rasmni biriktiring..."
                  : userLang === 'ru'
                  ? "Задайте вопрос или прикрепите фото..."
                  : "Ask a question or attach a file..."
              }
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />

            <button
              type="submit"
              disabled={isLoading || (!inputPrompt.trim() && !attachedFile)}
              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition cursor-pointer shadow-md shadow-amber-500/20 shrink-0 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
