import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

// Enable JSON parsing with 25MB limit for Base64 multimodal uploads (images, audio)
app.use(express.json({ limit: '25mb' }));

// Lazy/Safe Gemini initialization
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) {
    console.warn('Warning: GEMINI_API_KEY is not configured in environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Exponential backoff retry helper
async function generateContentWithRetry(params: any, retries = 3, initialDelay = 1000) {
  const ai = getGeminiClient();
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent(params);
      return response;
    } catch (error: any) {
      const isRateLimit =
        error?.status === 429 ||
        error?.message?.includes('429') ||
        error?.message?.includes('RESOURCE_EXHAUSTED');
      if (isRateLimit && i < retries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Gemini 429 Rate Limit encountered. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Gemini API call failed after retries.');
}

// Global System Prompts for Teacher vs Student AI Personas
const TEACHER_SYSTEM_INSTRUCTION = `
You are the Executive Academic Assistant & IELTS/CEFR Co-Pilot for teachers at Renessans Learning Center.
YOUR ROLE & RESPONSIBILITIES:
1. Direct Generation: Draft comprehensive 60-minute lesson plans, practice exercise worksheets, quiz questions, and high-scoring sample Band 8.0/9.0 essays instantly upon request.
2. Automated Essay & Speaking Grading: Evaluate student submissions strictly against official IELTS Band Descriptors (Task Response / Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy).
3. OFFICIAL IELTS SCORING MANDATE: ALL individual band scores and overall band scores MUST strictly follow official IELTS band score increments (.0 or .5). Example valid scores: 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0. NEVER output non-standard decimals like 7.3 or 6.8.
4. Broadcast & Announcements: Draft polished broadcast messages for parents/students regarding test schedules, attendance, and center news.
TONE: Direct, efficient, highly professional, academic, and structured.
`;

const STUDENT_SYSTEM_INSTRUCTION = `
You are the Socratic Learning Coach & Tutor for students at Renessans Learning Center in Uzbekistan.
STRICT ACADEMIC INTEGRITY GUARDRAILS (NO CHEATING / NO DIRECT HOMEWORK SOLVING):
1. DO NOT give direct answers or complete homework assignments/essays for the student.
2. ENFORCE SOCRATIC GUIDANCE: Ask helpful leading questions, explain underlying grammar rules and formulas step-by-step, break down difficult vocabulary, and guide the student to arrive at the answer themselves.
3. WRITING FEEDBACK: Point out specific grammatical, structural, or lexical errors in student drafts and offer suggestions or similar examples WITHOUT rewriting the full text for them.
4. OFFICIAL IELTS SCORING MANDATE: When estimating student practice scores, ALL band scores MUST strictly adhere to official IELTS band score increments (.0 or .5).
TONE: Encouraging, patient, structured, and supportive.
`;

// --- API ROUTES ---

// 1. Universal Subject Coach with Grounding and Model selection
app.post('/api/ai/coach', async (req, res) => {
  try {
    const {
      prompt,
      contextHistory = [],
      userLanguage = 'uz',
      fileAttachment,
      role = 'student',
      enableWebSearch = false,
      model = 'gemini-3.6-flash',
      customSystemInstruction
    } = req.body;

    let systemInst = customSystemInstruction || (role === 'teacher' ? TEACHER_SYSTEM_INSTRUCTION : STUDENT_SYSTEM_INSTRUCTION);
    if (!customSystemInstruction && (role === 'admin' || role === 'superadmin')) {
      systemInst += `\nRole Context: You are assisting an Administrator. Help draft announcements, center news, communication copy, and summary reports.`;
    }

    systemInst += `\nTarget Language: ${userLanguage === 'uz' ? "O'zbekcha" : userLanguage === 'ru' ? 'Русский' : 'English'}`;

    const parts: any[] = [];

    if (fileAttachment?.inlineData?.data) {
      parts.push({
        inlineData: {
          data: fileAttachment.inlineData.data,
          mimeType: fileAttachment.inlineData.mimeType || 'image/jpeg',
        },
      });
    }

    if (contextHistory.length > 0) {
      const formattedHistory = contextHistory
        .map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
        .slice(-8)
        .join('\n');
      parts.push({ text: `Previous Conversation History:\n${formattedHistory}\n\nCurrent User Question: ${prompt}` });
    } else {
      parts.push({ text: prompt });
    }

    const config: any = {
      systemInstruction: systemInst,
      temperature: role === 'teacher' ? 0.3 : 0.7,
    };

    if (enableWebSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const selectedModel = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'].includes(model)
      ? model
      : 'gemini-3.6-flash';

    const response = await generateContentWithRetry({
      model: selectedModel,
      contents: { parts },
      config,
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({
      text: response.text || 'Kechirasiz, javob shakllantirishda muammo bo\'ldi.',
      groundingChunks
    });
  } catch (err: any) {
    console.error('API Error /api/ai/coach:', err);
    res.status(500).json({ error: err?.message || 'Gemini service error' });
  }
});

// 2. Study Document / Textbook OCR & Analysis
app.post('/api/ai/analyze-doc', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', questionPrompt = '', userLanguage = 'uz' } = req.body;

    const langName = userLanguage === 'uz' ? "O'zbekcha" : userLanguage === 'ru' ? 'Русский' : 'English';

    const promptText = `
Analyze this study document / textbook / exercise / draft image.
User Question / Instructions: "${questionPrompt}"

Perform OCR and analysis:
1. Transcribe or summarize the visible text/exercise.
2. Identify core concepts or subjects (e.g., IELTS Grammar, Math equation, Python code).
3. Apply the ACADEMIC INTEGRITY GUARDRAIL: Do NOT solve the homework directly. Explain the rule/formula, point out key errors or clues, and give a guided hint or similar step-by-step example.
4. Provide response in ${langName}.
`;

    const response = await generateContentWithRetry({
      model: 'gemini-3.6-flash',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: promptText },
        ],
      },
      config: {
        systemInstruction: STUDENT_SYSTEM_INSTRUCTION,
        temperature: 0.5,
      },
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error('API Error /api/ai/analyze-doc:', err);
    res.status(500).json({ error: err?.message || 'Document analysis failed' });
  }
});

// 3. IELTS Speaking Audio Evaluator
app.post('/api/ai/evaluate-speaking', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', partNumber = 1, userLanguage = 'uz' } = req.body;

    const langName = userLanguage === 'uz' ? "O'zbekcha" : userLanguage === 'ru' ? 'Русский' : 'English';

    const promptText = `
You are an official IELTS Speaking Examiner and Audio Evaluator.
Target Language for Feedback: ${langName}
Speaking Test Part: Part ${partNumber}

CRITICAL IELTS SCORING MANDATE: All individual criteria band scores and overall score MUST strictly be official IELTS band increments (.0 or .5). For example: 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0.

Instructions:
1. Transcribe the student's spoken audio accurately.
2. Evaluate performance across 4 official IELTS criteria:
   - Fluency & Coherence (Band 1.0 - 9.0, ending in .0 or .5)
   - Lexical Resource (Band 1.0 - 9.0, ending in .0 or .5)
   - Grammatical Range & Accuracy (Band 1.0 - 9.0, ending in .0 or .5)
   - Pronunciation & Intonation (Band 1.0 - 9.0, ending in .0 or .5)
3. Calculate Overall Band Score (strictly rounded to nearest .0 or .5 increment).
4. Provide detailed constructive coaching notes, highlighting grammar mistakes, fillers, and suggested vocabulary upgrades.

Format the response cleanly with Markdown headers and bullet points.
`;

    const response = await generateContentWithRetry({
      model: 'gemini-3.6-flash',
      contents: {
        parts: [
          { inlineData: { data: audioBase64, mimeType } },
          { text: promptText },
        ],
      },
      config: {
        systemInstruction: TEACHER_SYSTEM_INSTRUCTION,
        temperature: 0.3,
      },
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error('API Error /api/ai/evaluate-speaking:', err);
    res.status(500).json({ error: err?.message || 'Speaking evaluation failed' });
  }
});

// 4. Teacher IELTS Essay Grader
app.post('/api/ai/grade-essay', async (req, res) => {
  try {
    const { essayText, taskType = 'task2', rubricPrompt = '', userLanguage = 'uz' } = req.body;

    const langName = userLanguage === 'uz' ? "O'zbekcha" : userLanguage === 'ru' ? 'Русский' : 'English';

    const promptText = `
Grade this IELTS Writing ${taskType === 'task1' ? 'Task 1' : 'Task 2'} essay according to official IELTS assessment criteria.
Rubric/Prompt: "${rubricPrompt}"
Essay Content:
"""
${essayText}
"""

CRITICAL IELTS SCORING MANDATE: ALL sub-scores and overall scores MUST strictly end in official IELTS increments (.0 or .5). Examples: 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0. NEVER output non-standard decimals.

Evaluation requirements:
1. Provide individual Band Scores (1.0 - 9.0, .0 or .5 increments) for:
   - Task Achievement / Task Response
   - Coherence & Cohesion
   - Lexical Resource
   - Grammatical Range & Accuracy
2. Overall Band Score (strictly rounded to nearest .0 or .5).
3. Word Count check.
4. Detailed inline corrections (Grammar & Style).
5. Better vocabulary & phrase suggestions for the student to improve.
6. Provide response in ${langName}.
`;

    const response = await generateContentWithRetry({
      model: 'gemini-3.6-flash',
      contents: { parts: [{ text: promptText }] },
      config: {
        systemInstruction: TEACHER_SYSTEM_INSTRUCTION,
        temperature: 0.3,
      },
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error('API Error /api/ai/grade-essay:', err);
    res.status(500).json({ error: err?.message || 'Essay grading failed' });
  }
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Vite Middleware Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CenterFlow Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
