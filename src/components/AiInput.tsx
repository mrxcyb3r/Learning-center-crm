import React, { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileAttachment } from '../services/gemini';
import { AnimatedButton } from './AnimatedButton';
import { debounce } from '../utils/security';
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
  Lightbulb,
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suggested quick prompts
  const PROMPT_SUGGESTIONS = [
    '✍️ Grade Task 2 Essay',
    '📘 Draft CEFR B2 Lesson Plan',
    '📊 Class Performance Summary',
    '🎙️ IELTS Speaking Band 8 Tips',
  ];

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
    if ((!inputText.trim() && !attachment) || isLoading) return;

    const textToSend = inputText;
    const attachmentToSend = attachment;

    setInputText('');
    setAttachment(null);
    setAttachmentName('');
    setSuggestions([]);

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
                <span className="hidden sm:inline">Live News Grounding</span>
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
            disabled={(!inputText.trim() && !attachment) || isLoading}
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
