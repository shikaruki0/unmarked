import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';

const mainSource = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const indexSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const styleSource = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');

test('objective-card DOM reference exists for normal and tutorial HUD transitions', () => {
  assert.match(indexSource, /id="objective-card"/);
  assert.match(mainSource, /objectiveCard:\s*\$\('#objective-card'\)/);

  const references = [...mainSource.matchAll(/dom\.objectiveCard/g)].length;
  assert.ok(references >= 4, 'objectiveCard is used by start, tutorial, exit, and HUD paths');
});

test('every DOM ID queried in src/main.js exists in index.html', () => {
  const queriedIds = [...mainSource.matchAll(/\$\('#([^']+)'\)/g)].map((match) => match[1]);
  assert.ok(queriedIds.length >= 60, 'expected all HUD and modal selectors to be checked');
  for (const id of queriedIds) {
    assert.match(indexSource, new RegExp(`id="${id}"`), `index.html is missing id="${id}"`);
  }
});

test('initial and match-start camera yaw faces the briefing desk rather than the back wall', () => {
  assert.doesNotMatch(mainSource, /this\.yaw\s*=\s*Math\.PI/, 'spawn yaw must not point +Z away from lobby');
  const cam = new THREE.PerspectiveCamera(70, 16 / 9, 0.08, 145);
  cam.rotation.order = 'YXZ';
  cam.position.set(0, 1.63, 16);
  cam.rotation.set(-0.06, 0, 0);
  cam.updateMatrixWorld(true);
  const lookDir = new THREE.Vector3();
  cam.getWorldDirection(lookDir);
  const toBriefingDesk = new THREE.Vector3(0, 1.13, 13.4).sub(cam.position).normalize();
  assert.ok(lookDir.dot(toBriefingDesk) > 0.95, 'yaw=0 faces directly toward the briefing desk');
});

test('loading overlay disables pointer events immediately when done', () => {
  assert.match(styleSource, /\.loading-screen\.done\s*\{[^}]*pointer-events:\s*none/);
});

test('expired runtime VFX pulses dispose geometry and material on removal', () => {
  assert.match(mainSource, /this\.fxGroup\.remove\(effect\.mesh\);\s*effect\.mesh\.geometry\?\.dispose\(\);\s*effect\.material\?\.dispose\(\);/);
});

test('touch listeners are always bound and tutorial Step 7 preserves taser if used on a bot', () => {
  assert.doesNotMatch(mainSource, /bindTouchControls\(\)\s*\{\s*if\s*\(!this\.isTouchDevice\)\s*return;/);
  assert.match(mainSource, /Training stun — keep your taser and use it on the TRAINING TARGET\./);
});
