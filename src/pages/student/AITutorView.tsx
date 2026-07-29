import React, { useState, useRef, useEffect } from 'react';
import { FormattedAIResponse } from '../../components/AI/FormattedAIResponse';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  generateInsaneAIResponse,
  evaluateSpeakingAudio,
  gradeIELTSEssay,
  UserLanguage,
  ChatMessage,
  FileAttachment,
  GroundingChunk
} from '../../services/gemini';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Paperclip,
  X,
  Bot,
  User,
  Loader2,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Copy,
  Check,
  History,
  Sparkle,
  Globe,
  RotateCcw,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Maximize2
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
  const { activeRole } = useAuth();
  const { language } = useLanguage();

  const [userLang] = useState<UserLanguage>(language === 'EN' ? 'en' : 'uz');

  // Model & Web Search Settings
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.6-flash');
  const [enableWebSearch, setEnableWebSearch] = useState<boolean>(false);

  // Local Persistence for Chat Threads
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showGuardrail, setShowGuardrail] = useState(true);

  // Active Chat Messages State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text:
        userLang === 'uz'
          ? "Salom! Men Renessans Prime AI o'quv yordamchisiman. Darslik mashqlari, web qidiruv, IELTS Speaking va insholarini Socratic uslubda o'rganishda yordam beraman."
          : userLang === 'ru'
          ? "Здравствуйте! Я ИИ-помощник Renessans Prime. Чем могу помочь по предметам, IELTS или веб-поиску?"
          : "Hello! I am Renessans Prime AI Learning Coach. How can I assist you with your studies, web search, or IELTS practice today?"
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'speaking' | 'essay'>('chat');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Text-To-Speech (TTS) State
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState<number | null>(null);

  // File Attachment State with Live Preview
  const [attachedFile, setAttachedFile] = useState<FileAttachment | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [isZoomingPreview, setIsZoomingPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Input (Speech Recognition / Recorder) State
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  const speechRecognitionRef = useRef<any>(null);

  // Audio Recorder for Speaking Evaluation State
  const [isRecordingSpeaking, setIsRecordingSpeaking] = useState(false);
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

  // Clean Speech Synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // Handle Thread Selection
  const handleSelectThread = (thread: SavedThread) => {
    setActiveThreadId(thread.id);
    setMessages(thread.messages);
    setActiveTab('chat');
    setIsHistoryOpen(false);
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
    setFileDataUrl('');
    setFileSize('');
    setInputPrompt('');
    setActiveTab('chat');
    setIsHistoryOpen(false);
  };

  // Delete Thread
  const handleDeleteThread = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSavedThreads((prev) => prev.filter((t) => t.id !== id));
    if (activeThreadId === id) {
      handleNewChat();
    }
  };

  // Clear All History
  const handleClearAllHistory = () => {
    if (confirm("Barcha suhbatlar tarixini o'chirmoqchimisiz?")) {
      setSavedThreads([]);
      handleNewChat();
    }
  };

  // Export Chat to Markdown File
  const handleExportChat = () => {
    const thread = savedThreads.find((t) => t.id === activeThreadId);
    const title = thread ? thread.title : 'Renessans_AI_Chat';
    let mdContent = `# ${title}\nDate: ${new Date().toLocaleDateString()}\n\n---\n\n`;

    messages.forEach((m) => {
      mdContent += `### ${m.role === 'user' ? '👤 User' : '🤖 Renessans Prime AI'}\n${m.text}\n\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy Text
  const handleCopyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Text To Speech (TTS)
  const handleToggleSpeech = (text: string, idx: number) => {
    if (!('speechSynthesis' in window)) {
      alert("Sizning brauzeringiz matnni ovozli o'qish funksiyasini qo'llab-quvvatlamaydi.");
      return;
    }

    if (speakingMsgIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingMsgIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting for cleaner audio
    const cleanText = text.replace(/[*#`_~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = userLang === 'uz' ? 'uz-UZ' : 'en-US';
    utterance.rate = 1.0;

    utterance.onend = () => setSpeakingMsgIdx(null);
    utterance.onerror = () => setSpeakingMsgIdx(null);

    setSpeakingMsgIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  // Regenerate Response
  const handleRegenerate = async (msgIndex: number) => {
    if (isLoading) return;

    // Find previous user prompt
    let userPromptText = '';
    let userAttachment: FileAttachment | undefined = undefined;

    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userPromptText = messages[i].text;
        userAttachment = messages[i].attachment;
        break;
      }
    }

    if (!userPromptText) return;

    setIsLoading(true);
    const historySlice = messages.slice(0, msgIndex - 1);

    try {
      const response = await generateInsaneAIResponse({
        prompt: userPromptText,
        history: historySlice,
        fileAttachment: userAttachment,
        enableWebSearch,
        userLanguage: userLang,
        model: selectedModel,
        role: activeRole
      });

      const updatedMsgs = [...messages];
      updatedMsgs[msgIndex] = {
        role: 'model',
        text: response.text,
        groundingChunks: response.groundingChunks
      };
      setMessages(updatedMsgs);
    } catch (err: any) {
      console.error('Regenerate Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Voice Input (Speech-to-Text for prompt bar)
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Brauzeringiz nutqni matnga aylantirishni (Speech-to-Text) qo'llab-quvvatlamaydi. Chrome yoki Edge brauzeridan foydalaning.");
      return;
    }

    if (isVoiceInputActive) {
      speechRecognitionRef.current?.stop();
      setIsVoiceInputActive(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = userLang === 'uz' ? 'uz-UZ' : 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setInputPrompt(transcript);
    };

    recognition.onend = () => {
      setIsVoiceInputActive(false);
    };

    recognition.onerror = () => {
      setIsVoiceInputActive(false);
    };

    speechRecognitionRef.current = recognition;
    recognition.start();
    setIsVoiceInputActive(true);
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
      { label: "🌐 Live News Grounding", text: "What are the latest AI and technology education trends this month?" },
      { label: "🇺🇿 Yechim usuli", text: "Bu misolni yechish metodini va asosiy qoidasini tushuntirib ber (javobini bermasdan)." },
      { label: "🇬🇧 IELTS Speaking", text: "Evaluate my speaking performance for Fluency, Vocabulary, and Grammar." },
      { label: "💻 Python Code Help", text: "Explain how list comprehensions work in Python with a clean example." }
    ];
  };

  // Handle File Upload with Live Thumbnail
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      alert("Fayl hajmi 12MB dan oshmasligi kerak.");
      return;
    }

    const sizeFormatted = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    setFileName(file.name);
    setFileSize(sizeFormatted);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFileDataUrl(result);
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
    setFileDataUrl('');
    setFileSize('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Speaking Voice Studio
  const startRecordingSpeaking = async () => {
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
      setIsRecordingSpeaking(true);
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
    setIsRecordingSpeaking(false);

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
          const finalMsgs: ChatMessage[] = [...updatedMsgs, { role: 'model', text: evalResult }];
          setMessages(finalMsgs);

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

  // Send Main AI Chat
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputPrompt.trim() && !attachedFile) || isLoading) return;

    const userQuery = inputPrompt.trim() || (attachedFile ? "Please analyze this uploaded document / image." : "");
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
    setFileDataUrl('');
    setFileSize('');
    setIsLoading(true);

    try {
      const response = await generateInsaneAIResponse({
        prompt: userQuery,
        history: messages,
        fileAttachment: currentAttachment,
        enableWebSearch,
        userLanguage: userLang,
        model: selectedModel,
        role: activeRole
      });

      const finalMsgs: ChatMessage[] = [
        ...updatedMsgs,
        {
          role: 'model',
          text: response.text,
          groundingChunks: response.groundingChunks
        }
      ];
      setMessages(finalMsgs);

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

  // Essay Submission
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
    <div className="relative min-h-[calc(100vh-5rem)] flex flex-col bg-white/80 dark:bg-slate-900/50 backdrop-blur-md text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200/80 dark:border-slate-800/60 shadow-sm dark:shadow-xl overflow-hidden font-sans transition-colors duration-200">
      
      {/* INTEGRATED TOP CONTROL BAR */}
      <header className="px-4 md:px-6 py-3 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* History & New Chat Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
              isHistoryOpen
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="Suhbatlar tarixini ochish/yopish"
          >
            <History className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">History</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-[10px] text-amber-400 font-mono">
              {savedThreads.length}
            </span>
          </button>

          <button
            onClick={handleNewChat}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          {/* Export Chat Button */}
          <button
            onClick={handleExportChat}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition cursor-pointer border border-slate-700"
            title="Suhbatni Markdown shaklida yuklab olish"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Center Workspace Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Workspace</span>
          </button>

          <button
            onClick={() => setActiveTab('speaking')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'speaking'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>IELTS Voice</span>
          </button>

          <button
            onClick={() => setActiveTab('essay')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'essay'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Essay Grader</span>
          </button>
        </div>

        {/* Model Switcher & Web Search Indicator */}
        <div className="flex items-center gap-2">
          {/* Model Switcher Dropdown */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="gemini-3.6-flash">Gemini 3.6 Flash (Fast)</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Reasoning)</option>
          </select>
        </div>
      </header>

      {/* DISMISSIBLE GUARDRAIL NOTICE */}
      {showGuardrail && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong className="font-bold">Socratic Coach Guardrail:</strong> AI masalalarni to'g'ridan-to'g'ri yechib bermaydi. U akademik tushuncha va ko'rsatmalar beradi.
            </span>
          </div>
          <button
            onClick={() => setShowGuardrail(false)}
            className="p-1 text-amber-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* MAIN CONTAINER WITH OPTIONAL SLIDE-OVER HISTORY DRAWER */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* SLIDE-OVER HISTORY DRAWER */}
        {isHistoryOpen && (
          <aside className="absolute z-20 inset-y-0 left-0 w-72 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 p-4 flex flex-col shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                <span>O'tgan Suhbatlar</span>
              </h4>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suhbatni qidirish..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1">
              {filteredThreads.map((thread) => {
                const isActive = activeThreadId === thread.id;
                return (
                  <div
                    key={thread.id}
                    onClick={() => handleSelectThread(thread)}
                    className={`group flex items-center justify-between p-2.5 rounded-xl text-xs transition cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 text-amber-500/80" />
                      <span className="truncate">{thread.title}</span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteThread(e, thread.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {savedThreads.length > 0 && (
              <button
                onClick={handleClearAllHistory}
                className="mt-3 w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Barcha Tarixni Tozalash</span>
              </button>
            )}
          </aside>
        )}

        {/* WORKSPACE CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          {/* TAB 1: IELTS VOICE COACH WORKSPACE */}
          {activeTab === 'speaking' && (
            <div className="flex-1 p-6 overflow-y-auto max-w-3xl mx-auto w-full space-y-6 animate-fadeIn">
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-amber-400" />
                      <span>IELTS Speaking Voice Studio</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Audio nutqingizni yozib yuboring va Gemini AI orqali instant Band Score hamda batafsil tahlil oling.
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
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

                <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
                  {isRecordingSpeaking ? (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-20 h-20 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center animate-ping">
                        <Mic className="w-10 h-10" />
                      </div>
                      <span className="text-sm font-mono font-bold text-rose-400">
                        Nutq yozilmoqda... {recordingSeconds}s
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
                        onClick={startRecordingSpeaking}
                        disabled={isLoading}
                        className="w-20 h-20 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
                      >
                        <Mic className="w-10 h-10" />
                      </button>
                      <div>
                        <h4 className="text-sm font-extrabold text-white">Mikrofonni Bosing va Gapiring</h4>
                        <p className="text-xs text-slate-400 mt-0.5">IELTS Speaking Part {speakingPart} mavzusida nutq so'zlang.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ESSAY GRADERSHIP WORKSPACE */}
          {activeTab === 'essay' && (
            <div className="flex-1 p-6 overflow-y-auto max-w-3xl mx-auto w-full space-y-6 animate-fadeIn">
              <form onSubmit={handleGradeEssaySubmit} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-400" />
                    <span>IELTS Writing Essay Assessor</span>
                  </h3>

                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setTaskType('task1')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                        taskType === 'task1' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Task 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskType('task2')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
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
                      Words: {essayText.trim() ? essayText.trim().split(/\s+/).length : 0}
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
            </div>
          )}

          {/* TAB 3: GENERAL CHAT MESSAGES STREAM */}
          {activeTab === 'chat' && (
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 max-w-3xl mx-auto w-full">
              {/* Feature Banner Card */}
              <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm dark:shadow-xl">
                <img
                  src="https://i.ibb.co/fzkdYxCC/image.png"
                  alt="24/7 AI Tutor"
                  className="w-20 h-20 object-cover rounded-xl border border-amber-500/30 shadow-md shrink-0 opacity-90 dark:opacity-100"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">24/7 AI Personal Coach & Tutor</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
                      GEMINI POWERED
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                    IELTS Speaking practice, Essay grading, grammar drills va real-time akademik yordam oling.
                  </p>
                </div>
              </div>

              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                const isSpeaking = speakingMsgIdx === idx;

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
                          : 'bg-slate-900 text-slate-100 border border-slate-800 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {/* Attached File Display in Message */}
                      {msg.attachment && (
                        <div className="mb-2 p-2 rounded-xl bg-black/20 text-[10px] font-mono flex items-center gap-2 text-amber-300">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>Attached File ({msg.attachment.inlineData.mimeType})</span>
                        </div>
                      )}

                      {/* User message vs Model Markdown message */}
                      {isUser ? (
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      ) : (
                        <FormattedAIResponse content={msg.text} />
                      )}

                      {/* Google Search Grounding Citations Accordion */}
                      {!isUser && msg.groundingChunks && msg.groundingChunks.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-800/80">
                          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-400 mb-1.5">
                            <Globe className="w-3 h-3" />
                            <span>Web Search Grounding Sources ({msg.groundingChunks.length}):</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.groundingChunks.map((chunk, cIdx) => {
                              if (!chunk.web?.uri) return null;
                              return (
                                <a
                                  key={cIdx}
                                  href={chunk.web.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 hover:text-amber-300 transition flex items-center gap-1"
                                >
                                  <span className="truncate max-w-[140px]">{chunk.web.title || chunk.web.uri}</span>
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Interactive Action Bar on AI Responses */}
                      {!isUser && (
                        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center gap-2 opacity-80 group-hover:opacity-100 transition">
                          {/* Copy Button */}
                          <button
                            onClick={() => handleCopyText(msg.text, idx)}
                            className="p-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-1 text-[10px]"
                            title="Nusxalash"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">Nusxalandi</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {/* Text-To-Speech Button */}
                          <button
                            onClick={() => handleToggleSpeech(msg.text, idx)}
                            className={`p-1 rounded bg-slate-800/80 hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 text-[10px] ${
                              isSpeaking ? 'text-amber-400 font-bold animate-pulse' : 'text-slate-400 hover:text-white'
                            }`}
                            title="Ovozli o'qish (TTS)"
                          >
                            {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                            <span>{isSpeaking ? 'To\'xtatish' : 'Ovozli O\'qish'}</span>
                          </button>

                          {/* Regenerate Button */}
                          <button
                            onClick={() => handleRegenerate(idx)}
                            disabled={isLoading}
                            className="p-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition cursor-pointer flex items-center gap-1 text-[10px] disabled:opacity-50"
                            title="Qaytadan yaratish"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Qayta sorash</span>
                          </button>
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
                <div className="flex items-center gap-2 text-xs text-amber-400 font-bold animate-pulse p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Renessans Prime AI tahlil o'tkazmoqda...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* BOTTOM QUICK CHIPS & MULTIMODAL INPUT BAR */}
          {activeTab === 'chat' && (
            <div className="p-4 bg-slate-900/90 border-t border-slate-800/90 shrink-0 space-y-2.5">
              
              {/* Quick Action Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-3xl mx-auto">
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

              {/* INSTANT IMAGE/FILE THUMBNAIL PREVIEW CARD */}
              {attachedFile && (
                <div className="max-w-3xl mx-auto p-2.5 rounded-2xl bg-slate-950 border border-amber-500/40 flex items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-3 min-w-0">
                    {fileDataUrl ? (
                      <div className="relative group">
                        <img
                          src={fileDataUrl}
                          alt="Thumbnail preview"
                          className="w-12 h-12 object-cover rounded-xl border border-slate-800 group-hover:scale-105 transition cursor-pointer"
                          onClick={() => setIsZoomingPreview(!isZoomingPreview)}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition">
                          <Maximize2 className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{fileName}</p>
                      <p className="text-[10px] text-amber-400 font-mono mt-0.5">
                        {attachedFile.inlineData.mimeType} • {fileSize}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 transition cursor-pointer shrink-0"
                    title="Faylni olib tashlash"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* FULL ZOOM PREVIEW MODAL IF CLICKED */}
              {isZoomingPreview && fileDataUrl && (
                <div
                  className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                  onClick={() => setIsZoomingPreview(false)}
                >
                  <div className="relative max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-2">
                    <button
                      onClick={() => setIsZoomingPreview(false)}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950 text-white hover:bg-rose-500 transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <img src={fileDataUrl} alt="Zoomed preview" className="max-w-full max-h-[75vh] object-contain rounded-xl" />
                  </div>
                </div>
              )}

              {/* Input Form with Action Tools */}
              <form onSubmit={handleSendChat} className="max-w-3xl mx-auto space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf,text/*"
                    className="hidden"
                  />

                  {/* Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-3 rounded-2xl border transition cursor-pointer shrink-0 ${
                      attachedFile
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                        : 'bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-700 border-slate-700'
                    }`}
                    title="Darslik rasmi yoki fayl biriktirish"
                  >
                    <Paperclip className="w-4.5 h-4.5" />
                  </button>

                  {/* Web Search Grounding Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setEnableWebSearch(!enableWebSearch)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-1 shrink-0 ${
                      enableWebSearch
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 border-slate-700'
                    }`}
                    title="Google Search Grounding web qidiruvini yoqish/o'chirish"
                  >
                    <Globe className="w-4.5 h-4.5" />
                    <span className="hidden sm:inline text-xs font-mono">
                      {enableWebSearch ? 'Search ON' : 'Search'}
                    </span>
                  </button>

                  {/* Voice Input (Speech to Text) Button */}
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`p-3 rounded-2xl border transition cursor-pointer shrink-0 ${
                      isVoiceInputActive
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse'
                        : 'bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 border-slate-700'
                    }`}
                    title="Ovoz bilan kiritish (Speech-To-Text)"
                  >
                    {isVoiceInputActive ? <MicOff className="w-4.5 h-4.5 text-rose-400" /> : <Mic className="w-4.5 h-4.5" />}
                  </button>

                  {/* Main Input Text */}
                  <input
                    type="text"
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    placeholder={
                      isVoiceInputActive
                        ? "Eshitilmoqda, gapiring..."
                        : userLang === 'uz'
                        ? "Savolingiz, darslik rasmi yoki Python kodi haqida so'rang..."
                        : userLang === 'ru'
                        ? "Задайте вопрос по предметам или фото..."
                        : "Ask a question, upload a study photo, or search the web..."
                    }
                    className="flex-1 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />

                  {/* Submit Button */}
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

    </div>
  );
};
