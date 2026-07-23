import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Copy, Check, Terminal } from 'lucide-react';

interface FormattedAIResponseProps {
  content: string;
}

export const FormattedAIResponse: React.FC<FormattedAIResponseProps> = ({ content }) => {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopyCode = (codeText: string, codeId: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(codeId);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="prose prose-invert max-w-none text-xs text-slate-200 leading-relaxed space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Custom Headings
          h1: ({ children }) => (
            <h1 className="text-base font-extrabold text-amber-400 mt-4 mb-2 pb-1 border-b border-amber-500/20">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold text-amber-300 mt-3 mb-1.5 flex items-center gap-1.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-bold text-amber-200 mt-2.5 mb-1">
              {children}
            </h3>
          ),

          // Custom Paragraphs
          p: ({ children }) => (
            <p className="mb-2.5 leading-relaxed text-slate-200">{children}</p>
          ),

          // Bold text
          strong: ({ children }) => (
            <strong className="font-bold text-amber-300">{children}</strong>
          ),

          // Callout / Blockquote
          blockquote: ({ children }) => (
            <div className="my-3 p-3 rounded-xl bg-amber-500/10 border-l-4 border-amber-500 text-amber-200 text-xs font-medium space-y-1 shadow-sm">
              {children}
            </div>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-2 space-y-1 text-slate-200">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1 text-slate-200">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-slate-800 shadow-md">
              <table className="w-full text-left text-xs bg-slate-950/80 divide-y divide-slate-800">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-900 text-amber-400 font-bold">{children}</thead>,
          th: ({ children }) => <th className="p-2.5 font-bold text-amber-400 border-b border-slate-800">{children}</th>,
          td: ({ children }) => <td className="p-2.5 border-t border-slate-800/60 text-slate-300">{children}</td>,

          // Code blocks & Inline code
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            const codeId = React.useId();

            if (inline) {
              return (
                <code className="bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded-md font-mono text-[11px] border border-amber-500/20" {...props}>
                  {children}
                </code>
              );
            }

            return (
              <div className="my-3 rounded-xl bg-slate-950 border border-slate-800/90 overflow-hidden shadow-lg group">
                <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3 h-3 text-amber-500" />
                    <span>{match ? match[1] : 'code'}</span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(codeString, codeId)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    {copiedCodeId === codeId ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 overflow-x-auto font-mono text-xs text-slate-200 leading-relaxed bg-slate-950">
                  <code {...props}>{children}</code>
                </pre>
              </div>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
