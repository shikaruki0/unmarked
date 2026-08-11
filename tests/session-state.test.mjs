import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GAME_MODES,
  GAME_PHASES,
  closeBriefingSession,
  createGameSessionState,
  exitTutorialSession,
  isInputActive,
  openBriefingSession,
  pauseSession,
  startNormalSession,
  startTutorialSession,
} from '../src/game-logic.js';

test('normal start selects normal mode and active playing phase', () => {
  const state = startNormalSession(createGameSessionState());

  assert.equal(state.mode, GAME_MODES.normal);
  assert.equal(state.phase, GAME_PHASES.playing);
  assert.equal(state.tutorialActive, false);
});

test('tutorial start selects tutorial mode and active playing phase', () => {
  const state = startTutorialSession(createGameSessionState());

  assert.equal(state.mode, GAME_MODES.tutorial);
  assert.equal(state.phase, GAME_PHASES.playing);
  assert.equal(state.tutorialActive, true);
});

test('tutorial mode does not replace the playing phase', () => {
  const state = startTutorialSession(createGameSessionState());

  assert.notEqual(state.phase, GAME_MODES.tutorial);
  assert.equal(isInputActive(state), true);
});

test('pausing preserves the current mode', () => {
  const tutorial = pauseSession(startTutorialSession(createGameSessionState()));
  const normal = pauseSession(startNormalSession(createGameSessionState()));

  assert.equal(tutorial.mode, GAME_MODES.tutorial);
  assert.equal(tutorial.phase, GAME_PHASES.paused);
  assert.equal(normal.mode, GAME_MODES.normal);
  assert.equal(normal.phase, GAME_PHASES.paused);
});

test('briefing preserves the correct return phase', () => {
  const fromPlaying = closeBriefingSession(openBriefingSession(startNormalSession(createGameSessionState())));
  const fromPaused = closeBriefingSession(openBriefingSession(pauseSession(startTutorialSession(createGameSessionState()))));

  assert.equal(fromPlaying.mode, GAME_MODES.normal);
  assert.equal(fromPlaying.phase, GAME_PHASES.playing);
  assert.equal(fromPaused.mode, GAME_MODES.tutorial);
  assert.equal(fromPaused.phase, GAME_PHASES.paused);
});

test('exiting tutorial clears tutorial state', () => {
  const exited = exitTutorialSession(startTutorialSession(createGameSessionState()));

  assert.equal(exited.mode, GAME_MODES.normal);
  assert.equal(exited.phase, GAME_PHASES.menu);
  assert.equal(exited.tutorialActive, false);
});

test('starting normal mode after tutorial clears tutorial restrictions', () => {
  const state = startNormalSession(startTutorialSession(createGameSessionState()));

  assert.equal(state.mode, GAME_MODES.normal);
  assert.equal(state.phase, GAME_PHASES.playing);
  assert.equal(state.tutorialActive, false);
  assert.equal(isInputActive(state), true);
});

test('input-active logic is true for normal playing and tutorial playing', () => {
  assert.equal(isInputActive(startNormalSession(createGameSessionState())), true);
  assert.equal(isInputActive(startTutorialSession(createGameSessionState())), true);
});

test('input-active logic is false for paused, briefing, menu, and ended phases', () => {
  for (const phase of [GAME_PHASES.paused, GAME_PHASES.briefing, GAME_PHASES.menu, GAME_PHASES.ended]) {
    assert.equal(isInputActive({ mode: GAME_MODES.normal, phase }), false, phase);
    assert.equal(isInputActive({ mode: GAME_MODES.tutorial, phase }), false, phase);
  }
});
