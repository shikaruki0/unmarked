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
