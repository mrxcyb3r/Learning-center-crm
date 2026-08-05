import { generateInsaneAIResponse, ChatMessage, FileAttachment } from './gemini';

export interface DiagnosticResult {
  fluencyScore: number;
  lexicalDiversityScore: number;
  grammarAccuracyScore: number;
  hesitationMarkersCount: number;
  overallBand: number;
  detailedFeedback: string;
  actionableTips: string[];
}

export interface CodeRefactorResult {
  originalCode: string;
  optimizedCode: string;
  language: string;
  bugsFound: string[];
  performanceImprovements: string[];
  explanation: string;
}

/**
 * Prompt Template 1: Speech Fluency & Vocabulary Diagnostic
 */
export async function diagnoseSpeechFluency(transcript: string, targetBand: number = 8.0): Promise<string> {
  const prompt = `Perform a comprehensive IELTS Band 8.5+ Speech Fluency & Vocabulary Diagnostic on the following speaking transcript:

TRANSCRIPT:
"${transcript}"

TARGET BAND: ${targetBand}

Please format your analysis cleanly in Markdown with the following sections:
### 🎙️ IELTS Speaking Diagnostic Report

1. **Fluency & Coherence Analysis**
   - Pauses & Hesitation Markers identified
   - Self-correction patterns and discourse markers used

2. **Lexical Resource & Vocabulary Precision**
   - Advanced topic-specific idioms and collocations used
   - Repetitive words and suggested C1/C2 upgrades

3. **Grammatical Range & Accuracy**
   - Complex clause structures evaluated
   - Minor grammatical or tense slips detected

4. **Estimated Sub-Scores Breakdown**
   - Fluency: /9.0
   - Lexical Resource: /9.0
   - Grammar: /9.0
   - **Overall Speaking Band**: /9.0

5. **Actionable Roadmap to Band ${targetBand}+**
   - 3 specific exercises to eliminate hesitations and boost cohesion.`;

  const response = await generateInsaneAIResponse({
    prompt,
    model: 'gemini-2.5-flash',
    enableWebSearch: false,
  });

  return response.text;
}

/**
 * Prompt Template 2: Automated Code Debugger & Refactoring
 */
export async function debugAndRefactorCode(codeSnippet: string, programmingLang: string = 'Python'): Promise<string> {
  const prompt = `Perform an Automated Code Debugging & Refactoring audit on the following ${programmingLang} logic:

CODE SNIPPET:
\`\`\`${programmingLang.toLowerCase()}
${codeSnippet}
\`\`\`

Please format your response cleanly in Markdown with the following sections:
### ⚡ CenterFlow Automated Code Debugger & Refactoring

1. **Bug & Syntax Audit**
   - Key edge cases, off-by-one errors, type mismatches, or syntax issues identified.

2. **Refactored & Production-Optimized Code**
   Provide the clean, readable, type-safe, and optimal implementation:
   \`\`\`${programmingLang.toLowerCase()}
   // Clean refactored implementation
   \`\`\`

3. **Performance & Complexity Improvements**
   - Time Complexity: Before vs. After
   - Space Complexity: Before vs. After

4. **Best Practice Recommendations**
   - Defensive checks, error handling, and clean modular structure advice.`;

  const response = await generateInsaneAIResponse({
    prompt,
    model: 'gemini-2.5-flash',
    enableWebSearch: false,
  });

  return response.text;
}

/**
 * Helper to generate Socratic Step-by-Step Hint without giving full answer
 */
export async function generateSocraticHint(contextMessage: string): Promise<string> {
  const prompt = `The student is asking for a Socratic hint regarding this problem/question:

QUESTION/CONTEXT:
"${contextMessage}"

CRITICAL INSTRUCTIONS:
- Do NOT provide the direct answer or final solution.
- Provide 1 clear, encouraging, step-by-step conceptual hint or guiding question to lead them to deduce the answer themselves.
- Keep it concise (2-3 sentences max).`;

  const response = await generateInsaneAIResponse({
    prompt,
    model: 'gemini-2.5-flash',
  });

  return response.text;
}

/**
 * Helper to export chat sessions to Markdown or JSON strings
 */
export function exportSessionToMarkdown(title: string, messages: ChatMessage[]): string {
  let md = `# 📘 CenterFlow Neural Copilot Session Export: ${title}\n`;
  md += `*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;

  messages.forEach((msg, idx) => {
    const roleLabel = msg.role === 'user' ? '👤 **Student / User**' : '🤖 **CenterFlow AI Copilot**';
    md += `### ${roleLabel}\n\n${msg.text}\n\n`;
    if (msg.attachment) {
      md += `*Attachment attached: ${msg.attachment.inlineData?.mimeType}*\n\n`;
    }
    md += `---\n\n`;
  });

  return md;
}

export function exportSessionToJSON(title: string, messages: ChatMessage[]): string {
  return JSON.stringify(
    {
      exportVersion: '2.5',
      title,
      exportedAt: new Date().toISOString(),
      messages,
    },
    null,
    2
  );
}
