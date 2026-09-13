import { GoogleGenAI } from '@google/genai';
import { auth } from './firebase';

/** Attach the Firebase ID token so the server AI proxy can authenticate the caller. */
async function aiAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch {
    // Anonymous caller — the server returns 401 and callers fall back safely.
  }
  return headers;
}

export type UserLanguage = 'uz' | 'en' | 'ru';
export type UserRole = 'student' | 'teacher' | 'admin' | 'superadmin' | 'support' | 'receptionist' | 'guest';

export interface FileAttachment {
  inlineData: {
    data: string; // Base64
    mimeType: string;
  };
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  attachment?: FileAttachment;
  groundingChunks?: GroundingChunk[];
}

export interface AIResponseResult {
  text: string;
  groundingChunks?: GroundingChunk[];
}

// Official IELTS Band Score Rounding (.0 or .5 steps)
export function roundToIELTSBand(rawScore: number): number {
  if (isNaN(rawScore) || rawScore <= 0) return 0;
  const floor = Math.floor(rawScore);
  const diff = rawScore - floor;
  if (diff < 0.25) {
    return floor;
  } else if (diff < 0.75) {
    return floor + 0.5;
  } else {
    return floor + 1;
  }
}

export const TEACHER_SYSTEM_INSTRUCTION = `
You are the Executive Academic Assistant & IELTS/CEFR Co-Pilot for teachers at Renessans Learning Center.
YOUR ROLE & RESPONSIBILITIES:
1. Direct Generation: Draft comprehensive 60-minute lesson plans, practice exercise worksheets, quiz questions, and high-scoring sample Band 8.0/9.0 essays instantly upon request.
2. Automated Essay & Speaking Grading: Evaluate student submissions strictly against official IELTS Band Descriptors (Task Response / Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy).
3. OFFICIAL IELTS SCORING MANDATE: ALL individual band scores and overall band scores MUST strictly follow official IELTS band score increments (.0 or .5). Example valid scores: 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0. NEVER output non-standard decimals like 7.3 or 6.8.
4. Broadcast & Announcements: Draft polished broadcast messages for parents/students regarding test schedules, attendance, and center news.
TONE: Direct, efficient, highly professional, academic, and structured.
`;

export const STUDENT_SYSTEM_INSTRUCTION = `
You are the Socratic Learning Coach & Tutor for students at Renessans Learning Center in Uzbekistan.
STRICT ACADEMIC INTEGRITY GUARDRAILS (NO CHEATING / NO DIRECT HOMEWORK SOLVING):
1. DO NOT give direct answers or complete homework assignments/essays for the student.
2. ENFORCE SOCRATIC GUIDANCE: Ask helpful leading questions, explain underlying grammar rules and formulas step-by-step, break down difficult vocabulary, and guide the student to arrive at the answer themselves.
3. WRITING FEEDBACK: Point out specific grammatical, structural, or lexical errors in student drafts and offer suggestions or similar examples WITHOUT rewriting the full text for them.
4. OFFICIAL IELTS SCORING MANDATE: When estimating student practice scores, ALL band scores MUST strictly adhere to official IELTS band score increments (.0 or .5).
TONE: Encouraging, patient, structured, and supportive.
`;

// Universal Multimodal & Grounded AI Coach function
export async function generateInsaneAIResponse({
  prompt,
  history = [],
  fileAttachment = null,
  enableWebSearch = false,
  userLanguage = 'uz',
  model = 'gemini-3.6-flash',
  role = 'student',
  customSystemInstruction
}: {
  prompt: string;
  history?: ChatMessage[];
  fileAttachment?: FileAttachment | null;
  enableWebSearch?: boolean;
  userLanguage?: UserLanguage;
  model?: string;
  role?: UserRole;
  customSystemInstruction?: string;
}): Promise<AIResponseResult> {
  try {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: await aiAuthHeaders(),
      body: JSON.stringify({
        prompt,
        contextHistory: history,
        userLanguage,
        fileAttachment,
        role,
        enableWebSearch,
        model,
        customSystemInstruction
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.text) {
        return {
          text: data.text,
          groundingChunks: data.groundingChunks || []
        };
      }
    }
  } catch (err) {
    console.warn('Server endpoint /api/ai/coach unreachable, trying direct client fallback:', err);
  }

  // Client-side Fallback
  return callClientSDKWithRetry(async (ai) => {
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

    if (history.length > 0) {
      const formattedHistory = history
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
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

    const response = await ai.models.generateContent({
      model: model || 'gemini-3.6-flash',
      contents: { parts },
      config,
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return {
      text: response.text || 'Javob shakllantirib bo\'lmadi.',
      groundingChunks: chunks
    };
  });
}

// Client-side fallback initialization
const getClientGeminiSDK = () => {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

async function callClientSDKWithRetry(fn: (ai: GoogleGenAI) => Promise<any>, retries = 3, initialDelay = 1000) {
  const ai = getClientGeminiSDK();
  if (!ai) {
    throw new Error('No Gemini API key available on server or client env.');
  }

  for (let i = 0; i < retries; i++) {
    try {
      return await fn(ai);
    } catch (err: any) {
      const is429 = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED');
      if (is429 && i < retries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Gemini client call failed after retries.');
}

const ACADEMIC_GUARDRAIL_SYSTEM_INSTRUCTION = `
You are the Prime Learning Coach for Renessans Learning Center in Uzbekistan. You are friendly, highly knowledgeable in English (IELTS/CEFR), Mathematics, Physics, General Science, and IT/Python Dasturlash.

STRICT ACADEMIC INTEGRITY GUARDRAIL (NO HOMEWORK SOLVING):
- Do NOT provide direct answers or complete assignments/homework solutions for students.
- If a student uploads an image, audio file, or text of a homework exercise, test, or quiz:
  1. Identify the core concepts, grammar rules, or mathematical/algorithmic principles involved.
  2. Provide a similar, step-by-step example problem to illustrate how to solve it.
  3. Guide the student with hint questions or constructive feedback to help them solve their own assignment.
  4. Explicitly state: "I am here to coach and help you learn! Try working through this step using the hints above, and show me your answer so I can check it."

Language Requirement: Always detect and respond in the user's requested language (Uzbek, English, or Russian).
`;

/**
 * 1. Universal Subject Coach & Learning Assistant
 */
export async function askAICoach(
  prompt: string,
  contextHistory: ChatMessage[] = [],
  userLanguage: UserLanguage = 'uz',
  fileAttachment?: FileAttachment,
  role: UserRole = 'student'
): Promise<string> {
  const result = await generateInsaneAIResponse({
    prompt,
    history: contextHistory,
    fileAttachment: fileAttachment || null,
    userLanguage,
    role
  });
  return result.text;
}

/**
 * 2. Image & Document OCR Analysis (Textbooks, Notes, Drafts)
 */
export async function analyzeStudyDocument(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  questionPrompt: string = '',
  userLanguage: UserLanguage = 'uz'
): Promise<string> {
  try {
    const res = await fetch('/api/ai/analyze-doc', {
      method: 'POST',
      headers: await aiAuthHeaders(),
      body: JSON.stringify({ imageBase64, mimeType, questionPrompt, userLanguage }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.text) return data.text;
    }
  } catch (err) {
    console.warn('Server endpoint /api/ai/analyze-doc unreachable, falling back to SDK:', err);
  }

  return callClientSDKWithRetry(async (ai) => {
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: promptText },
        ],
      },
      config: {
        systemInstruction: ACADEMIC_GUARDRAIL_SYSTEM_INSTRUCTION,
        temperature: 0.5,
      },
    });

    return response.text || 'Document analysis completed with no text output.';
  });
}

/**
 * 3. IELTS Speaking Audio Evaluator (Voice to Analysis)
 */
export async function evaluateSpeakingAudio(
  audioBase64: string,
  mimeType: string = 'audio/webm',
  partNumber: 1 | 2 | 3 = 1,
  userLanguage: UserLanguage = 'uz'
): Promise<string> {
  try {
    const res = await fetch('/api/ai/evaluate-speaking', {
      method: 'POST',
      headers: await aiAuthHeaders(),
      body: JSON.stringify({ audioBase64, mimeType, partNumber, userLanguage }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.text) return data.text;
    }
  } catch (err) {
    console.warn('Server endpoint /api/ai/evaluate-speaking unreachable, falling back to SDK:', err);
  }

  return callClientSDKWithRetry(async (ai) => {
    const langName = userLanguage === 'uz' ? "O'zbekcha" : userLanguage === 'ru' ? 'Русский' : 'English';
    const promptText = `
You are an official IELTS Speaking Examiner and Audio Evaluator.
Target Language for Feedback: ${langName}
Speaking Test Part: Part ${partNumber}

Instructions:
1. Transcribe the student's spoken audio accurately.
2. Evaluate performance across 4 official IELTS criteria:
   - Fluency & Coherence (Band 1.0 - 9.0)
   - Lexical Resource (Band 1.0 - 9.0)
   - Grammatical Range & Accuracy (Band 1.0 - 9.0)
   - Pronunciation & Intonation (Band 1.0 - 9.0)
3. Calculate Overall Band Score (rounded to nearest 0.5).
4. Provide detailed constructive coaching notes, highlighting grammar mistakes, fillers, and suggested vocabulary upgrades.

Format the response cleanly with Markdown headers and bullet points.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: {
        parts: [
          { inlineData: { data: audioBase64, mimeType } },
          { text: promptText },
        ],
      },
      config: {
        systemInstruction: "You are an expert IELTS Speaking Examiner. Be accurate, encouraging, and detailed.",
        temperature: 0.4,
      },
    });

    return response.text || 'Audio evaluation completed.';
  });
}

/**
 * 4. Teacher IELTS Essay & Lesson Assistant
 */
export async function gradeIELTSEssay(
  essayText: string,
  taskType: 'task1' | 'task2' = 'task2',
  rubricPrompt: string = '',
  userLanguage: UserLanguage = 'uz'
): Promise<string> {
  try {
    const res = await fetch('/api/ai/grade-essay', {
      method: 'POST',
      headers: await aiAuthHeaders(),
      body: JSON.stringify({ essayText, taskType, rubricPrompt, userLanguage }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.text) return data.text;
    }
  } catch (err) {
    console.warn('Server endpoint /api/ai/grade-essay unreachable, falling back to SDK:', err);
  }

  return callClientSDKWithRetry(async (ai) => {
    const langName = userLanguage === 'uz' ? "O'zbekcha" : userLanguage === 'ru' ? 'Русский' : 'English';
    const promptText = `
Grade this IELTS Writing ${taskType === 'task1' ? 'Task 1' : 'Task 2'} essay according to official IELTS assessment criteria.
Rubric/Prompt: "${rubricPrompt}"
Essay Content:
"""
${essayText}
"""

Evaluation requirements:
1. Provide individual Band Scores (1.0 - 9.0) for:
   - Task Achievement / Task Response
   - Coherence & Cohesion
   - Lexical Resource
   - Grammatical Range & Accuracy
2. Overall Band Score.
3. Word Count check.
4. Detailed inline corrections (Grammar & Style).
5. Better vocabulary & phrase suggestions for the student to improve.
6. Provide response in ${langName}.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts: [{ text: promptText }] },
      config: {
        systemInstruction: "You are a master IELTS Writing Assessor. Provide clear, professional, structured criteria evaluation.",
        temperature: 0.3,
      },
    });

    return response.text || 'Essay evaluation completed.';
  });
}

export async function polishLandingCopy(
  inputText: string,
  targetLanguage: UserLanguage = 'en'
): Promise<string> {
  if (!inputText.trim()) return inputText;

  const systemInstruction = `You are a senior ed-tech copywriter. Enhance the input text to make it compelling, grammatically flawless, professional, and engaging for prospective students while maintaining its core meaning. Return only the polished text in English, Uzbek, or Russian as requested. Do not include quotes, extra intro text, or markdown code blocks.`;

  try {
    const res = await generateInsaneAIResponse({
      prompt: `Polish and enhance this text in ${targetLanguage === 'uz' ? "Uzbek (O'zbekcha)" : targetLanguage === 'ru' ? 'Russian (Русский)' : 'English'}:\n"""${inputText}"""`,
      userLanguage: targetLanguage,
      customSystemInstruction: systemInstruction,
      model: 'gemini-3.6-flash',
      role: 'admin'
    });
    return res.text.replace(/^["'\s]+|["'\s]+$/g, '');
  } catch (err) {
    console.error('Error polishing text with Gemini:', err);
    return inputText;
  }
}

