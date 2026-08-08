import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BRIEFING_CONTROLS,
  BRIEFING_INTRO,
  BRIEFING_SECTIONS,
  BRIEFING_TITLE,
  TUTORIAL_MESSAGES,
  advanceTutorial,
  assignHiddenKiller,
  createSeededRandom,
  createTutorialState,
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

test('briefing covers every required topic and never spoils the hidden role', () => {
  assert.equal(BRIEFING_TITLE, 'BLACKSITE EMERGENCY BRIEFING');
  const headings = BRIEFING_SECTIONS.map((section) => section.heading);
  for (const required of ['SURVIVOR OBJECTIVE', 'KILLER OBJECTIVE', 'IMPORTANT', 'DEFENSE', 'INVESTIGATION', 'FINAL WARNING']) {
    assert.ok(headings.includes(required), `briefing is missing section: ${required}`);
  }
  const allText = [BRIEFING_INTRO, ...BRIEFING_SECTIONS.map((section) => section.body), ...BRIEFING_CONTROLS.map((control) => `${control.keys} ${control.action}`)].join(' ');
  for (const phrase of ['three power nodes', 'keycard', 'taser', 'innocent', 'repair', 'sabotage', 'Quarantine Exit', 'do not reveal']) {
    assert.ok(allText.toLowerCase().includes(phrase.toLowerCase()), `briefing is missing: ${phrase}`);
  }
  const actions = BRIEFING_CONTROLS.map((control) => control.action.toLowerCase());
  for (const action of ['move', 'look around', 'sprint', 'interact', 'repair or sabotage', 'defensive item', 'flashlight', 'pause']) {
    assert.ok(actions.some((entry) => entry.includes(action)), `briefing controls are missing: ${action}`);
  }
  // The letter stays general: it instructs both roles conditionally but never
  // assigns the player a specific role ("If you are the killer..." is allowed).
  assert.ok(/if you are the killer/i.test(allText), 'briefing must cover the killer role in general terms');
  assert.ok(!/you are the (killer|survivor)\./i.test(allText), 'briefing must not assign the player a role');
});

test('tutorial hints fire exactly once per match', () => {
  let state = createTutorialState();
  const first = advanceTutorial(state, { type: 'spawn' });
  assert.equal(first.message, TUTORIAL_MESSAGES.letterHint);
  state = first.state;
  // Repeating the same signal never repeats the hint.
  const repeat = advanceTutorial(state, { type: 'spawn' });
  assert.equal(repeat.message, null);

  const full = advanceTutorial(state, { type: 'nearGenerator' });
  assert.equal(full.message, TUTORIAL_MESSAGES.generatorHint);
  const done = advanceTutorial(full.state, { type: 'firstGeneratorDone' });
  assert.equal(done.message, TUTORIAL_MESSAGES.firstGeneratorDone);
  const seen = advanceTutorial(done.state, { type: 'defenseSeen' });
  assert.equal(seen.message, TUTORIAL_MESSAGES.defenseItem);
  // Seeing and then collecting the same item still produces one hint.
  const collected = advanceTutorial(seen.state, { type: 'defenseCollected' });
  assert.equal(collected.message, null);
  const powered = advanceTutorial(collected.state, { type: 'powerRestored' });
  assert.equal(powered.message, TUTORIAL_MESSAGES.powerRestored);
  const keycard = advanceTutorial(powered.state, { type: 'keycardTaken' });
  assert.equal(keycard.message, TUTORIAL_MESSAGES.keycardTaken);
  const afterKeycard = advanceTutorial(keycard.state, { type: 'keycardTaken' });
  assert.equal(afterKeycard.message, null);
});

test('objective hint follows closing the letter, and the spawn hint yields to reading it', () => {
  let state = createTutorialState();
  const opened = advanceTutorial(state, { type: 'letterOpened' });
  assert.equal(opened.message, null);
  assert.equal(opened.state.letterOpenedCount, 1);
  const closed = advanceTutorial(opened.state, { type: 'letterClosed' });
  assert.equal(closed.message, TUTORIAL_MESSAGES.objective);
  const closedAgain = advanceTutorial(closed.state, { type: 'letterClosed' });
  assert.equal(closedAgain.message, null);

  // A player who already read the letter is not nagged by the spawn hint.
  const lateSpawn = advanceTutorial(opened.state, { type: 'spawn' });
  assert.equal(lateSpawn.message, null);
});
