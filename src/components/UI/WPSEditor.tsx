import React, { useState, useRef, useEffect } from 'react';
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
  FileText,
  Undo,
  Redo,
  Paintbrush,
  Eraser,
  Highlighter,
  Link,
  Image as ImageIcon,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Outdent,
  Indent,
  Plus,
  Minus
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface WPSEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const FONT_FAMILIES = [
  { name: 'Lucida Handwriting', value: "'Dancing Script', 'Lucida Handwriting', cursive" },
  { name: 'Caveat (Handwriting)', value: "'Caveat', cursive" },
  { name: 'Inter (Sans-Serif)', value: "'Inter', sans-serif" },
  { name: 'Arial', value: "Arial, Helvetica, sans-serif" },
  { name: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { name: 'Georgia', value: "Georgia, serif" },
  { name: 'Courier New (Mono)', value: "'Fira Code', 'Courier New', monospace" },
  { name: 'Playfair Display', value: "'Playfair Display', serif" }
];

const FONT_SIZES = ['12', '14', '16', '18', '20', '24', '28', '32', '36', '48'];

const HIGHLIGHT_COLORS = [
  { label: 'Yellow', color: '#fef08a' },
  { label: 'Green', color: '#bbf7d0' },
  { label: 'Pink', color: '#fbcfe8' },
  { label: 'Cyan', color: '#a5f3fc' },
  { label: 'Orange', color: '#fed7aa' },
  { label: 'None', color: 'transparent' }
];

const TEXT_COLORS = [
  { label: 'Black', color: '#0f172a' },
  { label: 'Blue', color: '#2563eb' },
  { label: 'Red', color: '#dc2626' },
  { label: 'Green', color: '#16a34a' },
  { label: 'Purple', color: '#9333ea' },
  { label: 'Amber', color: '#d97706' },
  { label: 'Gray', color: '#64748b' },
  { label: 'White', color: '#ffffff' }
];

export const WPSEditor: React.FC<WPSEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write document, essay, problem set or code notes...',
  minHeight = '220px'
}) => {
  // Access global app theme synchronously
  let isDark = false;
  try {
    const { theme } = useTheme();
    isDark = theme === 'dark';
  } catch {
    isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  }

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFont, setSelectedFont] = useState(FONT_FAMILIES[0].value);
  const [selectedFontSize, setSelectedFontSize] = useState('16');
  const [showMathToolbar, setShowMathToolbar] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  // Synchronize initial or external value changes safely
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        if (!value) {
          editorRef.current.innerHTML = `<p style="font-family: ${selectedFont}; font-size: ${selectedFontSize}px;"><br></p>`;
        } else if (!value.startsWith('<') && !value.endsWith('>')) {
          editorRef.current.innerHTML = `<p style="font-family: ${selectedFont}; font-size: ${selectedFontSize}px;">${value}</p>`;
        } else {
          editorRef.current.innerHTML = value;
        }
      }
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const execCmd = (command: string, valueArg: string | undefined = undefined) => {
    focusEditor();
    document.execCommand(command, false, valueArg);
    handleInput();
  };

  // Font family change handler
  const handleFontFamilyChange = (fontVal: string) => {
    setSelectedFont(fontVal);
    focusEditor();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      document.execCommand('fontName', false, fontVal);
    } else if (editorRef.current) {
      editorRef.current.style.fontFamily = fontVal;
      execCmd('formatBlock', 'p');
    }
    handleInput();
  };

  // Font size change handler
  const handleFontSizeChange = (sizeVal: string) => {
    setSelectedFontSize(sizeVal);
    focusEditor();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const selectedText = range.toString();
      if (selectedText) {
        const span = document.createElement('span');
        span.style.fontSize = `${sizeVal}px`;
        span.textContent = selectedText;
        range.deleteContents();
        range.insertNode(span);
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
    } else if (editorRef.current) {
      editorRef.current.style.fontSize = `${sizeVal}px`;
    }
    handleInput();
  };

  // Adjust font size (+ or -)
  const adjustFontSize = (delta: number) => {
    const currentNum = parseInt(selectedFontSize, 10) || 16;
    const newNum = Math.max(8, Math.min(72, currentNum + delta));
    handleFontSizeChange(newNum.toString());
  };

  // Clear formatting
  const clearFormatting = () => {
    focusEditor();
    document.execCommand('removeFormat', false);
    if (editorRef.current) {
      editorRef.current.style.fontFamily = FONT_FAMILIES[0].value;
      editorRef.current.style.fontSize = '16px';
    }
    handleInput();
  };

  // Insert HTML snippet at current caret
  const insertHTML = (html: string) => {
    focusEditor();
    document.execCommand('insertHTML', false, html);
    handleInput();
  };

  // Math symbols handler
  const insertMathSymbol = (symbol: string) => {
    insertHTML(`<span style="font-family: 'Fira Code', monospace; font-weight: bold; padding: 0 2px;">${symbol}</span> `);
  };

  // Insert Table
  const insertTableGrid = (rows: number = 3, cols: number = 3) => {
    let tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid #cbd5e1;"><thead><tr style="background-color: ${isDark ? '#1e293b' : '#f8fafc'};">`;
    for (let c = 1; c <= cols; c++) {
      tableHtml += `<th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-weight: bold;">Header ${c}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 1; r <= rows; r++) {
      tableHtml += `<tr>`;
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 8px;">Data ${r}-${c}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p><br></p>`;
    insertHTML(tableHtml);
  };

  // Image Upload / Drag & Drop / Paste
  const handleImageFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgSrc = e.target?.result as string;
      if (imgSrc) {
        insertHTML(`<div style="margin: 12px 0; text-align: center;"><img src="${imgSrc}" alt="Uploaded image" style="max-width: 100%; max-height: 420px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #cbd5e1; display: inline-block;" /><p style="font-size: 11px; color: #64748b; margin-top: 4px;">📷 ${file.name || 'Pasted image'}</p></div><p><br></p>`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Drag & Drop Images
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) => handleImageFile(file));
    }
  };

  // Handle Paste Clipboard Images
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) handleImageFile(file);
          return;
        }
      }
    }
  };

  // Calculate statistics
  const plainText = editorRef.current ? editorRef.current.innerText || '' : value.replace(/<[^>]+>/g, '');
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const charCount = plainText.length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-md overflow-hidden flex flex-col font-sans transition">
      {/* WPS Ribbon Toolbar Container */}
      <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-col divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 text-xs">
        
        {/* ROW 1: Undo/Redo, Font Family, Font Size, Formatting, Colors, Lists */}
        <div className="p-2 flex flex-wrap items-center justify-between gap-2 overflow-x-auto">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Undo / Redo */}
            <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-300 dark:border-slate-800">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                title="Undo (Ctrl+Z)"
                onClick={() => execCmd('undo')}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <Undo className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                title="Redo (Ctrl+Y)"
                onClick={() => execCmd('redo')}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <Redo className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                title="Format Painter"
                onClick={() => {
                  const sel = window.getSelection()?.toString();
                  if (sel) alert(`Format copied for selection`);
                }}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-amber-500 cursor-pointer"
              >
                <Paintbrush className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Font Family Dropdown */}
            <div className="pr-1.5 border-r border-slate-300 dark:border-slate-800">
              <select
                value={selectedFont}
                onChange={(e) => handleFontFamilyChange(e.target.value)}
                className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                title="Font Family"
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font.name} value={font.value} style={{ fontFamily: font.value }}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size Dropdown */}
            <div className="pr-1.5 border-r border-slate-300 dark:border-slate-800 flex items-center gap-1">
              <select
                value={selectedFontSize}
                onChange={(e) => handleFontSizeChange(e.target.value)}
                className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                title="Font Size"
              >
                {FONT_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} px
                  </option>
                ))}
              </select>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                title="Increase Font Size"
                onClick={() => adjustFontSize(2)}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer"
              >
                <Plus className="w-3 h-3 text-slate-700 dark:text-slate-200" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                title="Decrease Font Size"
                onClick={() => adjustFontSize(-2)}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer"
              >
                <Minus className="w-3 h-3 text-slate-700 dark:text-slate-200" />
              </button>
            </div>

            {/* Bold, Italic, Underline, Strikethrough */}
            <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-300 dark:border-slate-800">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                title="Bold (Ctrl+B)"
                onClick={() => execCmd('bold')}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                title="Italic (Ctrl+I)"
                onClick={() => execCmd('italic')}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 italic text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                title="Underline (Ctrl+U)"
                onClick={() => execCmd('underline')}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 underline text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                title="Strikethrough"
                onClick={() => execCmd('strikeThrough')}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 line-through text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Colors: Highlight & Text Color */}
            <div className="flex items-center gap-1 px-1.5 border-r border-slate-300 dark:border-slate-800 relative">
              {/* Highlight Marker */}
              <div className="relative">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  title="Highlight Background Marker"
                  onClick={() => {
                    setShowHighlightPicker(!showHighlightPicker);
                    setShowTextColorPicker(false);
                  }}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-amber-500 cursor-pointer flex items-center gap-0.5"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                </button>
                {showHighlightPicker && (
                  <div className="absolute left-0 top-full mt-1 z-30 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 flex gap-1.5 animate-fadeIn">
                    {HIGHLIGHT_COLORS.map((hc) => (
                      <button
                        key={hc.label}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        title={hc.label}
                        onClick={() => {
                          execCmd('hiliteColor', hc.color);
                          setShowHighlightPicker(false);
                        }}
                        className="w-5 h-5 rounded-full border border-slate-300 shadow-sm transition hover:scale-110 cursor-pointer"
                        style={{ backgroundColor: hc.color }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Text Color */}
              <div className="relative">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  title="Font Text Color"
                  onClick={() => {
                    setShowTextColorPicker(!showTextColorPicker);
                    setShowHighlightPicker(false);
                  }}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white cursor-pointer flex items-center gap-0.5 font-bold"
                >
                  <Palette className="w-3.5 h-3.5 text-blue-500" />
                </button>
                {showTextColorPicker && (
                  <div className="absolute left-0 top-full mt-1 z-30 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 flex gap-1.5 animate-fadeIn">
                    {TEXT_COLORS.map((tc) => (
                      <button
                        key={tc.label}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        title={tc.label}
                        onClick={() => {
                          execCmd('foreColor', tc.color);
                          setShowTextColorPicker(false);
                        }}
                        className="w-5 h-5 rounded-full border border-slate-300 shadow-sm transition hover:scale-110 cursor-pointer"
                        style={{ backgroundColor: tc.color }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Clear Formatting */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                title="Clear Formatting"
                onClick={clearFormatting}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-rose-500 cursor-pointer"
              >
                <Eraser className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Lists & Indents */}
            <div className="flex items-center gap-0.5 pl-1.5">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                title="Bulleted List"
                onClick={() => execCmd('insertUnorderedList')}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                title="Numbered List"
                onClick={() => execCmd('insertOrderedList')}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                title="Decrease Indent"
                onClick={() => execCmd('outdent')}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <Outdent className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                title="Increase Indent"
                onClick={() => execCmd('indent')}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <Indent className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ROW 2: Alignment, Headings, Sub/Super, Hyperlink, Media, Table, Math, Code */}
        <div className="p-2 flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {/* Alignment */}
          <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-300 dark:border-slate-800">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              title="Align Left"
              onClick={() => execCmd('justifyLeft')}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              title="Align Center"
              onClick={() => execCmd('justifyCenter')}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              title="Align Right"
              onClick={() => execCmd('justifyRight')}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              title="Justify"
              onClick={() => execCmd('justifyFull')}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Headings & Sub/Superscript */}
          <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-300 dark:border-slate-800">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              title="Heading 1"
              onClick={() => execCmd('formatBlock', 'h1')}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
            >
              <Heading1 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              title="Heading 2"
              onClick={() => execCmd('formatBlock', 'h2')}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              title="Heading 3"
              onClick={() => execCmd('formatBlock', 'h3')}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
            >
              <Heading3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              title="Blockquote"
              onClick={() => execCmd('formatBlock', 'blockquote')}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              title="Subscript"
              onClick={() => execCmd('subscript')}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-amber-500 font-bold text-[10px]"
            >
              <SubscriptIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              title="Superscript"
              onClick={() => execCmd('superscript')}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-amber-500 font-bold text-[10px]"
            >
              <SuperscriptIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Inserts: Hyperlink & Image Upload */}
          <div className="flex items-center gap-1 px-1.5 border-r border-slate-300 dark:border-slate-800">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              title="Insert Hyperlink"
              onClick={() => setShowLinkModal(!showLinkModal)}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-blue-500 cursor-pointer"
            >
              <Link className="w-3.5 h-3.5" />
            </button>

            {/* Upload/Attach Image */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              title="Insert Image (Upload or Drag & Drop)"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-emerald-500 cursor-pointer flex items-center gap-1 font-semibold text-[11px]"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Image</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
              }}
            />
          </div>

          {/* Table, Math & Code */}
          <div className="flex items-center gap-1 pl-1.5">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              title="Insert Grid Table"
              onClick={() => insertTableGrid(3, 3)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-bold text-[11px] transition cursor-pointer"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              title="Math Formulas & Equation Bar"
              onClick={() => setShowMathToolbar(!showMathToolbar)}
              className={`flex items-center gap-1 px-2 py-1 rounded font-bold text-[11px] transition cursor-pointer ${
                showMathToolbar
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300'
              }`}
            >
              <Sigma className="w-3.5 h-3.5" />
              <span>Math (∑)</span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              title="Insert Monospace Code Block"
              onClick={() =>
                insertHTML(
                  `<pre style="background:#0f172a; color:#34d399; padding:12px; border-radius:8px; font-family:'Fira Code', monospace; margin:8px 0;"><code># Write code here...\ndef solution():\n    return "Passed"</code></pre><p><br></p>`
                )
              }
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-emerald-500 cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Link Popover Modal */}
      {showLinkModal && (
        <div className="p-2.5 bg-blue-500/10 border-b border-blue-500/20 flex items-center gap-2 animate-fadeIn">
          <Link className="w-4 h-4 text-blue-500 shrink-0" />
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com/document.pdf"
            className="flex-1 px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (linkUrl) {
                execCmd('createLink', linkUrl);
                setLinkUrl('');
                setShowLinkModal(false);
              }
            }}
            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
          >
            Insert Link
          </button>
          <button
            type="button"
            onClick={() => setShowLinkModal(false)}
            className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Math Symbols Toolbar */}
      {showMathToolbar && (
        <div className="p-2 bg-amber-500/10 border-b border-amber-500/20 flex flex-wrap gap-1.5 text-xs animate-fadeIn">
          {['√x', 'x²', 'xⁿ', 'π', '∫', '±', '÷', 'θ', 'Σ', 'Δ', '∞', '≠', '≤', '≥', 'α', 'β', 'f(x) = ', 'lim_{x→∞}', '∫ f(x)dx'].map(
            (sym) => (
              <button
                key={sym}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertMathSymbol(sym)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-mono font-bold text-slate-800 dark:text-slate-200 text-xs shadow-sm border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                {sym}
              </button>
            )
          )}
        </div>
      )}

      {/* WPS Document Sheet Canvas (ContentEditable Engine synced to Global Theme) */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        onDrop={handleDrop}
        onPaste={handlePaste}
        onDragOver={(e) => e.preventDefault()}
        style={{
          minHeight,
          fontFamily: selectedFont,
          fontSize: `${selectedFontSize}px`
        }}
        className={`w-full p-6 leading-relaxed focus:outline-none resize-y transition overflow-y-auto cursor-text shadow-inner ${
          isDark
            ? 'bg-slate-900 text-slate-100 selection:bg-amber-500 selection:text-slate-950 caret-amber-400'
            : 'bg-white text-slate-900 selection:bg-amber-300 selection:text-slate-900 caret-slate-900'
        }`}
      />

      {/* Document Footer Bar: Word, Char, Read Time */}
      <div className="px-4 py-2 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium select-none">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">WPS Office Suite</span>
          <span className="text-slate-400">| Drag & Drop Images / Paste (Ctrl+V) Supported</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Words: <strong className="text-amber-500 font-bold">{wordCount}</strong></span>
          <span>Chars: <strong className="text-amber-500 font-bold">{charCount}</strong></span>
          <span>Read Time: <strong className="text-amber-500 font-bold">~{readTime}m</strong></span>
        </div>
      </div>
    </div>
  );
};
