import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';

const headlessThreeUrl = new URL('./__three_headless__.mjs', import.meta.url).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('.css')) {
      return { url: 'data:text/javascript,export default {};', shortCircuit: true };
    }
    if (specifier === 'three' && context.parentURL?.endsWith('/src/main.js')) {
      return { url: headlessThreeUrl, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === headlessThreeUrl) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
          export * from 'three';
          export class WebGLRenderer {
            constructor() {
              this.shadowMap = { enabled: false, type: null };
              this.outputColorSpace = null;
              this.toneMapping = null;
              this.toneMappingExposure = 1;
            }
            setPixelRatio() {}
            setSize() {}
            render() {}
            dispose() {}
          }
        `,
      };
    }
    return nextLoad(url, context);
  },
});

function makeClassList(initial = []) {
  const set = new Set(initial.filter(Boolean));
  return {
    add: (...c) => c.forEach((x) => set.add(x)),
    remove: (...c) => c.forEach((x) => set.delete(x)),
    toggle: (c, force) => {
      const next = force === undefined ? !set.has(c) : Boolean(force);
      if (next) set.add(c);
      else set.delete(c);
      return next;
    },
    contains: (c) => set.has(c),
  };
}

function makeCtx2d() {
  return {
    clearRect() {}, fillRect() {}, strokeRect() {}, fillText() {},
    save() {}, restore() {}, beginPath() {}, arc() {}, clip() {},
    moveTo() {}, lineTo() {}, stroke() {}, translate() {}, rotate() {},
    closePath() {}, fill() {},
    fillStyle: '', strokeStyle: '', font: '', textAlign: '', textBaseline: '', globalAlpha: 1, lineWidth: 1,
  };
}

function createEl(tag = 'div', id = '', classes = []) {
  const listeners = new Map();
  const children = [];
  return {
    tagName: tag.toUpperCase(),
    id,
    width: 180,
    height: 180,
    checked: false,
    textContent: '',
    innerHTML: '',
    style: {},
    classList: makeClassList(classes),
    children,
    append(...nodes) { children.push(...nodes); },
    prepend(...nodes) { children.unshift(...nodes); },
    replaceChildren(...nodes) { children.length = 0; children.push(...nodes); },
    remove() {},
    focus() {},
    setPointerCapture() {},
    getBoundingClientRect: () => ({ left: 20, top: 260, width: 116, height: 116 }),
    getContext: () => makeCtx2d(),
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    dispatchEvent(event) {
      event.preventDefault ??= () => {};
      event.stopPropagation ??= () => {};
      for (const fn of listeners.get(event.type) || []) fn(event);
    },
    click() { this.dispatchEvent({ type: 'click' }); },
  };
}

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const byId = new Map();
for (const match of html.matchAll(/<([a-z0-9-]+)([^>]*?)id="([^"]+)"([^>]*)>/gi)) {
  const [, tag, pre, id, post] = match;
  const clsMatch = `${pre} ${post}`.match(/class="([^"]+)"/i);
  const classes = clsMatch ? clsMatch[1].split(/\s+/) : [];
  byId.set(id, createEl(tag, id, classes));
}

let coarse = false;
let fine = true;
const maxTouchPoints = 10;
let nextRaf = null;
let fakeNow = 1000;
const docListeners = new Map();
const winListeners = new Map();

const origNow = performance.now.bind(performance);
performance.now = () => fakeNow;

globalThis.window = {
  innerWidth: 1280,
  innerHeight: 720,
  devicePixelRatio: 1,
  matchMedia: (q) => ({
    matches: q.includes('coarse') ? coarse : q.includes('fine') ? fine : false,
  }),
  setTimeout: (fn, ms = 0) => {
    const timer = setTimeout(fn, Math.min(ms, 5));
    timer.unref?.();
    return timer;
  },
  clearTimeout: (id) => clearTimeout(id),
  scrollTo() {},
  addEventListener(type, fn) {
    if (!winListeners.has(type)) winListeners.set(type, []);
    winListeners.get(type).push(fn);
  },
  dispatchEvent(ev) {
    ev.preventDefault ??= () => {};
    ev.stopPropagation ??= () => {};
    for (const fn of winListeners.get(ev.type) || []) fn(ev);
  },
};

Object.defineProperty(globalThis, 'navigator', {
  value: { get maxTouchPoints() { return maxTouchPoints; } },
  configurable: true,
});

globalThis.requestAnimationFrame = (cb) => { nextRaf = cb; return 1; };

function advanceSeconds(totalSeconds, dt = 0.04) {
  const steps = Math.ceil(totalSeconds / dt);
  for (let i = 0; i < steps; i += 1) {
    fakeNow += dt * 1000;
    const cb = nextRaf;
    if (cb) cb();
  }
}

globalThis.document = {
  body: createEl('body'),
  pointerLockElement: null,
  querySelector: (sel) => (sel.startsWith('#') ? byId.get(sel.slice(1)) ?? null : null),
  createElement: (tag) => createEl(tag),
  createTextNode: (t) => ({ textContent: t }),
  exitPointerLock() {
    this.pointerLockElement = null;
    this.dispatchEvent({ type: 'pointerlockchange' });
  },
  addEventListener(type, fn) {
    if (!docListeners.has(type)) docListeners.set(type, []);
    docListeners.get(type).push(fn);
  },
  dispatchEvent(ev) {
    ev.preventDefault ??= () => {};
    ev.stopPropagation ??= () => {};
    for (const fn of docListeners.get(ev.type) || []) fn(ev);
  },
};

byId.get('game-canvas').requestPointerLock = () => {
  document.pointerLockElement = byId.get('game-canvas');
  document.dispatchEvent({ type: 'pointerlockchange' });
};

await import('../src/main.js');

test('runtime smoke: PC normal match, PC tutorial, Phone tutorial, and Phone normal match run without errors', () => {
  try {
    // 1. Touchscreen PC normal match
    assert.equal(document.body.classList.contains('touch-device'), false, 'touchscreen PC starts in PC mode');
    byId.get('start-button').click();
    assert.equal(byId.get('intro-screen').classList.contains('hidden'), true);
    assert.equal(byId.get('hud').classList.contains('hidden'), false);
    assert.equal(byId.get('objective-card').classList.contains('hidden'), false);
    assert.equal(byId.get('tutorial-card').classList.contains('hidden'), true);
    assert.equal(document.pointerLockElement, byId.get('game-canvas'), 'pointer lock acquired on PC');

    // Walk forward toward the briefing desk (yaw=0 -> z decreases from 17 toward 13.4)
    document.dispatchEvent({ type: 'keydown', code: 'KeyW' });
    advanceSeconds(0.5);
    document.dispatchEvent({ type: 'keyup', code: 'KeyW' });
    assert.equal(byId.get('interaction-text').textContent, 'E — READ INCIDENT BRIEFING', 'walked straight up to the briefing desk');

    // Open and close briefing via E, then pause and resume
    document.dispatchEvent({ type: 'keydown', code: 'KeyE' });
    assert.equal(byId.get('briefing-screen').classList.contains('hidden'), false);
    document.dispatchEvent({ type: 'keydown', code: 'KeyE' });
    assert.equal(byId.get('briefing-screen').classList.contains('hidden'), true);
    document.dispatchEvent({ type: 'keydown', code: 'Escape' });
    assert.equal(byId.get('pause-screen').classList.contains('hidden'), false);
    byId.get('resume-button').click();
    assert.equal(byId.get('pause-screen').classList.contains('hidden'), true);

    // 2. PC Tutorial Steps 1 -> 5
    byId.get('tutorial-button').click();
    assert.equal(byId.get('tutorial-card').classList.contains('hidden'), false);
    assert.equal(byId.get('objective-card').classList.contains('hidden'), true);
    assert.equal(byId.get('tutorial-step').textContent, '1 / 12');

    // Look right then back to center so player faces briefing desk again
    document.dispatchEvent({ type: 'mousemove', movementX: 220, movementY: 0 });
    document.dispatchEvent({ type: 'mousemove', movementX: -220, movementY: 0 });
    assert.equal(byId.get('tutorial-step').textContent, '2 / 12', 'PC mouse look completed Step 1');

    // Walk forward to briefing desk -> completes Step 2
    document.dispatchEvent({ type: 'keydown', code: 'KeyW' });
    advanceSeconds(0.8);
    document.dispatchEvent({ type: 'keyup', code: 'KeyW' });
    assert.equal(byId.get('tutorial-step').textContent, '3 / 12', 'PC WASD walk completed Step 2');

    // Open & close briefing letter at desk -> completes Step 3
    document.dispatchEvent({ type: 'keydown', code: 'KeyE' });
    document.dispatchEvent({ type: 'keydown', code: 'KeyE' });
    assert.equal(byId.get('tutorial-step').textContent, '4 / 12', 'PC briefing interaction completed Step 3');

    // Toggle flashlight off -> on -> completes Step 4
    document.dispatchEvent({ type: 'keydown', code: 'KeyQ' });
    document.dispatchEvent({ type: 'keydown', code: 'KeyQ' });
    assert.equal(byId.get('tutorial-step').textContent, '5 / 12', 'PC flashlight toggle completed Step 4');

    // Sprint west -> completes Step 5
    document.dispatchEvent({ type: 'keydown', code: 'ShiftLeft' });
    document.dispatchEvent({ type: 'keydown', code: 'KeyA' });
    advanceSeconds(1.2);
    document.dispatchEvent({ type: 'keyup', code: 'KeyA' });
    document.dispatchEvent({ type: 'keyup', code: 'ShiftLeft' });
    assert.equal(byId.get('tutorial-step').textContent, '6 / 12', 'PC sprint completed Step 5');

    // Walk into south-west Generator 03 room: player is near (-8, 0, 14.3).
    // Walk south (KeyS, +Z) to z ~ 20, then west (KeyA, -X) to generatorC (-23, 0, 20)
    document.dispatchEvent({ type: 'keydown', code: 'KeyS' });
    advanceSeconds(1.42);
    document.dispatchEvent({ type: 'keyup', code: 'KeyS' });
    document.dispatchEvent({ type: 'keydown', code: 'KeyA' });
    advanceSeconds(3.6);
    document.dispatchEvent({ type: 'keyup', code: 'KeyA' });

    // Hold E to repair Generator 03 (2.4s duration in tutorial) -> completes Step 6
    document.dispatchEvent({ type: 'keydown', code: 'KeyE' });
    advanceSeconds(2.6);
    document.dispatchEvent({ type: 'keyup', code: 'KeyE' });
    assert.equal(byId.get('tutorial-step').textContent, '7 / 12', 'PC generator repair completed Step 6');

    // Walk east out of Generator 03 room to x ~ 5.5, then north to z ~ 10.5 (taser)
    document.dispatchEvent({ type: 'keydown', code: 'KeyD' });
    advanceSeconds(6.8);
    document.dispatchEvent({ type: 'keyup', code: 'KeyD' });
    document.dispatchEvent({ type: 'keydown', code: 'KeyW' });
    advanceSeconds(2.35);
    document.dispatchEvent({ type: 'keyup', code: 'KeyW' });
    document.dispatchEvent({ type: 'keydown', code: 'KeyE' });
    document.dispatchEvent({ type: 'keyup', code: 'KeyE' });
    advanceSeconds(0.05);
    assert.equal(byId.get('held-item').textContent, 'TASER', 'collected tutorial taser');

    // Step east toward TRAINING TARGET (7.8, 0, 10.5) and fire taser (KeyF) -> completes Step 7
    document.dispatchEvent({ type: 'keydown', code: 'KeyD' });
    advanceSeconds(0.5);
    document.dispatchEvent({ type: 'keyup', code: 'KeyD' });
    document.dispatchEvent({ type: 'keydown', code: 'KeyF' });
    document.dispatchEvent({ type: 'keyup', code: 'KeyF' });
    advanceSeconds(0.05);
    assert.equal(byId.get('tutorial-step').textContent, '8 / 12', 'PC taser training completed Step 7');

    // Walk west to pipe (-5.5, 0, 10.5) and press E -> completes Step 8
    document.dispatchEvent({ type: 'keydown', code: 'KeyA' });
    advanceSeconds(3.2);
    document.dispatchEvent({ type: 'keyup', code: 'KeyA' });
    document.dispatchEvent({ type: 'keydown', code: 'KeyE' });
    document.dispatchEvent({ type: 'keyup', code: 'KeyE' });
    assert.equal(byId.get('tutorial-step').textContent, '9 / 12', 'PC pipe lesson completed Step 8');

    // Walk south to z ~ 19.5, then east into Security (23.1, 0, 19.2) and collect keycard -> Step 9
    document.dispatchEvent({ type: 'keydown', code: 'KeyS' });
    advanceSeconds(2.2);
    document.dispatchEvent({ type: 'keyup', code: 'KeyS' });
    document.dispatchEvent({ type: 'keydown', code: 'KeyD' });
    advanceSeconds(7.0);
    document.dispatchEvent({ type: 'keyup', code: 'KeyD' });
    document.dispatchEvent({ type: 'keydown', code: 'KeyE' });
    document.dispatchEvent({ type: 'keyup', code: 'KeyE' });
    assert.equal(byId.get('tutorial-step').textContent, '10 / 12', 'PC keycard collection completed Step 9');

    // Walk west out of Security to x ~ 2.4 (clear of lobby desk), then north to Quarantine Exit (0, 0, -31.3) -> Step 10
    document.dispatchEvent({ type: 'keydown', code: 'KeyA' });
    advanceSeconds(5.1);
    document.dispatchEvent({ type: 'keyup', code: 'KeyA' });
    document.dispatchEvent({ type: 'keydown', code: 'KeyW' });
    advanceSeconds(12.6);
    document.dispatchEvent({ type: 'keyup', code: 'KeyW' });
    document.dispatchEvent({ type: 'keydown', code: 'KeyE' });
    document.dispatchEvent({ type: 'keyup', code: 'KeyE' });
    assert.equal(byId.get('tutorial-step').textContent, '11 / 12', 'PC quarantine exit completed Step 10');

    // Step 11 prompt shows E — CONTINUE and pressing E finishes the tutorial -> Step 12
    advanceSeconds(0.1);
    assert.equal(byId.get('interaction-text').textContent, 'E — CONTINUE');
    document.dispatchEvent({ type: 'keydown', code: 'KeyE' });
    document.dispatchEvent({ type: 'keyup', code: 'KeyE' });
    assert.equal(byId.get('tutorial-step').textContent, '12 / 12', 'PC trust lesson completed Step 11 -> 12');

    // 3. Switch to Phone landscape (844x390, coarse pointer) and verify Phone Tutorial & Phone Normal Match
    coarse = true;
    fine = false;
    window.innerWidth = 844;
    window.innerHeight = 390;
    window.dispatchEvent({ type: 'resize' });
    window.dispatchEvent({ type: 'pointerdown', pointerType: 'touch' });
    assert.equal(document.body.classList.contains('touch-device'), true, 'touch mode activated');

    byId.get('tutorial-button').click();
    assert.equal(byId.get('tutorial-step').textContent, '1 / 12');
    assert.match(byId.get('tutorial-copy').textContent, /Drag the right side/i);

    // Phone Step 1: drag right side of canvas to look right and back to center
    byId.get('game-canvas').dispatchEvent({ type: 'pointerdown', pointerType: 'touch', pointerId: 2, clientX: 600, clientY: 200 });
    byId.get('game-canvas').dispatchEvent({ type: 'pointermove', pointerType: 'touch', pointerId: 2, clientX: 460, clientY: 200 });
    byId.get('game-canvas').dispatchEvent({ type: 'pointermove', pointerType: 'touch', pointerId: 2, clientX: 600, clientY: 200 });
    byId.get('game-canvas').dispatchEvent({ type: 'pointerup', pointerType: 'touch', pointerId: 2, clientX: 600, clientY: 200 });
    assert.equal(byId.get('tutorial-step').textContent, '2 / 12', 'Phone drag-to-look completed Step 1');

    // Phone Step 2: push virtual joystick forward toward briefing desk
    byId.get('touch-stick').dispatchEvent({ type: 'pointerdown', pointerType: 'touch', pointerId: 1, clientX: 78, clientY: 268 });
    byId.get('touch-stick').dispatchEvent({ type: 'pointermove', pointerType: 'touch', pointerId: 1, clientX: 78, clientY: 268 });
    advanceSeconds(0.8);
    byId.get('touch-stick').dispatchEvent({ type: 'pointerup', pointerType: 'touch', pointerId: 1 });
    assert.equal(byId.get('tutorial-step').textContent, '3 / 12', 'Phone virtual joystick completed Step 2');

    // Phone Step 3: tap USE on briefing desk, then tap CLOSE
    byId.get('touch-interact').dispatchEvent({ type: 'pointerdown', pointerType: 'touch', pointerId: 3 });
    byId.get('touch-interact').dispatchEvent({ type: 'pointerup', pointerType: 'touch', pointerId: 3 });
    assert.equal(byId.get('briefing-screen').classList.contains('hidden'), false);
    byId.get('briefing-close').click();
    assert.equal(byId.get('tutorial-step').textContent, '4 / 12', 'Phone USE button completed Step 3');

    // Phone Step 4: tap LAMP twice
    byId.get('touch-flashlight').dispatchEvent({ type: 'pointerdown', pointerType: 'touch', pointerId: 4 });
    byId.get('touch-flashlight').dispatchEvent({ type: 'pointerdown', pointerType: 'touch', pointerId: 4 });
    assert.equal(byId.get('tutorial-step').textContent, '5 / 12', 'Phone LAMP button completed Step 4');

    // Phone Step 5: push stick fully to outer edge to sprint
    byId.get('touch-stick').dispatchEvent({ type: 'pointerdown', pointerType: 'touch', pointerId: 1, clientX: 25, clientY: 318 });
    byId.get('touch-stick').dispatchEvent({ type: 'pointermove', pointerType: 'touch', pointerId: 1, clientX: 25, clientY: 318 });
    advanceSeconds(1.2);
    byId.get('touch-stick').dispatchEvent({ type: 'pointerup', pointerType: 'touch', pointerId: 1 });
    assert.equal(byId.get('tutorial-step').textContent, '6 / 12', 'Phone joystick-edge sprint completed Step 5');

    // Exit tutorial cleanly and start normal Phone match
    byId.get('tutorial-exit-button').click();
    assert.equal(byId.get('intro-screen').classList.contains('hidden'), false);
    byId.get('start-button').click();
    assert.equal(byId.get('hud').classList.contains('hidden'), false);
    assert.equal(byId.get('objective-card').classList.contains('hidden'), false);
    assert.equal(byId.get('tutorial-card').classList.contains('hidden'), true);
    advanceSeconds(0.5);
    assert.equal(byId.get('interaction-text').textContent, 'USE — READ INCIDENT BRIEFING', 'Phone normal match shows USE prompt facing desk');
  } finally {
    performance.now = origNow;
  }
});
