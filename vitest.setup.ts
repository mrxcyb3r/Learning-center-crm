/**
 * Global vitest setup — replaces the bundled `.md?raw` corpus with physical
 * file reads so the knowledge layer is testable without a Vite server.
 *
 * This ONLY affects tests: at runtime/build the real `documents.ts` `?raw`
 * imports are bundled by Vite as intended.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { vi } from 'vitest';

const DOCS_DIR = join(process.cwd(), 'src', 'ai', 'knowledge', 'documents');

function collectRawDocs(): Array<{ id: string; raw: string }> {
  const out: Array<{ id: string; raw: string }> = [];
  const WAIT_DIRS = ['', 'faq', 'courses', 'teachers'];
  const seen = new Set<string>();
  for (const rel of WAIT_DIRS) {
    const abs = join(DOCS_DIR, rel);
    let files: string[] = [];
    try {
      files = readdirSync(abs);
    } catch {
      continue;
    }
    for (const f of files.sort()) {
      if (!f.endsWith('.md')) continue;
      const id = rel ? rel + '/' + f.slice(0, -3) : f.slice(0, -3);
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({ id, raw: readFileSync(join(abs, f), 'utf8') });
    }
  }
  return out;
}

vi.mock('./src/ai/knowledge/loader/documents', () => ({
  RAW_DOCUMENTS: collectRawDocs(),
}));