import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FormattedAIResponse } from './FormattedAIResponse';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
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
  ChevronRight,
  Maximize2,
  Minimize2,
  Award,
  Code,
  GraduationCap,
  BookOpen,
  HelpCircle,
  Mail,
  Megaphone,
  Briefcase
} from 'lucide-react';

export interface SavedThread {
  id: string;
  title: string;
  date: string;
  messages: ChatMessage[];
}

export interface AIChatCoreProps {
  variant?: 'full' | 'floating';
  isOpen?: boolean;
  onClose?: () => void;
  initialMode?: 'chat' | 'speaking' | 'essay';
  onBackToDashboard?: () => void;
}

export const AIChatCore: React.FC<AIChatCoreProps> = ({
  variant = 'full',
  isOpen = true,
  onClose,
  initialMode = 'chat',
  onBackToDashboard
}) => {
  const { userProfile, activeRole } = useAuth();
  const { language, translate } = useLanguage();
  const { theme } = useTheme();

  // Dynamically map app language to Gemini UserLanguage
  const userLang: UserLanguage = language === 'EN' ? 'en' : language === 'RU' ? 'ru' : 'uz';

  // Model & Web Search Settings
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.6-flash');
  const [enableWebSearch, setEnableWebSearch] = useState<boolean>(false);

  // Dynamic Mode Selector per Role
  const [activeMode, setActiveMode] = useState<string>('general');

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

  // Initial Welcome Message according to selected language
  const getWelcomeMessage = () => {
    return translate(
      "Salom! Men CenterFlow Neural Copilot v2.5 AI yordamchisiman. Darslik mashqlari, IELTS Speaking, Python kodi va akademik resurslar bilan ishlashda tayyorman. Savolingizni bering!",
      "Hello! I am CenterFlow Neural Copilot v2.5 Flash. How can I assist you with your studies, IELTS practice, or teaching workflows today?",
      "Здравствуйте! Я CenterFlow Neural Copilot v2.5 ИИ-помощник. Чем могу помочь по предметам, IELTS или программированию?"
    );
  };

  // Active Chat Messages State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: getWelcomeMessage()
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'speaking' | 'essay'>(initialMode);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Text-To-Speech (TTS) State
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState<number | null>(null);

  // File Attachment State with Live Preview
  const [attachedFile, setAttachedFile] = useState<FileAttachment | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Input (Speech Recognition) State
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

  // Dynamic Multi-Role System Prompt Generator
  const buildSystemPrompt = () => {
    const name = userProfile?.fullName || (userProfile as any)?.name || (activeRole === 'teacher' ? 'Teacher' : activeRole === 'admin' ? 'Administrator' : 'Student');

    if (activeRole === 'teacher') {
      const dept = 'IELTS & Academic English';
      const assignedGroups = 'IELTS-Intensive-A1, General-English-B2';

      if (activeMode === 'lesson_plan') {
        return `You are Teacher Copilot & Curriculum Design Assistant for ${name} at Renessans Learning Center.
Department: ${dept} | Groups: ${assignedGroups}.
SPECIALIZED MODE: 📚 Lesson Plan Generator.
Output structured 60-minute or 90-minute lesson outlines including:
1. Warm-up Activity (10 mins)
2. Core Interactive Skill Building (35 mins)
3. Guided Worksheet/Exercise Practice (35 mins)
4. Wrap-up & Homework Assignment (10 mins)
Maintain an efficient, highly practical, academic tone. Format cleanly with clear headers and bullet points. Response language: ${userLang}.`;
      }

      if (activeMode === 'quiz_builder') {
        return `You are Teacher Copilot & Quiz Builder for ${name} at Renessans Learning Center.
SPECIALIZED MODE: 📝 Quiz & Homework Builder.
Generate comprehensive quizzes, multiple-choice questions, fill-in-the-blanks, or IELTS reading/listening passages. Always include complete Answer Keys with detailed explanations at the end. Response language: ${userLang}.`;
      }

      if (activeMode === 'parent_report') {
        return `You are Teacher Copilot for ${name} at Renessans Learning Center.
SPECIALIZED MODE: 💬 Parent Progress Report Writer.
Convert teacher shorthand notes into polite, constructive, encouraging, and professional student progress updates for parents via Telegram or Email. Response language: ${userLang}.`;
      }

      return `You are the Executive Academic Assistant & IELTS/CEFR Co-Pilot for teacher ${name} at Renessans Learning Center. Help draft lesson plans, worksheets, student feedback, and class announcements efficiently. Response language: ${userLang}.`;
    }

    if (activeRole === 'admin' || activeRole === 'superadmin') {
      const branch = 'Tashkent Main Branch';

      if (activeMode === 'announcements') {
        return `You are Executive Operations Copilot for administrator ${name} at Renessans Learning Center (${branch}).
SPECIALIZED MODE: 📢 Announcement & Broadcast Generator.
Draft engaging, clear, high-converting Telegram, SMS, or email announcements for student tuition fee reminders, upcoming IELTS test dates, center holidays, or new course batch launches. Use emojis effectively. Response language: ${userLang}.`;
      }

      if (activeMode === 'operations_advisory') {
        return `You are Executive Operations Copilot for administrator ${name} at Renessans Learning Center (${branch}).
SPECIALIZED MODE: 📊 Operations & Administration Advisory.
Provide practical operational advice, staff scheduling frameworks, debtor communication scripts, and administrative templates. Response language: ${userLang}.`;
      }

      return `You are Executive Operations Copilot for administrator ${name} at Renessans Learning Center (${branch}). Provide clear operational scripts, administrative copy, and center reports. Response language: ${userLang}.`;
    }

    // Default: Student Role
    const enrolledSubject = 'IELTS & General English';
    const targetGoal = 'Band 8.0 / 1500+ SAT';

    if (activeMode === 'essay_evaluator') {
      return `You are Specialized AI Mentor for student ${name}.
Enrolled Subject: ${enrolledSubject} | Target Goal: ${targetGoal}.
SPECIALIZED MODE: 📝 IELTS Essay Evaluator.
Analyze submitted essays strictly against official IELTS Band Descriptors:
1. Task Response / Task Achievement
2. Coherence & Cohesion
3. Lexical Resource
4. Grammatical Range & Accuracy
Provide itemized band scores in standard .0 or .5 steps (e.g. 6.5, 7.0, 7.5), followed by an overall estimated Band Score and specific C1/C2 vocabulary & grammar upgrade suggestions. Response language: ${userLang}.`;
    }

    if (activeMode === 'code_reviewer') {
      return `You are Cybersecurity & Python Code Reviewer for student ${name}.
SPECIALIZED MODE: 💻 Code Reviewer & Tech Tutor.
Analyze submitted code snippets for bugs, security vulnerabilities, efficiency bottlenecks, and style. Provide refactored clean code blocks with step-by-step explanations. Response language: ${userLang}.`;
    }

    if (activeMode === 'speaking_coach') {
      return `You are Interactive Speaking & Grammar Coach for student ${name}.
SPECIALIZED MODE: 🗣️ Speaking & Grammar Coach.
Conduct interactive micro-quizzes, suggest C1/C2 vocabulary upgrades, point out grammatical nuances, and ask IELTS Speaking practice questions. Response language: ${userLang}.`;
    }

    return `You are the Socratic Learning Coach & Tutor for student ${name} at Renessans Learning Center in Uzbekistan.
STRICT ACADEMIC INTEGRITY GUARDRAIL:
1. DO NOT give direct answers or solve complete homework assignments for the student.
2. ENFORCE SOCRATIC GUIDANCE: Ask helpful leading questions, explain underlying grammar rules and formulas step-by-step, and guide the student to arrive at the answer themselves.
Response language: ${userLang}.`;
  };

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
        text: translate(
          "Yangi suhbat boshlandi! Qaysi fan yoki mavzu bo'yicha ko'maklashay?",
          "New conversation started! How can I assist you?",
          "Новый чат начат! Чем могу помочь?"
        )
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
    toast.info(translate("Suhbat o'chirildi.", "Thread deleted.", "Чат удален."));
    if (activeThreadId === id) {
      handleNewChat();
    }
  };

  // Clear All History
  const handleClearAllHistory = () => {
    if (confirm(translate("Barcha suhbatlar tarixini o'chirmoqchimisiz?", "Are you sure you want to clear all chat history?", "Вы уверены, что хотите очистить всю историю чата?"))) {
      setSavedThreads([]);
      toast.success(translate("Barcha suhbatlar tarixi tozalandi.", "All history cleared.", "Вся история очищена."));
      handleNewChat();
    }
  };

  // Export Chat to Markdown File
  const handleExportChat = () => {
    const thread = savedThreads.find((t) => t.id === activeThreadId);
    const title = thread ? thread.title : 'CenterFlow_AI_Chat';
    let mdContent = `# ${title}\nDate: ${new Date().toLocaleDateString()}\n\n---\n\n`;

    messages.forEach((m) => {
      mdContent += `### ${m.role === 'user' ? '👤 User' : '🤖 CenterFlow Neural Copilot'}\n${m.text}\n\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(translate("Suhbat hujjati (.md) yuklab olindi.", "Chat exported as Markdown (.md).", "Чат скачан в формате Markdown (.md)."));
  };

  // Copy Text
  const handleCopyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success(translate("Nusxalandi!", "Copied to clipboard!", "Скопировано!"));
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Text To Speech (TTS)
  const handleToggleSpeech = (text: string, idx: number) => {
    if (!('speechSynthesis' in window)) {
      toast.error(translate(
        "Sizning brauzeringiz matnni ovozli o'qish funksiyasini qo'llab-quvvatlamaydi.",
        "Your browser does not support text-to-speech synthesis.",
        "Ваш браузер не поддерживает озвучивание текста."
      ));
      return;
    }

    if (speakingMsgIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingMsgIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Pick appropriate natural voice
    const voices = window.speechSynthesis.getVoices();
    const targetLangCode = language === 'EN' ? 'en' : language === 'RU' ? 'ru' : 'uz';
    const preferredVoice = voices.find(v => 
      v.lang.toLowerCase().startsWith(targetLangCode) && 
      (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Neural'))
    ) || voices.find(v => v.lang.toLowerCase().startsWith(targetLangCode));

    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.lang = language === 'EN' ? 'en-US' : language === 'RU' ? 'ru-RU' : 'uz-UZ';
    utterance.rate = 1.0;

    utterance.onend = () => setSpeakingMsgIdx(null);
    utterance.onerror = () => setSpeakingMsgIdx(null);

    setSpeakingMsgIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  // Regenerate Response
  const handleRegenerate = async (msgIndex: number) => {
    if (isLoading) return;

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
        role: activeRole,
        customSystemInstruction: buildSystemPrompt()
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
      toast.error(translate("Qayta so'rovda xatolik yuz berdi.", "Error regenerating response.", "Ошибка при повторном запросе."));
    } finally {
      setIsLoading(false);
    }
  };

  // Voice Input (Speech-to-Text for prompt bar)
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(translate(
        "Brauzeringiz nutqni matnga aylantirishni (Speech-to-Text) qo'llab-quvvatlamaydi. Chrome brauzeridan foydalaning.",
        "Speech recognition is not supported in your browser. Please use Chrome.",
        "Распознавание речи не поддерживается в вашем браузере. Используйте Chrome."
      ));
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
    recognition.lang = language === 'EN' ? 'en-US' : language === 'RU' ? 'ru-RU' : 'uz-UZ';

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

  // Dynamic Suggestion Chips based on Role & Active Mode (Multi-Language Supported)
  const getQuickChips = () => {
    if (activeRole === 'teacher') {
      if (activeMode === 'lesson_plan') {
        return [
          {
            label: translate("📝 IELTS Lesson Plan", "📝 IELTS Lesson Plan", "📝 План урока IELTS"),
            text: translate(
              "Technology impact bo'yicha 60 minutlik IELTS Writing Task 2 dars rejasini tuzib ber.",
              "Create a 60-minute IELTS Writing Task 2 lesson plan outline on technology impact.",
              "Составь 60-минутный план урока IELTS Writing Task 2 на тему влияния технологий."
            )
          },
          {
            label: translate("🐍 Python Lesson", "🐍 Python Lesson", "🐍 Урок Python"),
            text: translate(
              "Python Sikllar va Funksiyalar bo'yicha 90 minutlik dars rejasini 3 ta amaliy mashq bilan tuzib ber.",
              "Draft a 90-minute Python Loops & Functions lesson outline with 3 practice problems.",
              "Составь 90-минутный план урока по циклам и функциям Python с 3 практическими задачами."
            )
          }
        ];
      }
      if (activeMode === 'quiz_builder') {
        return [
          {
            label: translate("🎯 Grammar Quiz", "🎯 Grammar Quiz", "🎯 Тест по грамматике"),
            text: translate(
              "Advanced English Conditionals bo'yicha 5 ta ko'p variantli test va izohli javoblarini tuzib ber.",
              "Generate 5 multiple-choice questions for Advanced English Conditionals with explanations.",
              "Создай 5 вопросов с несколькими вариантами ответов по Advanced Conditionals с объяснениями."
            )
          },
          {
            label: translate("📖 IELTS Reading Passage", "📖 IELTS Reading Passage", "📖 Текст IELTS Reading"),
            text: translate(
              "200 so'zli ilmiy matn va 3 ta True/False/Not Given savoli va javoblar kalitini yaratib ber.",
              "Create a short 200-word academic passage with 3 True/False/Not Given questions and answer key.",
              "Создай академический текст на 200 слов с 3 вопросами True/False/Not Given и ключами."
            )
          }
        ];
      }
      if (activeMode === 'parent_report') {
        return [
          {
            label: translate("💬 Parent Progress Email", "💬 Parent Progress Email", "💬 Отчет для родителей"),
            text: translate(
              "O'quvchi lug'atdan 88% to'pladi, davomati 100%, tartibli. Ota-onaga professional Telegram xabar tayyorla.",
              "Convert shorthand: 'Student score 88% in vocabulary, attendance 100%, polite in class' into email for parent.",
              "Переведи заметку: 'Результат 88%, посещаемость 100%' в вежливое сообщение для родителей."
            )
          }
        ];
      }
      return [
        {
          label: translate("📝 Lesson Plan", "📝 Lesson Plan", "📝 План урока"),
          text: translate(
            "60 minutlik IELTS Writing Task 2 dars rejasini tuzib ber.",
            "Create a 60-minute IELTS Writing Task 2 lesson plan outline on technology impact.",
            "Составь 60-минутный план урока IELTS Writing Task 2."
          )
        },
        {
          label: translate("🎯 Quiz Generator", "🎯 Quiz Generator", "🎯 Генератор тестов"),
          text: translate(
            "Python Sikllar bo'yicha 5 ta savolli test tuzib ber.",
            "Generate 5 multiple-choice questions for Python Loops with explanations.",
            "Создай тест из 5 вопросов по циклам Python."
          )
        },
        {
          label: translate("💡 Socratic Hints", "💡 Socratic Hints", "💡 Сократовские подсказки"),
          text: translate(
            "Kvadrat tenglamani tushunmayotgan o'quvchiga 3 ta yo'naltiruvchi savol ber.",
            "Give me 3 Socratic hint questions to guide a student struggling with quadratic equations.",
            "Дай 3 наводящих вопроса для ученика, не понимающего квадратные уравнения."
          )
        }
      ];
    }

    if (activeRole === 'admin' || activeRole === 'superadmin') {
      if (activeMode === 'announcements') {
        return [
          {
            label: translate("📢 Telegram Batch Launch", "📢 Telegram Batch Launch", "📢 Анонс в Telegram"),
            text: translate(
              "Dushanba kuni boshlanadigan IELTS 7.5+ intensiv kursi uchun Telegram posti tayyorlab ber.",
              "Draft an engaging Telegram post announcing a new IELTS 7.5+ Intensive Batch starting next Monday.",
              "Подготовь пост для Telegram о старте нового интенсивного курса IELTS 7.5+ в следующий понедельник."
            )
          },
          {
            label: translate("💳 Tuition Reminder SMS", "💳 Tuition Reminder SMS", "💳 Напоминание об оплате"),
            text: translate(
              "Qarzdor o'quvchilar uchun muloyim va professional SMS eslatma matnini yozib ber.",
              "Write a polite SMS reminder for students with overdue tuition fees.",
              "Напиши вежливое СМС-напоминание студентам о задолженности по оплате."
            )
          }
        ];
      }
      return [
        {
          label: translate("📢 Telegram Post", "📢 Telegram Post", "📢 Пост в Telegram"),
          text: translate(
            "Yangi IELTS kursi haqida Telegram posti tayyorlab ber.",
            "Draft an engaging Telegram channel post announcing a new IELTS 7.5+ Intensive Batch.",
            "Напиши пост в Telegram о новом курсе IELTS 7.5+."
          )
        },
        {
          label: translate("📊 Weekly Summary", "📊 Weekly Summary", "📊 Еженедельный отчет"),
          text: translate(
            "Haftalik o'qituvchilar davomati va to'lovlar hisoboti shablonini tuzib ber.",
            "Write a professional weekly summary format for teacher attendance and student tuition payments.",
            "Составь шаблон еженедельного отчета по посещаемости преподавателей и оплате."
          )
        }
      ];
    }

    // Student Chips
    if (activeMode === 'essay_evaluator') {
      return [
        {
          label: translate("📝 Grade Essay Draft", "📝 Grade Essay Draft", "📝 Оценить эссе"),
          text: translate(
            "Mening IELTS Task 2 inshoimni rasmiy kriteriyalar bo'yicha tahlil qilib ber.",
            "Please evaluate my Task 2 essay on Technology vs Human Interaction against official Band descriptors.",
            "Оцени мое эссе Task 2 по официальным критериям IELTS."
          )
        },
        {
          label: translate("🎯 Band 8.0 Tips", "🎯 Band 8.0 Tips", "🎯 Советы для Band 8.0"),
          text: translate(
            "Coherence & Cohesion ballimni Band 8.0 ga chiqarish uchun 3 ta maslahat ber.",
            "How can I improve my Coherence & Cohesion score to Band 8.0?",
            "Как повысить балл Coherence & Cohesion до Band 8.0?"
          )
        }
      ];
    }

    if (activeMode === 'code_reviewer') {
      return [
        {
          label: translate("💻 Review Python Code", "💻 Review Python Code", "💻 Проверить код Python"),
          text: translate(
            "Python list comprehension qanday ishlashini tushuntir va ushbu kodni optimallashtir.",
            "Explain how list comprehensions work in Python and optimize this snippet.",
            "Объясни генераторы списков в Python и оптимизируй этот код."
          )
        },
        {
          label: translate("🛡️ Security Check", "🛡️ Security Check", "🛡️ Проверка безопасности"),
          text: translate(
            "Python API funksiyamda rate limit xatolari xavfsiz ushlanganligini tekshirib ber.",
            "Check if my Python API request function handles rate limit exceptions securely.",
            "Проверь, безопасно ли моя функция Python обрабатывает ошибки API."
          )
        }
      ];
    }

    if (activeMode === 'speaking_coach') {
      return [
        {
          label: translate("🗣️ Speaking Micro-Quiz", "🗣️ Speaking Micro-Quiz", "🗣️ Мини-тест по речи"),
          text: translate(
            "Menga 2 ta IELTS Speaking Part 2 savolini ber va javoblarim lug'at boyligini bahola.",
            "Ask me 2 IELTS Speaking Part 2 practice questions and grade my vocabulary.",
            "Задай мне 2 вопроса IELTS Speaking Part 2 и оцени мой словарный запас."
          )
        },
        {
          label: translate("✨ C2 Vocabulary", "✨ C2 Vocabulary", "✨ Слова уровня C2"),
          text: translate(
            "'important' va 'useful' so'zlari uchun 5 ta C1/C2 darajadagi akademik sinonim ber.",
            "Give me 5 C1/C2 advanced academic synonyms for 'important' and 'useful'.",
            "Дай 5 академических синонимов уровня C1/C2 для 'important' и 'useful'."
          )
        }
      ];
    }

    return [
      {
        label: translate("🌐 Live News Grounding", "🌐 Live News Grounding", "🌐 Новости ИИ и технологий"),
        text: translate(
          "Bu oyning eng so'nggi Sun'iy Intellekt va ta'lim texnologiyalari yangiliklari nimalardan iborat?",
          "What are the latest AI and technology education trends this month?",
          "Какие последние тренды в области ИИ и образовательных технологий в этом месяце?"
        )
      },
      {
        label: translate("🇺🇿 Yechim usuli", "💡 Socratic Guide", "💡 Наводящие вопросы"),
        text: translate(
          "Bu misolni yechish metodini va asosiy qoidasini tushuntirib ber (javobini bermasdan).",
          "Explain the problem-solving method and formula step-by-step without giving away the final answer.",
          "Объясни метод решения и правило шаг за шагом, не давая готовый ответ."
        )
      },
      {
        label: translate("🇬🇧 IELTS Speaking", "🇬🇧 IELTS Speaking", "🇬🇧 IELTS Speaking"),
        text: translate(
          "IELTS Speaking bo'yicha ravonlik, lug'at va gramatika tahlilini o'tkazib ber.",
          "Evaluate my speaking performance for Fluency, Vocabulary, and Grammar.",
          "Оцени мою устную речь по беглости, словарному запасу и грамматике."
        )
      },
      {
        label: translate("💻 Python Code Help", "💻 Python Code Help", "💻 Помощь по Python"),
        text: translate(
          "Python da list comprehension qanday ishlashini aniq misol bilan tushuntir.",
          "Explain how list comprehensions work in Python with a clean example.",
          "Объясни, как работают генераторы списков в Python на понятном примере."
        )
      }
    ];
  };

  // Handle File Upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      toast.error(translate("Fayl hajmi 12MB dan oshmasligi kerak.", "File size must not exceed 12MB.", "Размер файла не должен превышать 12 МБ."));
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
      toast.info(translate("Fayl biriktirildi!", "File attached!", "Файл прикреплен!"));
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

  // Speaking Voice Studio Audio Recording
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
      toast.error(translate("Microphone ga ruxsat berilmadi yoki qurilmada mikrofon topilmadi.", "Microphone permission denied or device not found.", "Разрешение для микрофона не получено или микрофон не найден."));
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
              date: translate('Bugun', 'Today', 'Сегодня'),
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

    const userQuery = inputPrompt.trim() || (attachedFile ? translate("Iltimos, ushbu yuklangan hujjat / rasmni tahlil qiling.", "Please analyze this uploaded document / image.", "Пожалуйста, проанализируйте этот загруженный документ / изображение.") : "");
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
        role: activeRole,
        customSystemInstruction: buildSystemPrompt()
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
        const title = userQuery.slice(0, 28) || translate('Suhbat ', 'Chat ', 'Чат ') + new Date().toLocaleTimeString();
        const newThread: SavedThread = {
          id: 'thread-' + Date.now(),
          title,
          date: translate('Bugun', 'Today', 'Сегодня'),
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
          date: translate('Bugun', 'Today', 'Сегодня'),
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

  const containerClasses =
    variant === 'floating'
      ? 'fixed bottom-6 right-6 z-50 w-full max-w-lg max-h-[85vh] h-[650px] flex flex-col bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 shadow-2xl rounded-3xl overflow-hidden font-sans text-slate-100 animate-fadeIn'
      : `relative min-h-[calc(100vh-5rem)] flex flex-col backdrop-blur-xl rounded-3xl border shadow-2xl overflow-hidden font-sans transition-all duration-300 ${
          theme === 'light'
            ? 'bg-white/80 border-slate-200/90 shadow-xl text-slate-900'
            : 'bg-slate-900/60 border-slate-800/80 shadow-2xl text-slate-100'
        }`;

  return (
    <div className={containerClasses}>
      {/* AMBIENT RADIAL GLOW EFFECT BEHIND HEADER */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-indigo-500/10 blur-3xl pointer-events-none rounded-full" />

      {/* HEADER TOOLBAR */}
      <header className="px-4 md:px-5 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 relative z-10 backdrop-blur-md">
        {/* Left Side: Status & Neural Bot Identity */}
        <div className="flex items-center gap-2.5">
          {variant === 'full' && onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Dashboard-ga qaytish"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col">
              <h2 className="text-xs font-black tracking-wide text-slate-100 flex items-center gap-1.5">
                <span>CenterFlow Neural Copilot</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                  v2.5 Flash
                </span>
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                {translate("Real-vaqt Socratic AI", "Real-time Socratic AI", "ИИ-наставник Сократа")}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Main View Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80 shadow-inner">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'chat'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('speaking')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'speaking'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice</span>
          </button>

          <button
            onClick={() => setActiveTab('essay')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'essay'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Essay</span>
          </button>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-1.5">
          {/* Model Switcher Dropdown */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-2 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-amber-400 focus:outline-none cursor-pointer"
          >
            <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
          </select>

          {/* History Drawer Toggle */}
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className={`p-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
              isHistoryOpen
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
            title={translate("Suhbatlar tarixi", "Chat history", "История чата")}
          >
            <History className="w-4 h-4 text-amber-500" />
          </button>

          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition cursor-pointer flex items-center gap-1 shadow-md shadow-amber-500/20"
            title={translate("Yangi suhbat", "New chat", "Новый чат")}
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Export Chat Button */}
          <button
            onClick={handleExportChat}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition cursor-pointer border border-slate-700"
            title={translate("Yuklab olish", "Download chat", "Скачать чат")}
          >
            <Download className="w-4 h-4" />
          </button>

          {variant === 'floating' && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer border border-slate-700"
              title={translate("Yopish", "Close", "Закрыть")}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* SPECIALIZED ROLE MODE SELECTION PILLS TOOLBAR */}
      <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto relative z-10 shrink-0">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Mode:
        </span>

        {/* General Mode Pill */}
        <button
          onClick={() => setActiveMode('general')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
            activeMode === 'general'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md scale-105'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
          }`}
        >
          🎓 {translate("General Mentor", "General Mentor", "Общий наставник")}
        </button>

        {/* Student Specific Mode Pills */}
        {activeRole === 'student' && (
          <>
            <button
              onClick={() => setActiveMode('essay_evaluator')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                activeMode === 'essay_evaluator'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md scale-105'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
              }`}
            >
              📝 {translate("IELTS Essay Evaluator", "IELTS Essay Evaluator", "Оценка эссе IELTS")}
            </button>
            <button
              onClick={() => setActiveMode('code_reviewer')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                activeMode === 'code_reviewer'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md scale-105'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
              }`}
            >
              💻 {translate("Code Reviewer", "Code Reviewer", "Проверка кода")}
            </button>
            <button
              onClick={() => setActiveMode('speaking_coach')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                activeMode === 'speaking_coach'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md scale-105'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
              }`}
            >
              🗣️ {translate("Speaking Coach", "Speaking Coach", "Тренер по речи")}
            </button>
          </>
        )}

        {/* Teacher Specific Mode Pills */}
        {activeRole === 'teacher' && (
          <>
            <button
              onClick={() => setActiveMode('lesson_plan')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                activeMode === 'lesson_plan'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md scale-105'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
              }`}
            >
              📚 {translate("Lesson Plan", "Lesson Plan", "План урока")}
            </button>
            <button
              onClick={() => setActiveMode('quiz_builder')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                activeMode === 'quiz_builder'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md scale-105'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
              }`}
            >
              📝 {translate("Quiz Builder", "Quiz Builder", "Конструктор тестов")}
            </button>
            <button
              onClick={() => setActiveMode('parent_report')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                activeMode === 'parent_report'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md scale-105'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
              }`}
            >
              💬 {translate("Parent Report", "Parent Report", "Отчет родителям")}
            </button>
          </>
        )}

        {/* Admin Specific Mode Pills */}
        {(activeRole === 'admin' || activeRole === 'superadmin') && (
          <>
            <button
              onClick={() => setActiveMode('announcements')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                activeMode === 'announcements'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md scale-105'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
              }`}
            >
              📢 {translate("Announcements", "Announcements", "Объявления")}
            </button>
            <button
              onClick={() => setActiveMode('operations_advisory')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                activeMode === 'operations_advisory'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md scale-105'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
              }`}
            >
              📊 {translate("Operations", "Operations", "Операции")}
            </button>
          </>
        )}
      </div>

      {/* DISMISSIBLE SOCRATIC GUARDRAIL NOTICE */}
      {showGuardrail && (
        <div className="px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-[11px] text-amber-300 flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong className="font-bold">{translate("Socratic Guardrail:", "Socratic Guardrail:", "Правило Сократа:")}</strong>{' '}
              {translate(
                "AI yo'naltiruvchi savollar va tushunchalar beradi.",
                "AI guides with hints step-by-step.",
                "ИИ наставляет наводящими вопросами."
              )}
            </span>
          </div>
          <button
            onClick={() => setShowGuardrail(false)}
            className="p-0.5 text-amber-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* MAIN CONTAINER WITH SLIDE-OVER HISTORY DRAWER */}
      <div className="flex-1 flex min-h-0 relative z-10">
        {/* SLIDE-OVER HISTORY DRAWER */}
        {isHistoryOpen && (
          <aside className="absolute z-30 inset-y-0 left-0 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 p-4 flex flex-col shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                <span>{translate("O'tgan Suhbatlar", "Chat History", "История чата")}</span>
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
                placeholder={translate("Suhbatni qidirish...", "Search history...", "Поиск истории...")}
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
                <span>{translate("Barcha Tarixni Tozalash", "Clear All History", "Очистить всю историю")}</span>
              </button>
            )}
          </aside>
        )}

        {/* WORKSPACE CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* TAB 1: IELTS VOICE COACH WORKSPACE */}
          {activeTab === 'speaking' && (
            <div className="flex-1 p-5 overflow-y-auto max-w-2xl mx-auto w-full space-y-5 animate-fadeIn">
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-amber-400" />
                      <span>IELTS Speaking Voice Studio</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {translate(
                        "Audio nutqingizni yozib yuboring va Instant Band Score hamda tahlil oling.",
                        "Record your voice for instant IELTS Band Score & analysis.",
                        "Запишите свою речь для мгновенной оценки IELTS Band Score."
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {[1, 2, 3].map((p) => (
                      <button
                        key={p}
                        onClick={() => setSpeakingPart(p as 1 | 2 | 3)}
                        className={`px-2.5 py-0.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                          speakingPart === p ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Part {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
                  {isRecordingSpeaking ? (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center animate-ping">
                        <Mic className="w-8 h-8" />
                      </div>
                      <span className="text-xs font-mono font-bold text-rose-400">
                        {translate("Nutq yozilmoqda...", "Recording audio...", "Запись речи...")} {recordingSeconds}s
                      </span>
                      <button
                        onClick={stopRecordingAndEvaluate}
                        className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-xl shadow-rose-600/30 transition cursor-pointer"
                      >
                        {translate("To'xtatish & AI Tahlil", "Stop & Analyze AI", "Остановить и оценить")}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-3">
                      <button
                        onClick={startRecordingSpeaking}
                        disabled={isLoading}
                        className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-500/20 transition cursor-pointer disabled:opacity-50 active:scale-95"
                      >
                        <Mic className="w-8 h-8" />
                      </button>
                      <div>
                        <h4 className="text-xs font-extrabold text-white">
                          {translate("Mikrofonni Bosing va Gapiring", "Tap Mic & Speak", "Нажмите микрофон и говорите")}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">IELTS Speaking Part {speakingPart}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ESSAY GRADERSHIP WORKSPACE */}
          {activeTab === 'essay' && (
            <div className="flex-1 p-5 overflow-y-auto max-w-2xl mx-auto w-full space-y-4 animate-fadeIn">
              <form onSubmit={handleGradeEssaySubmit} className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>IELTS Essay Auto-Grader</span>
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

                <input
                  type="text"
                  value={essayPrompt}
                  onChange={(e) => setEssayPrompt(e.target.value)}
                  placeholder={translate("Essay mavzusi (Mavzuni shu yerga kiriting)...", "Essay topic prompt...", "Тема эссе...")}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />

                <textarea
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                  rows={8}
                  placeholder={translate("Insho matnini shu yerga yozing yoki joylang...", "Paste or write your essay here...", "Вставьте или напишите текст эссе здесь...")}
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-mono text-slate-400">
                    {essayText.trim().split(/\s+/).filter(Boolean).length} {translate("so'z", "words", "слов")}
                  </span>

                  <button
                    type="submit"
                    disabled={!essayText.trim() || isLoading}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-extrabold transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{translate("AI Baho Olish", "Grade Essay", "Оценить эссе")}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: MAIN CHAT MESSAGES STREAM WORKSPACE */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* MESSAGES LIST */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 ${
                      msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                        msg.role === 'user'
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-gradient-to-br from-amber-500 to-indigo-600 text-slate-950 font-extrabold'
                      }`}
                    >
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Message Content Bubble */}
                    <div
                      className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-4 text-xs leading-relaxed space-y-2 shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                          : 'bg-slate-950/90 border border-slate-800 text-slate-100 rounded-tl-none backdrop-blur-md'
                      }`}
                    >
                      {/* Optional Attachment Preview */}
                      {msg.attachment && (
                        <div className="p-2 rounded-xl bg-black/20 border border-white/10 flex items-center gap-2 mb-2">
                          <ImageIcon className="w-4 h-4 text-amber-400" />
                          <span className="text-[11px] font-mono truncate">{translate("Biriktirilgan fayl/rasm", "Attached file/image", "Прикрепленный файл/изображение")}</span>
                        </div>
                      )}

                      {/* Text / Markdown Render */}
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap font-sans">{msg.text}</p>
                      ) : (
                        <FormattedAIResponse content={msg.text} />
                      )}

                      {/* Grounding Web Search Citations */}
                      {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {translate("Manbalar & Havolalar:", "Grounding Sources:", "Источники:")}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.groundingChunks.map((chunk, cIdx) =>
                              chunk.web ? (
                                <a
                                  key={cIdx}
                                  href={chunk.web.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                                >
                                  <span>{chunk.web.title || 'Source'}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : null
                            )}
                          </div>
                        </div>
                      )}

                      {/* AI Response Action Buttons: Copy, TTS, Regenerate */}
                      {msg.role === 'model' && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                          <button
                            onClick={() => handleCopyText(msg.text, idx)}
                            className="hover:text-amber-400 transition cursor-pointer flex items-center gap-1"
                          >
                            {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedIndex === idx ? translate("Nusxalandi", "Copied", "Скопировано") : translate("Nusxalash", "Copy", "Копировать")}</span>
                          </button>

                          <button
                            onClick={() => handleToggleSpeech(msg.text, idx)}
                            className={`hover:text-amber-400 transition cursor-pointer flex items-center gap-1 ${
                              speakingMsgIdx === idx ? 'text-amber-400 font-bold' : ''
                            }`}
                          >
                            {speakingMsgIdx === idx ? <VolumeX className="w-3 h-3 animate-pulse text-amber-400" /> : <Volume2 className="w-3 h-3" />}
                            <span>{speakingMsgIdx === idx ? translate("To'xtatish", "Stop", "Стоп") : translate("Ovozli o'qish", "Read Aloud", "Озвучить")}</span>
                          </button>

                          <button
                            onClick={() => handleRegenerate(idx)}
                            className="hover:text-amber-400 transition cursor-pointer flex items-center gap-1 ml-auto"
                            title={translate("Qayta so'rash", "Regenerate response", "Перегенерировать")}
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center animate-spin">
                      <Loader2 className="w-4 h-4" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-amber-400 font-mono flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 animate-bounce text-amber-400" />
                      <span>{translate("AI fikrlamoqda va shakllantirmoqda...", "AI is reasoning and crafting...", "ИИ размышляет и формирует ответ...")}</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* QUICK SUGGESTION CHIPS */}
              <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto shrink-0">
                {getQuickChips().map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipClick(chip.text)}
                    className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 hover:text-amber-400 transition shrink-0 cursor-pointer shadow-sm"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* PROMPT INPUT & CONTROL BAR */}
              <form onSubmit={handleSendChat} className="p-3 bg-slate-900/90 border-t border-slate-800 shrink-0 space-y-2">
                {/* Live Attached File Banner */}
                {attachedFile && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-amber-500/30 text-xs text-amber-400">
                    <div className="flex items-center gap-2 truncate">
                      <ImageIcon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{fileName} ({fileSize})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {/* File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 transition cursor-pointer"
                    title={translate("Hujjat/Rasm biriktirish", "Attach document/image", "Прикрепить документ/изображение")}
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Voice STT Input Button */}
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`p-2.5 rounded-2xl border transition cursor-pointer ${
                      isVoiceInputActive
                        ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border-slate-800'
                    }`}
                    title={translate("Ovozli kiritish (Speech-to-Text)", "Voice input (Speech-to-Text)", "Голосовой ввод")}
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  {/* Web Search Grounding Toggle */}
                  <button
                    type="button"
                    onClick={() => setEnableWebSearch(!enableWebSearch)}
                    className={`p-2.5 rounded-2xl border transition cursor-pointer ${
                      enableWebSearch
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 font-bold'
                        : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                    }`}
                    title={translate("Internetdan jonli qidiruv", "Live Web Search Grounding", "Поиск в Интернете")}
                  >
                    <Globe className="w-4 h-4" />
                  </button>

                  {/* Main Input Field */}
                  <input
                    type="text"
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    placeholder={translate("Savol yoki so'rovingizni yozing...", "Ask your question or topic...", "Задайте ваш вопрос...")}
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={(!inputPrompt.trim() && !attachedFile) || isLoading}
                    className="p-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black shadow-lg shadow-amber-500/20 transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
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
