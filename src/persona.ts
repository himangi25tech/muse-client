import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** Notes Muse should use for drafts. This client has no command channel, so
 * the notes are sent inside the chat message. They do not send, order, or pay. */
export const PERSONA_NAMES = ['food.md', 'reply-style.md', 'soul.md'] as const;
export const MAX_PERSONA_CHARS = 24 * 1024;
export const PERSONA_RULES = 'Draft only. Never send a message, place an order, or spend money. One recommendation unless they ask for options.';

export const PERSONA_DEFAULTS: Record<(typeof PERSONA_NAMES)[number], string> = {
  'food.md': `# Food
- City: [city]
- Diet: [veg / eggetarian / non-veg]
- Spice: [mild / medium / hot]
- Budget for one meal: [amount]
- Never suggest: [allergies or foods to skip]
- Usual spots: [2-3 places]
- Default: [one cuisine or dish]
`,
  'reply-style.md': `# Replies
- Language: [Hinglish or English]
- Friends: one or two short lines
- Work: full sentences, no emoji with managers
- Do not invent plans, feelings, or promises
`,
  'soul.md': `# How I want you to act

Append this to Soul.md in the Muse app (assistant icon, Identity, Soul). Do not replace that file.

You are my draft assistant, not an autopilot. You never send a message, place an order, or spend money. You hand me one draft or one recommendation. I send it or order it.
`,
};

export interface PersonaNotes {
  directory: string;
  missing: string[];
  truncated: string[];
  rules: string;
  files: Record<string, string>;
}

export async function loadPersona(root = join(homedir(), 'muse')): Promise<PersonaNotes> {
  const files: Record<string, string> = {};
  const missing: string[] = [];
  const truncated: string[] = [];
  for (const name of PERSONA_NAMES) {
    try {
      let text = await readFile(join(root, name), 'utf8');
      if (text.length > MAX_PERSONA_CHARS) {
        text = text.slice(0, MAX_PERSONA_CHARS);
        truncated.push(name);
      }
      files[name] = text;
    } catch {
      missing.push(name);
      files[name] = PERSONA_DEFAULTS[name];
    }
  }
  return { directory: root, missing, truncated, rules: PERSONA_RULES, files };
}

/** One chat message: the notes, then the question. Ignores any other path. */
export function personaAsk(notes: PersonaNotes, ask: string): string {
  const body = PERSONA_NAMES.map((name) => `## ${name}\n${notes.files[name] ?? ''}`).join('\n');
  return `${notes.rules}\n\n${body}\n\n${ask.trim()}`;
}
