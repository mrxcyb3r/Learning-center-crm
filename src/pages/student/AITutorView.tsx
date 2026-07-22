import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
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
  FileText,
  Image as ImageIcon,
  Volume2,
  Plus,
  Search,
  MessageSquare,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Info,
  Sparkle,
  Copy,
  Check
} from 'lucide-react';

interface SavedThread {
  id: string;
  title: string;
  date: string;
  messages: ChatMessage[];
}

interface AITutorViewProps {
  onBackToDashboard?: () => void;
}

export const AITutorView: React.FC<AITutorViewProps> = ({ onBackToDashboard }) => {
  const { activeRole, userProfile } = useAuth();
  const { language } = useLanguage();

  const [userLang, setUserLang] = useState<UserLanguage>(language === 'EN' ? 'en' : 'uz');

  // Initial Saved Threads (Local Persistence)
  const [savedThreads, setSavedThreads] = useState<SavedThread[]>(() => {
    try {
      const stored = localStorage.getItem('centerflow_ai_threads');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse saved threads:', e);
    }
    return [
      {
        id: 'thread-1',
        title: 'Python List Comprehensions',
        date: 'Bugun',
        messages: [
          { role: 'user', text: 'Python da list comprehension qanday ishlaydi?' },
          {
            role: 'model',
            text:
              '**List Comprehension** — Python da ro\'yxatlarni (list) ixcham va tezroq yaratish usulidir.\n\n### Sintaksis:\n`[expression for item in iterable if condition]`\n\n- **Misol:** 1 dan 10 gacha bo\'lgan juft sonlarning kvadratini ro\'yxatga olish:\n```python\nkvadratlar = [x**2 for x in range(1, 11) if x % 2 == 0]\nprint(kvadratlar)  # [4, 16, 36, 64, 100]\n```\n\nSizga shunga o\'xshash mashq beraymi?'
          }
        ]
      },
      {
        id: 'thread-2',
        title: 'IELTS Essay #14 Feedback',
        date: 'Kecha',
        messages: [
          { role: 'user', text: 'IELTS Task 2 essay insho tahlilini qilib berasizmi?' },
          {
            role: 'model',
            text:
              '**IELTS Writing Task 2 Evaluation:**\n- **Overall Band Score:** 7.0\n- **Task Response:** 7.0\n- **Coherence & Cohesion:** 7.0\n- **Lexical Resource:** 6.5\n- **Grammar:** 7.0\n\n**Tavsiya:** Lug\'at boyligini oshirish uchun *vital*, *paramount*, *subsequently* kabi C1 academic so\'zlardan ko\'proq foydalaning.'
          }
        ]
      }
    ];
  });

  const [activeThreadId, setActiveThreadId] = useState<string>('new');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text:
        userLang === 'uz'
          ? "Salom! Men CenterFlow Prime Multimodal AI o'quv yordamchisiman. Darslik mashqlari, IELTS Speaking audio va insholarini tahlil qilish hamda Socratic metodda tushunchalarni o'rganishda yordam beraman."
          : userLang === 'ru'
          ? "Здравствуйте! Я ИИ-помощник CenterFlow Prime. Чем могу помочь вам по предметам, IELTS, математике или программированию?"
          : "Hello! I am CenterFlow's Prime Multimodal AI Learning Coach. How can I assist you with your studies, IELTS practice, or coding today?"
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'speaking' | 'essay'>('chat');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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

  // Sync saved threads to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('centerflow_ai_threads', JSON.stringify(savedThreads));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [savedThreads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle Thread Switching
  const handleSelectThread = (thread: SavedThread) => {
    setActiveThreadId(thread.id);
    setMessages(thread.messages);
    setActiveTab('chat');
  };

  // Start New Chat
  const handleNewChat = () => {
    setActiveThreadId('new');
    setMessages([
      {
        role: 'model',
        text:
          userLang === 'uz'
            ? "Yangi suhbat boshlandi! Qaysi fan yoki mavzu bo'yicha ko'maklashay?"
            : userLang === 'ru'
            ? "Новый чат начат! Чем могу помочь?"
            : "New conversation started! How can I assist you?"
      }
    ]);
    setAttachedFile(null);
    setFileName('');
    setInputPrompt('');
    setActiveTab('chat');
  };

  // Delete Thread
  const handleDeleteThread = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSavedThreads((prev) => prev.filter((t) => t.id !== id));
    if (activeThreadId === id) {
      handleNewChat();
    }
  };

  // Copy Message to Clipboard
  const handleCopyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleChipClick = (chipText: string) => {
    setInputPrompt(chipText);
  };

  const getQuickChips = () => {
    if (activeRole === 'teacher') {
      return [
        { label: "📝 Lesson Plan", text: "Create a 60-minute IELTS Writing Task 2 lesson plan outline on technology impact." },
        { label: "🎯 Quiz Generator", text: "Generate 5 multiple-choice questions for Python Loops & Functions with explanations." },
        { label: "💡 Homework Hints", text: "Give me 3 Socratic hint questions to guide a student struggling with quadratic equations." }
      ];
    }

    if (activeRole === 'admin' || activeRole === 'superadmin') {
      return [
        { label: "📢 Telegram Post", text: "Draft an engaging Telegram channel post announcing a new IELTS 7.5+ Intensive Batch starting next Monday." },
        { label: "📊 Weekly Summary", text: "Write a professional weekly summary format for teacher attendance and student tuition payments." }
      ];
    }

    return [
      { label: "🇺🇿 Yechim usuli", text: "Bu misolni yechish metodini va asosiy qoidasini tushuntirib ber (javobini bermasdan)." },
      { label: "🇬🇧 IELTS Speaking", text: "Evaluate my speaking performance for Fluency, Vocabulary, and Grammar." },
      { label: "💻 Python Code Help", text: "Explain how list comprehensions work in Python with a clean example." },
      { label: "📐 Math Concept", text: "Explain the Pythagorean theorem step by step with a real-world example." }
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
        const updatedMsgs = [...messages, userMsg];
        setMessages(updatedMsgs);
        setIsLoading(true);

        try {
          const evalResult = await evaluateSpeakingAudio(base64Audio, 'audio/webm', speakingPart, userLang);
          const finalMsgs: ChatMessage[] = [...updatedMsgs, { role: 'model' as const, text: evalResult }];
          setMessages(finalMsgs);

          // Save to thread history if new
          if (activeThreadId === 'new') {
            const newThread: SavedThread = {
              id: 'thread-' + Date.now(),
              title: `IELTS Speaking Part ${speakingPart}`,
              date: 'Bugun',
              messages: finalMsgs
            };
            setSavedThreads((prev) => [newThread, ...prev]);
            setActiveThreadId(newThread.id);
          }
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

    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
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

      const finalMsgs: ChatMessage[] = [...updatedMsgs, { role: 'model', text: aiResponseText }];
      setMessages(finalMsgs);

      // Auto-save new session
      if (activeThreadId === 'new') {
        const title = userQuery.slice(0, 28) || 'Suhbat ' + new Date().toLocaleTimeString();
        const newThread: SavedThread = {
          id: 'thread-' + Date.now(),
          title,
          date: 'Bugun',
          messages: finalMsgs
        };
        setSavedThreads((prev) => [newThread, ...prev]);
        setActiveThreadId(newThread.id);
      } else {
        setSavedThreads((prev) =>
          prev.map((t) => (t.id === activeThreadId ? { ...t, messages: finalMsgs } : t))
        );
      }
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

    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setIsLoading(true);

    try {
      const result = await gradeIELTSEssay(essayText, taskType, essayPrompt, userLang);
      const finalMsgs: ChatMessage[] = [...updatedMsgs, { role: 'model', text: result }];
      setMessages(finalMsgs);

      if (activeThreadId === 'new') {
        const newThread: SavedThread = {
          id: 'thread-' + Date.now(),
          title: `IELTS Essay (${taskType.toUpperCase()})`,
          date: 'Bugun',
          messages: finalMsgs
        };
        setSavedThreads((prev) => [newThread, ...prev]);
        setActiveThreadId(newThread.id);
      }

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

  const filteredThreads = savedThreads.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="-m-4 sm:-m-6 md:-m-8 h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* LEFT CHAT HISTORY SIDEBAR (~260px) */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        
        {/* New Chat Button & Search */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Suhbat Boshlash</span>
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suhbatlarni qidirish..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Saved Conversations List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            O'tgan Suhbatlar
          </p>

          {filteredThreads.map((thread) => {
            const isActive = activeThreadId === thread.id;
            return (
              <div
                key={thread.id}
                onClick={() => handleSelectThread(thread)}
                className={`group w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <MessageSquare className="w-4 h-4 shrink-0 text-amber-500/80" />
                  <span className="truncate">{thread.title}</span>
                </div>

                <button
                  onClick={(e) => handleDeleteThread(e, thread.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
                  title="O'chirish"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer: Back to Dashboard & User Profile */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Dashboardga Qaytish</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
              {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">
                {userProfile?.displayName || 'Student User'}
              </p>
              <p className="text-[10px] text-amber-400 font-mono font-semibold">
                CenterFlow AI Prime
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN WORKSPACE AREA (RIGHT COLUMN) */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        
        {/* Sleek Top Header Bar */}
        <header className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-white tracking-tight">
                  CenterFlow Prime AI
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Gemini 2.5 / 3.6 Flash
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                24/7 Universal Multimodal Learning Engine & Socratic Coach
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Switchers */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'chat' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI Chat</span>
              </button>

              <button
                onClick={() => setActiveTab('speaking')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'speaking' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>IELTS Voice Coach</span>
              </button>

              <button
                onClick={() => setActiveTab('essay')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'essay' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Essay Grader</span>
              </button>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <Globe className="w-3.5 h-3.5 text-amber-400 ml-1" />
              {(['uz', 'en', 'ru'] as UserLanguage[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setUserLang(lang)}
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded transition cursor-pointer ${
                    userLang === lang ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Academic Guardrail Notice Banner */}
        <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong className="font-bold">Akademik Halollik Guardrail:</strong> CenterFlow AI uy vazifalarini to'g'ridan-to yechib bermaydi. U o'xshash misollar, Socratic savollar va qoidalarni o'rgatadi.
            </span>
          </div>
        </div>

        {/* TAB WORKSPACE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-4xl mx-auto w-full">
          
          {/* TAB 1: IELTS VOICE COACH WORKSPACE */}
          {activeTab === 'speaking' && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-amber-400" />
                    <span>IELTS Speaking Voice Evaluator Studio</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Nutqingizni yozib oling va Gemini AI orqali IELTS Band score & audio feedback oling.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
                  {[1, 2, 3].map((p) => (
                    <button
                      key={p}
                      onClick={() => setSpeakingPart(p as 1 | 2 | 3)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                        speakingPart === p ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Part {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
                {isRecording ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-20 h-20 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center animate-ping">
                      <Mic className="w-10 h-10" />
                    </div>
                    <span className="text-sm font-mono font-bold text-rose-400">
                      Nutq yozilmoqda... {recordingSeconds} soniya
                    </span>
                    <button
                      onClick={stopRecordingAndEvaluate}
                      className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-xl shadow-rose-600/30 transition cursor-pointer"
                    >
                      Yozishni To'xtatish & AI Tahlil Boshlash
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-3">
                    <button
                      onClick={startRecording}
                      disabled={isLoading}
                      className="w-20 h-20 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
                    >
                      <Mic className="w-10 h-10" />
                    </button>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">Mikrofonni Bosing va Gapiring</h4>
                      <p className="text-xs text-slate-400 mt-0.5">IELTS Speaking Part {speakingPart} bo'yicha javob bering.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ESSAY GRADERSHIP WORKSPACE */}
          {activeTab === 'essay' && (
            <form onSubmit={handleGradeEssaySubmit} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span>IELTS Writing Essay Assessor</span>
                </h3>

                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setTaskType('task1')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      taskType === 'task1' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Task 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskType('task2')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      taskType === 'task2' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Task 2
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Essay Topic / Question Prompt:
                </label>
                <input
                  type="text"
                  value={essayPrompt}
                  onChange={(e) => setEssayPrompt(e.target.value)}
                  placeholder="e.g., Some people believe that technology reduces human interaction..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300">
                    Essay Content:
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    Word count: {essayText.trim() ? essayText.trim().split(/\s+/).length : 0} words
                  </span>
                </div>
                <textarea
                  rows={8}
                  required
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                  placeholder="In today's rapidly changing global economy, education plays a vital role..."
                  className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !essayText.trim()}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-xl shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>IELTS Writing Band Score va Tahlil Olish</span>
              </button>
            </form>
          )}

          {/* TAB 3: GENERAL CHAT MESSAGES STREAM */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={idx}
                    className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-md mt-1">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`relative group max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-md'
                          : 'bg-slate-900 text-slate-100 border border-slate-800 rounded-tl-none'
                      }`}
                    >
                      {!isUser && (
                        <button
                          onClick={() => handleCopyText(msg.text, idx)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition"
                          title="Copy message"
                        >
                          {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      {msg.attachment && (
                        <div className="mb-2 p-2 rounded-xl bg-black/20 text-[10px] font-mono flex items-center gap-2 text-amber-300">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>Fayl Biriktirildi ({msg.attachment.inlineData.mimeType})</span>
                        </div>
                      )}

                      {isUser ? (
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      ) : (
                        <div className="prose prose-invert max-w-none text-xs space-y-2 [&>p]:mb-1 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>h1]:font-bold [&>h2]:font-bold [&>h3]:font-bold [&>strong]:font-bold [&>strong]:text-amber-400 [&>code]:bg-slate-950 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:font-mono">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-slate-800 text-white font-bold flex items-center justify-center shrink-0 text-xs mt-1">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-amber-400 font-bold animate-pulse p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini AI multimodal tahlil o'tkazmoqda va javob tayyorlamoqda...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* BOTTOM QUICK CHIPS & MULTIMODAL PROMPT INPUT */}
        {activeTab === 'chat' && (
          <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 space-y-3">
            
            {/* Quick Action Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-4xl mx-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0 flex items-center gap-1">
                <Sparkle className="w-3 h-3 text-amber-500" />
                Chips:
              </span>
              {getQuickChips().map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleChipClick(chip.text)}
                  className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-[11px] text-slate-300 hover:text-amber-400 transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChat} className="max-w-4xl mx-auto space-y-2">
              {attachedFile && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                  <div className="flex items-center gap-2 truncate">
                    <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate font-mono text-[11px]">{fileName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-slate-400 hover:text-rose-400 transition cursor-pointer"
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
                  className="p-3 rounded-2xl bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-700 transition cursor-pointer border border-slate-700 shrink-0"
                  title="Upload photo of textbook exercise or draft"
                >
                  <Paperclip className="w-4.5 h-4.5" />
                </button>

                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder={
                    userLang === 'uz'
                      ? "Savolingiz, darslik rasmi yoki Python kodi haqida so'rang..."
                      : userLang === 'ru'
                      ? "Задайте вопрос по предметам или фото..."
                      : "Ask a question, upload a study photo, or practice..."
                  }
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />

                <button
                  type="submit"
                  disabled={isLoading || (!inputPrompt.trim() && !attachedFile)}
                  className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold transition cursor-pointer shadow-lg shadow-amber-500/20 shrink-0 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Send className="w-4.5 h-4.5" />}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

    </div>
  );
};
