/** Pure match rules used by the browser runtime and its node tests. */
export const BOT_NAMES = ['MARA', 'ELIAS', 'JUNE', 'NOAH', 'IRIS', 'ROWAN', 'KAI'];

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createSeededRandom(seed = Date.now()) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function assignHiddenKiller(random = Math.random, ids = ['player', ...BOT_NAMES]) {
  const index = Math.floor(random() * ids.length);
  return {
    killerId: ids[clamp(index, 0, ids.length - 1)],
    ids: [...ids],
  };
}

export function formatClock(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, '0');
  const remainder = (safeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

export function getSurvivorCount(player, bots) {
  const everyone = [player, ...bots];
  return everyone.filter((actor) => actor.role === 'survivor' && actor.alive && !actor.escaped).length;
}

export function getAliveCount(player, bots) {
  return [player, ...bots].filter((actor) => actor.alive && !actor.escaped).length;
}

export function getObjectiveState({ playerRole, generators, powerRestored, keycardTaken, exitOpen, survivorsRemaining }) {
  if (playerRole === 'killer') {
    const eliminated = Math.max(0, 7 - survivorsRemaining);
    return {
      title: 'Erase the witnesses',
      copy: `${survivorsRemaining} survivor${survivorsRemaining === 1 ? '' : 's'} remain`,
      progress: eliminated / 7,
    };
  }

  if (!powerRestored) {
    const online = generators.filter((generator) => generator.repaired).length;
    const partial = generators.reduce((sum, generator) => sum + generator.progress, 0) / generators.length;
    return {
      title: 'Restore emergency power',
      copy: `${online} / ${generators.length} power nodes online`,
      progress: partial,
    };
  }

  if (!keycardTaken) {
    return {
      title: 'Retrieve the exit keycard',
      copy: 'Security office access is now available',
      progress: 0.7,
    };
  }

  return {
    title: exitOpen ? 'Reach the quarantine exit' : 'Authorize the quarantine exit',
    copy: exitOpen ? 'The north exit is open. Leave alive.' : 'Use the keycard at the north exit.',
    progress: exitOpen ? 1 : 0.85,
  };
}

export function pickEnvironmentalEvent(random = Math.random) {
  const events = ['blackout', 'fog', 'alarm', 'radio'];
  return events[Math.floor(random() * events.length)] ?? events[0];
}

export function isMatchOver({ player, bots, killerEscaped = false }) {
  const survivorsRemaining = getSurvivorCount(player, bots);
  if (killerEscaped) return { over: true, winner: 'survivors', reason: 'killer-escaped' };
  if (survivorsRemaining === 0) return { over: true, winner: 'killer', reason: 'no-survivors' };
  return { over: false, winner: null, reason: null };
}

/* ------------------------------------------------------------------ */
/* First-run onboarding: briefing letter content and tutorial messages  */
/* ------------------------------------------------------------------ */

/** Title shown on the in-world letter and the briefing overlay. */
export const BRIEFING_TITLE = 'BLACKSITE EMERGENCY BRIEFING';

export const BRIEFING_INTRO =
  'Eight people are trapped inside this facility. One of them is secretly the killer. ' +
  'The killer looks exactly like everyone else. There are no meetings, votes, or role reveals. ' +
  'Watch what people do, investigate what they leave behind, and be careful who you trust.';

/** Short, readable sections rendered by the briefing overlay. */
export const BRIEFING_SECTIONS = [
  {
    heading: 'SURVIVOR OBJECTIVE',
    body: '1. Restore all three power nodes.\n2. Enter Security after emergency power returns.\n3. Collect the exit keycard.\n4. Open the north Quarantine Exit.\n5. Escape alive.',
  },
  {
    heading: 'KILLER OBJECTIVE',
    body: 'If you are the killer, pretend to help, sabotage repaired power nodes, isolate survivors, and eliminate every witness before anyone escapes.',
  },
  {
    heading: 'IMPORTANT',
    body: 'Your role is shown on the HUD when the match begins. Do not reveal the hidden killer through the briefing letter.',
  },
  {
    heading: 'DEFENSE',
    body: 'A taser temporarily stuns a nearby person. A metal pipe is dangerous. Attacking an innocent survivor has serious consequences.',
  },
  {
    heading: 'INVESTIGATION',
    body: 'Look for blood, footprints, dropped badges, damaged equipment, and security recordings. A clue may be incomplete or misleading. Evidence never reveals a role automatically.',
  },
  {
    heading: 'FINAL WARNING',
    body: 'Stay near people you trust — but remember: the person standing beside you may be the killer.',
  },
];

/** Controls shown in the briefing overlay (H is the briefing toggle). */
export const BRIEFING_CONTROLS = [
  { keys: 'W A S D', action: 'Move' },
  { keys: 'MOUSE', action: 'Look around' },
  { keys: 'SHIFT', action: 'Sprint' },
  { keys: 'E', action: 'Interact or read' },
  { keys: 'HOLD E', action: 'Repair or sabotage a power node' },
  { keys: 'F', action: 'Attack or use the held defensive item' },
  { keys: 'Q', action: 'Toggle flashlight' },
  { keys: 'H', action: 'Open or close the briefing' },
  { keys: 'ESC', action: 'Pause, or close the briefing first' },
];

/** Non-blocking tutorial hints shown through the existing subtitle system. */
export const TUTORIAL_MESSAGES = {
  letterHint: 'Read the glowing briefing letter on the desk. Press E.',
  objective: 'OBJECTIVE: Restore three power nodes.',
  generatorHint: 'Hold E until the power node is fully repaired.',
  firstGeneratorDone: 'Two power nodes remain. Watch the people around you.',
  defenseItem: 'Tasers are nonlethal. The pipe can harm an innocent. Use F carefully.',
  powerRestored: 'Emergency power restored. Find the keycard inside Security.',
  keycardTaken: 'Reach the north Quarantine Exit and escape.',
};

/** Fresh per-match tutorial state: every hint fires at most once per match. */
export function createTutorialState() {
  return {
    letterHintShown: false,
    objectiveShown: false,
    generatorHintShown: false,
    firstGeneratorDoneShown: false,
    defenseShown: false,
    powerRestoredShown: false,
    keycardShown: false,
    letterOpenedCount: 0,
  };
}

/**
 * Pure tutorial state machine. Returns the next state plus the message to
 * show (or null). Each hint fires exactly once per match, so nothing repeats.
 *
 * @param {ReturnType<typeof createTutorialState>} state
 * @param {{ type: string }} signal
 * @returns {{ state: object, message: string | null }}
 */
export function advanceTutorial(state, signal) {
  const next = { ...state };
  let message = null;

  switch (signal.type) {
    case 'spawn':
      // Delayed spawn hint. Skipped if the player already read the letter.
      if (!next.letterHintShown && next.letterOpenedCount === 0) {
        next.letterHintShown = true;
        message = TUTORIAL_MESSAGES.letterHint;
      }
      break;
    case 'letterOpened':
      next.letterOpenedCount += 1;
      break;
    case 'letterClosed':
      if (!next.objectiveShown) {
        next.objectiveShown = true;
        message = TUTORIAL_MESSAGES.objective;
      }
      break;
    case 'nearGenerator':
      if (!next.generatorHintShown) {
        next.generatorHintShown = true;
        message = TUTORIAL_MESSAGES.generatorHint;
      }
      break;
    case 'firstGeneratorDone':
      if (!next.firstGeneratorDoneShown) {
        next.firstGeneratorDoneShown = true;
        message = TUTORIAL_MESSAGES.firstGeneratorDone;
      }
      break;
    case 'defenseSeen':
    case 'defenseCollected':
      if (!next.defenseShown) {
        next.defenseShown = true;
        message = TUTORIAL_MESSAGES.defenseItem;
      }
      break;
    case 'powerRestored':
      if (!next.powerRestoredShown) {
        next.powerRestoredShown = true;
        message = TUTORIAL_MESSAGES.powerRestored;
      }
      break;
    case 'keycardTaken':
      if (!next.keycardShown) {
        next.keycardShown = true;
        message = TUTORIAL_MESSAGES.keycardTaken;
      }
      break;
    default:
      break;
  }

  return { state: next, message };
}
