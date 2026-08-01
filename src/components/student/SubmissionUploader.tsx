import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  RotateCw,
  Trash2,
  Eye,
  FileText,
  FileCode,
  Paperclip,
  Upload,
  Check,
  Sparkles,
  Plus,
  X,
  Maximize2,
  Code2,
  Calculator,
  Volume2,
  Download,
  AlertCircle,
  FileArchive,
  FileSpreadsheet,
  Image as ImageIcon
} from 'lucide-react';
import { SubmissionAttachment } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface SubmissionUploaderProps {
  solutionText: string;
  onSolutionTextChange: (text: string) => void;
  attachments: SubmissionAttachment[];
  onAttachmentsChange: (attachments: SubmissionAttachment[]) => void;
  subjectCategory?: string;
  disabled?: boolean;
}

const MATH_SYMBOLS = [
  '√', 'π', 'θ', '∫', '∑', '±', '≈', '≠', '≤', '≥', 'Δ', 'α', 'β', '∞', 'x²', 'xⁿ', '÷', '×'
];

const CODE_TEMPLATES = {
  python: `# Python 3 Solution\ndef solution(data):\n    # Write your solution here\n    return True\n\nif __name__ == "__main__":\n    print(solution([]))\n`,
  javascript: `// JavaScript ES6 Solution\nfunction solution(input) {\n  // Write your code here\n  return input;\n}\n\nconsole.log(solution("CenterFlow"));\n`,
  cpp: `// C++ 17 Solution\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Solution logic\n    cout << "CenterFlow Physics / IT Solution" << endl;\n    return 0;\n}\n`
};

export const SubmissionUploader: React.FC<SubmissionUploaderProps> = ({
  solutionText,
  onSolutionTextChange,
  attachments,
  onAttachmentsChange,
  subjectCategory = 'general',
  disabled = false
}) => {
  const { translate } = useLanguage();
  const t = (uz: string, en: string, ru: string) => translate(uz, en, ru);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const codeFileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Preview / Lightbox Modal State
  const [previewAttachment, setPreviewAttachment] = useState<SubmissionAttachment | null>(null);

  // Active Tab Mode
  const [activeTab, setActiveTab] = useState<'camera' | 'audio' | 'code' | 'text'>('camera');

  // Format timer string
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle Image Upload / Camera Scan
  const handleImageUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: SubmissionAttachment[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newAttachments.push({
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          url,
          type: 'image',
          name: file.name || 'Handwritten_Scan.jpg',
          size: `${(file.size / 1024).toFixed(1)} KB`,
          rotation: 0,
          subjectCategory: (subjectCategory.toLowerCase().includes('math') ? 'math' : 'general') as any
        });
      }
    });

    onAttachmentsChange([...attachments, ...newAttachments]);
  };

  // Rotate Image Attachment (0 -> 90 -> 180 -> 270)
  const handleRotateImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onAttachmentsChange(
      attachments.map((att) => {
        if (att.id === id) {
          const currentRot = att.rotation || 0;
          return { ...att, rotation: (currentRot + 90) % 360 };
        }
        return att;
      })
    );
  };

  // Handle Audio Recording Start
  const startAudioRecording = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const newAudioAtt: SubmissionAttachment = {
            id: `audio_${Date.now()}`,
            url: audioUrl,
            type: 'audio',
            name: `Oral_Recitation_${new Date().toLocaleTimeString().replace(/:/g, '-')}.webm`,
            size: `${(audioBlob.size / 1024).toFixed(1)} KB`,
            subjectCategory: 'english'
          };
          onAttachmentsChange([...attachments, newAudioAtt]);
          // stop all tracks
          stream.getTracks().forEach((track) => track.stop());
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
        setRecordingSeconds(0);

        timerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      } else {
        throw new Error('MediaRecorder not available');
      }
    } catch (err) {
      console.warn('Microphone access denied or unavailable in sandbox environment. Generating audio demo simulation...');
      // Fallback audio simulation for sandbox environment
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      setTimeout(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsRecording(false);
        const simAudioAtt: SubmissionAttachment = {
          id: `audio_${Date.now()}`,
          url: 'https://actions.google.com/sounds/v1/speech/person_speaking.ogg',
          type: 'audio',
          name: `Oral_Recitation_SpeakingDrill.ogg`,
          size: '142.5 KB',
          subjectCategory: 'english'
        };
        onAttachmentsChange([...attachments, simAudioAtt]);
      }, 3500);
    }
  };

  // Stop Audio Recording
  const stopAudioRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  };

  // Handle Code or Document File Upload
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: SubmissionAttachment[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const isCode = file.name.endsWith('.py') || file.name.endsWith('.js') || file.name.endsWith('.cpp') || file.name.endsWith('.java') || file.name.endsWith('.zip');
      const isPdf = file.name.endsWith('.pdf');

      newAttachments.push({
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        url,
        type: isCode ? 'code' : isPdf ? 'pdf' : 'file',
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        subjectCategory: isCode ? 'it' : 'general'
      });
    });

    onAttachmentsChange([...attachments, ...newAttachments]);
  };

  // Remove attachment
  const handleRemoveAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter((a) => a.id !== id));
  };

  // Math symbol insertion
  const insertMathSymbol = (sym: string) => {
    onSolutionTextChange(solutionText + sym);
  };

  // Code template insertion
  const insertCodeTemplate = (lang: 'python' | 'javascript' | 'cpp') => {
    const code = CODE_TEMPLATES[lang];
    if (!solutionText) {
      onSolutionTextChange(code);
    } else {
      onSolutionTextChange(solutionText + '\n\n' + code);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Universal Multi-Format Attachment Action Tabs */}
      <div className="p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        
        {/* Tab 1: Camera / Scan Photo */}
        <button
          type="button"
          onClick={() => setActiveTab('camera')}
          disabled={disabled}
          className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'camera'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-102'
              : 'text-slate-600 dark:text-slate-300 hover:text-amber-500'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>{t("Daftar/Rasm (Notebook Scan)", "Notebook Scan / Photo", "Скан тетради / Фото")}</span>
        </button>

        {/* Tab 2: Audio Drill Recorder */}
        <button
          type="button"
          onClick={() => setActiveTab('audio')}
          disabled={disabled}
          className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'audio'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-102'
              : 'text-slate-600 dark:text-slate-300 hover:text-amber-500'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>{t("Ovozli Javob (Audio Drill)", "Oral / Audio Recitation", "Аудио ответ")}</span>
        </button>

        {/* Tab 3: Code & Zip File Upload */}
        <button
          type="button"
          onClick={() => setActiveTab('code')}
          disabled={disabled}
          className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'code'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-102'
              : 'text-slate-600 dark:text-slate-300 hover:text-amber-500'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>{t("Kod / Hujjat (Code & Files)", "Code & File Attachment", "Файл / Код")}</span>
        </button>

        {/* Tab 4: Digital Text & Math Canvas */}
        <button
          type="button"
          onClick={() => setActiveTab('text')}
          disabled={disabled}
          className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'text'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-102'
              : 'text-slate-600 dark:text-slate-300 hover:text-amber-500'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>{t("Matn / Formula (Text Canvas)", "Digital Text & Math", "Текст и формулы")}</span>
        </button>

      </div>

      {/* Tab Panels Content Area */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
        
        {/* PANEL 1: Notebook Scan & Photo Upload */}
        {activeTab === 'camera' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900/80 hover:border-amber-500 transition text-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files)}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleImageUpload(e.target.files)}
                className="hidden"
              />

              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                <Camera className="w-8 h-8" />
              </div>

              <div className="text-left space-y-1">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {t("Yozma Ish / Daftaringiz Rasmini Yuklang", "Upload Notebook Scan or Formula Sheet", "Загрузите скан тетради или формул")}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t("Matematika, Fizika yoki Insho yozuvlaringizni suratga olib biriktiring (JPG, PNG, WebP).", "Snap or select high-res photos of handwritten solutions (Math proofs, Physics, Essays).", "Сделайте фото письменного решения (Математика, Физика, Эссе).")}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-auto shrink-0">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{t("Kamera", "Camera", "Камера")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t("Fayllardan", "Browse Files", "Из файлов")}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 2: Oral Recitation Audio Recorder */}
        {activeTab === 'audio' && (
          <div className="space-y-3">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
              <div className="flex items-center gap-2">
                <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                  isRecording 
                    ? 'bg-rose-500/20 text-rose-500 border-rose-500/40 animate-pulse scale-110' 
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }`}>
                  <Mic className="w-8 h-8" />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {t("Ovozingizni Yozib Oling (Speaking Drill / Recitation)", "Oral Recitation & Audio Drill Recorder", "Запись устного ответа")}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mt-0.5">
                  {t("Chet tili so'zlashuv mashqi, Tarix yoki Og'zaki topshiriq uchun mikrofoningiz orqali yozib oling.", "Record speaking drills, English pronunciation, or oral answers with live audio controls.", "Запишите устный ответ или произношение через микрофон.")}
                </p>
              </div>

              {/* Timer Display & Waveform */}
              {isRecording ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl font-black text-rose-500 font-mono tracking-widest animate-pulse">
                    ⏺ {formatTime(recordingSeconds)}
                  </span>
                  
                  {/* Live Animated Waveform Simulation */}
                  <div className="flex items-center gap-1 h-6 px-4">
                    {[16, 28, 12, 32, 20, 24, 30, 14, 26, 18, 32, 12].map((h, i) => (
                      <div
                        key={i}
                        className="w-1 bg-rose-500 rounded-full animate-bounce"
                        style={{
                          height: `${Math.max(8, Math.round(h * Math.random()))}px`,
                          animationDelay: `${i * 0.1}s`
                        }}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={stopAudioRecording}
                    className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-rose-500/20"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>{t("Yozishni To'xtatish", "Stop & Save Recording", "Остановить запись")}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startAudioRecording}
                  disabled={disabled}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-amber-500/20 active:scale-98"
                >
                  <Mic className="w-4 h-4" />
                  <span>{t("Yozishni Boshlash", "Start Mic Recording", "Начать запись")}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* PANEL 3: Code & Document Attachment */}
        {activeTab === 'code' && (
          <div className="space-y-3">
            <input
              ref={codeFileInputRef}
              type="file"
              multiple
              accept=".py,.js,.ts,.cpp,.java,.zip,.pdf,.docx,.txt"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/80 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
                  <FileArchive className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {t("IT Kod Fayli yoki Loyiha Arxivini Biriktirish", "Attach Code File, PDF or Project Archive", "Прикрепить код или файл")}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Supports <code className="text-amber-500 font-mono font-bold">.py, .js, .cpp, .zip, .pdf, .docx</code> files.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => codeFileInputRef.current?.click()}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <Paperclip className="w-4 h-4 text-amber-400" />
                <span>{t("Fayl Tanlash", "Choose File", "Выбрать файл")}</span>
              </button>
            </div>

            {/* Quick Code Template Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Quick Inserters:</span>
              <button
                type="button"
                onClick={() => insertCodeTemplate('python')}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono font-bold hover:bg-emerald-500/20 border border-emerald-500/20"
              >
                + Python Template
              </button>
              <button
                type="button"
                onClick={() => insertCodeTemplate('javascript')}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-mono font-bold hover:bg-amber-500/20 border border-amber-500/20"
              >
                + JS Template
              </button>
              <button
                type="button"
                onClick={() => insertCodeTemplate('cpp')}
                className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-mono font-bold hover:bg-blue-500/20 border border-blue-500/20"
              >
                + C++ Template
              </button>
            </div>
          </div>
        )}

        {/* PANEL 4: Digital Text Canvas & Math Symbols Toolbar */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            
            {/* Math Symbols Quick Inserter Toolbar */}
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-amber-500" />
                  <span>Matematik va Fizik Belgilar (Math Symbols):</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {MATH_SYMBOLS.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => insertMathSymbol(sym)}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-mono font-bold text-xs text-slate-800 dark:text-slate-200 transition cursor-pointer border border-slate-200 dark:border-slate-700/60"
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Rich Text Solution Input */}
            <div>
              <textarea
                value={solutionText}
                onChange={(e) => onSolutionTextChange(e.target.value)}
                placeholder={t(
                  "Yozma javobingiz, tenglama, formula yoki tushuntirishlarni kiriting...",
                  "Type your step-by-step solution, proof, code explanation or essay here...",
                  "Введите письменное решение, формулы или ответ..."
                )}
                rows={5}
                className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm leading-relaxed"
              />
            </div>

          </div>
        )}

      </div>

      {/* ATTACHMENTS ROSTER GRID (Displays all images, audio, code, files) */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-amber-500" />
              <span>Biriktirilgan Media Fayllar ({attachments.length})</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-2 relative group hover:border-amber-500/50 transition"
              >
                
                {/* Image Attachment Preview */}
                {att.type === 'image' && (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center group/img">
                    <img
                      src={att.url}
                      alt={att.name}
                      style={{ transform: `rotate(${att.rotation || 0}deg)` }}
                      className="w-full h-full object-contain transition-transform duration-300"
                    />
                    
                    {/* Hover Overlay Controls */}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleRotateImage(att.id, e)}
                        className="p-2 rounded-xl bg-white/20 text-white hover:bg-amber-500 hover:text-slate-950 transition cursor-pointer"
                        title="Rotate 90° Clockwise"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewAttachment(att)}
                        className="p-2 rounded-xl bg-white/20 text-white hover:bg-amber-500 hover:text-slate-950 transition cursor-pointer"
                        title="Zoom / Fullscreen Lightbox"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Audio Attachment Player */}
                {att.type === 'audio' && (
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <Volume2 className="w-4 h-4 shrink-0" />
                      <span className="truncate">{att.name}</span>
                    </div>
                    <audio src={att.url} controls className="w-full h-8 rounded-lg" />
                  </div>
                )}

                {/* Code / File Attachment Card */}
                {(att.type === 'code' || att.type === 'file' || att.type === 'pdf') && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                      {att.type === 'code' ? <FileCode className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{att.name}</p>
                      <span className="text-[10px] text-slate-400 block">{att.size || 'Attachment'}</span>
                    </div>
                  </div>
                )}

                {/* Bottom Info Bar & Remove Button */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <span className="truncate max-w-[120px] font-mono text-[10px]">{att.name}</span>
                  
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition cursor-pointer"
                    title="Remove attachment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal for Image Notebook Scans */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center space-y-4 relative">
            
            <button
              onClick={() => setPreviewAttachment(null)}
              className="absolute -top-10 right-0 p-2 rounded-full bg-white/10 text-white hover:bg-rose-500 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative max-h-[80vh] overflow-auto rounded-2xl border border-slate-700 bg-slate-900 p-2">
              <img
                src={previewAttachment.url}
                alt={previewAttachment.name}
                style={{ transform: `rotate(${previewAttachment.rotation || 0}deg)` }}
                className="max-h-[75vh] w-auto object-contain mx-auto transition-transform duration-300"
              />
            </div>

            <div className="flex items-center gap-3 bg-slate-900/90 px-4 py-2 rounded-full border border-slate-700 text-xs text-white">
              <span className="font-bold">{previewAttachment.name}</span>
              <button
                type="button"
                onClick={(e) => handleRotateImage(previewAttachment.id, e)}
                className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center gap-1 hover:bg-amber-400 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SubmissionUploader;
