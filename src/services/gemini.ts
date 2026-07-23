import { GoogleGenAI } from '@google/genai';

export type UserLanguage = 'uz' | 'en' | 'ru';
export type UserRole = 'student' | 'teacher' | 'admin' | 'superadmin' | 'guest';

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

// Universal Multimodal & Grounded AI Coach function
export async function generateInsaneAIResponse({
  prompt,
  history = [],
  fileAttachment = null,
  enableWebSearch = false,
  userLanguage = 'uz',
  model = 'gemini-3.6-flash',
  role = 'student'
}: {
  prompt: string;
  history?: ChatMessage[];
  fileAttachment?: FileAttachment | null;
  enableWebSearch?: boolean;
  userLanguage?: UserLanguage;
  model?: string;
  role?: UserRole;
}): Promise<AIResponseResult> {
  try {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        contextHistory: history,
        userLanguage,
        fileAttachment,
        role,
        enableWebSearch,
        model
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
    let systemInst = ACADEMIC_GUARDRAIL_SYSTEM_INSTRUCTION;
    if (role === 'teacher') {
      systemInst += `\nRole Context: You are assisting a Teacher. Help create lesson plans, quiz ideas, explanation analogies, and constructive grading feedback.`;
    } else if (role === 'admin' || role === 'superadmin') {
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
        .map((m) => `${m.role === 'user' ? 'Student' : 'Coach'}: ${m.text}`)
        .slice(-8)
        .join('\n');
      parts.push({ text: `Previous Conversation History:\n${formattedHistory}\n\nCurrent User Question: ${prompt}` });
    } else {
      parts.push({ text: prompt });
    }

    const config: any = {
      systemInstruction: systemInst,
      temperature: 0.7,
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

// Client-side fallback initialization if needed
const getClientGeminiSDK = () => {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

// Exponential backoff helper for client-side fallback
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
