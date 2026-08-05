import { useState, useCallback, useEffect } from 'react';
import { ChatMessage, FileAttachment, generateInsaneAIResponse, UserLanguage } from '../services/gemini';

export interface SavedThread {
  id: string;
  title: string;
  date: string;
  messages: ChatMessage[];
  mode: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: 'model',
    text: `### 👋 Welcome to CenterFlow Neural Copilot v2.5

I am your official AI Academic Co-Pilot & IELTS Band 8.5+ Mentor.

**How can I assist your learning center operations today?**
- ✍️ **IELTS Writing Grading**: Paste an essay for instant 4-criteria Band analysis.
- 🎙️ **Speaking Evaluation**: Transcribe or analyze speaking test recordings.
- 📚 **Lesson Plan Generator**: Produce structured 60-minute CEFR B2/C1 lesson blueprints.
- 📊 **Student Analytics**: Interrogate class performance and score distributions.`,
  },
];

const INITIAL_THREADS: SavedThread[] = [
  {
    id: 'thread-1',
    title: 'IELTS Band 8.5 Task 2 Feedback',
    date: 'Today, 09:15 AM',
    mode: 'general',
    messages: INITIAL_MESSAGES,
  },
  {
    id: 'thread-2',
    title: 'CEFR C1 Listening Mock Analysis',
    date: 'Yesterday, 04:30 PM',
    mode: 'general',
    messages: [
      {
        role: 'user',
        text: 'Analyze student error patterns in Section 3 multiple choice questions.',
      },
      {
        role: 'model',
        text: '### Section 3 Analysis Summary\nStudents exhibited a 35% higher error rate on distractors containing synonym flips. Recommendation: Focus next session on paraphrase identification.',
      },
    ],
  },
  {
    id: 'thread-3',
    title: 'Financial Revenue Forecast Q3',
    date: '3 days ago',
    mode: 'admin',
    messages: [
      {
        role: 'user',
        text: 'What is the projected revenue growth for IELTS Master cohorts?',
      },
      {
        role: 'model',
        text: 'Based on current enrollment velocity (+18% MoM), projected Q3 revenue for IELTS Master cohorts stands at **$42,800 USD**.',
      },
    ],
  },
];

export function useAiMessages(language: UserLanguage = 'en', userRole: string = 'student') {
  const [threads, setThreads] = useState<SavedThread[]>(() => {
    const saved = localStorage.getItem('centerflow_ai_threads');
    return saved ? JSON.parse(saved) : INITIAL_THREADS;
  });

  const [activeThreadId, setActiveThreadId] = useState<string>(INITIAL_THREADS[0].id);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync threads to localStorage
  useEffect(() => {
    localStorage.setItem('centerflow_ai_threads', JSON.stringify(threads));
  }, [threads]);

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];
  const messages = activeThread ? activeThread.messages : INITIAL_MESSAGES;

  const sendMessage = useCallback(
    async (
      text: string,
      options?: {
        attachment?: FileAttachment;
        enableGrounding?: boolean;
        activeMode?: string;
      }
    ) => {
      if (!text.trim() && !options?.attachment) return;

      const userMsg: ChatMessage = {
        role: 'user',
        text,
        attachment: options?.attachment,
      };

      setError(null);
      setIsLoading(true);

      // Append user message immediately
      setThreads((prevThreads) =>
        prevThreads.map((thread) => {
          if (thread.id === activeThreadId) {
            const updated = [...thread.messages, userMsg];
            return {
              ...thread,
              title: thread.messages.length <= 1 ? text.slice(0, 32) + '...' : thread.title,
              messages: updated,
            };
          }
          return thread;
        })
      );

      try {
        const historyForApi = messages.map((m) => ({
          role: m.role,
          text: m.text,
        }));

        const result = await generateInsaneAIResponse({
          prompt: text,
          history: historyForApi,
          userLanguage: language as any,
          fileAttachment: options?.attachment || null,
          enableWebSearch: options?.enableGrounding ?? false,
          role: userRole as any,
          model: options?.activeMode || 'gemini-2.5-flash',
        });

        const botMsg: ChatMessage = {
          role: 'model',
          text: result.text,
          groundingChunks: result.groundingChunks,
        };

        setThreads((prevThreads) =>
          prevThreads.map((thread) => {
            if (thread.id === activeThreadId) {
              return {
                ...thread,
                messages: [...thread.messages, botMsg],
              };
            }
            return thread;
          })
        );
      } catch (err: any) {
        console.error('AI Response Generation Error:', err);
        setError('Failed to fetch AI response. Please check your connection or retry.');
        const fallbackMsg: ChatMessage = {
          role: 'model',
          text: `⚠️ **Neural Copilot Alert**: I encountered a temporary network glitch while generating your response.\n\n*Suggestion*: Try rephrasing your prompt or click Retry below.`,
        };
        setThreads((prev) =>
          prev.map((t) => (t.id === activeThreadId ? { ...t, messages: [...t.messages, fallbackMsg] } : t))
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeThreadId, messages, language, userRole]
  );

  const createNewThread = useCallback((mode: string = 'general') => {
    const newId = `thread-${Date.now()}`;
    const newThread: SavedThread = {
      id: newId,
      title: 'New Conversation',
      date: 'Just now',
      mode,
      messages: INITIAL_MESSAGES,
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newId);
  }, []);

  const deleteThread = useCallback((id: string) => {
    setThreads((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (filtered.length === 0) {
        const resetThread: SavedThread = {
          id: `thread-${Date.now()}`,
          title: 'New Conversation',
          date: 'Just now',
          mode: 'general',
          messages: INITIAL_MESSAGES,
        };
        return [resetThread];
      }
      return filtered;
    });
  }, []);

  const clearMessages = useCallback(() => {
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThreadId ? { ...t, messages: INITIAL_MESSAGES } : t))
    );
  }, [activeThreadId]);

  return {
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
  };
}
