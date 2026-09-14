import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

/** Env first, optional gitignored local key file as fallback if present. Never crash if absent. */
function getReceptionistApiKey(): string {
  const fromEnv = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
  if (fromEnv) return fromEnv;

  try {
    const localKeyPath = path.join(process.cwd(), 'server', 'geminiKey.local.ts');
    if (fs.existsSync(localKeyPath)) {
      const content = fs.readFileSync(localKeyPath, 'utf8');
      const match = content.match(/LOCAL_GEMINI_API_KEY\s*=\s*['"`]([^'"`]+)['"`]/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  } catch {
    // Ignore local read errors safely
  }

  return '';
}

const VALID_INTENTS = [
  'course_price',
  'course_description',
  'course_schedule',
  'course_duration',
  'course_teacher',
  'course_availability',
  'branch_address',
  'working_hours',
  'trial_lesson',
  'faq',
  'contact_info',
  'teacher_info',
  'admission',
  'level_placement',
  'results_grants',
  'payment_methods',
  'recommendation',
] as const;

function normalizeIntent(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const lower = raw.toLowerCase().trim();
  if (VALID_INTENTS.includes(lower as any)) return lower;
  return null;
}

const SYSTEM_INSTRUCTION = `
You are the Renessans Learning Center AI Receptionist.

Your role is to answer simple, factual questions from parents and students about the center using ONLY the verified CenterFlow data provided in the "Verified CenterFlow Data" section below.

CORE RULES (STRICTLY ENFORCED):
1. Answer ONLY from the verified CenterFlow data below — NEVER invent prices, schedules, teachers, branches, or policies.
2. If the verified data does not contain the answer, MUST respond with: "Bu savol bo'yicha aniq ma'lumotim yo'q. Murojaatingizni operatorimizga yuboraman."
3. Never make financial decisions (refunds, discounts, payments).
4. Never make administrative decisions (policy exceptions, staff issues).
5. Never provide private/internal information.
6. Always be concise and professional in Uzbek by default. Respond in the user's language if Russian or English is used.
7. If a question requires teacher expertise, mention that it will be escalated.
8. If a question requires business/financial/admin authority, mention it will be escalated.

RESPONSE STYLE:
- Be natural and helpful, NOT robotic or template-like
- Use Uzbek primarily, but respond in Russian or English if the user writes in those languages
- Never say "I don't know" without offering the fallback
- Always prefer verified CenterFlow information

CONVERSATION FLOW:
- User asks question
- AI retrieves verified data
- AI generates answer from data only
- If data unavailable → fallback message + escalation to receptionist
- Receptionist can then take over manually

You will be provided with "Verified CenterFlow Data" below. Use ONLY that information. Do not reference or access any other data sources.
`;

// ---------------------------------------------------------------------------
// Rate limiting — simple in-memory sliding window per IP.
// ---------------------------------------------------------------------------
const MAX_QUESTION_CHARS = 1000;
const MAX_CONTEXT_CHARS = 8000;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 15; // per window per IP
const LLM_TIMEOUT_MS = 30_000;
const MAX_LLM_RETRIES = 1;

interface RateBucket {
  count: number;
  windowStart: number;
}
const rateBuckets = new Map<string, RateBucket>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(ip, { count: 1, windowStart: now });
    return true;
  }
  bucket.count++;
  return bucket.count <= RATE_LIMIT_MAX;
}

// Periodic cleanup so the map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of rateBuckets) {
    if (now - bucket.windowStart > RATE_LIMIT_WINDOW_MS * 2) rateBuckets.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS * 2).unref();

// ---------------------------------------------------------------------------
// Gemini call with timeout + retry on 429.
// ---------------------------------------------------------------------------
async function callGemini(
  ai: GoogleGenAI,
  prompt: string,
  retries = MAX_LLM_RETRIES
): Promise<string> {
  const attempt = async (): Promise<string> => {
    const result = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini timeout')), LLM_TIMEOUT_MS)
      ),
    ]);
    return (result.text || '').trim();
  };

  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await attempt();
    } catch (err: any) {
      lastErr = err;
      const status = err?.status || err?.code || 0;
      if (status === 429 && i < retries) {
        // Exponential backoff: 1s, 2s
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export function aiReceptionistRouter() {
  const router = Router();

  const handleReceptionist = async (req: Request, res: Response) => {
    try {
      const ip = (req.ip || req.socket.remoteAddress || 'unknown').replace(/::ffff:/, '');

      // Rate limit.
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: "Juda ko'p so'rov. Iltimos, biroz kutib qayta urinib ko'ring." });
      }

      const { question, context, intent } = req.body || {};

      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        return res.status(400).json({ error: 'Savol kiritilishi shart.' });
      }

      if (question.length > MAX_QUESTION_CHARS) {
        return res.status(400).json({ error: "Savol juda uzun — iltimos, qisqartiring." });
      }

      if (!context || typeof context !== 'string' || context.trim().length === 0) {
        return res.status(400).json({ error: 'Kontext talab qilinadi.' });
      }

      if (context.length > MAX_CONTEXT_CHARS) {
        return res.status(400).json({ error: "Kontext hajmi chegaradan oshib ketdi." });
      }

      const validIntent = normalizeIntent(intent);
      if (!validIntent) {
        return res.status(400).json({ error: 'Nazorati noto\'g\'ri.' });
      }

      const apiKey = getReceptionistApiKey();
      if (!apiKey) {
        return res.json({
          text: 'Bu savol bo\'yicha aniq ma\'lumotim yo\'q. Murojaatingizni operatorimizga yuboraman.',
          fallback: true,
          source: 'no_ai_config'
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build-centerflow',
          },
        },
      });

      const prompt = `
${SYSTEM_INSTRUCTION}

Foydalanuvchi savoni: "${question}"

Verified CenterFlow Data:
${context}

Based on the verified data above, provide a concise answer in Uzbek (or the user's language). If the data does not suffice, respond exactly with:
"Bu savol bo'yicha aniq ma'lumotim yo'q. Murojaatingizni operatorimizga yuboraman."

Answer:
`;

      const text = await callGemini(ai, prompt);

      if (!text) {
        return res.json({
          text: 'Bu savol bo\'yicha aniq ma\'lumotim yo\'q. Murojaatingizni operatorimizga yuboraman.',
          fallback: true,
          source: 'empty_model_output'
        });
      }

      res.json({
        text,
        fallback: false,
        source: 'gemini'
      });
    } catch (err: any) {
      // Safe logging — never log the question content.
      const status = err?.status || err?.code || 'unknown';
      console.error('[AI RECEPTIONIST] Error:', { status, message: err?.message || String(err) });
      res.json({
        text: 'Bu savol bo\'yicha aniq ma\'lumotim yo\'q. Murojaatingizni operatorimizga yuboraman.',
        fallback: true,
        source: 'error_fallback'
      });
    }
  };

  router.post('/', handleReceptionist);
  router.post('/ai/receptionist', handleReceptionist);

  return router;
}

export default aiReceptionistRouter;
