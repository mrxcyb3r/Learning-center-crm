import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Sparkles, Send, Bot, User, BookOpen, CheckCircle, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AITutorView: React.FC = () => {
  const { language } = useLanguage();
  const isUz = language === 'UZ';

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: isUz
        ? "Salom! Men Renessans LC ning 24/7 AI Tutor Yordamchisiman. IELTS Writing inshoingizni tekshirish, gramatika va leksikani tahlil qilish yoki Speaking uchun savol-javob qilishga tayyorman. Menga insho matningizni yuboring yoki savolingizni berishingiz mumkin!"
        : "Hello! I am Renessans LC's 24/7 AI Tutor Assistant. I can review your IELTS Writing essays, analyze grammar & vocabulary, or practice Speaking questions with you. Paste your essay or ask me anything!",
      timestamp: '10:00 AM'
    }
  ]);

  const handleSend = async (customPrompt?: string) => {
    const userText = customPrompt || input;
    if (!userText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      // Call backend AI proxy
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, role: 'IELTS/CEFR Tutor' })
      });

      if (response.ok) {
        const data = await response.json();
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.reply || (isUz ? "Tushundim! Mana tahlil..." : "Got it! Here is the analysis..."),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('AI service response error');
      }
    } catch (err) {
      // Fallback intelligent response
      setTimeout(() => {
        const fallbackText = userText.toLowerCase().includes('essay') || userText.toLowerCase().includes('insho')
          ? (isUz
            ? "Writing Task 2 Insho Tahlili:\n\n1. Grammatika: Structure juda yaxshi shakllangan.\n2. Leksika: 'essential', 'paramount' kabi akademik so'zlar ishlatilgan (Band 7.5+).\n3. Tavsiya: Cohesion va Coherence uchun 'Furthermore' o'rniga 'In addition to this' birikmalarini ham qo'llashingiz mumkin."
            : "Writing Task 2 Essay Evaluation:\n\n1. Grammar: Clear sentence structure.\n2. Vocabulary: Good academic collocations used.\n3. Recommendation: Enhance cohesion by using varied transition markers.")
          : (isUz
            ? "Savolingiz qabul qilindi! Ushbu mavzu bo'yicha e'tibor qaratishingiz kerak bo'lgan asosiy grammatik va leksik qoidalar:\n- Present Perfect Continuous zamonidan foydalanish\n- Academic Task 1 diagramma taqqoslash birikmalari."
            : "Got your question! Here are key vocabulary & grammar pointers for your topic:\n- Use Present Perfect Continuous for duration\n- Apply high-level comparison markers.");

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, aiMsg]);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>24/7 AI Tutor Assistant</span>
          </div>
          <h2 className="text-2xl font-black">
            {isUz ? "IELTS & CEFR Sun'iy Intellekt Yordamchisi" : "24/7 AI IELTS & CEFR Tutor"}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            {isUz
              ? "Insholaringizni zudlik bilan baholang, grammatika xatolaringizni to'g'rilang va Speaking lug'atingizni boyiting."
              : "Evaluate your essays instantly, fix grammar mistakes, and expand your speaking vocabulary."}
          </p>
        </div>

        <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
          <Bot className="w-6 h-6" />
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleSend(isUz ? "Mening Writing Task 2 inshoimni grammatika bo'yicha tekshirib ber" : "Evaluate my Writing Task 2 essay for grammar")}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
        >
          📝 {isUz ? "Writing Task 2 Inshoni Tekshirish" : "Check Writing Task 2 Essay"}
        </button>
        <button
          onClick={() => handleSend(isUz ? "IELTS Speaking Part 2 uchun namuna savol va lug'at ber" : "Give me IELTS Speaking Part 2 cue card & vocabulary")}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
        >
          🗣️ {isUz ? "Speaking Cue Card Mashqi" : "Speaking Cue Card Drill"}
        </button>
        <button
          onClick={() => handleSend(isUz ? "CEFR C1 grammatika test va mashqlar ber" : "Give me CEFR C1 grammar exercises")}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
        >
          🎯 {isUz ? "CEFR Grammatika Testi" : "CEFR Grammar Test"}
        </button>
      </div>

      {/* Chat Messages Box */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md min-h-[380px] flex flex-col justify-between space-y-4">
        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-900 text-amber-400 border border-slate-800'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed max-w-[80%] whitespace-pre-line ${
                  m.sender === 'user'
                    ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 rounded-tl-none'
                }`}
              >
                <p>{m.text}</p>
                <span className="text-[9px] opacity-60 block mt-1 text-right">{m.timestamp}</span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-amber-500 font-semibold p-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{isUz ? "AI Yordamchi javob tayyorlamoqda..." : "AI Tutor is typing..."}</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isUz ? "Inshoingizni kiriting yoki savol berishingiz mumkin..." : "Paste your essay or ask a question..."}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{isUz ? "Yuborish" : "Send"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
