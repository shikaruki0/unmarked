import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const mainSource = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const indexSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('objective-card DOM reference exists for normal and tutorial HUD transitions', () => {
  assert.match(indexSource, /id="objective-card"/);
  assert.match(mainSource, /objectiveCard:\s*\$\('#objective-card'\)/);

  const references = [...mainSource.matchAll(/dom\.objectiveCard/g)].length;
  assert.ok(references >= 4, 'objectiveCard is used by start, tutorial, exit, and HUD paths');
});
