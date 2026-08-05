import React, { useState, useRef, ChangeEvent, KeyboardEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileAttachment } from '../services/gemini';
import { AnimatedButton } from './AnimatedButton';
import {
  Send,
  Paperclip,
  X,
  Sparkles,
  Globe,
  FileText,
  Image as ImageIcon,
  Bot,
  Loader2,
  Mic,
  MicOff,
  Lightbulb,
  Check,
} from 'lucide-react';

interface AiInputProps {
  onSendMessage: (text: string, options?: { attachment?: FileAttachment; enableGrounding?: boolean }) => Promise<void>;
  isLoading: boolean;
  activeModeLabel?: string;
  placeholder?: string;
  isGroundingActive?: boolean;
  onToggleGrounding?: () => void;
}

export const AiInput: React.FC<AiInputProps> = ({
  onSendMessage,
  isLoading,
  activeModeLabel = 'General Mentor',
  placeholder = 'Ask CenterFlow Copilot anything... (e.g. Grade my Task 2 essay or draft lesson plan)',
  isGroundingActive = false,
  onToggleGrounding,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Suggested quick prompts
  const PROMPT_SUGGESTIONS = [
    '✍️ Grade Task 2 Essay',
    '📘 Draft CEFR B2 Lesson Plan',
    '📊 Class Performance Summary',
    '🎙️ IELTS Speaking Band 8 Tips',
  ];

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setSpeechTranscript(currentTranscript);
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Try Google Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (speechTranscript) {
        setInputText((prev) => (prev ? `${prev} ${speechTranscript}` : speechTranscript));
        setSpeechTranscript('');
      }
    } else {
      setSpeechTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const applySpeechTranscript = () => {
    if (speechTranscript) {
      setInputText((prev) => (prev ? `${prev} ${speechTranscript}` : speechTranscript));
      setSpeechTranscript('');
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const clearSpeechTranscript = () => {
    setSpeechTranscript('');
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Handle file selection and convert to Base64
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      setAttachment({
        inlineData: {
          data: base64Data,
          mimeType: file.type || 'application/octet-stream',
        },
      });
      setAttachmentName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    setAttachmentName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalQuery = (inputText + (speechTranscript ? ` ${speechTranscript}` : '')).trim();
    if ((!finalQuery && !attachment) || isLoading) return;

    const textToSend = finalQuery;
    const attachmentToSend = attachment;

    setInputText('');
    setSpeechTranscript('');
    setAttachment(null);
    setAttachmentName('');
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    await onSendMessage(textToSend, {
      attachment: attachmentToSend || undefined,
      enableGrounding: isGroundingActive,
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative w-full space-y-2.5">
      {/* QUICK SUGGESTIONS CAROUSEL */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400 shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3 h-3" /> Quick Prompts:
        </span>
        {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInputText(suggestion.replace(/^[^\s]+\s/, ''));
            }}
            className="px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 transition shrink-0 cursor-pointer font-medium"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* INSTANT AUDIO TRANSCRIPT PREVIEW BAR */}
      <AnimatePresence>
        {(isListening || speechTranscript) && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/80 to-slate-950/80 border border-cyan-500/40 backdrop-blur-md flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2 text-cyan-300 flex-1 truncate">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <span className="font-extrabold text-[11px] uppercase tracking-wide text-cyan-400 shrink-0">Live Voice Transcript:</span>
              <span className="italic text-slate-200 truncate">{speechTranscript || 'Listening to your speech...'}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={applySpeechTranscript}
                className="px-2 py-1 rounded-lg bg-cyan-500/30 hover:bg-cyan-500/50 text-cyan-200 border border-cyan-400/40 text-[11px] font-bold flex items-center gap-1 transition"
              >
                <Check className="w-3 h-3" /> Append
              </button>
              <button
                type="button"
                onClick={clearSpeechTranscript}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INPUT CONTAINER BOX WITH ATMOSPHERIC SHIMMER BORDER */}
      <div className="relative rounded-2xl bg-slate-950/90 border border-amber-500/30 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-500/20 shadow-2xl backdrop-blur-md p-3 transition-all">
        {/* ATTACHMENT PREVIEW CHIP */}
        <AnimatePresence>
          {attachmentName && (
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="max-w-[200px] truncate">{attachmentName}</span>
              <button
                onClick={handleRemoveAttachment}
                className="p-0.5 rounded-lg hover:bg-amber-500/30 text-amber-200 hover:text-white transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TEXTAREA INPUT */}
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          className="w-full bg-transparent text-white placeholder-slate-500 text-xs sm:text-sm resize-none focus:outline-none leading-relaxed"
        />

        {/* INPUT ACTIONS & CONTROLS FOOTER */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-900">
          <div className="flex items-center gap-2">
            {/* Microphone Speech Recognition Button with Pulse */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                isListening
                  ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse shadow-lg shadow-red-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border-slate-800'
              }`}
              title={isListening ? 'Stop recording voice' : 'Start live speech-to-text'}
            >
              {isListening ? <MicOff className="w-4 h-4 text-red-400 animate-spin" /> : <Mic className="w-4 h-4" />}
              <span className="hidden sm:inline">{isListening ? 'Recording...' : 'Voice'}</span>
            </button>

            {/* File Attachment Trigger */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,application/pdf,text/plain,.doc,.docx"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Attach Essay, Document or Photo"
            >
              <Paperclip className="w-4 h-4" />
              <span className="hidden sm:inline">Attach</span>
            </button>

            {/* Live Search Grounding Toggle */}
            {onToggleGrounding && (
              <button
                type="button"
                onClick={onToggleGrounding}
                className={`px-2.5 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                  isGroundingActive
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Live Grounding</span>
              </button>
            )}

            {/* Mode Indicator Tag */}
            <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-900 text-amber-400 border border-slate-800 font-extrabold hidden md:inline-block">
              {activeModeLabel}
            </span>
          </div>

          {/* Submit Button */}
          <AnimatedButton
            variant="amber"
            size="sm"
            isLoading={isLoading}
            disabled={(!inputText.trim() && !speechTranscript && !attachment) || isLoading}
            onClick={handleSubmit}
            rightIcon={<Send className="w-3.5 h-3.5" />}
          >
            Send
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

