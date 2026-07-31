import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Code,
  Quote,
  Table,
  Sigma,
  Palette,
  Heading1,
  Heading2,
  Heading3,
  Type,
  FileText
} from 'lucide-react';

interface WPSEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  minHeight?: string;
}

export const WPSEditor: React.FC<WPSEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write document, essay, problem set or code notes...',
  rows = 8,
  minHeight = '180px'
}) => {
  const [activeColor, setActiveColor] = useState('#3b82f6');
  const [showMathToolbar, setShowMathToolbar] = useState(false);

  const insertText = (before: string, after: string = '') => {
    onChange(`${value}${before}${after}`);
  };

  const insertMath = (symbol: string) => {
    onChange(`${value}${symbol} `);
  };

  const insertTable = () => {
    const tableTemplate = `\n\n| Item / Step | Formula / Code | Result |\n| :--- | :---: | ---: |\n| 1. Input | f(x) = x² + 2x | Solved |\n| 2. Output | y = 4 | Passed |\n\n`;
    onChange(`${value}${tableTemplate}`);
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col font-sans transition">
      {/* WPS Office Ribbon Toolbar Header */}
      <div className="p-2 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1 text-slate-700 dark:text-slate-300 text-xs selection:bg-amber-500">
        {/* Headings / Style */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-300 dark:border-slate-800">
          <button
            type="button"
            title="Heading 1"
            onClick={() => insertText('\n# ')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Heading 2"
            onClick={() => insertText('\n## ')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Heading 3"
            onClick={() => insertText('\n### ')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Normal Text"
            onClick={() => insertText('\n')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <Type className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Formatting */}
        <div className="flex items-center gap-0.5 px-2 border-r border-slate-300 dark:border-slate-800">
          <button
            type="button"
            title="Bold"
            onClick={() => insertText('**', '**')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Italic"
            onClick={() => insertText('*', '*')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Underline"
            onClick={() => insertText('<u>', '</u>')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Strikethrough"
            onClick={() => insertText('~~', '~~')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 line-through"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Superscript"
            onClick={() => insertText('^(', ')')}
            className="px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-[10px] font-bold text-amber-500"
          >
            x²
          </button>
          <button
            type="button"
            title="Subscript"
            onClick={() => insertText('_({', '})')}
            className="px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-[10px] font-bold text-amber-500"
          >
            x₂
          </button>
        </div>

        {/* Alignment & Lists */}
        <div className="flex items-center gap-0.5 px-2 border-r border-slate-300 dark:border-slate-800">
          <button
            type="button"
            title="Bullet List"
            onClick={() => insertText('\n- ')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Numbered List"
            onClick={() => insertText('\n1. ')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Quote"
            onClick={() => insertText('\n> ')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Code Block"
            onClick={() => insertText('\n```python\n# Your code here\n```\n')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-emerald-500 font-mono font-bold"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Inserts & Math */}
        <div className="flex items-center gap-1 pl-2">
          <button
            type="button"
            title="Insert WPS Grid Table"
            onClick={insertTable}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-bold text-[10px] transition"
          >
            <Table className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>

          <button
            type="button"
            title="Math Formula Suite"
            onClick={() => setShowMathToolbar(!showMathToolbar)}
            className={`flex items-center gap-1 px-2 py-1 rounded font-bold text-[10px] transition ${
              showMathToolbar
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300'
            }`}
          >
            <Sigma className="w-3.5 h-3.5" />
            <span>Math (∑)</span>
          </button>
        </div>
      </div>

      {/* Math Quick-Bar Dropdown */}
      {showMathToolbar && (
        <div className="p-2 bg-amber-500/10 border-b border-amber-500/20 flex flex-wrap gap-1.5 text-xs animate-fadeIn">
          {['√x', 'x²', 'xⁿ', 'π', '∫', '±', '÷', 'θ', 'Σ', 'Δ', '∞', '≠', '≤', '≥', 'α', 'β', 'f(x) = ', 'lim_{x→∞}'].map(
            (sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => insertMath(sym)}
                className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] shadow-sm border border-slate-200 dark:border-slate-700 transition"
              >
                {sym}
              </button>
            )
          )}
        </div>
      )}

      {/* Editor Body Area */}
      <textarea
        rows={rows}
        style={{ minHeight }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs leading-relaxed focus:outline-none resize-y font-sans selection:bg-amber-500 selection:text-slate-950"
      />

      {/* Footer Word & Char Counter Canvas Bar */}
      <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
        <div className="flex items-center gap-2">
          <FileText className="w-3 h-3 text-amber-500" />
          <span>WPS Document Suite</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Words: <strong className="text-amber-500">{wordCount}</strong></span>
          <span>Chars: <strong className="text-amber-500">{charCount}</strong></span>
        </div>
      </div>
    </div>
  );
};
