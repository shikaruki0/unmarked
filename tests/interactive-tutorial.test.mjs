import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInteractiveTutorialState,
  advanceInteractiveTutorial,
  getTutorialInstruction,
  isTutorialComplete,
  INTERACTIVE_TUTORIAL_TOTAL_STEPS,
  assignHiddenKiller,
  getObjectiveState,
} from '../src/game-logic.js';

test('interactive tutorial starts at step 1', () => {
  const state = createInteractiveTutorialState();
  assert.equal(state.step, 1);
  assert.equal(state.complete, false);
  assert.equal(isTutorialComplete(state), false);
  const info = getTutorialInstruction(state, false);
  assert.equal(info.step, 1);
  assert.match(info.instruction, /move the mouse/i);
  const mobile = getTutorialInstruction(state, true);
  assert.match(mobile.instruction, /drag the right side/i);
});

test('camera movement advances step 1', () => {
  let state = createInteractiveTutorialState();
  const before = state.step;
  const result = advanceInteractiveTutorial(state, { type: 'cameraMoved', delta: 0.5 });
  assert.equal(result.advanced, true);
  assert.equal(result.state.step, 2);
  assert.equal(result.state.cameraMoved, true);
  // Repeating shouldn't advance again from step 2 with same signal
  const stay = advanceInteractiveTutorial(result.state, { type: 'cameraMoved', delta: 0.5 });
  assert.equal(stay.state.step, 2);
  assert.equal(before, 1);
});

test('walking advances movement training', () => {
  let state = createInteractiveTutorialState();
  state = advanceInteractiveTutorial(state, { type: 'cameraMoved', delta: 0.5 }).state;
  assert.equal(state.step, 2);
  // Not enough distance yet
  let r1 = advanceInteractiveTutorial(state, { type: 'moved', distance: 1.0 });
  assert.equal(r1.state.step, 2);
  // Enough cumulative
  let r2 = advanceInteractiveTutorial(r1.state, { type: 'moved', distance: 2.0 });
  assert.equal(r2.state.step, 3);
});

test('letter must be opened and closed before advancing', () => {
  let state = createInteractiveTutorialState();
  state = advanceInteractiveTutorial(state, { type: 'cameraMoved', delta: 1 }).state;
  state = advanceInteractiveTutorial(state, { type: 'moved', distance: 3 }).state;
  assert.equal(state.step, 3);
  // Closing without opening does NOT advance (fresh state step 3)
  let closeOnly = advanceInteractiveTutorial(state, { type: 'letterClosed' });
  assert.equal(closeOnly.state.step, 3);
  assert.equal(closeOnly.state.letterClosed, false);
  // Open then close advances
  let opened = advanceInteractiveTutorial(state, { type: 'letterOpened' });
  assert.equal(opened.state.letterOpened, true);
  assert.equal(opened.state.step, 3);
  let closed = advanceInteractiveTutorial(opened.state, { type: 'letterClosed' });
  assert.equal(closed.state.step, 4);
  assert.equal(closed.state.letterClosed, true);
});

test('flashlight requires correct state changes', () => {
  let state = createInteractiveTutorialState();
  // Fast advance to step 4
  state = advanceInteractiveTutorial(state, { type: 'cameraMoved', delta: 1 }).state;
  state = advanceInteractiveTutorial(state, { type: 'moved', distance: 3 }).state;
  state = advanceInteractiveTutorial(state, { type: 'letterOpened' }).state;
  state = advanceInteractiveTutorial(state, { type: 'letterClosed' }).state;
  assert.equal(state.step, 4);
  // One toggle not enough
  let one = advanceInteractiveTutorial(state, { type: 'flashlightToggled', on: false });
  assert.equal(one.state.step, 4);
  assert.equal(one.state.flashlightToggles, 1);
  // Duplicate same state shouldn't count
  let dup = advanceInteractiveTutorial(one.state, { type: 'flashlightToggled', on: false });
  assert.equal(dup.state.flashlightToggles, 1);
  // Second distinct toggle advances
  let two = advanceInteractiveTutorial(one.state, { type: 'flashlightToggled', on: true });
  assert.equal(two.state.step, 5);
  assert.equal(two.state.flashlightToggles, 2);
});

test('sprint requires meaningful duration', () => {
  let state = createInteractiveTutorialState();
  state = advanceInteractiveTutorial(state, { type: 'cameraMoved', delta: 1 }).state;
  state = advanceInteractiveTutorial(state, { type: 'moved', distance: 3 }).state;
  state = advanceInteractiveTutorial(state, { type: 'letterOpened' }).state;
  state = advanceInteractiveTutorial(state, { type: 'letterClosed' }).state;
  state = advanceInteractiveTutorial(state, { type: 'flashlightToggled', on: false }).state;
  state = advanceInteractiveTutorial(state, { type: 'flashlightToggled', on: true }).state;
  assert.equal(state.step, 5);
  let half = advanceInteractiveTutorial(state, { type: 'sprinting', delta: 0.4 });
  assert.equal(half.state.step, 5);
  let enough = advanceInteractiveTutorial(half.state, { type: 'sprinting', delta: 0.7 });
  assert.equal(enough.state.step, 6);
  assert.ok(enough.state.sprintTime >= 1.0);
});

test('generator completion advances only when player repairs it', () => {
  let state = createInteractiveTutorialState();
  // Advance to step 6
  state = advanceInteractiveTutorial(state, { type: 'cameraMoved', delta: 1 }).state;
  state = advanceInteractiveTutorial(state, { type: 'moved', distance: 3 }).state;
  state = advanceInteractiveTutorial(state, { type: 'letterOpened' }).state;
  state = advanceInteractiveTutorial(state, { type: 'letterClosed' }).state;
  state = advanceInteractiveTutorial(state, { type: 'flashlightToggled', on: false }).state;
  state = advanceInteractiveTutorial(state, { type: 'flashlightToggled', on: true }).state;
  state = advanceInteractiveTutorial(state, { type: 'sprinting', delta: 1.1 }).state;
  assert.equal(state.step, 6);
  // Bot repair shouldn't count
  let bot = advanceInteractiveTutorial(state, { type: 'generatorRepaired', byPlayer: false });
  assert.equal(bot.state.step, 6);
  assert.equal(bot.state.generatorRepaired, false);
  // Player repair counts
  let player = advanceInteractiveTutorial(state, { type: 'generatorRepaired', byPlayer: true });
  assert.equal(player.state.step, 7);
  assert.equal(player.state.generatorRepaired, true);
});

test('taser must be collected before it can be used', () => {
  let state = createInteractiveTutorialState();
  state = advanceInteractiveTutorial(state, { type: 'cameraMoved', delta: 1 }).state;
  state = advanceInteractiveTutorial(state, { type: 'moved', distance: 3 }).state;
  state = advanceInteractiveTutorial(state, { type: 'letterOpened' }).state;
  state = advanceInteractiveTutorial(state, { type: 'letterClosed' }).state;
  state = advanceInteractiveTutorial(state, { type: 'flashlightToggled', on: false }).state;
  state = advanceInteractiveTutorial(state, { type: 'flashlightToggled', on: true }).state;
  state = advanceInteractiveTutorial(state, { type: 'sprinting', delta: 1.1 }).state;
  state = advanceInteractiveTutorial(state, { type: 'generatorRepaired', byPlayer: true }).state;
  assert.equal(state.step, 7);
  // Use before collect shouldn't advance
  let usedEarly = advanceInteractiveTutorial(state, { type: 'taserUsed', success: true });
  assert.equal(usedEarly.state.step, 7);
  assert.equal(usedEarly.state.taserUsed, false);
  // Collect then use succeeds
  let collected = advanceInteractiveTutorial(state, { type: 'taserCollected' });
  assert.equal(collected.state.taserCollected, true);
  assert.equal(collected.state.step, 7);
  let used = advanceInteractiveTutorial(collected.state, { type: 'taserUsed', success: true });
  assert.equal(used.state.step, 8);
  assert.equal(used.state.taserUsed, true);
});

test('taser use advances only on successful target contact', () => {
  let state = createInteractiveTutorialState();
  // Jump to step 7
  state = advanceInteractiveTutorial(state, { type: 'cameraMoved', delta: 1 }).state;
  state = advanceInteractiveTutorial(state, { type: 'moved', distance: 3 }).state;
  state = advanceInteractiveTutorial(state, { type: 'letterOpened' }).state;
  state = advanceInteractiveTutorial(state, { type: 'letterClosed' }).state;
  state = advanceInteractiveTutorial(state, { type: 'flashlightToggled', on: false }).state;
  state = advanceInteractiveTutorial(state, { type: 'flashlightToggled', on: true }).state;
  state = advanceInteractiveTutorial(state, { type: 'sprinting', delta: 1.1 }).state;
  state = advanceInteractiveTutorial(state, { type: 'generatorRepaired', byPlayer: true }).state;
  state = advanceInteractiveTutorial(state, { type: 'taserCollected' }).state;
  // Failed hit shouldn't advance
  let failed = advanceInteractiveTutorial(state, { type: 'taserUsed', success: false });
  assert.equal(failed.state.step, 7);
  // Successful hit advances
  let success = advanceInteractiveTutorial(state, { type: 'taserUsed', success: true });
  assert.equal(success.state.step, 8);
});

test('pipe lesson cannot accidentally kill a survivor', () => {
  let state = createInteractiveTutorialState();
  state = advanceInteractiveTutorial(state, { type: 'cameraMoved', delta: 1 }).state;
  state = advanceInteractiveTutorial(state, { type: 'moved', distance: 3 }).state;
  state = advanceInteractiveTutorial(state, { type: 'letterOpened' }).state;
  state = advanceInteractiveTutorial(state, { type: 'letterClosed' }).state;
  state = advanceInteractiveTutorial(state, { type: 'flashlightToggled', on: false }).state;
  state = advanceInteractiveTutorial(state, { type: 'flashlightToggled', on: true }).state;
  state = advanceInteractiveTutorial(state, { type: 'sprinting', delta: 1.1 }).state;
  state = advanceInteractiveTutorial(state, { type: 'generatorRepaired', byPlayer: true }).state;
  state = advanceInteractiveTutorial(state, { type: 'taserCollected' }).state;
  state = advanceInteractiveTutorial(state, { type: 'taserUsed', success: true }).state;
  assert.equal(state.step, 8);
  // Signal with killedSurvivor should NOT advance
  let killAttempt = advanceInteractiveTutorial(state, { type: 'pipeAcknowledged', killedSurvivor: true });
  assert.equal(killAttempt.state.step, 8);
  assert.equal(killAttempt.state.pipeAcknowledged, false);
  // Normal acknowledgment advances
  let ack = advanceInteractiveTutorial(state, { type: 'pipeAcknowledged' });
  assert.equal(ack.state.step, 9);
});

test('keycard collection advances correctly', () => {
  let state = createInteractiveTutorialState();
  state = advanceInteractiveTutorial(state, { type: 'cameraMoved', delta: 1 }).state;
  state = advanceInteractiveTutorial(state, { type: 'moved', distance: 3 }).state;
  state = advanceInteractiveTutorial(state, { type: 'letterOpened' }).state;
  state = advanceInteractiveTutorial(state, { type: 'letterClosed' }).state;
  state = advanceInteractiveTutorial(state, { type: 'flashlightToggled', on: false }).state;
  state = advanceInteractiveTutorial(state, { type: 'flashlightToggled', on: true }).state;
  state = advanceInteractiveTutorial(state, { type: 'sprinting', delta: 1.1 }).state;
  state = advanceInteractiveTutorial(state, { type: 'generatorRepaired', byPlayer: true }).state;
  state = advanceInteractiveTutorial(state, { type: 'taserCollected' }).state;
  state = advanceInteractiveTutorial(state, { type: 'taserUsed', success: true }).state;
  state = advanceInteractiveTutorial(state, { type: 'pipeAcknowledged' }).state;
  assert.equal(state.step, 9);
  let kc = advanceInteractiveTutorial(state, { type: 'keycardCollected' });
  assert.equal(kc.state.step, 10);
  assert.equal(kc.state.keycardCollected, true);
});

test('exit completion finishes training', () => {
  let state = createInteractiveTutorialState();
  state = advanceInteractiveTutorial(state, { type: 'cameraMoved', delta: 1 }).state;
  state = advanceInteractiveTutorial(state, { type: 'moved', distance: 3 }).state;
  state = advanceInteractiveTutorial(state, { type: 'letterOpened' }).state;
  state = advanceInteractiveTutorial(state, { type: 'letterClosed' }).state;
  state = advanceInteractiveTutorial(state, { type: 'flashlightToggled', on: false }).state;
  state = advanceInteractiveTutorial(state, { type: 'flashlightToggled', on: true }).state;
  state = advanceInteractiveTutorial(state, { type: 'sprinting', delta: 1.1 }).state;
  state = advanceInteractiveTutorial(state, { type: 'generatorRepaired', byPlayer: true }).state;
  state = advanceInteractiveTutorial(state, { type: 'taserCollected' }).state;
  state = advanceInteractiveTutorial(state, { type: 'taserUsed', success: true }).state;
  state = advanceInteractiveTutorial(state, { type: 'pipeAcknowledged' }).state;
  state = advanceInteractiveTutorial(state, { type: 'keycardCollected' }).state;
  assert.equal(state.step, 10);
  let exit = advanceInteractiveTutorial(state, { type: 'exitReached' });
  assert.equal(exit.state.step, 11);
  assert.equal(exit.state.exitReached, true);
  let trust = advanceInteractiveTutorial(exit.state, { type: 'trustAcknowledged' });
  assert.equal(trust.state.step, 12);
  let complete = advanceInteractiveTutorial(trust.state, { type: 'complete' });
  assert.equal(complete.state.complete, true);
  assert.equal(isTutorialComplete(complete.state), true);
});

test('steps cannot be skipped accidentally by unrelated signals', () => {
  let state = createInteractiveTutorialState();
  // Try to jump directly to generator repair from step 1
  let attempt = advanceInteractiveTutorial(state, { type: 'generatorRepaired', byPlayer: true });
  assert.equal(attempt.state.step, 1);
  // Try taser collect at step 1
  let taserEarly = advanceInteractiveTutorial(state, { type: 'taserCollected' });
  assert.equal(taserEarly.state.step, 1);
  // Advance to step 3 and try sprint signal shouldn't skip
  state = advanceInteractiveTutorial(state, { type: 'cameraMoved', delta: 1 }).state;
  state = advanceInteractiveTutorial(state, { type: 'moved', distance: 3 }).state;
  assert.equal(state.step, 3);
  let sprintEarly = advanceInteractiveTutorial(state, { type: 'sprinting', delta: 5 });
  assert.equal(sprintEarly.state.step, 3);
  // Keycard early shouldn't skip
  let kcEarly = advanceInteractiveTutorial(state, { type: 'keycardCollected' });
  assert.equal(kcEarly.state.step, 3);
});

test('tutorial reset creates a fresh state', () => {
  let state = createInteractiveTutorialState();
  state = advanceInteractiveTutorial(state, { type: 'cameraMoved', delta: 1 }).state;
  state = advanceInteractiveTutorial(state, { type: 'moved', distance: 3 }).state;
  assert.equal(state.step, 3);
  const fresh = createInteractiveTutorialState();
  assert.equal(fresh.step, 1);
  assert.equal(fresh.distanceMoved, 0);
  assert.equal(fresh.cameraMoved, false);
  assert.deepEqual(fresh, createInteractiveTutorialState());
});

test('tutorial completion does not alter normal match rules', () => {
  // Normal match killer assignment still works after tutorial logic exists
  const ids = ['player', 'MARA', 'ELIAS', 'JUNE', 'NOAH', 'IRIS', 'ROWAN', 'KAI'];
  const match = assignHiddenKiller(() => 0.1, ids);
  assert.ok(ids.includes(match.killerId));
  // Normal objective state unchanged
  const gens = [{ repaired: false, progress: 0 }, { repaired: false, progress: 0 }, { repaired: false, progress: 0 }];
  const obj = getObjectiveState({ playerRole: 'survivor', generators: gens, powerRestored: false, keycardTaken: false, exitOpen: false, survivorsRemaining: 7 });
  assert.equal(obj.title, 'Restore emergency power');
  // Tutorial state does not affect that pure function
  const tut = createInteractiveTutorialState();
  const tut2 = advanceInteractiveTutorial(tut, { type: 'cameraMoved', delta: 1 }).state;
  assert.equal(getObjectiveState({ playerRole: 'survivor', generators: gens, powerRestored: false, keycardTaken: false, exitOpen: false, survivorsRemaining: 7 }).title, 'Restore emergency power');
  assert.notEqual(tut.step, tut2.step);
});
