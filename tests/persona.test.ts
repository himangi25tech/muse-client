import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadPersona, personaAsk, PERSONA_RULES } from '../src/persona.js';

test('loadPersona reads home notes and ignores other paths', async () => {
  const root = await mkdtemp(join(tmpdir(), 'muse-persona-'));
  try {
    await writeFile(join(root, 'food.md'), 'veg thali under 250\n');
    await writeFile(join(root, 'secret.txt'), 'do-not-leak');
    const notes = await loadPersona(root);
    assert.equal(notes.files['food.md'], 'veg thali under 250\n');
    assert.deepEqual(notes.missing, ['reply-style.md', 'soul.md']);
    assert.match(notes.files['reply-style.md'] ?? '', /Hinglish or English/);
    assert.equal(notes.rules, PERSONA_RULES);
    const ask = personaAsk(notes, 'what should I eat');
    assert.match(ask, /Never send a message/);
    assert.match(ask, /veg thali under 250/);
    assert.match(ask, /what should I eat$/);
    assert.equal(ask.includes('do-not-leak'), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
