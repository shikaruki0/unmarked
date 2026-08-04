import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assignHiddenKiller,
  createSeededRandom,
  formatClock,
  getAliveCount,
  getObjectiveState,
  getSurvivorCount,
  isMatchOver,
} from '../src/game-logic.js';

test('hidden killer assignment always chooses exactly one roster member', () => {
  const random = createSeededRandom(42);
  const ids = ['player', 'MARA', 'ELIAS', 'JUNE', 'NOAH', 'IRIS', 'ROWAN', 'KAI'];
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const match = assignHiddenKiller(random, ids);
    assert.equal(match.ids.length, 8);
    assert.ok(ids.includes(match.killerId));
  }
});

test('match clock has stable two-digit output', () => {
  assert.equal(formatClock(0), '00:00');
  assert.equal(formatClock(65.9), '01:05');
  assert.equal(formatClock(-2), '00:00');
});

test('survivor and alive counts exclude escaped or eliminated actors', () => {
  const player = { role: 'survivor', alive: true, escaped: false };
  const bots = [
    { role: 'survivor', alive: true, escaped: false },
    { role: 'survivor', alive: false, escaped: false },
    { role: 'killer', alive: true, escaped: false },
    { role: 'survivor', alive: true, escaped: true },
  ];
  assert.equal(getSurvivorCount(player, bots), 2);
  assert.equal(getAliveCount(player, bots), 3);
});

test('objectives move from power to keycard to the exit for survivors', () => {
  const generators = [
    { repaired: true, progress: 1 },
    { repaired: false, progress: 0.5 },
    { repaired: false, progress: 0 },
  ];
  const power = getObjectiveState({ playerRole: 'survivor', generators, powerRestored: false, keycardTaken: false, exitOpen: false, survivorsRemaining: 6 });
  assert.equal(power.title, 'Restore emergency power');
  assert.equal(power.copy, '1 / 3 power nodes online');
  assert.equal(power.progress, 0.5);

  const keycard = getObjectiveState({ playerRole: 'survivor', generators, powerRestored: true, keycardTaken: false, exitOpen: false, survivorsRemaining: 6 });
  assert.equal(keycard.title, 'Retrieve the exit keycard');

  const exit = getObjectiveState({ playerRole: 'survivor', generators, powerRestored: true, keycardTaken: true, exitOpen: true, survivorsRemaining: 6 });
  assert.equal(exit.title, 'Reach the quarantine exit');
});

test('killer objective and end condition follow survivor count', () => {
  const generators = [{ repaired: false, progress: 0 }, { repaired: false, progress: 0 }, { repaired: false, progress: 0 }];
  const objective = getObjectiveState({ playerRole: 'killer', generators, powerRestored: false, keycardTaken: false, exitOpen: false, survivorsRemaining: 3 });
  assert.equal(objective.title, 'Erase the witnesses');
  assert.equal(objective.copy, '3 survivors remain');

  const player = { role: 'killer', alive: true, escaped: false };
  const bots = [{ role: 'survivor', alive: false, escaped: false }];
  assert.deepEqual(isMatchOver({ player, bots }), { over: true, winner: 'killer', reason: 'no-survivors' });
});
