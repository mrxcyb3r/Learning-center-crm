import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, Phone } from 'lucide-react';
import { aiReceptionist } from '../../services/aiReceptionist';

interface ChatMsg {
  id: string;
  from: 'user' | 'ai' | 'system';
  text: string;
  aiNote?: boolean;
}

const QUICK_ACTIONS = [
  'Kurslar va narxlar',
  'Filiallar',
  'Sinov darsi',
  'Dars jadvali',
  "O'qituvchilar",
];

const GREETING: ChatMsg = {
  id: 'greeting',
  from: 'ai',
  text: "Assalomu alaykum! Renessans o'quv markazi haqida savollaringiz bo'lsa, yordam beraman.",
};

const NO_AI_MSG =
  "AI yordamchi sozlanmagan. Savolingizni operatorimizga yuboring — tez orada javob beramiz.";

let msgCounter = 0;
function nextId(): string {
  msgCounter += 1;
  return 'msg-' + Date.now().toString(36) + '-' + msgCounter;
}

export const AiReceptionistWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([GREETING]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [operatorMode, setOperatorMode] = useState(false);
  const [opName, setOpName] = useState('');
  const [opPhone, setOpPhone] = useState('');
  const [opSent, setOpSent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const pushMsg = useCallback((msg: ChatMsg) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const handleSend = useCallback(
    async (rawText?: string) => {
      const text = (rawText ?? draft).trim();
      if (!text || sending) return;
      setDraft('');
      pushMsg({ id: nextId(), from: 'user', text });

      // Operator handoff mode — collect message for human
      if (operatorMode) {
        pushMsg({
          id: nextId(),
          from: 'system',
          text: "Xabaringiz operatorga yuborildi. Tez orada siz bilan bog'lanamiz.",
        });
        try {
          const { questionsService } = await import('../../services/repository');
          await questionsService.createQuestion({
            fullName: opName || 'Sayt mehmoni (AI chat)',
            phone: opPhone || '',
            subject: 'AI chat — operator bilan bog\'lanish',
            message: text,
            preferredContact: 'phone',
            source: 'AI chatbot',
          });
        } catch {
          // Message already acknowledged; persistence is best-effort here.
        }
        return;
      }

      setSending(true);
      try {
        const result = await aiReceptionist.processQuestion(text);
        if (result.answer) {
          pushMsg({
            id: nextId(),
            from: 'ai',
            text: result.answer,
            aiNote: !result.shouldEscalate,
          });
        }
        // Persist every AI-handled turn as a questions doc + AI metadata, so
        // Receptionist → AI Murojaatlar shows real counts and transparency.
        // Escalated turns additionally surface in the regular inbox as unread.
        const persistTurn = async () => {
          const { questionsService, murojaatlarService } = await import('../../services/repository');
          const docId = await questionsService.createQuestion({
            fullName: 'Sayt mehmoni (AI chat)',
            phone: '',
            subject: result.shouldEscalate
              ? 'AI chat savoli — operator kerak'
              : 'AI chat savoli — AI javob berdi',
            message: 'Savol: ' + text,
            preferredContact: 'phone',
            source: 'AI chatbot',
          });
          await murojaatlarService.saveAiResult(docId, 'question', {
            answer: result.answer,
            intent: result.intent,
            sources: result.knowledgeSources.map((s) => s.source),
            escalated: result.shouldEscalate,
            escalationReason: result.escalationReason,
            escalatedTo: result.escalatedTo,
          });
        };
        if (result.shouldEscalate) {
          pushMsg({
            id: nextId(),
            from: 'system',
            text:
              result.escalationReason ||
              "Bu savol bo'yicha aniq ma'lumotim yo'q. Murojaatingizni operatorimizga yuboraman.",
          });
          try {
            await persistTurn();
          } catch {
            // Escalation notice already shown; persistence best-effort.
          }
        } else if (result.answer) {
          try {
            await persistTurn();
          } catch {
            // Answer already shown; persistence best-effort.
          }
        }
      } catch {
        pushMsg({ id: nextId(), from: 'ai', text: NO_AI_MSG });
      } finally {
        setSending(false);
      }
    },
    [draft, sending, operatorMode, opName, opPhone, pushMsg]
  );

  const handleOperatorSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!opName.trim() || !opPhone.trim()) return;
      try {
        const { questionsService } = await import('../../services/repository');
        await questionsService.createQuestion({
          fullName: opName.trim(),
          phone: opPhone.trim(),
          subject: 'AI chat — operator bilan bog\'lanish',
          message: "Mijoz operator bilan bog'lanishni so'radi.",
          preferredContact: 'phone',
          source: 'AI chatbot',
        });
      } catch {
        // Still confirm — receptionist sees the chat escalation row.
      }
      setOpSent(true);
      pushMsg({
        id: nextId(),
        from: 'system',
        text: "So'rovingiz qabul qilindi, " + opName.trim() + ". Operatorimiz tez orada qo'ng'iroq qiladi.",
      });
    },
    [opName, opPhone, pushMsg]
  );

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Renessans AI yordamchi"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 pl-4 pr-5 py-3 shadow-lg shadow-amber-500/30 font-black text-sm transition cursor-pointer"
        >
          <Bot className="w-5 h-5" />
          Renessans AI
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-[360px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
          style={{ height: 'min(520px, calc(100vh - 6rem))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950 dark:bg-slate-950 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center">
                <Bot className="w-4.5 h-4.5 text-slate-950" />
              </div>
              <div>
                <div className="text-sm font-black text-white leading-tight">Renessans AI</div>
                <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Onlayn — savol bering
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Yopish"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3.5 py-3 space-y-2.5 bg-slate-50 dark:bg-slate-950">
            {messages.map((m) => {
              if (m.from === 'system') {
                return (
                  <div key={m.id} className="text-center">
                    <span className="inline-block px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-[11px] font-semibold max-w-full">
                      {m.text}
                    </span>
                  </div>
                );
              }
              const isUser = m.from === 'user';
              return (
                <div key={m.id} className={'flex ' + (isUser ? 'justify-end' : 'justify-start')}>
                  <div
                    className={
                      'max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ' +
                      (isUser
                        ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 rounded-br-md font-medium'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-md')
                    }
                  >
                    <div className="whitespace-pre-wrap break-words">{m.text}</div>
                    {m.aiNote && (
                      <div className="mt-1 text-[9px] font-bold text-slate-400 dark:text-slate-500">
                        AI javobi — tasdiqlangan ma'lumot
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Quick actions (only at start) */}
            {messages.length <= 1 && !operatorMode && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_ACTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    disabled={sending}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Operator form */}
            {operatorMode && !opSent && (
              <form onSubmit={handleOperatorSubmit} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 space-y-2">
                <div className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                  Operator bilan bog'lanish
                </div>
                <input
                  value={opName}
                  onChange={(e) => setOpName(e.target.value)}
                  placeholder="Ismingiz"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <input
                  value={opPhone}
                  onChange={(e) => setOpPhone(e.target.value)}
                  placeholder="Telefon raqamingiz"
                  inputMode="tel"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <button
                  type="submit"
                  disabled={!opName.trim() || !opPhone.trim()}
                  className="w-full py-2 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 text-xs font-black transition cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Qo'ng'iroq so'rash
                </button>
              </form>
            )}
          </div>

          {/* Input bar */}
          <div className="px-3 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            {!operatorMode && (
              <button
                onClick={() => setOperatorMode(true)}
                className="w-full py-1.5 rounded-lg text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Operator bilan bog'lanish
              </button>
            )}
            {operatorMode && (
              <button
                onClick={() => setOperatorMode(false)}
                className="w-full py-1.5 rounded-lg text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                AI bilan davom etish
              </button>
            )}
            <div className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={operatorMode ? 'Operatorga xabar yozing...' : 'Savolingizni yozing...'}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <button
                onClick={() => handleSend()}
                disabled={sending || !draft.trim()}
                aria-label="Yuborish"
                className="p-2.5 rounded-xl bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 hover:opacity-90 disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
