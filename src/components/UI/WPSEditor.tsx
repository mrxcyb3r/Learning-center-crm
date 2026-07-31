import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Code,
  Quote,
  Table as TableIcon,
  Sigma,
  Palette,
  Undo,
  Redo,
  Highlighter,
  Link as LinkIcon,
  Image as ImageIcon,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Trash2,
  FileText
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface WPSEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  isDarkMode?: boolean;
}

const FONT_FAMILIES = [
  { name: 'Inter (Sans-Serif)', value: 'Inter, sans-serif' },
  { name: 'Lucida Handwriting', value: "'Dancing Script', 'Lucida Handwriting', cursive" },
  { name: 'Caveat (Handwriting)', value: "'Caveat', cursive" },
  { name: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { name: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Courier New (Mono)', value: "'Fira Code', 'Courier New', monospace" },
  { name: 'Playfair Display', value: "'Playfair Display', serif" }
];

const HIGHLIGHT_COLORS = [
  { label: 'Yellow', color: '#fef08a' },
  { label: 'Green', color: '#bbf7d0' },
  { label: 'Pink', color: '#fbcfe8' },
  { label: 'Cyan', color: '#a5f3fc' },
  { label: 'Orange', color: '#fed7aa' },
  { label: 'None', color: 'transparent' }
];

const TEXT_COLORS = [
  { label: 'Default', color: '' },
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
  minHeight = '300px',
  isDarkMode: isDarkModeProp
}) => {
  let isDark = false;
  try {
    const { theme } = useTheme();
    isDark = theme === 'dark';
  } catch {
    isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  }
  if (isDarkModeProp !== undefined) {
    isDark = isDarkModeProp;
  }

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFont, setSelectedFont] = useState(FONT_FAMILIES[0].value);
  const [showMathToolbar, setShowMathToolbar] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Underline,
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: true,
        allowBase64: true
      }),
      Link.configure({
        openOnClick: false,
        autolink: true
      }),
      CharacterCount,
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      })
    ],
    content: value || `<p>${placeholder}</p>`,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none leading-relaxed'
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
              event.preventDefault();
              const file = items[i].getAsFile();
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  const src = e.target?.result as string;
                  if (src && view) {
                    const { schema } = view.state;
                    const node = schema.nodes.image.create({
                      src,
                      alt: file.name || 'Pasted image'
                    });
                    const transaction = view.state.tr.replaceSelectionWith(node);
                    view.dispatch(transaction);
                  }
                };
                reader.readAsDataURL(file);
                return true;
              }
            }
          }
        }
        return false;
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              if (src && view) {
                const { schema } = view.state;
                const node = schema.nodes.image.create({
                  src,
                  alt: file.name || 'Dropped image'
                });
                const transaction = view.state.tr.replaceSelectionWith(node);
                view.dispatch(transaction);
              }
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      }
    }
  });

  // Keep external value synced without resetting caret when typing
  useEffect(() => {
    if (editor) {
      const currentHTML = editor.getHTML();
      if (value !== undefined && value !== currentHTML) {
        if (value === '' && currentHTML === '<p></p>') return;
        editor.commands.setContent(value || '<p></p>');
      }
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="w-full h-48 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs text-slate-500 animate-pulse">
        Loading WPS Tiptap Editor...
      </div>
    );
  }

  // Handle image upload from file picker
  const handleImageFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (src) {
        editor.chain().focus().setImage({ src, alt: file.name }).run();
      }
    };
    reader.readAsDataURL(file);
  };

  // Math symbols handler
  const insertMathSymbol = (symbol: string) => {
    editor
      .chain()
      .focus()
      .insertContent(`<span style="font-family: 'Fira Code', monospace; font-weight: bold; padding: 0 3px;">${symbol}</span> `)
      .run();
  };

  const words = editor.storage.characterCount.words();
  const characters = editor.storage.characterCount.characters();
  const readTime = Math.max(1, Math.ceil(words / 200));

  return (
    <div className={`w-full rounded-2xl border shadow-lg overflow-hidden flex flex-col font-sans transition-colors ${
      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-100 border-slate-300 text-slate-900'
    }`}>
      {/* Tiptap Custom Styles */}
      <style>{`
        .tiptap table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
          overflow: hidden;
        }
        .tiptap td, .tiptap th {
          border: 1px solid ${isDark ? '#334155' : '#cbd5e1'};
          padding: 8px 12px;
          position: relative;
          vertical-align: top;
        }
        .tiptap th {
          background-color: ${isDark ? '#1e293b' : '#f1f5f9'};
          font-weight: bold;
        }
        .tiptap img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 1rem auto;
          display: block;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .tiptap pre {
          background-color: #0f172a;
          color: #34d399;
          padding: 1rem;
          border-radius: 12px;
          font-family: 'Fira Code', monospace;
          margin: 1rem 0;
        }
        .tiptap blockquote {
          border-left: 4px solid #f59e0b;
          padding-left: 1rem;
          font-style: italic;
          margin: 1rem 0;
        }
      `}</style>

      {/* Tiptap Contextual Bubble Menu */}
      <BubbleMenu
        editor={editor}
        className="flex items-center gap-1 p-1.5 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 text-xs z-50"
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-slate-800 ${editor.isActive('bold') ? 'text-amber-400 font-bold' : ''}`}
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-slate-800 ${editor.isActive('italic') ? 'text-amber-400 italic' : ''}`}
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded hover:bg-slate-800 ${editor.isActive('underline') ? 'text-amber-400 underline' : ''}`}
          title="Underline"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
          className="p-1.5 rounded hover:bg-slate-800 text-amber-300"
          title="Highlight"
        >
          <Highlighter className="w-3.5 h-3.5" />
        </button>
      </BubbleMenu>

      {/* Sticky Ribbon Toolbar Header */}
      <div className={`p-2 border-b flex flex-col gap-2 text-xs transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* ROW 1: Undo/Redo, Font Family, Headings, Formatting, Colors */}
        <div className="flex flex-wrap items-center justify-between gap-2 overflow-x-auto">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Undo / Redo */}
            <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-300 dark:border-slate-800">
              <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="Undo (Ctrl+Z)"
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
              >
                <Undo className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="Redo (Ctrl+Y)"
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
              >
                <Redo className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Font Family Selector */}
            <div className="pr-1.5 border-r border-slate-300 dark:border-slate-800">
              <select
                value={selectedFont}
                onChange={(e) => {
                  const fontVal = e.target.value;
                  setSelectedFont(fontVal);
                  editor.chain().focus().setFontFamily(fontVal).run();
                }}
                className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                title="Font Family"
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font.name} value={font.value} style={{ fontFamily: font.value }}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Headings Dropdown */}
            <div className="pr-1.5 border-r border-slate-300 dark:border-slate-800">
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'p') editor.chain().focus().setParagraph().run();
                  else if (val === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
                  else if (val === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
                  else if (val === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
                }}
                value={
                  editor.isActive('heading', { level: 1 })
                    ? 'h1'
                    : editor.isActive('heading', { level: 2 })
                    ? 'h2'
                    : editor.isActive('heading', { level: 3 })
                    ? 'h3'
                    : 'p'
                }
                className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
              >
                <option value="p">Paragraph</option>
                <option value="h1">Heading 1</option>
                <option value="h2">Heading 2</option>
                <option value="h3">Heading 3</option>
              </select>
            </div>

            {/* B, I, U, S */}
            <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-300 dark:border-slate-800">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-1.5 rounded transition cursor-pointer ${
                  editor.isActive('bold') ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded transition cursor-pointer ${
                  editor.isActive('italic') ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`p-1.5 rounded transition cursor-pointer ${
                  editor.isActive('underline') ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title="Underline"
              >
                <UnderlineIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`p-1.5 rounded transition cursor-pointer ${
                  editor.isActive('strike') ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title="Strikethrough"
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleSubscript().run()}
                className={`p-1.5 rounded transition cursor-pointer ${
                  editor.isActive('subscript') ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title="Subscript"
              >
                <SubscriptIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleSuperscript().run()}
                className={`p-1.5 rounded transition cursor-pointer ${
                  editor.isActive('superscript') ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title="Superscript"
              >
                <SuperscriptIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Colors: Highlight & Text Color */}
            <div className="flex items-center gap-1 px-1.5 border-r border-slate-300 dark:border-slate-800 relative">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowHighlightPicker(!showHighlightPicker);
                    setShowTextColorPicker(false);
                  }}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-amber-500 cursor-pointer flex items-center gap-0.5"
                  title="Highlight Color"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                </button>
                {showHighlightPicker && (
                  <div className="absolute left-0 top-full mt-1 z-30 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 flex gap-1.5 animate-fadeIn">
                    {HIGHLIGHT_COLORS.map((hc) => (
                      <button
                        key={hc.label}
                        type="button"
                        onClick={() => {
                          if (hc.color === 'transparent') editor.chain().focus().unsetHighlight().run();
                          else editor.chain().focus().toggleHighlight({ color: hc.color }).run();
                          setShowHighlightPicker(false);
                        }}
                        className="w-5 h-5 rounded-full border border-slate-300 shadow-sm transition hover:scale-110 cursor-pointer"
                        style={{ backgroundColor: hc.color }}
                        title={hc.label}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowTextColorPicker(!showTextColorPicker);
                    setShowHighlightPicker(false);
                  }}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-blue-500 cursor-pointer"
                  title="Text Color"
                >
                  <Palette className="w-3.5 h-3.5" />
                </button>
                {showTextColorPicker && (
                  <div className="absolute left-0 top-full mt-1 z-30 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 flex gap-1.5 animate-fadeIn">
                    {TEXT_COLORS.map((tc) => (
                      <button
                        key={tc.label}
                        type="button"
                        onClick={() => {
                          if (!tc.color) editor.chain().focus().unsetColor().run();
                          else editor.chain().focus().setColor(tc.color).run();
                          setShowTextColorPicker(false);
                        }}
                        className="w-5 h-5 rounded-full border border-slate-300 shadow-sm transition hover:scale-110 cursor-pointer"
                        style={{ backgroundColor: tc.color || '#94a3b8' }}
                        title={tc.label}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Alignments */}
            <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-300 dark:border-slate-800">
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`p-1.5 rounded cursor-pointer ${
                  editor.isActive({ textAlign: 'left' }) ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`p-1.5 rounded cursor-pointer ${
                  editor.isActive({ textAlign: 'center' }) ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`p-1.5 rounded cursor-pointer ${
                  editor.isActive({ textAlign: 'right' }) ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title="Align Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                className={`p-1.5 rounded cursor-pointer ${
                  editor.isActive({ textAlign: 'justify' }) ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title="Justify"
              >
                <AlignJustify className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Lists & Quotes */}
            <div className="flex items-center gap-0.5 pl-1.5">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-1.5 rounded cursor-pointer ${
                  editor.isActive('bulletList') ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title="Bulleted List"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-1.5 rounded cursor-pointer ${
                  editor.isActive('orderedList') ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title="Numbered List"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`p-1.5 rounded cursor-pointer ${
                  editor.isActive('blockquote') ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title="Blockquote"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`p-1.5 rounded cursor-pointer ${
                  editor.isActive('codeBlock') ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title="Code Block"
              >
                <Code className="w-3.5 h-3.5 text-emerald-500" />
              </button>
            </div>
          </div>
        </div>

        {/* ROW 2: Hyperlink, Image Upload, Table Builder, Math formulas */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {/* Hyperlink */}
          <div className="flex items-center gap-1 pr-1.5 border-r border-slate-300 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowLinkModal(!showLinkModal)}
              className={`p-1.5 rounded cursor-pointer ${
                editor.isActive('link') ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-blue-500'
              }`}
              title="Insert / Edit Link"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Image Upload */}
          <div className="flex items-center gap-1 px-1.5 border-r border-slate-300 dark:border-slate-800">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-emerald-500 cursor-pointer flex items-center gap-1 font-semibold text-[11px]"
              title="Upload / Insert Image (Drag & Drop or Ctrl+V Supported)"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Image</span>
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

          {/* Table Controls */}
          <div className="flex items-center gap-1 px-1.5 border-r border-slate-300 dark:border-slate-800">
            <button
              type="button"
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-bold text-[11px] transition cursor-pointer"
              title="Insert 3x3 Table"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            {editor.isActive('table') && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                  title="Add Row"
                >
                  +Row
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="px-1.5 py-0.5 rounded bg-blue-500 text-white text-[10px] font-bold cursor-pointer"
                  title="Add Column"
                >
                  +Col
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  className="p-1 rounded bg-rose-500 text-white cursor-pointer"
                  title="Delete Table"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Math Formulas Toolbar Toggle */}
          <div className="flex items-center gap-1 pl-1.5">
            <button
              type="button"
              onClick={() => setShowMathToolbar(!showMathToolbar)}
              className={`flex items-center gap-1 px-2 py-1 rounded font-bold text-[11px] transition cursor-pointer ${
                showMathToolbar
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
              title="Math Formulas Quick Bar"
            >
              <Sigma className="w-3.5 h-3.5" />
              <span>Math (∑)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Link Popover Modal */}
      {showLinkModal && (
        <div className="p-2.5 bg-blue-500/10 border-b border-blue-500/20 flex items-center gap-2 animate-fadeIn">
          <LinkIcon className="w-4 h-4 text-blue-500 shrink-0" />
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
                editor.chain().focus().setLink({ href: linkUrl }).run();
                setLinkUrl('');
                setShowLinkModal(false);
              }
            }}
            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
          >
            Insert Link
          </button>
          {editor.isActive('link') && (
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().unsetLink().run();
                setShowLinkModal(false);
              }}
              className="px-2 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold transition cursor-pointer"
            >
              Unlink
            </button>
          )}
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
                onClick={() => insertMathSymbol(sym)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-mono font-bold text-slate-800 dark:text-slate-200 text-xs shadow-sm border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                {sym}
              </button>
            )
          )}
        </div>
      )}

      {/* Google Docs Style Centered Page Canvas Container */}
      <div className={`w-full overflow-y-auto p-4 md:p-8 flex justify-center transition-colors ${
        isDark ? 'bg-slate-950' : 'bg-slate-100'
      }`}>
        {/* Centered Document Page Sheet */}
        <div
          style={{ minHeight }}
          className={`w-full max-w-4xl p-8 md:p-12 rounded-2xl shadow-xl border transition-all cursor-text ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/50'
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
          }`}
          onClick={() => editor.chain().focus().run()}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Document Footer Bar: Dynamic Word, Character, Read Time Stats */}
      <div className={`px-4 py-2 border-t flex flex-wrap items-center justify-between text-[11px] font-medium select-none ${
        isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
      }`}>
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">Google Docs / WPS Tiptap Suite</span>
          <span className="text-slate-400">| Drag & Drop / Ctrl+V Image Paste</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Words: <strong className="text-amber-500 font-bold">{words}</strong></span>
          <span>Chars: <strong className="text-amber-500 font-bold">{characters}</strong></span>
          <span>Read Time: <strong className="text-amber-500 font-bold">~{readTime}m</strong></span>
        </div>
      </div>
    </div>
  );
};
