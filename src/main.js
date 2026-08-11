import * as THREE from 'three';
import './style.css';
import './mobile.css';
import {
  BOT_NAMES,
  BRIEFING_CONTROLS,
  BRIEFING_INTRO,
  BRIEFING_SECTIONS,
  BRIEFING_TITLE,
  INTERACTIVE_TUTORIAL_TOTAL_STEPS,
  advanceInteractiveTutorial,
  advanceTutorial,
  assignHiddenKiller,
  clamp,
  createInteractiveTutorialState,
  createSeededRandom,
  createTutorialState,
  formatClock,
  getAliveCount,
  getObjectiveState,
  getSurvivorCount,
  getTutorialInstruction,
  isTutorialComplete,
  pickEnvironmentalEvent,
} from './game-logic.js';
import { disposeObjectTree } from './three-utils.js';

const $ = (selector) => document.querySelector(selector);

const dom = {
  canvas: $('#game-canvas'),
  loading: $('#loading-screen'),
  hud: $('#hud'),
  intro: $('#intro-screen'),
  start: $('#start-button'),
  accessibility: $('#accessibility-screen'),
  accessibilityButton: $('#accessibility-button'),
  closeAccessibility: $('#close-accessibility'),
  reducedMotion: $('#reduced-motion'),
  highContrast: $('#high-contrast'),
  pause: $('#pause-screen'),
  pauseButton: $('#pause-button'),
  resume: $('#resume-button'),
  howToPlay: $('#how-to-play-button'),
  restartFromPause: $('#restart-from-pause'),
  briefing: $('#briefing-screen'),
  briefingBody: $('#briefing-body'),
  briefingHeading: $('#briefing-heading'),
  briefingClose: $('#briefing-close'),
  result: $('#result-screen'),
  resultKicker: $('#result-kicker'),
  resultHeading: $('#result-heading'),
  resultCopy: $('#result-copy'),
  reportGrid: $('#report-grid'),
  playAgain: $('#play-again-button'),
  roleCard: $('#role-card'),
  matchClock: $('#match-clock'),
  roleTitle: $('#role-title'),
  roleCopy: $('#role-copy'),
  objectiveTitle: $('#objective-title'),
  objectiveCopy: $('#objective-copy'),
  objectiveFill: $('#objective-progress-fill'),
  aliveCount: $('#alive-count'),
  healthFill: $('#health-fill'),
  healthValue: $('#health-value'),
  staminaFill: $('#stamina-fill'),
  heldItem: $('#held-item'),
  eventLog: $('#event-log'),
  interaction: $('#interaction-prompt'),
  interactionText: $('#interaction-text'),
  action: $('#action-prompt'),
  actionText: $('#action-text'),
  subtitle: $('#subtitle'),
  damageFlash: $('#damage-flash'),
  minimap: $('#minimap'),
  touchControls: $('#touch-controls'),
  touchStick: $('#touch-stick'),
  touchStickKnob: $('#touch-stick-knob'),
  touchInteract: $('#touch-interact'),
  touchAction: $('#touch-action'),
  touchFlashlight: $('#touch-flashlight'),
  tutorialButton: $('#tutorial-button'),
  tutorialCard: $('#tutorial-card'),
  tutorialStep: $('#tutorial-step'),
  tutorialTitle: $('#tutorial-title'),
  tutorialCopy: $('#tutorial-copy'),
  tutorialProgressFill: $('#tutorial-progress-fill'),
  tutorialHint: $('#tutorial-hint'),
  tutorialSkip: $('#tutorial-skip-button'),
  tutorialExit: $('#tutorial-exit-button'),
  tutorialComplete: $('#tutorial-complete-screen'),
  tutorialStartMatch: $('#tutorial-start-match'),
  tutorialRepeat: $('#tutorial-repeat-button'),
  tutorialHome: $('#tutorial-home-button'),
  tutorialPauseExit: $('#tutorial-pause-exit'),
};

const COLORS = {
  aqua: 0x7fffc8,
  aquaSoft: 0x3ba87d,
  red: 0xfc4c50,
  redDark: 0x6e1018,
  amber: 0xf7bd4e,
  floor: 0x101d1c,
  wall: 0x1d302e,
  wallTrim: 0x35514c,
  uniform: 0x506763,
  skin: 0xb98269,
};

const ZONES = {
  generatorA: { id: 'generatorA', label: 'GENERATOR 01', position: new THREE.Vector3(-23, 0, -20), access: new THREE.Vector3(-16.5, 0, -20) },
  generatorB: { id: 'generatorB', label: 'GENERATOR 02', position: new THREE.Vector3(23, 0, -20), access: new THREE.Vector3(16.5, 0, -20) },
  generatorC: { id: 'generatorC', label: 'GENERATOR 03', position: new THREE.Vector3(-23, 0, 20), access: new THREE.Vector3(-16.5, 0, 20) },
  security: { id: 'security', label: 'SECURITY', position: new THREE.Vector3(23, 0, 20), access: new THREE.Vector3(16.5, 0, 20) },
  exit: { id: 'exit', label: 'QUARANTINE EXIT', position: new THREE.Vector3(0, 0, -31.3), access: new THREE.Vector3(0, 0, -28) },
  lobby: { id: 'lobby', label: 'LOBBY', position: new THREE.Vector3(0, 0, 8), access: new THREE.Vector3(0, 0, 8) },
};

const vecDistance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const randomFrom = (random, list) => list[Math.floor(random() * list.length)];
const toRadians = (degrees) => (degrees * Math.PI) / 180;

function lerpAngle(a, b, amount) {
  let difference = (b - a + Math.PI) % (Math.PI * 2) - Math.PI;
  if (difference < -Math.PI) difference += Math.PI * 2;
  return a + difference * Math.min(1, amount);
}

function makeLabelSprite(text, color = '#a4ffcf', scale = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(3, 14, 15, 0.84)';
  context.fillRect(0, 10, canvas.width, 76);
  context.strokeStyle = color;
  context.globalAlpha = 0.55;
  context.strokeRect(1, 11, canvas.width - 2, 74);
  context.globalAlpha = 1;
  context.fillStyle = color;
  context.font = '600 38px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.8 * scale, 0.72 * scale, 1);
  return sprite;
}

/** Lightweight generated audio: every cue is created locally after player input. */
class AudioDirector {
  constructor() {
    this.context = null;
    this.master = null;
    this.ambient = null;
    this.enabled = true;
  }

  start() {
    if (!this.enabled) return;
    try {
      if (!this.context) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        this.context = new AudioContextClass();
        this.master = this.context.createGain();
        this.master.gain.value = 0.26;
        this.master.connect(this.context.destination);
        this.startAmbient();
      }
      if (this.context.state === 'suspended') this.context.resume();
    } catch {
      // Audio is an enhancement; gameplay remains complete if a browser blocks it.
    }
  }

  startAmbient() {
    if (!this.context || this.ambient) return;
    const drone = this.context.createOscillator();
    const droneGain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    const tremolo = this.context.createOscillator();
    const tremoloGain = this.context.createGain();
    drone.type = 'sine';
    drone.frequency.value = 46;
    filter.type = 'lowpass';
    filter.frequency.value = 180;
    droneGain.gain.value = 0.022;
    tremolo.frequency.value = 0.09;
    tremoloGain.gain.value = 0.012;
    tremolo.connect(tremoloGain).connect(droneGain.gain);
    drone.connect(filter).connect(droneGain).connect(this.master);
    drone.start();
    tremolo.start();
    this.ambient = { drone, tremolo, droneGain };
  }

  tone(frequency, duration = 0.12, type = 'sine', volume = 0.1, slideTo = null) {
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.025);
  }

  noise(duration = 0.15, volume = 0.08, cutoff = 1000) {
    if (!this.context || !this.master) return;
    const length = Math.ceil(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(this.master);
    source.start();
  }

  cue(type) {
    switch (type) {
      case 'repair': this.tone(190, 0.08, 'square', 0.04, 230); break;
      case 'complete': this.tone(220, 0.15, 'sine', 0.09, 440); setTimeout(() => this.tone(440, 0.22, 'sine', 0.07, 660), 95); break;
      case 'sabotage': this.tone(130, 0.22, 'sawtooth', 0.08, 45); this.noise(0.08, 0.04, 700); break;
      case 'pickup': this.tone(510, 0.1, 'triangle', 0.07, 760); break;
      case 'alarm': this.tone(680, 0.18, 'square', 0.08, 520); setTimeout(() => this.tone(680, 0.18, 'square', 0.07, 520), 240); break;
      case 'attack': this.noise(0.18, 0.13, 460); this.tone(74, 0.15, 'sawtooth', 0.09, 38); break;
      case 'hurt': this.tone(90, 0.25, 'sawtooth', 0.11, 42); this.noise(0.1, 0.07, 320); break;
      case 'taser': this.tone(156, 0.12, 'square', 0.09, 990); this.noise(0.1, 0.05, 1600); break;
      case 'evidence': this.tone(330, 0.12, 'triangle', 0.05, 510); break;
      case 'escape': this.tone(260, 0.35, 'sine', 0.12, 620); break;
      case 'death': this.tone(120, 0.6, 'sawtooth', 0.09, 28); break;
      default: break;
    }
  }
}

class UnmarkedGame {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ canvas: dom.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.86;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020708);
    this.scene.fog = new THREE.FogExp2(0x071110, 0.026);
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.08, 145);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);
    this.clock = new THREE.Clock();
    this.audio = new AudioDirector();

    this.phase = 'menu';
    this.matchTime = 0;
    this.random = Math.random;
    this.yaw = Math.PI;
    this.pitch = -0.06;
    this.cameraShake = 0;
    this.keys = new Set();
    this.staticColliders = [];
    this.staticGroup = new THREE.Group();
    this.matchGroup = new THREE.Group();
    this.fxGroup = new THREE.Group();
    this.scene.add(this.staticGroup, this.matchGroup, this.fxGroup);
    this.lights = [];
    this.vfx = [];
    this.eventLines = [];
    this.subtitleTimer = null;
    this.lastPrompt = null;
    this.flashlightOn = true;
    this.flashlight = null;
    this.flashlightTarget = null;
    this.blackoutUntil = 0;
    this.fogSurgeUntil = 0;
    this.nextEventAt = 30;
    this.exitDoorOpen = 0;
    this.awaitingPointerLock = false;
    this.isTouchDevice = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    this.touchMove = { x: 0, y: 0, pointerId: null };
    this.touchLook = { pointerId: null, x: 0, y: 0 };
    document.body.classList.toggle('touch-device', this.isTouchDevice);
    this.settings = { reducedMotion: false, highContrast: false };
    // Bumped on every startMatch(). Pending timeouts from a previous match can
    // compare their captured epoch against this to avoid touching a new match.
    this.matchEpoch = 0;
    // Match-managed collision boxes (briefing desk) so restart cleanup is exact.
    this.matchColliders = [];
    this.briefingOpen = false;
    this.tutorialState = createTutorialState();
    this.briefingLetter = null;

    // Interactive tutorial (hands-on training): structured state avoids scattered flags
    this.isTutorial = false;
    this.interactiveTutorialState = null;
    this.tutorialObjects = [];
    this.tutorialTarget = null;
    this.tutorialDummy = null;
    this.tutorialGenerator = null;
    this.tutorialKeycard = null;
    this.tutorialTaser = null;
    this.tutorialPipe = null;
    this.tutorialPrevYaw = this.yaw;
    this.tutorialPrevPitch = this.pitch;
    this._tutorialSprintAccum = 0;

    this.player = {
      id: 'player',
      name: 'YOU',
      role: 'survivor',
      position: new THREE.Vector3(0, 0, 16),
      alive: true,
      escaped: false,
      health: 100,
      stamina: 100,
      held: null,
      hidden: false,
      interaction: null,
      actionCooldown: 0,
    };

    this.setupScene();
    this.buildFacility();
    this.bindEvents();
    this.buildBriefing();
    this.updateCamera();
    this.renderLoop();
    window.setTimeout(() => dom.loading.classList.add('done'), 650);
  }

  setupScene() {
    const hemisphere = new THREE.HemisphereLight(0x476360, 0x06100e, 0.65);
    this.scene.add(hemisphere);
    this.ambientLight = new THREE.AmbientLight(0x6ea998, 0.32);
    this.scene.add(this.ambientLight);

    const moon = new THREE.DirectionalLight(0x97d8ca, 0.7);
    moon.position.set(-16, 25, 9);
    moon.castShadow = true;
    moon.shadow.mapSize.set(1024, 1024);
    moon.shadow.camera.left = -45;
    moon.shadow.camera.right = 45;
    moon.shadow.camera.top = 45;
    moon.shadow.camera.bottom = -45;
    this.scene.add(moon);

    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    for (let i = 0; i < 220; i += 1) {
      const radius = 42 + Math.random() * 62;
      starPositions.push((Math.random() - 0.5) * radius * 2, 14 + Math.random() * 36, (Math.random() - 0.5) * radius * 2);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0x83cbb6, size: 0.16, transparent: true, opacity: 0.42 }));
    this.scene.add(stars);

    this.flashlight = new THREE.SpotLight(0xdffff1, 2.5, 25, toRadians(30), 0.66, 1.4);
    this.flashlight.castShadow = false;
    this.flashlight.position.set(0, 1.5, 0);
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, 1.4, -9);
    this.camera.add(this.flashlight, this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
  }

  bindEvents() {
    dom.start.addEventListener('click', () => this.startMatch());
    if (dom.tutorialButton) dom.tutorialButton.addEventListener('click', () => this.startTutorial());
    dom.playAgain.addEventListener('click', () => this.startMatch());
    dom.pauseButton.addEventListener('click', () => this.pauseGame());
    dom.resume.addEventListener('click', () => this.resumeGame());
    dom.howToPlay.addEventListener('click', () => this.openBriefing());
    dom.briefingClose.addEventListener('click', () => this.closeBriefing());
    dom.restartFromPause.addEventListener('click', () => this.startMatch());
    if (dom.tutorialPauseExit) dom.tutorialPauseExit.addEventListener('click', () => this.exitTutorialToHome());
    if (dom.tutorialSkip) dom.tutorialSkip.addEventListener('click', () => this.exitTutorialToHome());
    if (dom.tutorialExit) dom.tutorialExit.addEventListener('click', () => this.exitTutorialToHome());
    if (dom.tutorialStartMatch) dom.tutorialStartMatch.addEventListener('click', () => this.startMatch());
    if (dom.tutorialRepeat) dom.tutorialRepeat.addEventListener('click', () => this.startTutorial());
    if (dom.tutorialHome) dom.tutorialHome.addEventListener('click', () => this.exitTutorialToHome());
    dom.accessibilityButton.addEventListener('click', () => dom.accessibility.classList.remove('hidden'));
    dom.closeAccessibility.addEventListener('click', () => dom.accessibility.classList.add('hidden'));
    dom.reducedMotion.addEventListener('change', () => {
      this.settings.reducedMotion = dom.reducedMotion.checked;
      document.body.classList.toggle('reduced-motion', this.settings.reducedMotion);
    });
    dom.highContrast.addEventListener('change', () => {
      this.settings.highContrast = dom.highContrast.checked;
      document.body.classList.toggle('high-contrast', this.settings.highContrast);
    });

    window.addEventListener('resize', () => this.resize());
    document.addEventListener('keydown', (event) => this.onKeyDown(event));
    document.addEventListener('keyup', (event) => this.keys.delete(event.code));
    document.addEventListener('mousemove', (event) => {
      if (document.pointerLockElement !== dom.canvas || this.phase !== 'playing') return;
      const modifier = this.settings.reducedMotion ? 0.00095 : 0.00175;
      const prevYaw = this.yaw;
      const prevPitch = this.pitch;
      this.yaw -= event.movementX * modifier;
      this.pitch = clamp(this.pitch - event.movementY * modifier, -1.25, 1.08);
      if (this.isTutorial && this.interactiveTutorialState && this.interactiveTutorialState.step === 1) {
        const delta = Math.abs(this.yaw - prevYaw) + Math.abs(this.pitch - prevPitch);
        if (delta > 0.001) this.signalInteractiveTutorial({ type: 'cameraMoved', delta });
      }
    });
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === dom.canvas) {
        this.awaitingPointerLock = false;
        return;
      }
      if (!this.isTouchDevice && this.phase === 'playing' && !this.awaitingPointerLock) this.pauseGame(true);
    });
    dom.canvas.addEventListener('mousedown', (event) => {
      if (this.phase === 'playing' && document.pointerLockElement !== dom.canvas) this.requestPointerLock();
      if (this.phase === 'playing' && event.button === 0 && document.pointerLockElement === dom.canvas) this.useAction();
    });
    this.bindTouchControls();
  }

  bindTouchControls() {
    if (!this.isTouchDevice) return;
    const stop = (event) => { event.preventDefault(); event.stopPropagation(); };
    const resetStick = () => {
      this.touchMove.x = 0;
      this.touchMove.y = 0;
      this.touchMove.pointerId = null;
      dom.touchStickKnob.style.transform = 'translate(0, 0)';
    };
    const moveStick = (event) => {
      if (event.pointerId !== this.touchMove.pointerId) return;
      stop(event);
      const rect = dom.touchStick.getBoundingClientRect();
      const radius = rect.width * 0.32;
      let x = event.clientX - (rect.left + rect.width / 2);
      let y = event.clientY - (rect.top + rect.height / 2);
      const length = Math.hypot(x, y);
      if (length > radius) { x = (x / length) * radius; y = (y / length) * radius; }
      this.touchMove.x = x / radius;
      this.touchMove.y = y / radius;
      dom.touchStickKnob.style.transform = `translate(${x}px, ${y}px)`;
    };
    dom.touchStick.addEventListener('pointerdown', (event) => {
      stop(event);
      this.touchMove.pointerId = event.pointerId;
      dom.touchStick.setPointerCapture(event.pointerId);
      moveStick(event);
    });
    dom.touchStick.addEventListener('pointermove', moveStick);
    dom.touchStick.addEventListener('pointerup', resetStick);
    dom.touchStick.addEventListener('pointercancel', resetStick);

    dom.canvas.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'touch' || this.phase !== 'playing' || event.clientX < window.innerWidth * 0.36) return;
      this.touchLook = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
      dom.canvas.setPointerCapture(event.pointerId);
    });
    dom.canvas.addEventListener('pointermove', (event) => {
      if (event.pointerId !== this.touchLook.pointerId || this.phase !== 'playing') return;
      event.preventDefault();
      const sensitivity = this.settings.reducedMotion ? 0.0024 : 0.0034;
      const prevYaw = this.yaw;
      const prevPitch = this.pitch;
      this.yaw -= (event.clientX - this.touchLook.x) * sensitivity;
      this.pitch = clamp(this.pitch - (event.clientY - this.touchLook.y) * sensitivity, -1.25, 1.08);
      this.touchLook.x = event.clientX;
      this.touchLook.y = event.clientY;
      if (this.isTutorial && this.interactiveTutorialState && this.interactiveTutorialState.step === 1) {
        const delta = Math.abs(this.yaw - prevYaw) + Math.abs(this.pitch - prevPitch);
        if (delta > 0.001) this.signalInteractiveTutorial({ type: 'cameraMoved', delta });
      }
    });
    const endLook = (event) => { if (event.pointerId === this.touchLook.pointerId) this.touchLook.pointerId = null; };
    dom.canvas.addEventListener('pointerup', endLook);
    dom.canvas.addEventListener('pointercancel', endLook);

    const holdInteract = (event) => {
      stop(event);
      if (this.phase !== 'playing') return;
      // Tutorial trust lesson: USE also acknowledges
      if (this.isTutorial && this.interactiveTutorialState && this.interactiveTutorialState.step === 11) {
        this.signalInteractiveTutorial({ type: 'trustAcknowledged' });
        return;
      }
      this.keys.add('KeyE');
      this.beginInteraction();
      dom.touchInteract.classList.add('pressed');
    };
    const releaseInteract = (event) => {
      stop(event);
      this.keys.delete('KeyE');
      dom.touchInteract.classList.remove('pressed');
    };
    dom.touchInteract.addEventListener('pointerdown', holdInteract);
    dom.touchInteract.addEventListener('pointerup', releaseInteract);
    dom.touchInteract.addEventListener('pointercancel', releaseInteract);
    dom.touchAction.addEventListener('pointerdown', (event) => { stop(event); this.useAction(); });
    dom.touchFlashlight.addEventListener('pointerdown', (event) => {
      stop(event);
      if (this.phase !== 'playing') return;
      this.flashlightOn = !this.flashlightOn;
      this.showSubtitle(this.flashlightOn ? 'Flashlight on.' : 'Flashlight off.', 1050);
      this.audio.cue(this.flashlightOn ? 'pickup' : 'sabotage');
      if (this.isTutorial && this.interactiveTutorialState && this.interactiveTutorialState.step === 4) {
        this.signalInteractiveTutorial({ type: 'flashlightToggled', on: this.flashlightOn });
      }
    });
  }

  onKeyDown(event) {
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyF', 'KeyQ', 'KeyH', 'ShiftLeft', 'ShiftRight'].includes(event.code)) event.preventDefault();
    this.keys.add(event.code);

    // The briefing overlay owns the keyboard while it is open: E, Escape, or H
    // all close it, and Escape closes the briefing before the pause menu.
    if (this.briefingOpen) {
      if (event.code === 'KeyE' || event.code === 'Escape' || event.code === 'KeyH') this.closeBriefing();
      return;
    }
    if (event.code === 'KeyH' && !event.repeat) {
      if (this.phase === 'playing') this.openBriefing();
      return;
    }
    if (event.code === 'Escape') {
      if (this.phase === 'playing') this.pauseGame();
      return;
    }
    if (this.phase !== 'playing' || event.repeat) return;
    // Tutorial trust lesson: any E acknowledges
    if (this.isTutorial && this.interactiveTutorialState && this.interactiveTutorialState.step === 11 && event.code === 'KeyE') {
      this.signalInteractiveTutorial({ type: 'trustAcknowledged' });
      return;
    }
    if (event.code === 'KeyE') this.beginInteraction();
    if (event.code === 'KeyF') this.useAction();
    if (event.code === 'KeyQ') {
      this.flashlightOn = !this.flashlightOn;
      this.showSubtitle(this.flashlightOn ? 'Flashlight on.' : 'Flashlight off.', 1050);
      this.audio.cue(this.flashlightOn ? 'pickup' : 'sabotage');
      if (this.isTutorial && this.interactiveTutorialState && this.interactiveTutorialState.step === 4) {
        this.signalInteractiveTutorial({ type: 'flashlightToggled', on: this.flashlightOn });
      }
    }
  }

  requestPointerLock() {
    if (this.isTouchDevice) return;
    this.awaitingPointerLock = true;
    const lock = dom.canvas.requestPointerLock?.();
    if (lock?.catch) lock.catch(() => { this.awaitingPointerLock = false; });
    window.setTimeout(() => { this.awaitingPointerLock = false; }, 700);
  }

  pauseGame(fromPointerChange = false) {
    if (this.phase !== 'playing') return;
    this.phase = 'paused';
    this.keys.clear();
    this.touchMove.x = 0;
    this.touchMove.y = 0;
    dom.touchStickKnob.style.transform = 'translate(0, 0)';
    dom.pause.classList.remove('hidden');
    // Tutorial pause shows EXIT TRAINING, hides abandon match during training
    if (dom.tutorialPauseExit) {
      if (this.isTutorial) {
        dom.tutorialPauseExit.classList.remove('hidden');
        dom.restartFromPause.classList.add('hidden');
      } else {
        dom.tutorialPauseExit.classList.add('hidden');
        dom.restartFromPause.classList.remove('hidden');
      }
    }
    if (!fromPointerChange && document.pointerLockElement === dom.canvas) document.exitPointerLock?.();
  }

  resumeGame() {
    if (this.phase !== 'paused') return;
    dom.pause.classList.add('hidden');
    this.phase = 'playing';
    this.requestPointerLock();
  }

  /** Builds the briefing overlay DOM once from the shared game-logic content. */
  buildBriefing() {
    const body = dom.briefingBody;
    body.replaceChildren();
    dom.briefingHeading.textContent = BRIEFING_TITLE;

    const intro = document.createElement('p');
    intro.className = 'briefing-intro';
    intro.textContent = BRIEFING_INTRO;
    body.append(intro);

    const controlsSection = document.createElement('section');
    const controlsHeading = document.createElement('h3');
    controlsHeading.textContent = 'CONTROLS';
    controlsSection.append(controlsHeading);
    const grid = document.createElement('div');
    grid.className = 'briefing-controls';
    const controls = this.isTouchDevice ? [
      { keys: 'STICK', action: 'Move; push to the edge to sprint' },
      { keys: 'DRAG', action: 'Look around on the right side' },
      { keys: 'USE', action: 'Interact; hold to repair or sabotage' },
      { keys: 'ACT', action: 'Attack or use the held item' },
      { keys: 'LAMP', action: 'Toggle flashlight' },
      { keys: 'Ⅱ', action: 'Pause or reopen How to Play' },
    ] : BRIEFING_CONTROLS;
    for (const control of controls) {
      const row = document.createElement('p');
      const kbd = document.createElement('kbd');
      kbd.textContent = control.keys;
      const span = document.createElement('span');
      span.textContent = control.action;
      row.append(kbd, span);
      grid.append(row);
    }
    controlsSection.append(grid);
    body.append(controlsSection);

    for (const section of BRIEFING_SECTIONS) {
      const element = document.createElement('section');
      const heading = document.createElement('h3');
      heading.textContent = section.heading;
      element.append(heading);
      const paragraph = document.createElement('p');
      const lines = section.body.split('\n');
      lines.forEach((line, index) => {
        if (index > 0) paragraph.append(document.createElement('br'));
        paragraph.append(document.createTextNode(line));
      });
      element.append(paragraph);
      body.append(element);
    }
  }

  /**
   * Opens the shared briefing overlay. From gameplay the simulation is frozen
   * (phase 'briefing' stops the update loop) and pointer lock is released so
   * the mouse works inside the overlay. From the pause menu the pause phase is
   * kept, so closing the briefing returns to the pause menu.
   */
  openBriefing() {
    if (this.briefingOpen) return;
    this.briefingOpen = true;
    if (this.phase === 'playing') {
      this.keys.clear();
      this.player.interaction = null;
      this.phase = 'briefing';
      if (document.pointerLockElement === dom.canvas) document.exitPointerLock?.();
      this.signalTutorial('letterOpened');
      if (this.isTutorial) this.signalInteractiveTutorial({ type: 'letterOpened' });
    }
    dom.briefing.classList.remove('hidden');
    dom.briefingClose.focus();
    this.audio.cue('pickup');
  }

  closeBriefing() {
    if (!this.briefingOpen) return;
    this.briefingOpen = false;
    dom.briefing.classList.add('hidden');
    this.keys.clear();
    if (this.phase === 'briefing') {
      this.phase = 'playing';
      this.requestPointerLock();
      this.signalTutorial('letterClosed');
      if (this.isTutorial) this.signalInteractiveTutorial({ type: 'letterClosed' });
    }
    this.audio.cue('pickup');
  }

  signalTutorial(type) {
    const result = advanceTutorial(this.tutorialState, { type });
    this.tutorialState = result.state;
    if (result.message && this.phase === 'playing' && !this.isTutorial) this.showSubtitle(result.message, 3800);
  }

  signalInteractiveTutorial(signal) {
    if (!this.isTutorial || !this.interactiveTutorialState) return;
    const before = this.interactiveTutorialState.step;
    const result = advanceInteractiveTutorial(this.interactiveTutorialState, signal);
    this.interactiveTutorialState = result.state;
    if (result.advanced) {
      this.refreshTutorialCard();
      // Light feedback for each step
      if (this.interactiveTutorialState.step === 12 || this.interactiveTutorialState.complete) {
        // Delay to let final subtitle finish before showing complete screen
        if (this.interactiveTutorialState.step === 12 && !this.interactiveTutorialState.complete && signal.type === 'trustAcknowledged') {
          this.showSubtitle('Trust your eyes. Verify everything.', 2600);
          window.setTimeout(() => {
            if (!this.isTutorial) return;
            this.interactiveTutorialState.complete = true;
            this.refreshTutorialCard();
            this.completeInteractiveTutorial();
          }, 900);
        } else if (this.interactiveTutorialState.step === 12) {
          this.completeInteractiveTutorial();
        } else {
          this.audio.cue('pickup');
          this.showSubtitle(`Training step ${before} complete.`, 1600);
        }
      } else {
        this.audio.cue('pickup');
        const hint = getTutorialInstruction(this.interactiveTutorialState, this.isTouchDevice).hint;
        if (hint) this.showSubtitle(hint, 2200);
      }
      // Highlight next objective if needed (glow already handled)
      this.highlightTutorialObjective();
    }
  }

  refreshTutorialCard() {
    if (!this.isTutorial || !this.interactiveTutorialState || !dom.tutorialCard) return;
    const info = getTutorialInstruction(this.interactiveTutorialState, this.isTouchDevice);
    const total = INTERACTIVE_TUTORIAL_TOTAL_STEPS;
    dom.tutorialStep.textContent = `${info.step} / ${total}`;
    dom.tutorialTitle.textContent = info.title.toUpperCase();
    dom.tutorialCopy.textContent = info.instruction;
    dom.tutorialHint.textContent = info.hint || '';
    const progress = ((info.step - 1) / total) * 100;
    // For complete, fill fully
    dom.tutorialProgressFill.style.width = `${this.interactiveTutorialState.complete ? 100 : progress}%`;
    // Keep card visible unless tutorial complete screen is up
    if (!this.interactiveTutorialState.complete) {
      dom.tutorialCard.classList.remove('hidden');
      dom.objectiveCard.classList.add('hidden');
      dom.tutorialPauseExit?.classList.remove('hidden');
    }
  }

  highlightTutorialObjective() {
    if (!this.isTutorial || !this.interactiveTutorialState) return;
    const step = this.interactiveTutorialState.step;
    // Pulse the relevant object's light/material for the current step
    const pulse = (obj, intensity) => {
      if (!obj || !obj.glowLight) return;
      obj.glowLight.intensity = intensity;
    };
    // Reset subtle pulsing handled in update loop; this just nudges.
    if (step === 3 && this.briefingLetter) pulse(this.briefingLetter, 1.4);
    if (step === 6 && this.tutorialGenerator) {
      this.tutorialGenerator.light.intensity = 1.1;
      this.tutorialGenerator.panel.material.emissiveIntensity = 2.2;
    }
    if (step === 7 && this.tutorialTaser) {
      if (this.tutorialTaser.group) this.tutorialTaser.group.visible = true;
    }
  }

  completeInteractiveTutorial() {
    if (!this.isTutorial) return;
    // Hide tutorial card, pause gameplay, show completion overlay
    dom.tutorialCard.classList.add('hidden');
    dom.tutorialPauseExit?.classList.add('hidden');
    dom.tutorialComplete.classList.remove('hidden');
    this.phase = 'paused';
    document.body.classList.remove('in-tutorial');
    document.body.classList.remove('in-match');
    if (document.pointerLockElement === dom.canvas) document.exitPointerLock?.();
    this.showSubtitle('TRAINING COMPLETE — You are ready.', 4200);
    this.audio.cue('complete');
    // Ensure touch controls reset
    this.keys.clear();
    this.touchMove.x = 0; this.touchMove.y = 0;
    if (dom.touchStickKnob) dom.touchStickKnob.style.transform = 'translate(0, 0)';
  }

  exitTutorialToHome() {
    // Clean up tutorial and return to home/menu without leaking resources
    this.isTutorial = false;
    this.interactiveTutorialState = null;
    this.tutorialObjects = [];
    this.tutorialTarget = null;
    this.tutorialDummy = null;
    this.tutorialGenerator = null;
    this.tutorialKeycard = null;
    this.tutorialTaser = null;
    this.tutorialPipe = null;
    if (dom.tutorialCard) dom.tutorialCard.classList.add('hidden');
    if (dom.tutorialComplete) dom.tutorialComplete.classList.add('hidden');
    dom.objectiveCard.classList.remove('hidden');
    dom.tutorialPauseExit?.classList.add('hidden');
    document.body.classList.remove('in-tutorial');
    document.body.classList.remove('in-match');
    this.clearMatch();
    dom.hud.classList.add('hidden');
    dom.intro.classList.remove('hidden');
    dom.pause.classList.add('hidden');
    dom.result.classList.add('hidden');
    dom.briefing.classList.add('hidden');
    this.briefingOpen = false;
    this.phase = 'menu';
    this.keys.clear();
    this.touchMove.x = 0; this.touchMove.y = 0;
    if (dom.touchStickKnob) dom.touchStickKnob.style.transform = 'translate(0, 0)';
    this.yaw = Math.PI;
    this.pitch = -0.06;
    this.updateCamera();
    this.flashlightOn = true;
    this.player.health = 100; this.player.stamina = 100; this.player.held = null;
    // Return page scroll to safe state
    window.scrollTo(0,0);
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  addBox({ x, y, z, width, height, depth, material, collision = true, group = this.staticGroup, castShadow = true, receiveShadow = true }) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    group.add(mesh);
    if (collision) this.staticColliders.push({ minX: x - width / 2, maxX: x + width / 2, minZ: z - depth / 2, maxZ: z + depth / 2 });
    return mesh;
  }

  addFacilityLight(position, color = COLORS.aqua, intensity = 1.4, distance = 13) {
    const fixture = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.12, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x7bb5a3, emissive: color, emissiveIntensity: 1.7, roughness: 0.55 }),
    );
    fixture.position.copy(position);
    fixture.position.y -= 0.15;
    this.staticGroup.add(fixture);
    const light = new THREE.PointLight(color, intensity, distance, 1.7);
    light.position.copy(position);
    this.scene.add(light);
    this.lights.push({ light, base: intensity, phase: Math.random() * 10 });
    return light;
  }

  addRoom({ zone, open }) {
    const wallMaterial = this.wallMaterial;
    const trimMaterial = this.trimMaterial;
    const x = zone.position.x;
    const z = zone.position.z;
    const width = 12;
    const depth = 12;
    const wallHeight = 4.8;
    if (open === 'east') {
      this.addBox({ x: x - width / 2, y: wallHeight / 2, z, width: 0.65, height: wallHeight, depth, material: wallMaterial });
      this.addBox({ x, y: wallHeight / 2, z: z - depth / 2, width, height: wallHeight, depth: 0.65, material: wallMaterial });
      this.addBox({ x, y: wallHeight / 2, z: z + depth / 2, width, height: wallHeight, depth: 0.65, material: wallMaterial });
      this.addBox({ x: x - width / 2 + 0.38, y: 1.15, z, width: 0.13, height: 2.2, depth: 2.8, material: trimMaterial, collision: false });
    } else {
      this.addBox({ x: x + width / 2, y: wallHeight / 2, z, width: 0.65, height: wallHeight, depth, material: wallMaterial });
      this.addBox({ x, y: wallHeight / 2, z: z - depth / 2, width, height: wallHeight, depth: 0.65, material: wallMaterial });
      this.addBox({ x, y: wallHeight / 2, z: z + depth / 2, width, height: wallHeight, depth: 0.65, material: wallMaterial });
      this.addBox({ x: x + width / 2 - 0.38, y: 1.15, z, width: 0.13, height: 2.2, depth: 2.8, material: trimMaterial, collision: false });
    }
    const sign = makeLabelSprite(zone.label, '#a5f7ce', 0.88);
    sign.position.set(open === 'east' ? x - width / 2 + 0.45 : x + width / 2 - 0.45, 3.5, z);
    sign.material.rotation = open === 'east' ? Math.PI / 2 : -Math.PI / 2;
    this.staticGroup.add(sign);
    this.addFacilityLight(new THREE.Vector3(x, 4.35, z), COLORS.aquaSoft, 1.25, 10);

    const desk = this.addBox({ x: x + (open === 'east' ? -2.2 : 2.2), y: 0.55, z: z + 2.7, width: 2.2, height: 1.1, depth: 1.1, material: this.propMaterial, collision: true });
    desk.rotation.y = open === 'east' ? 0.15 : -0.15;
    for (let i = 0; i < 3; i += 1) {
      const crate = this.addBox({
        x: x + (this.randomStatic() - 0.5) * 7,
        y: 0.45,
        z: z + (this.randomStatic() - 0.5) * 7,
        width: 0.8 + this.randomStatic() * 0.55,
        height: 0.9,
        depth: 0.8 + this.randomStatic() * 0.5,
        material: this.crateMaterial,
        collision: false,
      });
      crate.rotation.y = this.randomStatic() * Math.PI;
    }
  }

  randomStatic() {
    // Fixed-looking decorative randomness without affecting actual match randomness.
    return Math.random();
  }

  buildFacility() {
    this.floorMaterial = new THREE.MeshStandardMaterial({ color: COLORS.floor, roughness: 0.9, metalness: 0.13 });
    this.wallMaterial = new THREE.MeshStandardMaterial({ color: COLORS.wall, roughness: 0.82, metalness: 0.16 });
    this.trimMaterial = new THREE.MeshStandardMaterial({ color: COLORS.wallTrim, roughness: 0.55, metalness: 0.38, emissive: 0x10201c, emissiveIntensity: 0.3 });
    this.propMaterial = new THREE.MeshStandardMaterial({ color: 0x2b3935, roughness: 0.74, metalness: 0.25 });
    this.crateMaterial = new THREE.MeshStandardMaterial({ color: 0x463d2c, roughness: 0.87, metalness: 0.05 });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(72, 72), this.floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.staticGroup.add(floor);
    const grid = new THREE.GridHelper(70, 35, 0x31544c, 0x172c29);
    grid.position.y = 0.014;
    grid.material.transparent = true;
    grid.material.opacity = 0.25;
    this.staticGroup.add(grid);

    // Building shell. The north wall has one sealed quarantine doorway.
    this.addBox({ x: -35, y: 2.5, z: 0, width: 0.8, height: 5, depth: 71, material: this.wallMaterial });
    this.addBox({ x: 35, y: 2.5, z: 0, width: 0.8, height: 5, depth: 71, material: this.wallMaterial });
    this.addBox({ x: 0, y: 2.5, z: 35, width: 71, height: 5, depth: 0.8, material: this.wallMaterial });
    this.addBox({ x: -19.7, y: 2.5, z: -35, width: 30.6, height: 5, depth: 0.8, material: this.wallMaterial });
    this.addBox({ x: 19.7, y: 2.5, z: -35, width: 30.6, height: 5, depth: 0.8, material: this.wallMaterial });

    this.addRoom({ zone: ZONES.generatorA, open: 'east' });
    this.addRoom({ zone: ZONES.generatorB, open: 'west' });
    this.addRoom({ zone: ZONES.generatorC, open: 'east' });
    this.addRoom({ zone: ZONES.security, open: 'west' });

    // Centre lobby props create cover but leave clean walking lanes.
    this.addBox({ x: -5.3, y: 0.72, z: 4, width: 2.3, height: 1.45, depth: 1.25, material: this.crateMaterial, collision: true });
    this.addBox({ x: 6.2, y: 0.5, z: 7.1, width: 1.1, height: 1, depth: 1.1, material: this.crateMaterial, collision: true });
    this.addBox({ x: 4.8, y: 0.36, z: 8.2, width: 0.72, height: 0.72, depth: 0.72, material: this.crateMaterial, collision: false });
    const lobbySign = makeLabelSprite('SECTOR 07 / LOBBY', '#93d9bd', 1.05);
    lobbySign.position.set(0, 4.3, 31.3);
    this.staticGroup.add(lobbySign);

    this.addFacilityLight(new THREE.Vector3(0, 4.4, 8), COLORS.aquaSoft, 1.7, 14);
    this.addFacilityLight(new THREE.Vector3(0, 4.4, -11), COLORS.aquaSoft, 1.5, 14);
    this.addFacilityLight(new THREE.Vector3(0, 4.4, -27), COLORS.red, 0.86, 11);

    // Lockers are a gameplay hiding location and visual landmark.
    this.lockers = [];
    this.addLocker(-2.8, 16.7, Math.PI);
    this.addLocker(8.4, -8.2, -Math.PI / 2);
    this.addLocker(-9.5, -8.2, Math.PI / 2);

    // Security terminal is a clue source, not a role reveal.
    const terminalGroup = new THREE.Group();
    terminalGroup.position.set(20.6, 0, 17.2);
    const terminalBase = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.25, 0.8), this.propMaterial);
    terminalBase.position.y = 0.65;
    const terminalScreen = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.58, 0.08), new THREE.MeshStandardMaterial({ color: 0x111e1b, emissive: 0x195e49, emissiveIntensity: 1.35 }));
    terminalScreen.position.set(0, 1.43, -0.42);
    terminalGroup.add(terminalBase, terminalScreen);
    this.staticGroup.add(terminalGroup);
    this.terminal = { type: 'terminal', position: terminalGroup.position, group: terminalGroup, screen: terminalScreen };

    this.buildExitDoor();
    this.addExteriorDetails();
  }

  addLocker(x, z, rotation = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    const metal = new THREE.MeshStandardMaterial({ color: 0x30433f, roughness: 0.7, metalness: 0.5 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.5, 0.9), metal);
    body.position.y = 1.75;
    body.castShadow = true;
    body.receiveShadow = true;
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.64, 3.24, 0.05), new THREE.MeshStandardMaterial({ color: 0x39544e, roughness: 0.58, metalness: 0.42 }));
    door.position.set(-0.36, 1.75, -0.48);
    const door2 = door.clone();
    door2.position.x = 0.36;
    group.add(body, door, door2);
    this.staticGroup.add(group);
    this.staticColliders.push({ minX: x - 0.78, maxX: x + 0.78, minZ: z - 0.5, maxZ: z + 0.5 });
    this.lockers.push({ type: 'locker', position: group.position, group });
  }

  buildExitDoor() {
    const group = new THREE.Group();
    group.position.set(0, 0, -34.55);
    const metal = new THREE.MeshStandardMaterial({ color: 0x2d4641, metalness: 0.58, roughness: 0.48, emissive: 0x1e4438, emissiveIntensity: 0.35 });
    const left = new THREE.Mesh(new THREE.BoxGeometry(3.65, 4.55, 0.48), metal);
    const right = new THREE.Mesh(new THREE.BoxGeometry(3.65, 4.55, 0.48), metal.clone());
    left.position.set(-1.83, 2.28, 0);
    right.position.set(1.83, 2.28, 0);
    left.castShadow = right.castShadow = true;
    group.add(left, right);
    const sign = makeLabelSprite('QUARANTINE EXIT', '#ff7b7e', 0.95);
    sign.position.set(0, 4.8, 0.28);
    group.add(sign);
    const scanner = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.62, 0.15), new THREE.MeshStandardMaterial({ color: 0x1a2724, emissive: COLORS.red, emissiveIntensity: 1.4 }));
    scanner.position.set(3.2, 1.5, 0.3);
    group.add(scanner);
    this.staticGroup.add(group);
    this.exitDoor = { group, left, right, scanner };
  }

  addExteriorDetails() {
    const pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x26443d, roughness: 0.55, metalness: 0.75 });
    for (const [x, z, length, rotation] of [[-31, -5, 18, 0], [31, 9, 14, 0], [0, 31, 14, Math.PI / 2]]) {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, length, 8), pipeMaterial);
      pipe.position.set(x, 4.55, z);
      pipe.rotation.z = rotation || Math.PI / 2;
      this.staticGroup.add(pipe);
    }
    const warningMaterial = new THREE.MeshBasicMaterial({ color: COLORS.red, transparent: true, opacity: 0.74 });
    for (let i = 0; i < 8; i += 1) {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), warningMaterial);
      lamp.position.set(-31 + (i % 2) * 62, 3.8, -27 + Math.floor(i / 2) * 18);
      this.staticGroup.add(lamp);
    }
  }

  clearMatch() {
    // Dispose GPU resources (geometries/materials/textures) AND detach children.
    // Previously these children were only removed from the scene graph, so their
    // GPU memory leaked across every restart. Match-created lights live inside
    // these groups (generators, pickups, keycard), so they are removed too
    // instead of accumulating as direct children of this.scene.
    disposeObjectTree(this.matchGroup);
    disposeObjectTree(this.fxGroup);
    this.vfx = [];
    this.generators = [];
    this.bots = [];
    this.pickups = [];
    this.evidence = [];
    this.keycard = null;
    this.securityUnlocked = false;
    this.keycardTaken = false;
    this.exitOpen = false;
    this.exitDoorOpen = 0;
    this.blackoutUntil = 0;
    this.fogSurgeUntil = 0;
    this.eventLines = [];
    // Match-managed onboarding objects: exactly one desk, one letter, and one
    // glow light per match, all owned by this.matchGroup so restarts are clean.
    this.matchColliders = [];
    this.briefingLetter = null;
    this.tutorialState = createTutorialState();
    this.briefingOpen = false;
    // Tutorial-managed objects are owned by matchGroup so they are already disposed,
    // but clear references to avoid leaks between tutorial and normal matches.
    this.tutorialObjects = [];
    this.tutorialTarget = null;
    this.tutorialDummy = null;
    this.tutorialGenerator = null;
    this.tutorialKeycard = null;
    this.tutorialTaser = null;
    this.tutorialPipe = null;
    this.tutorialPrevYaw = this.yaw;
    this.tutorialPrevPitch = this.pitch;
    this._tutorialSprintAccum = 0;
    if (!this.isTutorial) {
      if (dom.tutorialCard) dom.tutorialCard.classList.add('hidden');
      if (dom.tutorialComplete) dom.tutorialComplete.classList.add('hidden');
      dom.objectiveCard.classList.remove('hidden');
      if (dom.tutorialPauseExit) dom.tutorialPauseExit.classList.add('hidden');
    }
    dom.briefing.classList.add('hidden');
    if (this.subtitleTimer) {
      window.clearTimeout(this.subtitleTimer);
      this.subtitleTimer = null;
    }
    dom.eventLog.innerHTML = '';
    dom.subtitle.classList.remove('visible');
    dom.subtitle.textContent = '';
  }

  startTutorial() {
    this.isTutorial = true;
    this.clearMatch();
    this.matchEpoch += 1;
    this.random = createSeededRandom(1337);
    this.matchTime = 0;
    this.nextEventAt = 9999;
    this.phase = 'playing';
    this.player = {
      id: 'player',
      name: 'YOU',
      role: 'survivor',
      position: new THREE.Vector3(0, 0, 16),
      alive: true,
      escaped: false,
      health: 100,
      stamina: 100,
      held: null,
      hidden: false,
      interaction: null,
      actionCooldown: 0,
    };
    this.yaw = Math.PI;
    this.pitch = -0.06;
    this.tutorialPrevYaw = this.yaw;
    this.tutorialPrevPitch = this.pitch;
    this.cameraShake = 0;
    this.flashlightOn = true;
    this.interactiveTutorialState = createInteractiveTutorialState();
    this.createTutorialObjects();
    this.updateRoleCard();
    this.updateCamera();
    this.scene.fog.density = 0.026;
    this.ambientLight.intensity = 0.32;
    this.keys.clear();
    dom.intro.classList.add('hidden');
    dom.accessibility.classList.add('hidden');
    dom.pause.classList.add('hidden');
    dom.result.classList.add('hidden');
    if (dom.tutorialComplete) dom.tutorialComplete.classList.add('hidden');
    dom.hud.classList.remove('hidden');
    document.body.classList.add('in-tutorial');
    document.body.classList.add('in-match');
    this.refreshTutorialCard();
    this.logEvent('TRAINING PROTOCOL ACTIVE — Learn by doing.', 'warning');
    this.showSubtitle(getTutorialInstruction(this.interactiveTutorialState, this.isTouchDevice).instruction, 3800);
    this.audio.start();
    this.audio.cue('pickup');
    this.requestPointerLock();
  }

  startMatch() {
    this.isTutorial = false;
    this.interactiveTutorialState = null;
    this.clearMatch();
    this.matchEpoch += 1;
    this.random = createSeededRandom((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
    const assignment = assignHiddenKiller(this.random);
    this.matchTime = 0;
    this.nextEventAt = 22 + this.random() * 16;
    this.phase = 'playing';
    this.player = {
      id: 'player',
      name: 'YOU',
      role: assignment.killerId === 'player' ? 'killer' : 'survivor',
      position: new THREE.Vector3(0, 0, 17),
      alive: true,
      escaped: false,
      health: 100,
      stamina: 100,
      held: null,
      hidden: false,
      interaction: null,
      actionCooldown: 0,
    };
    this.yaw = Math.PI;
    this.pitch = -0.07;
    this.cameraShake = 0;
    this.flashlightOn = true;
    this.createMatchObjects(assignment.killerId);
    this.updateRoleCard();
    this.updateCamera();
    this.scene.fog.density = 0.026;
    this.ambientLight.intensity = 0.32;
    this.keys.clear();

    dom.intro.classList.add('hidden');
    dom.accessibility.classList.add('hidden');
    dom.pause.classList.add('hidden');
    dom.result.classList.add('hidden');
    if (dom.tutorialComplete) dom.tutorialComplete.classList.add('hidden');
    if (dom.tutorialCard) dom.tutorialCard.classList.add('hidden');
    dom.objectiveCard.classList.remove('hidden');
    dom.hud.classList.remove('hidden');
    document.body.classList.remove('in-tutorial');
    document.body.classList.add('in-match');
    this.logEvent('Facility lock confirmed. Emergency protocol is live.', 'warning');
    this.logEvent('No emergency meetings. No role reveals.', 'danger');
    this.showSubtitle(
      this.player.role === 'killer'
        ? 'You are the KILLER. Pretend to help, sabotage power, and eliminate every survivor before anyone escapes.'
        : 'You are a SURVIVOR. Restore power, find the keycard, and escape. One of the others is the killer.',
      4800,
    );
    this.audio.start();
    this.audio.cue('alarm');
    this.requestPointerLock();
  }

  createMatchObjects(killerId) {
    this.createBriefingDesk();
    this.generators = [
      this.createGenerator(ZONES.generatorA, 1),
      this.createGenerator(ZONES.generatorB, 2),
      this.createGenerator(ZONES.generatorC, 3),
    ];
    this.createKeycard();
    this.createPickup('taser', new THREE.Vector3(8.5, 0, 10.5));
    this.createPickup('pipe', new THREE.Vector3(-8.2, 0, 10.1));
    this.createPickup('taser', new THREE.Vector3(-12.5, 0, -4.4));

    const spawnPoints = [
      new THREE.Vector3(-2.5, 0, 13.5), new THREE.Vector3(2.5, 0, 13.5), new THREE.Vector3(-6.5, 0, 11),
      new THREE.Vector3(6.2, 0, 12), new THREE.Vector3(-1.2, 0, 8), new THREE.Vector3(4.1, 0, 4), new THREE.Vector3(-4.2, 0, 4),
    ];
    BOT_NAMES.forEach((name, index) => this.createBot(name, index, killerId === name ? 'killer' : 'survivor', spawnPoints[index]));
  }

  createTutorialObjects() {
    // Reuse existing environment: single desk, one tutorial generator near lobby, det. placement
    this.createBriefingDesk();
    this.generators = [
      this.createGenerator(ZONES.generatorA, 1),
      this.createGenerator(ZONES.generatorB, 2),
      this.createGenerator(ZONES.generatorC, 3),
    ];
    // Designate generatorA as the controlled tutorial node: easy to locate near center-lobby approach
    this.tutorialGenerator = this.generators[0];
    // Move tutorial generator slightly closer to lobby for accessibility but keep zone access valid
    // The generator itself stays at its zone; we just ensure AI will ignore it.
    this.createKeycard();
    // Tutorial taser near lobby, and pipe nearby, plus training target/dummy
    // Place tutorial pickups deterministically near player start (0,0,16)
    const taserPos = new THREE.Vector3(5.5, 0, 10.5);
    this.createPickup('taser', taserPos);
    this.tutorialTaser = this.pickups[this.pickups.length - 1];
    const pipePos = new THREE.Vector3(-5.5, 0, 10.5);
    this.createPickup('pipe', pipePos);
    this.tutorialPipe = this.pickups[this.pickups.length - 1];
    // Training target for taser (safe AI volunteer) just beyond taser
    this.createTrainingTarget(new THREE.Vector3(7.8, 0, 10.5));
    // Training dummy for pipe (nonliving)
    this.createTrainingDummy(new THREE.Vector3(-7.8, 0, 10.5));
    // Bots: all survivors, non-aggressive, will wander but not attack or repair tutorial node
    const spawnPoints = [
      new THREE.Vector3(-2.5, 0, 13.5), new THREE.Vector3(2.5, 0, 13.5), new THREE.Vector3(-6.5, 0, 11),
      new THREE.Vector3(6.2, 0, 12), new THREE.Vector3(-1.2, 0, 8), new THREE.Vector3(4.1, 0, 4), new THREE.Vector3(-4.2, 0, 4),
    ];
    BOT_NAMES.forEach((name, index) => this.createBot(name, index, 'survivor', spawnPoints[index]));
    // Make bots slightly idle in tutorial: double their goalUntil so they wander less aggressively
    for (const bot of this.bots) bot.goalUntil = this.matchTime + 12 + Math.random() * 6;
  }

  createTrainingTarget(position) {
    const group = new THREE.Group();
    group.position.copy(position);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.7, 10), new THREE.MeshStandardMaterial({ color: 0x3a4b47, roughness: 0.72, metalness: 0.18 }));
    base.position.y = 0.85; base.castShadow = true;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshStandardMaterial({ color: 0xc9a88a, roughness: 0.85 }));
    head.position.y = 1.92;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.52, 0.32), new THREE.MeshStandardMaterial({ color: 0xf7bd4e, emissive: 0x7a4a00, emissiveIntensity: 0.6 }));
    plate.position.set(0, 1.18, 0.28);
    group.add(base, head, plate);
    const aura = new THREE.PointLight(COLORS.amber, 0.65, 4, 2);
    aura.position.y = 1.0;
    group.add(aura);
    const label = makeLabelSprite('TRAINING TARGET', '#ffe7ae', 0.54);
    label.position.set(0, 2.55, 0);
    group.add(label);
    this.matchGroup.add(group);
    this.tutorialObjects.push(group);
    this.tutorialTarget = { type: 'trainingTarget', position: group.position, group, aura, stunnedUntil: 0, label };
  }

  createTrainingDummy(position) {
    const group = new THREE.Group();
    group.position.copy(position);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.6, 0.32), new THREE.MeshStandardMaterial({ color: 0x6b5b4a, roughness: 0.88, metalness: 0.08 }));
    post.position.y = 0.8; post.castShadow = true;
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.14, 0.14), new THREE.MeshStandardMaterial({ color: 0x8b8b80, roughness: 0.7, metalness: 0.26 }));
    cross.position.y = 1.18;
    group.add(post, cross);
    const aura = new THREE.PointLight(0xa8c4be, 0.45, 3, 2);
    aura.position.y = 0.9;
    group.add(aura);
    const label = makeLabelSprite('TRAINING DUMMY', '#a4ffcf', 0.52);
    label.position.set(0, 2.4, 0);
    group.add(label);
    this.matchGroup.add(group);
    this.tutorialObjects.push(group);
    this.tutorialDummy = { type: 'trainingDummy', position: group.position, group, aura, label };
  }

  /**
   * Spawns the briefing desk directly in front of the player's start position
   * and the glowing INCIDENT BRIEFING letter lying flat on top of it. Both are
   * match-managed (inside this.matchGroup) so a restart yields exactly one desk
   * and one letter with no accumulated lights. The desk faces the spawn point
   * and stands clear of every wall, so the player can never be trapped by it.
   */
  createBriefingDesk() {
    const group = new THREE.Group();
    group.position.set(0, 0, 13.4);
    const wood = new THREE.MeshStandardMaterial({ color: 0x40382a, roughness: 0.78, metalness: 0.08 });
    const trim = new THREE.MeshStandardMaterial({ color: 0x2b251c, roughness: 0.85, metalness: 0.04 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.14, 1.05), wood);
    top.position.y = 1.02;
    top.castShadow = true;
    top.receiveShadow = true;
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.96, 0.92), trim);
    left.position.set(-0.9, 0.48, 0);
    const right = left.clone();
    right.position.x = 0.9;
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.96, 0.12), trim);
    back.position.set(0, 0.48, -0.4);
    group.add(top, left, right, back);
    this.matchGroup.add(group);
    this.matchColliders.push({ minX: -1.05, maxX: 1.05, minZ: 12.875, maxZ: 13.925 });

    const letter = new THREE.Group();
    letter.position.set(0, 1.13, 13.4);
    const paperMaterial = new THREE.MeshStandardMaterial({
      color: 0xdcd5bd,
      roughness: 0.92,
      metalness: 0,
      emissive: 0x8a6a1f,
      emissiveIntensity: 0.34,
    });
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.024, 0.6), paperMaterial);
    paper.position.y = 0.012;
    paper.rotation.z = 0.03;
    paper.castShadow = true;
    // Faint "typed lines" so it reads as a document from a distance.
    const textLines = new THREE.Mesh(
      new THREE.BoxGeometry(0.66, 0.006, 0.44),
      new THREE.MeshStandardMaterial({ color: 0x4a4232, emissive: 0x1c1609, emissiveIntensity: 0.55 }),
    );
    textLines.position.y = 0.028;
    letter.add(paper, textLines);
    const glowLight = new THREE.PointLight(COLORS.amber, 1.0, 4.2, 2);
    glowLight.position.set(0, 0.4, 0);
    letter.add(glowLight);
    const label = makeLabelSprite('INCIDENT BRIEFING', '#ffd98a', 0.62);
    label.position.set(0, 0.92, 0);
    letter.add(label);
    this.matchGroup.add(letter);
    this.briefingLetter = { type: 'letter', position: letter.position, group: letter, paper, paperMaterial, glowLight, label };
  }

  createGenerator(zone, index) {
    const group = new THREE.Group();
    group.position.copy(zone.position);
    const chassis = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 1.02, 1.1, 10), new THREE.MeshStandardMaterial({ color: 0x273a36, roughness: 0.56, metalness: 0.66 }));
    chassis.position.y = 0.55;
    chassis.castShadow = true;
    const coilMaterial = new THREE.MeshStandardMaterial({ color: 0x5d6958, emissive: 0x3a1808, emissiveIntensity: 0.55, roughness: 0.45, metalness: 0.5 });
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.12, 8, 16), coilMaterial);
    coil.rotation.x = Math.PI / 2;
    coil.position.y = 1.18;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.33, 0.08), new THREE.MeshStandardMaterial({ color: 0x101b19, emissive: COLORS.red, emissiveIntensity: 1.8 }));
    panel.position.set(0, 1.25, -0.85);
    const cage = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 0.14, 10), new THREE.MeshStandardMaterial({ color: 0x35534c, roughness: 0.4, metalness: 0.6 }));
    cage.position.y = 0.08;
    group.add(chassis, coil, panel, cage);
    const label = makeLabelSprite(`PWR-${String(index).padStart(2, '0')}`, '#e4bb62', 0.54);
    label.position.set(0, 2.25, 0);
    group.add(label);
    this.matchGroup.add(group);
    // Attach the status light to the generator GROUP (not this.scene) so it is
    // removed and disposed together with the match. Previously it was added
    // directly to the scene, so 3 new PointLights leaked on every restart.
    const light = new THREE.PointLight(COLORS.red, 0.58, 5.5, 2);
    light.position.set(0, 1.4, 0);
    group.add(light);
    const generator = {
      type: 'generator', index, zone, position: group.position, group, panel, coil, light,
      progress: 0, repaired: false, botWorkers: new Set(), lastSabotaged: -99,
    };
    this.updateGeneratorVisual(generator);
    return generator;
  }

  createKeycard() {
    const group = new THREE.Group();
    group.position.set(23.1, 1.45, 19.2);
    const card = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.05, 0.47), new THREE.MeshStandardMaterial({ color: 0x85e8bc, emissive: 0x3b9f75, emissiveIntensity: 1.3, roughness: 0.35, metalness: 0.32 }));
    card.rotation.x = -0.12;
    const glow = new THREE.PointLight(COLORS.aqua, 0.7, 3, 2);
    group.add(card, glow);
    const label = makeLabelSprite('EXIT KEYCARD', '#8dffcb', 0.46);
    label.position.y = 0.48;
    group.add(label);
    group.visible = false;
    this.matchGroup.add(group);
    this.keycard = { type: 'keycard', position: group.position, group, card, active: false, taken: false, zone: ZONES.security };
  }

  createPickup(kind, position) {
    const group = new THREE.Group();
    group.position.copy(position);
    let mesh;
    if (kind === 'taser') {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.62), new THREE.MeshStandardMaterial({ color: 0xf2b44d, emissive: 0x723a0b, emissiveIntensity: 0.7, roughness: 0.42, metalness: 0.42 }));
      mesh.rotation.z = Math.PI / 2;
    } else {
      mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.15, 8), new THREE.MeshStandardMaterial({ color: 0x8b8b80, roughness: 0.45, metalness: 0.78 }));
      mesh.rotation.z = Math.PI / 2;
    }
    mesh.position.y = 0.22;
    mesh.castShadow = true;
    const aura = new THREE.PointLight(kind === 'taser' ? COLORS.amber : 0xa8c4be, 0.5, 2.8, 2);
    aura.position.y = 0.42;
    group.add(mesh, aura);
    this.matchGroup.add(group);
    this.pickups.push({ type: 'pickup', kind, position: group.position, group, mesh, available: true });
  }

  createBot(name, index, role, position) {
    const group = new THREE.Group();
    group.position.copy(position);
    const uniform = new THREE.MeshStandardMaterial({ color: COLORS.uniform, roughness: 0.73, metalness: 0.06 });
    const accentColors = [0x77988b, 0x738c9b, 0x918d73, 0x858095, 0x758d81, 0x917b73, 0x698f8a];
    const accent = new THREE.MeshStandardMaterial({ color: accentColors[index], roughness: 0.64 });
    const skin = new THREE.MeshStandardMaterial({ color: COLORS.skin, roughness: 0.86 });
    const legs = new THREE.Group();
    const legGeometry = new THREE.BoxGeometry(0.22, 0.78, 0.25);
    const leftLeg = new THREE.Mesh(legGeometry, uniform);
    const rightLeg = new THREE.Mesh(legGeometry, uniform);
    leftLeg.position.set(-0.16, 0.39, 0);
    rightLeg.position.set(0.16, 0.39, 0);
    legs.add(leftLeg, rightLeg);
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.75, 0.34), uniform);
    torso.position.y = 1.12;
    const harness = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.11, 0.37), accent);
    harness.position.y = 1.18;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.255, 12, 10), skin);
    head.position.y = 1.76;
    const armGeometry = new THREE.BoxGeometry(0.15, 0.63, 0.16);
    const leftArm = new THREE.Mesh(armGeometry, uniform);
    const rightArm = new THREE.Mesh(armGeometry, uniform);
    leftArm.position.set(-0.42, 1.13, 0);
    rightArm.position.set(0.42, 1.13, 0);
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.17, 0.03), new THREE.MeshStandardMaterial({ color: 0xa7dbbb, emissive: 0x174f37, emissiveIntensity: 0.6 }));
    badge.position.set(0.2, 1.28, -0.19);
    [leftLeg, rightLeg, torso, harness, head, leftArm, rightArm, badge].forEach((part) => { part.castShadow = true; part.receiveShadow = true; });
    group.add(legs, torso, harness, head, leftArm, rightArm, badge);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.58, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.23, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.015;
    group.add(shadow);
    this.matchGroup.add(group);

    const bot = {
      id: name,
      name,
      role,
      group,
      position: group.position,
      alive: true,
      escaped: false,
      state: 'wander',
      goal: null,
      goalUntil: 0,
      routeEntered: false,
      killCooldown: 0,
      stunUntil: 0,
      lastSeenCorpse: null,
      leftArm,
      rightArm,
      legs,
      walkPhase: this.random() * Math.PI * 2,
      bodyHeight: 0,
    };
    return this.bots.push(bot), bot;
  }

  updateGeneratorVisual(generator) {
    const energy = generator.repaired ? 1 : generator.progress;
    const color = generator.repaired ? COLORS.aqua : generator.progress > 0 ? COLORS.amber : COLORS.red;
    generator.panel.material.emissive.setHex(color);
    generator.panel.material.emissiveIntensity = 1.15 + energy * 1.85;
    generator.coil.material.emissive.setHex(generator.repaired ? 0x20734f : 0x3a1808);
    generator.coil.material.emissiveIntensity = 0.4 + energy * 1.4;
    generator.light.color.setHex(color);
    generator.light.intensity = generator.repaired ? 1.25 : 0.22 + energy * 0.35;
    generator.coil.rotation.z += 0.01 + energy * 0.035;
  }

  updateRoleCard() {
    const killer = this.player.role === 'killer';
    dom.roleCard.classList.toggle('killer', killer);
    dom.roleCard.classList.toggle('survivor', !killer);
    dom.roleTitle.textContent = killer ? 'KILLER' : 'SURVIVOR';
    dom.roleCopy.textContent = killer
      ? 'Blend in. Sabotage power. Eliminate every witness before anyone escapes.'
      : 'Restore power. Find the keycard. Escape alive. Trust is not evidence.';
  }

  renderLoop() {
    requestAnimationFrame(() => this.renderLoop());
    const delta = Math.min(this.clock.getDelta(), 0.05);
    if (this.phase === 'playing') this.update(delta);
    this.renderer.render(this.scene, this.camera);
  }

  update(delta) {
    this.matchTime += delta;
    this.updatePlayer(delta);
    this.updatePlayerInteraction(delta);
    this.updateBots(delta);
    this.updateEnvironment(delta);
    this.updateTutorial(delta);
    this.updateEffects(delta);
    this.updatePrompts();
    this.updateHud();
    this.drawMinimap();
    this.checkMatchState();
  }

  /**
   * Drives the non-blocking tutorial hints and the letter's gentle pulse.
   * Each hint fires once per match; the pulse is steady in reduced-motion mode.
   * In tutorial mode, handles deterministic training highlights and suppresses
   * normal random hints.
   */
  updateTutorial(delta) {
    // Tutorial mode: lightweight deterministic highlights, no random hints or events
    if (this.isTutorial && this.interactiveTutorialState) {
      // Pulse briefing letter gently (reduced motion = steady)
      if (this.briefingLetter) {
        const reduced = this.settings.reducedMotion;
        const pulse = reduced ? 1 : 0.68 + Math.sin(this.matchTime * 2.7) * 0.32;
        this.briefingLetter.glowLight.intensity = 0.5 + pulse * 0.5;
        this.briefingLetter.paperMaterial.emissiveIntensity = 0.22 + pulse * 0.26;
      }
      // Tutorial objective highlights: glow the relevant object for current step
      const step = this.interactiveTutorialState.step;
      const timePulse = this.settings.reducedMotion ? 0.9 : 0.7 + Math.sin(this.matchTime * 2.1) * 0.28;
      if (this.tutorialGenerator && step === 6) {
        this.tutorialGenerator.light.intensity = 0.6 + timePulse * 0.7;
        this.tutorialGenerator.panel.material.emissiveIntensity = 1.2 + timePulse * 1.0;
      }
      if (this.tutorialTaser && step === 7) {
        const aura = this.tutorialTaser.group.children.find(c => c.isPointLight);
        if (aura) aura.intensity = 0.45 + timePulse * 0.45;
        // Gentle vertical bounce
        this.tutorialTaser.group.position.y = Math.sin(this.matchTime * 1.9) * 0.04;
      }
      if (this.tutorialTarget && step === 7) {
        this.tutorialTarget.aura.intensity = 0.5 + timePulse * 0.6;
        this.tutorialTarget.group.rotation.y = Math.sin(this.matchTime * 0.9) * 0.12;
      }
      if (this.tutorialDummy && step === 8) {
        this.tutorialDummy.aura.intensity = 0.45 + timePulse * 0.45;
      }
      if (this.keycard && step === 9 && this.keycard.active) {
        // keycard already has its own bounce in updateEnvironment, add extra glow
        const cardGlow = this.keycard.group.children.find(c => c.isPointLight);
        if (cardGlow) cardGlow.intensity = 0.7 + timePulse * 0.5;
      }
      if (this.tutorialTarget && this.tutorialTarget.stunnedUntil > this.matchTime) {
        this.tutorialTarget.group.position.y = 0.15 + Math.sin(this.matchTime * 12) * 0.03;
      }
      // Auto-hint for trust lesson after exit
      if (step === 11 && !this.interactiveTutorialState.trustAcknowledged) {
        // Show sequential trust lesson subtitles at intervals
        const t = this.matchTime % 9;
        if (t < 0.1) this.showSubtitle('In a real match, one person is secretly the killer.', 2800);
        else if (t > 3 && t < 3.1) this.showSubtitle('Observe behavior. Investigate evidence. Choose carefully who you trust.', 2800);
        else if (t > 6 && t < 6.1) this.showSubtitle('There are no meetings, votes, or guaranteed role reveals.', 2800);
      }
      // Update tutorial card progress (in case step changed via other signals)
      if (delta) this.refreshTutorialCard();
      return;
    }
    // Normal match contextual hints
    if (this.tutorialState.letterHintShown === false && this.tutorialState.letterOpenedCount === 0 && this.matchTime > 5.0) {
      this.signalTutorial('spawn');
    }
    const anyRepaired = this.generators.some((generator) => generator.repaired);
    if (!anyRepaired && !this.tutorialState.generatorHintShown) {
      const nearFirstGenerator = this.generators.some(
        (generator) => !generator.repaired && vecDistance(this.player.position, generator.position) < 3.1,
      );
      if (nearFirstGenerator) this.signalTutorial('nearGenerator');
    }
    if (!this.tutorialState.defenseShown) {
      const defenseSeen = this.pickups.some(
        (pickup) => pickup.available && vecDistance(this.player.position, pickup.position) < 6.5,
      );
      if (defenseSeen) this.signalTutorial('defenseSeen');
    }
    if (this.briefingLetter) {
      const reduced = this.settings.reducedMotion;
      const pulse = reduced ? 1 : 0.68 + Math.sin(this.matchTime * 2.7) * 0.32;
      this.briefingLetter.glowLight.intensity = 0.5 + pulse * 0.5;
      this.briefingLetter.paperMaterial.emissiveIntensity = 0.22 + pulse * 0.26;
    }
  }

  updatePlayer(delta) {
    if (!this.player.alive) return;
    const touchMoving = Math.hypot(this.touchMove.x, this.touchMove.y) > 0.12;
    const movingInput = this.keys.has('KeyW') || this.keys.has('KeyA') || this.keys.has('KeyS') || this.keys.has('KeyD') || touchMoving;
    const touchSprint = touchMoving && Math.hypot(this.touchMove.x, this.touchMove.y) > 0.86;
    const sprinting = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || touchSprint) && movingInput && this.player.stamina > 0.5 && !this.player.hidden;
    const speed = sprinting ? 6.7 : 4.05;
    if (sprinting) this.player.stamina = Math.max(0, this.player.stamina - 30 * delta);
    else this.player.stamina = Math.min(100, this.player.stamina + 17 * delta);

    let movedDistance = 0;
    if (!this.player.hidden && movingInput && !this.player.interaction) {
      const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      const right = new THREE.Vector3(-forward.z, 0, forward.x);
      const direction = new THREE.Vector3();
      if (this.keys.has('KeyW')) direction.add(forward);
      if (this.keys.has('KeyS')) direction.sub(forward);
      if (this.keys.has('KeyD')) direction.add(right);
      if (this.keys.has('KeyA')) direction.sub(right);
      if (touchMoving) {
        direction.addScaledVector(right, this.touchMove.x);
        direction.addScaledVector(forward, -this.touchMove.y);
      }
      if (direction.lengthSq() > 0) {
        direction.normalize().multiplyScalar(speed * delta);
        const beforeX = this.player.position.x, beforeZ = this.player.position.z;
        this.moveWithCollision(this.player.position, direction.x, direction.z, 0.42);
        movedDistance = Math.hypot(this.player.position.x - beforeX, this.player.position.z - beforeZ);
      }
    }
    this.updateCamera();
    // Tutorial step signals
    if (this.isTutorial && this.interactiveTutorialState) {
      const st = this.interactiveTutorialState.step;
      if (st === 2 && movedDistance > 0.001) {
        this.signalInteractiveTutorial({ type: 'moved', distance: movedDistance });
      }
      if (st === 5 && sprinting && movedDistance > 0.001) {
        this.signalInteractiveTutorial({ type: 'sprinting', delta, sprinting: true });
      }
    }
  }

  updateCamera() {
    const shake = this.settings.reducedMotion ? 0 : this.cameraShake;
    this.camera.position.set(this.player.position.x, 1.63 + Math.sin(this.matchTime * 10) * shake * 0.04, this.player.position.z);
    this.camera.rotation.set(this.pitch + Math.sin(this.matchTime * 17) * shake * 0.025, this.yaw + Math.cos(this.matchTime * 21) * shake * 0.018, 0);
    this.cameraShake = Math.max(0, this.cameraShake - 1 / 28);
    this.flashlight.intensity = this.flashlightOn && !this.player.hidden ? (this.blackoutUntil > this.matchTime ? 3.4 : 2.55) : 0;
  }

  collides(x, z, radius) {
    if (x - radius < -34.35 || x + radius > 34.35 || z - radius < -34.35 || z + radius > 34.35) return true;
    for (const collider of this.staticColliders) {
      if (x + radius > collider.minX && x - radius < collider.maxX && z + radius > collider.minZ && z - radius < collider.maxZ) return true;
    }
    for (const collider of this.matchColliders) {
      if (x + radius > collider.minX && x - radius < collider.maxX && z + radius > collider.minZ && z - radius < collider.maxZ) return true;
    }
    if (!this.exitOpen && x + radius > -3.7 && x - radius < 3.7 && z - radius < -34.05 && z + radius > -35.15) return true;
    return false;
  }

  moveWithCollision(position, dx, dz, radius) {
    const nextX = position.x + dx;
    if (!this.collides(nextX, position.z, radius)) position.x = nextX;
    const nextZ = position.z + dz;
    if (!this.collides(position.x, nextZ, radius)) position.z = nextZ;
  }

  beginInteraction() {
    if (this.player.hidden) {
      const locker = this.lockers.find((entry) => vecDistance(entry.position, this.player.position) < 2.1);
      if (locker) this.toggleLocker(locker);
      return;
    }
    // Tutorial trust lesson ack via E
    if (this.isTutorial && this.interactiveTutorialState && this.interactiveTutorialState.step === 11) {
      this.signalInteractiveTutorial({ type: 'trustAcknowledged' });
      return;
    }
    const target = this.getNearestInteractable();
    if (!target) {
      // In tutorial step 8, allow viewing pipe explanation even if pickups are a bit farther
      if (this.isTutorial && this.interactiveTutorialState && this.interactiveTutorialState.step === 8) {
        const dPipe = this.tutorialPipe ? vecDistance(this.player.position, this.tutorialPipe.position) : 999;
        const dDummy = this.tutorialDummy ? vecDistance(this.player.position, this.tutorialDummy.position) : 999;
        if (Math.min(dPipe, dDummy) < 3.2) {
          this.showSubtitle('The pipe is dangerous. Harming an innocent causes serious consequences. Violence is a last resort. Tap ACT near the dummy to try safely.', 4200);
          this.signalInteractiveTutorial({ type: 'pipeAcknowledged' });
          return;
        }
      }
      return;
    }
    const { type, ref } = target;
    if (type === 'letter') {
      this.openBriefing();
      return;
    }
    if (type === 'generator') {
      if (ref.repaired && this.player.role === 'killer' && !this.isTutorial) {
        this.player.interaction = { type: 'sabotage', ref, duration: 1.5, elapsed: 0 };
        this.showSubtitle('Hold E to overload the power node.', 1100);
      } else if (!ref.repaired) {
        // Tutorial: slightly faster repair for training node
        const isTutorialGen = this.isTutorial && ref === this.tutorialGenerator;
        const duration = isTutorialGen ? 2.4 : (this.player.role === 'killer' ? 5.2 : 3.75);
        this.player.interaction = { type: 'repair', ref, duration, elapsed: 0 };
        const prompt = this.isTutorial && isTutorialGen ? 'Hold to repair the training power node.' : (this.player.role === 'killer' ? 'Hold E to pretend to repair the power node.' : 'Hold E to repair the power node.');
        this.showSubtitle(prompt, 1100);
      } else {
        this.showSubtitle('The power node is online.', 1000);
      }
      return;
    }
    if (type === 'keycard') this.takeKeycard('YOU');
    if (type === 'exit') this.useExit('YOU');
    if (type === 'pickup') this.takePickup(ref);
    if (type === 'evidence') this.inspectEvidence(ref);
    if (type === 'terminal') this.inspectTerminal();
    if (type === 'locker') this.toggleLocker(ref);
    if (type === 'trainingDummy') {
      this.showSubtitle('The pipe is dangerous. Harming an innocent causes serious consequences. Violence is a last resort.', 3600);
      this.signalInteractiveTutorial({ type: 'pipeAcknowledged' });
      return;
    }
  }

  updatePlayerInteraction(delta) {
    const interaction = this.player.interaction;
    if (!interaction) return;
    const closeEnough = vecDistance(this.player.position, interaction.ref.position) < 2.85;
    if (!this.keys.has('KeyE') || !closeEnough) {
      this.player.interaction = null;
      return;
    }
    interaction.elapsed += delta;
    if (interaction.type === 'repair') {
      interaction.ref.progress = clamp(interaction.elapsed / interaction.duration, 0, 1);
      this.updateGeneratorVisual(interaction.ref);
      if (Math.floor(interaction.elapsed * 9) !== Math.floor((interaction.elapsed - delta) * 9)) this.audio.cue('repair');
      if (interaction.ref.progress >= 1) {
        this.completeGenerator(interaction.ref, 'YOU');
        this.player.interaction = null;
      }
    } else if (interaction.type === 'sabotage' && interaction.elapsed >= interaction.duration) {
      this.sabotageGenerator(interaction.ref, 'YOU');
      this.player.interaction = null;
    }
  }

  completeGenerator(generator, actor) {
    if (generator.repaired) return;
    const firstCompletion = this.generators.every((node) => !node.repaired);
    generator.progress = 1;
    generator.repaired = true;
    this.updateGeneratorVisual(generator);
    this.createPulse(generator.position, COLORS.aqua, 2.4);
    this.audio.cue('complete');
    this.logEvent(`PWR-${String(generator.index).padStart(2, '0')} comes online.`, 'normal');
    this.showSubtitle(actor === 'YOU' ? 'Power node stabilized.' : 'A generator hums to life nearby.', 1800);
    if (!this.isTutorial && firstCompletion) this.signalTutorial('firstGeneratorDone');
    if (this.isTutorial && actor === 'YOU' && generator === this.tutorialGenerator) {
      this.signalInteractiveTutorial({ type: 'generatorRepaired', byPlayer: true });
      // Tutorial unlocks security after ONE node
      if (!this.securityUnlocked) {
        this.securityUnlocked = true;
        if (this.keycard) {
          this.keycard.active = true;
          this.keycard.group.visible = true;
          this.keycard.group.position.set(23.1, 1.45, 19.2);
        }
        this.logEvent('Training: Security office unlocked: exit keycard available.', 'warning');
        this.showSubtitle('Training: Emergency power restored. Find the keycard inside Security.', 3200);
        this.audio.cue('alarm');
      }
      return;
    }
    if (!this.isTutorial && this.generators.every((node) => node.repaired) && !this.securityUnlocked) {
      this.securityUnlocked = true;
      this.keycard.active = true;
      this.keycard.group.visible = true;
      this.keycard.group.position.set(23.1, 1.45, 19.2);
      this.logEvent('Security office unlocked: exit keycard available.', 'warning');
      this.showSubtitle('Emergency power restored. The security office has unlocked.', 3200);
      this.signalTutorial('powerRestored');
      this.audio.cue('alarm');
    }
  }

  sabotageGenerator(generator, actor) {
    if (!generator.repaired || this.matchTime - generator.lastSabotaged < 8) return;
    generator.repaired = false;
    generator.progress = 0.12;
    generator.lastSabotaged = this.matchTime;
    this.updateGeneratorVisual(generator);
    this.createEvidence(generator.position.clone().add(new THREE.Vector3(1.05, 0.02, 0.45)), 'tampered');
    this.createPulse(generator.position, COLORS.red, 2.15);
    this.audio.cue('sabotage');
    this.logEvent('A power node has gone dark.', 'danger');
    this.showSubtitle(actor === 'YOU' ? 'The overload looks like a system fault.' : 'Somewhere, a generator dies.', 2200);
  }

  takeKeycard(actor) {
    if (!this.keycard?.active || this.keycard.taken) return;
    // In tutorial, only player collection counts for progress; bots should not take it
    if (this.isTutorial && actor !== 'YOU') return;
    this.keycard.taken = true;
    this.keycardTaken = true;
    this.keycard.group.visible = false;
    this.audio.cue('pickup');
    this.createPulse(this.keycard.position, COLORS.aqua, 1.7);
    this.logEvent('Exit keycard removed from the security office.', 'warning');
    this.showSubtitle(actor === 'YOU' ? 'Exit keycard acquired. Reach the quarantine door.' : 'A security lock clicks open somewhere in the facility.', 2600);
    if (!this.isTutorial) this.signalTutorial('keycardTaken');
    if (this.isTutorial && actor === 'YOU') this.signalInteractiveTutorial({ type: 'keycardCollected', byPlayer: true });
  }

  useExit(actor) {
    // Tutorial: controlled escape, no normal win, teach keycard->exit flow
    if (this.isTutorial) {
      if (actor !== 'YOU') return;
      if (!this.keycardTaken) {
        this.showSubtitle('QUARANTINE LOCK: exit keycard required.', 1500);
        this.audio.cue('sabotage');
        return;
      }
      if (!this.exitOpen) {
        this.exitOpen = true;
        this.audio.cue('alarm');
        this.logEvent('Training: Quarantine exit authorization accepted.', 'warning');
        this.showSubtitle('The quarantine door is opening.', 1900);
      }
      this.signalInteractiveTutorial({ type: 'exitReached', byPlayer: true });
      // Do not call escapePlayer; tutorial handles completion via trust lesson
      return;
    }
    if (this.player.role === 'killer' && actor === 'YOU') {
      this.showSubtitle('The exit is not your objective. No witnesses can leave.', 1700);
      return;
    }
    if (!this.keycardTaken) {
      this.showSubtitle('QUARANTINE LOCK: exit keycard required.', 1500);
      this.audio.cue('sabotage');
      return;
    }
    if (!this.exitOpen) {
      this.exitOpen = true;
      this.audio.cue('alarm');
      this.logEvent('Quarantine exit authorization accepted.', 'warning');
      this.showSubtitle('The quarantine door is opening.', 1900);
    }
    if (actor === 'YOU') {
      this.escapePlayer();
    } else {
      const bot = this.bots.find((entry) => entry.name === actor);
      if (bot) this.escapeBot(bot);
    }
  }

  takePickup(pickup) {
    if (!pickup.available) return;
    pickup.available = false;
    pickup.group.visible = false;
    this.player.held = pickup.kind;
    this.audio.cue('pickup');
    this.logEvent(`You took a ${pickup.kind === 'taser' ? 'taser' : 'metal pipe'}.`, 'warning');
    if (this.isTutorial) {
      if (pickup.kind === 'taser') {
        this.showSubtitle('Taser acquired. Find the TRAINING TARGET and use ACT / F to stun it.', 3000);
        this.signalInteractiveTutorial({ type: 'taserCollected' });
      } else if (pickup.kind === 'pipe') {
        this.showSubtitle('The pipe is dangerous. Harming an innocent causes serious consequences. Violence is a last resort.', 3800);
        // Pipe collection counts as viewing the lesson (optional dummy swing also works)
        this.signalInteractiveTutorial({ type: 'pipeAcknowledged' });
      }
    } else {
      this.showSubtitle(pickup.kind === 'pipe' ? 'A pipe can kill the wrong person. Choose carefully.' : 'One charge. It may buy you a few seconds.', 2500);
      this.signalTutorial('defenseCollected');
    }
  }

  inspectEvidence(evidence) {
    if (!evidence.inspected) {
      evidence.inspected = true;
      evidence.marker.material.opacity = 0.28;
      this.audio.cue('evidence');
    }
    const observations = {
      blood: 'Fresh blood. Someone did not leave alive.',
      footprint: 'Boot prints cross old dust. They could have been planted.',
      tampered: 'Tool marks are deliberate. The outage was not an accident.',
      badge: 'An ID badge was dropped in a hurry. It proves nothing about who attacked.',
    };
    const clueType = evidence.evidenceType;
    this.logEvent(`Evidence logged: ${clueType.toUpperCase()}.`, clueType === 'blood' ? 'danger' : 'normal');
    this.showSubtitle(observations[clueType] || 'The evidence is incomplete.', 3100);
  }

  inspectTerminal() {
    if (!this.securityUnlocked) {
      this.showSubtitle('SECURITY FEED: no emergency power. Restore the generators first.', 2500);
      return;
    }
    const lines = [
      'SECURITY FEED: A figure entered Generator Wing. The timecode is corrupt.',
      'SECURITY FEED: Movement detected near the lobby. Identity unresolved.',
      'SECURITY FEED: The camera lost signal during the first outage.',
    ];
    this.terminal.screen.material.emissive.setHex(COLORS.amber);
    this.terminal.screen.material.emissiveIntensity = 2.4;
    this.audio.cue('evidence');
    this.logEvent('You reviewed a corrupted security recording.', 'normal');
    this.showSubtitle(randomFrom(this.random, lines), 4200);
    const epoch = this.matchEpoch;
    window.setTimeout(() => {
      // Ignore if the match restarted while this timeout was pending.
      if (epoch !== this.matchEpoch) return;
      if (this.terminal?.screen?.material) {
        this.terminal.screen.material.emissive.setHex(0x195e49);
        this.terminal.screen.material.emissiveIntensity = 1.35;
      }
    }, 1000);
  }

  toggleLocker(locker) {
    this.player.hidden = !this.player.hidden;
    if (this.player.hidden) {
      this.player.interaction = null;
      this.flashlightOn = false;
      this.showSubtitle('You hold your breath inside the locker. Press E to leave.', 2400);
      this.logEvent('You are hidden. Movement and light are disabled.', 'normal');
    } else {
      this.showSubtitle('You step back into the facility.', 1300);
    }
    this.audio.cue(this.player.hidden ? 'sabotage' : 'pickup');
  }

  getNearestInteractable() {
    if (!this.player.alive) return null;
    const choices = [];
    if (this.briefingLetter && !this.player.hidden) {
      const distance = vecDistance(this.player.position, this.briefingLetter.position);
      if (distance < 2.1) choices.push({ type: 'letter', ref: this.briefingLetter, distance });
    }
    for (const generator of this.generators) {
      const distance = vecDistance(this.player.position, generator.position);
      if (distance < 2.55) choices.push({ type: 'generator', ref: generator, distance });
    }
    if (this.keycard?.active && !this.keycard.taken) {
      const distance = vecDistance(this.player.position, this.keycard.position);
      if (distance < 2.2) choices.push({ type: 'keycard', ref: this.keycard, distance });
    }
    const exitDistance = vecDistance(this.player.position, ZONES.exit.position);
    if (exitDistance < 4.5) choices.push({ type: 'exit', ref: ZONES.exit, distance: exitDistance });
    for (const pickup of this.pickups) {
      if (!pickup.available) continue;
      const distance = vecDistance(this.player.position, pickup.position);
      if (distance < 1.8) choices.push({ type: 'pickup', ref: pickup, distance });
    }
    for (const evidence of this.evidence) {
      if (evidence.inspected) continue;
      const distance = vecDistance(this.player.position, evidence.position);
      if (distance < 1.65) choices.push({ type: 'evidence', ref: evidence, distance });
    }
    const terminalDistance = vecDistance(this.player.position, this.terminal.position);
    if (terminalDistance < 2.1) choices.push({ type: 'terminal', ref: this.terminal, distance: terminalDistance });
    for (const locker of this.lockers) {
      const distance = vecDistance(this.player.position, locker.position);
      if (distance < 1.75) choices.push({ type: 'locker', ref: locker, distance });
    }
    // Tutorial extras: dummy for pipe lesson
    if (this.isTutorial && this.tutorialDummy) {
      const d = vecDistance(this.player.position, this.tutorialDummy.position);
      if (d < 2.2) choices.push({ type: 'trainingDummy', ref: this.tutorialDummy, distance: d });
    }
    choices.sort((a, b) => a.distance - b.distance);
    return choices[0] || null;
  }

  interactionLabel(target) {
    if (!target) return null;
    const { type, ref } = target;
    if (type === 'letter') return 'E — READ INCIDENT BRIEFING';
    if (type === 'generator') {
      if (ref.repaired && this.player.role === 'killer' && !this.isTutorial) return 'HOLD E — SABOTAGE POWER NODE';
      if (ref.repaired) return 'POWER NODE ONLINE';
      return this.player.role === 'killer' && !this.isTutorial ? 'HOLD E — PRETEND TO REPAIR' : 'HOLD E — REPAIR POWER NODE';
    }
    if (type === 'keycard') return 'E — TAKE EXIT KEYCARD';
    if (type === 'exit') return this.keycardTaken ? 'E — OPEN EXIT / ESCAPE' : 'EXIT LOCKED — KEYCARD REQUIRED';
    if (type === 'pickup') return `E — TAKE ${ref.kind.toUpperCase()}`;
    if (type === 'evidence') return 'E — INVESTIGATE EVIDENCE';
    if (type === 'terminal') return 'E — REVIEW SECURITY FEED';
    if (type === 'locker') return 'E — HIDE IN LOCKER';
    if (type === 'trainingDummy') return 'E — LEARN ABOUT THE PIPE';
    return null;
  }

  useAction() {
    if (this.phase !== 'playing' || this.player.actionCooldown > this.matchTime || !this.player.alive || this.player.hidden) return;
    // Tutorial branch: safe taser/pipe on training objects, no lethal consequences
    if (this.isTutorial) {
      const targetNearby = this.tutorialTarget ? vecDistance(this.player.position, this.tutorialTarget.position) < 2.6 : false;
      const dummyNearby = this.tutorialDummy ? vecDistance(this.player.position, this.tutorialDummy.position) < 2.4 : false;
      if (this.player.held === 'taser') {
        if (targetNearby) {
          this.player.held = null;
          this.player.actionCooldown = this.matchTime + 0.8;
          this.tutorialTarget.stunnedUntil = this.matchTime + 6;
          this.createPulse(this.tutorialTarget.position, COLORS.amber, 1.7);
          this.audio.cue('taser');
          this.logEvent('Training target stunned. Nobody dies. The taser proves nothing about guilt.', 'warning');
          this.showSubtitle('Target stunned safely. Tasers do not reveal the killer.', 2400);
          this.signalInteractiveTutorial({ type: 'taserUsed', success: true });
          return;
        } else if (this.isTutorial && this.interactiveTutorialState && this.interactiveTutorialState.step === 7) {
          this.showSubtitle('Move closer to the TRAINING TARGET (glowing amber marker) and try again.', 1800);
          return;
        }
      }
      if (this.player.held === 'pipe') {
        if (dummyNearby) {
          this.player.held = null;
          this.player.actionCooldown = this.matchTime + 0.9;
          this.createPulse(this.tutorialDummy.position, 0xa8c4be, 1.4);
          this.audio.cue('attack');
          this.showSubtitle('Safe swing on the training dummy. In a real match, harming an innocent has severe consequences.', 3200);
          // Pipe lesson acknowledges even if player hasn't yet formally acknowledged via E
          if (this.interactiveTutorialState && this.interactiveTutorialState.step === 8) this.signalInteractiveTutorial({ type: 'pipeAcknowledged' });
          return;
        } else {
          // In tutorial, never allow killing a survivor with pipe
          this.showSubtitle('Training: the pipe is dangerous. Use it only on the dummy for now.', 2000);
          if (this.player.held === 'pipe') {
            // Do not consume pipe or kill; just warn
            return;
          }
        }
      }
      // Fallback for tutorial: if no held item or not near target, try normal bot taser but without penalty?
      if (!this.player.held) {
        this.showSubtitle(this.isTouchDevice ? 'You need a taser first. Look for the glowing pickup.' : 'You need a taser first.', 1400);
        return;
      }
      // If tutorial taser used on a bot, just stun safely without advancing (only training target advances)
      const nearestBot = this.getNearestBot(2.15);
      if (nearestBot && this.player.held === 'taser') {
        this.player.held = null;
        this.player.actionCooldown = this.matchTime + 0.8;
        nearestBot.stunUntil = this.matchTime + 5;
        this.createPulse(nearestBot.position, COLORS.amber, 1.5);
        this.audio.cue('taser');
        this.showSubtitle('Training stun — the figure is dazed. For real progress, use the TRAINING TARGET.', 2200);
        return;
      }
      this.showSubtitle('No training target in reach.', 900);
      return;
    }
    const nearest = this.getNearestBot(2.15);
    if (!nearest) {
      this.showSubtitle(this.player.role === 'killer' ? 'No one is close enough.' : 'No target in reach.', 850);
      return;
    }
    if (this.player.role === 'killer') {
      this.player.actionCooldown = this.matchTime + 1.05;
      this.killBot(nearest, 'YOU');
      return;
    }
    if (!this.player.held) {
      this.showSubtitle('You have nothing to defend yourself with.', 1100);
      return;
    }
    if (this.player.held === 'taser') {
      this.player.held = null;
      this.player.actionCooldown = this.matchTime + 0.8;
      nearest.stunUntil = this.matchTime + (nearest.role === 'killer' ? 10 : 5.5);
      this.createPulse(nearest.position, COLORS.amber, 1.6);
      this.audio.cue('taser');
      if (nearest.role === 'killer') {
        this.logEvent('Your taser connects. The figure collapses—but is still alive.', 'warning');
        this.showSubtitle('The attacker spasms. Run before they recover.', 2600);
      } else {
        this.logEvent(`${nearest.name} is stunned. They may have been innocent.`, 'warning');
        this.showSubtitle('They are alive. A taser reveals nothing.', 1800);
      }
      return;
    }
    if (this.player.held === 'pipe') {
      this.player.held = null;
      this.player.actionCooldown = this.matchTime + 1;
      this.audio.cue('attack');
      if (nearest.role === 'killer') {
        nearest.stunUntil = this.matchTime + 14;
        this.createPulse(nearest.position, COLORS.amber, 2.2);
        this.showSubtitle('The blow drops them—for now. Get to the exit.', 2600);
        this.logEvent('You knocked an attacker down. Their identity is still unconfirmed.', 'warning');
      } else {
        this.killBot(nearest, 'YOU');
        const killEpoch = this.matchEpoch;
        window.setTimeout(() => {
          if (killEpoch !== this.matchEpoch) return;
          this.endMatch(false, 'You killed an innocent survivor. The blacksite takes you too.', 'innocent-killed');
        }, 220);
      }
    }
  }

  getNearestBot(maxDistance) {
    let closest = null;
    let closestDistance = maxDistance;
    for (const bot of this.bots) {
      if (!bot.alive || bot.escaped) continue;
      const distance = vecDistance(this.player.position, bot.position);
      if (distance < closestDistance) {
        closest = bot;
        closestDistance = distance;
      }
    }
    return closest;
  }

  updateBots(delta) {
    for (const bot of this.bots) {
      if (!bot.alive || bot.escaped) continue;
      if (bot.stunUntil > this.matchTime) {
        this.animateBot(bot, delta, false, true);
        continue;
      }
      if (bot.role === 'killer' && this.matchTime > 16) this.updateKillerBot(bot, delta);
      else this.updateSurvivorBot(bot, delta, bot.role === 'killer');
      this.observeCorpse(bot);
    }
  }

  updateSurvivorBot(bot, delta, pretending = false) {
    if (!bot.goal || bot.goalUntil < this.matchTime || !this.isGoalValid(bot.goal)) this.chooseSurvivorGoal(bot, pretending);
    if (!bot.goal) return;
    const goalPosition = this.botMovementTarget(bot);
    const arrived = this.moveBotToward(bot, goalPosition, delta, 2.3 + this.random() * 0.32);
    if (!arrived) return;
    if (!bot.routeEntered && bot.goal.access) {
      bot.routeEntered = true;
      return;
    }
    if (bot.goal.type === 'generator') {
      const generator = bot.goal.ref;
      if (!generator.repaired) {
        generator.progress = clamp(generator.progress + delta * (pretending ? 0.017 : 0.031), 0, 1);
        this.updateGeneratorVisual(generator);
        if (generator.progress >= 1) this.completeGenerator(generator, bot.name);
      }
    } else if (bot.goal.type === 'keycard') {
      this.takeKeycard(bot.name);
      bot.goal = null;
    } else if (bot.goal.type === 'exit') {
      this.useExit(bot.name);
    } else if (bot.goal.type === 'wander') {
      bot.goal = null;
    }
    this.animateBot(bot, delta, true, false);
  }

  chooseSurvivorGoal(bot, pretending = false) {
    bot.routeEntered = false;
    bot.goalUntil = this.matchTime + 4.8 + this.random() * 5.5;
    if (!this.securityUnlocked) {
      let offline = this.generators.filter((node) => !node.repaired);
      // Tutorial: bots must not repair the controlled training node; leave it for the player
      if (this.isTutorial && this.tutorialGenerator) offline = offline.filter(n => n !== this.tutorialGenerator);
      if (offline.length && this.random() < 0.8) {
        offline.sort((a, b) => vecDistance(bot.position, a.position) - vecDistance(bot.position, b.position));
        const choice = this.random() < 0.62 ? offline[0] : randomFrom(this.random, offline);
        bot.goal = { type: 'generator', ref: choice, position: choice.position, access: choice.zone.access };
        return;
      }
    } else if (!this.keycardTaken && !pretending) {
      // Tutorial: bots should not steal keycard
      if (this.isTutorial) {
        const wandering = [ZONES.lobby, ZONES.generatorA, ZONES.generatorB, ZONES.generatorC];
        const choice = randomFrom(this.random, wandering);
        bot.goal = { type: 'wander', ref: choice, position: choice.access, access: null };
        return;
      }
      bot.goal = { type: 'keycard', ref: this.keycard, position: this.keycard.position, access: ZONES.security.access };
      return;
    } else if (this.keycardTaken && !pretending) {
      // Tutorial bots don't race to exit
      if (this.isTutorial) {
        const wandering = [ZONES.lobby, ZONES.generatorA, ZONES.generatorB, ZONES.generatorC];
        const choice = randomFrom(this.random, wandering);
        bot.goal = { type: 'wander', ref: choice, position: choice.access, access: null };
        return;
      }
      bot.goal = { type: 'exit', ref: ZONES.exit, position: ZONES.exit.position, access: ZONES.exit.access };
      return;
    }
    const wandering = [ZONES.lobby, ZONES.generatorA, ZONES.generatorB, ZONES.generatorC];
    const choice = randomFrom(this.random, wandering);
    bot.goal = { type: 'wander', ref: choice, position: choice.access, access: null };
  }

  isGoalValid(goal) {
    if (goal.type === 'generator') return !goal.ref.repaired;
    if (goal.type === 'keycard') return !this.keycardTaken && this.keycard.active;
    if (goal.type === 'exit') return this.keycardTaken;
    return true;
  }

  botMovementTarget(bot) {
    if (bot.goal.access && !bot.routeEntered) return bot.goal.access;
    return bot.goal.position;
  }

  moveBotToward(bot, target, delta, speed) {
    const dx = target.x - bot.position.x;
    const dz = target.z - bot.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 0.72) {
      this.animateBot(bot, delta, false, false);
      return true;
    }
    const amount = Math.min(speed * delta, distance);
    const moveX = (dx / distance) * amount;
    const moveZ = (dz / distance) * amount;
    const previousX = bot.position.x;
    const previousZ = bot.position.z;
    this.moveWithCollision(bot.position, moveX, moveZ, 0.34);
    if (Math.abs(bot.position.x - previousX) + Math.abs(bot.position.z - previousZ) < 0.005) {
      // A simple sidestep keeps AI from staring at a wall if another character has crowded an entrance.
      const angle = Math.atan2(dz, dx) + (this.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
      this.moveWithCollision(bot.position, Math.cos(angle) * amount * 0.7, Math.sin(angle) * amount * 0.7, 0.34);
    }
    const desiredRotation = Math.atan2(dx, dz);
    bot.group.rotation.y = lerpAngle(bot.group.rotation.y, desiredRotation, delta * 7);
    this.animateBot(bot, delta, true, false);
    return false;
  }

  animateBot(bot, delta, walking, stunned) {
    bot.walkPhase += delta * (walking ? 10 : 2.5);
    const swing = walking ? Math.sin(bot.walkPhase) * 0.52 : Math.sin(bot.walkPhase) * 0.05;
    bot.leftArm.rotation.x = swing;
    bot.rightArm.rotation.x = -swing;
    if (stunned) {
      bot.group.rotation.z = Math.sin(this.matchTime * 14) * 0.08;
      bot.group.position.y = 0.02;
    } else {
      bot.group.rotation.z *= 0.85;
      bot.group.position.y = walking ? Math.abs(Math.sin(bot.walkPhase)) * 0.035 : 0;
    }
  }

  updateKillerBot(killer, delta) {
    if (!killer.goal || killer.goalUntil < this.matchTime || !this.isKillerGoalValid(killer.goal)) this.chooseKillerGoal(killer);
    if (!killer.goal) return;
    if (killer.goal.type === 'sabotage') {
      const arrived = this.moveBotToward(killer, this.botMovementTarget(killer), delta, 3.35);
      if (arrived) {
        killer.routeEntered = true;
        if (vecDistance(killer.position, killer.goal.ref.position) < 2.2) {
          this.sabotageGenerator(killer.goal.ref, killer.name);
          killer.goal = null;
        }
      }
      return;
    }
    const target = killer.goal.ref;
    if (!target || !target.alive || target.escaped || (target.id === 'player' && target.hidden)) {
      killer.goal = null;
      return;
    }
    this.moveBotToward(killer, target.position, delta, 3.55 + this.random() * 0.45);
    const attackDistance = vecDistance(killer.position, target.position);
    if (attackDistance < 1.45 && killer.killCooldown < this.matchTime) {
      killer.killCooldown = this.matchTime + 11 + this.random() * 6;
      if (target.id === 'player') this.damagePlayer(54, killer);
      else this.killBot(target, killer.name);
      killer.goal = null;
    }
  }

  isKillerGoalValid(goal) {
    if (goal.type === 'sabotage') return goal.ref.repaired && this.matchTime - goal.ref.lastSabotaged > 8;
    return goal.ref?.alive && !goal.ref.escaped;
  }

  chooseKillerGoal(killer) {
    killer.routeEntered = false;
    killer.goalUntil = this.matchTime + 3.4 + this.random() * 3.3;
    const sabotageCandidates = this.generators.filter((node) => node.repaired && this.matchTime - node.lastSabotaged > 13);
    if (sabotageCandidates.length && this.random() < 0.24 && !this.keycardTaken) {
      const generator = randomFrom(this.random, sabotageCandidates);
      killer.goal = { type: 'sabotage', ref: generator, position: generator.position, access: generator.zone.access };
      return;
    }
    const targets = this.getSurvivorActors().filter((actor) => actor.id !== killer.id && !(actor.id === 'player' && actor.hidden));
    if (!targets.length) {
      killer.goal = null;
      return;
    }
    // Prefer an isolated person, but keep a little uncertainty so each incident feels different.
    targets.sort((a, b) => this.targetDangerScore(b, killer) - this.targetDangerScore(a, killer));
    const selected = this.random() < 0.72 ? targets[0] : randomFrom(this.random, targets);
    killer.goal = { type: 'hunt', ref: selected, position: selected.position, access: null };
  }

  targetDangerScore(target, killer) {
    const otherSurvivors = this.getSurvivorActors().filter((candidate) => candidate.id !== target.id);
    const nearestFriend = otherSurvivors.reduce((nearest, candidate) => Math.min(nearest, vecDistance(target.position, candidate.position)), 999);
    return nearestFriend * 1.8 - vecDistance(target.position, killer.position) * 0.18 + this.random() * 2;
  }

  getSurvivorActors() {
    const actors = this.bots.filter((bot) => bot.role === 'survivor' && bot.alive && !bot.escaped);
    if (this.player.role === 'survivor' && this.player.alive && !this.player.escaped) actors.push(this.player);
    return actors;
  }

  observeCorpse(bot) {
    if (bot.lastSeenCorpse && this.matchTime - bot.lastSeenCorpse.time < 10) return;
    const corpse = this.bots.find((candidate) => !candidate.alive && !candidate.escaped && vecDistance(candidate.position, bot.position) < 5.1);
    if (!corpse) return;
    bot.lastSeenCorpse = { id: corpse.id, time: this.matchTime };
    bot.goal = { type: 'wander', ref: ZONES.lobby, position: ZONES.lobby.position.clone().add(new THREE.Vector3((this.random() - 0.5) * 10, 0, (this.random() - 0.5) * 7)), access: null };
    bot.goalUntil = this.matchTime + 5;
    this.logEvent('Footsteps break into a panicked run.', 'danger');
    this.showSubtitle('You hear someone running through the facility.', 1700);
  }

  killBot(bot, attacker) {
    if (!bot?.alive || bot.escaped) return;
    bot.alive = false;
    bot.state = 'dead';
    bot.group.position.y = 0.17;
    bot.group.rotation.z = attacker === 'YOU' ? -1.18 : (this.random() < 0.5 ? 1.15 : -1.15);
    bot.leftArm.rotation.x = -1.3;
    bot.rightArm.rotation.x = 0.9;
    this.createEvidence(bot.position.clone().add(new THREE.Vector3(0.25, 0.02, 0.1)), 'blood');
    this.createEvidence(bot.position.clone().add(new THREE.Vector3(-0.65, 0.02, 0.48)), 'footprint');
    if (this.random() < 0.75) this.createEvidence(bot.position.clone().add(new THREE.Vector3(0.5, 0.02, -0.52)), 'badge');
    this.createPulse(bot.position, COLORS.red, 2.1);
    this.audio.cue('attack');
    this.logEvent(attacker === 'YOU' ? 'A body hits the floor.' : 'A scream ends abruptly somewhere nearby.', 'danger');
    this.showSubtitle(attacker === 'YOU' ? 'One less witness.' : 'Something terrible just happened.', 2100);
    this.checkMatchState();
  }

  damagePlayer(amount, attacker) {
    if (this.isTutorial) return;
    if (!this.player.alive) return;
    this.player.health -= amount;
    this.cameraShake = this.settings.reducedMotion ? 0 : 1;
    dom.damageFlash.classList.add('active');
    window.setTimeout(() => dom.damageFlash.classList.remove('active'), 130);
    this.audio.cue('hurt');
    this.createPulse(this.player.position, COLORS.red, 1.7);
    this.showSubtitle('Something strikes from the dark. Get away!', 1900);
    this.logEvent('You were attacked. The attacker did not reveal themselves.', 'danger');
    if (this.player.health <= 0) {
      this.player.health = 0;
      this.player.alive = false;
      this.endMatch(false, 'The killer found you before the facility let you go.', 'killed');
    } else if (attacker) {
      attacker.goalUntil = this.matchTime + 4.5;
    }
  }

  escapePlayer() {
    if (this.player.role === 'killer') return;
    this.player.escaped = true;
    this.player.alive = false;
    this.audio.cue('escape');
    this.endMatch(true, 'Cold air hits your face as the quarantine door seals behind you. The blacksite keeps its secrets.', 'escaped');
  }

  escapeBot(bot) {
    if (!bot.alive || bot.escaped) return;
    bot.escaped = true;
    bot.alive = false;
    bot.group.visible = false;
    this.logEvent(`${bot.name} disappeared through the quarantine exit.`, 'warning');
    this.audio.cue('escape');
    if (this.player.role === 'killer') {
      this.endMatch(false, `${bot.name} escaped. The witnesses are no longer contained.`, 'witness-escaped');
    } else {
      this.showSubtitle(`${bot.name} made it out. The door remains open—run.`, 2200);
    }
  }

  createEvidence(position, type) {
    const group = new THREE.Group();
    group.position.copy(position);
    let marker;
    if (type === 'blood') {
      marker = new THREE.Mesh(new THREE.CircleGeometry(0.62, 18), new THREE.MeshBasicMaterial({ color: COLORS.redDark, transparent: true, opacity: 0.76, depthWrite: false }));
      marker.rotation.x = -Math.PI / 2;
      marker.position.y = 0.022;
      group.add(marker);
      const splatter = new THREE.Mesh(new THREE.CircleGeometry(0.17, 10), marker.material.clone());
      splatter.position.set(0.64, 0.023, 0.2);
      splatter.rotation.x = -Math.PI / 2;
      group.add(splatter);
    } else if (type === 'footprint') {
      marker = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 0.48), new THREE.MeshBasicMaterial({ color: 0x5e3026, transparent: true, opacity: 0.74, depthWrite: false }));
      marker.position.y = 0.02;
      marker.rotation.y = this.random() * Math.PI;
      group.add(marker);
      const second = marker.clone();
      second.position.set(0.22, 0, -0.38);
      group.add(second);
    } else if (type === 'tampered') {
      marker = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.06, 6, 14), new THREE.MeshBasicMaterial({ color: COLORS.amber, transparent: true, opacity: 0.75, depthWrite: false }));
      marker.rotation.x = Math.PI / 2;
      marker.position.y = 0.035;
      group.add(marker);
    } else {
      marker = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.025, 0.45), new THREE.MeshBasicMaterial({ color: 0x9bdfc1, transparent: true, opacity: 0.82, depthWrite: false }));
      marker.position.y = 0.025;
      marker.rotation.y = this.random() * Math.PI;
      group.add(marker);
    }
    this.matchGroup.add(group);
    this.evidence.push({ type: 'evidence', evidenceType: type, position: group.position, group, marker, inspected: false });
  }

  createPulse(position, color, size = 1.6) {
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.18, 18), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(position);
    mesh.position.y = 0.05;
    this.fxGroup.add(mesh);
    this.vfx.push({ mesh, material, age: 0, duration: 0.62, size });
  }

  updateEffects(delta) {
    for (let i = this.vfx.length - 1; i >= 0; i -= 1) {
      const effect = this.vfx[i];
      effect.age += delta;
      const progress = effect.age / effect.duration;
      effect.mesh.scale.setScalar(1 + progress * effect.size * 2.2);
      effect.material.opacity = (1 - progress) * 0.5;
      if (progress >= 1) {
        this.fxGroup.remove(effect.mesh);
        this.vfx.splice(i, 1);
      }
    }
  }

  updateEnvironment(delta) {
    if (!this.isTutorial && this.matchTime >= this.nextEventAt) {
      this.triggerEnvironmentalEvent();
      this.nextEventAt = this.matchTime + 25 + this.random() * 22;
    }
    if (this.isTutorial) this.nextEventAt = 9999;
    const blackout = this.blackoutUntil > this.matchTime;
    const foggy = this.fogSurgeUntil > this.matchTime;
    this.scene.fog.density += ((foggy ? 0.055 : 0.026) - this.scene.fog.density) * Math.min(1, delta * 1.6);
    this.ambientLight.intensity += ((blackout ? 0.09 : 0.32) - this.ambientLight.intensity) * Math.min(1, delta * 3);
    for (const entry of this.lights) {
      const flicker = Math.sin(this.matchTime * 17 + entry.phase) > 0.92 ? 0.25 : 1;
      const target = blackout ? entry.base * 0.08 : entry.base * flicker;
      entry.light.intensity += (target - entry.light.intensity) * Math.min(1, delta * 10);
    }
    const openingTarget = this.exitOpen ? 1 : 0;
    this.exitDoorOpen += (openingTarget - this.exitDoorOpen) * Math.min(1, delta * 2.1);
    this.exitDoor.left.position.x = -1.83 - this.exitDoorOpen * 2.25;
    this.exitDoor.right.position.x = 1.83 + this.exitDoorOpen * 2.25;
    this.exitDoor.scanner.material.emissive.setHex(this.exitOpen ? COLORS.aqua : COLORS.red);
    this.exitDoor.scanner.material.emissiveIntensity = this.exitOpen ? 2.6 : 1.4;

    for (const pickup of this.pickups) {
      if (!pickup.available) continue;
      pickup.group.position.y = Math.sin(this.matchTime * 2.4 + pickup.position.x) * 0.06;
      pickup.mesh.rotation.y += delta * 1.3;
    }
    if (this.keycard?.active && !this.keycard.taken) {
      this.keycard.card.rotation.y += delta * 1.4;
      this.keycard.group.position.y = 1.43 + Math.sin(this.matchTime * 2.1) * 0.06;
    }
  }

  triggerEnvironmentalEvent() {
    const type = pickEnvironmentalEvent(this.random);
    if (type === 'blackout') {
      this.blackoutUntil = this.matchTime + 7;
      this.logEvent('GRID FAILURE: emergency lights engaged.', 'danger');
      this.showSubtitle('The facility goes black. Your flashlight is all you have.', 3200);
      this.audio.cue('alarm');
    } else if (type === 'fog') {
      this.fogSurgeUntil = this.matchTime + 12;
      this.logEvent('Ventilation failure: dense fog in all wings.', 'warning');
      this.showSubtitle('Cold fog spills through the corridors.', 2600);
      this.audio.cue('sabotage');
    } else if (type === 'alarm') {
      this.logEvent('Movement alarm: source unresolved.', 'danger');
      this.showSubtitle('An alarm screams from another sector.', 2200);
      this.audio.cue('alarm');
    } else {
      this.logEvent('Radio interference detected.', 'normal');
      this.showSubtitle('RADIO: ...don’t let them see you...', 2600);
      this.audio.cue('evidence');
    }
  }

  updatePrompts() {
    if (this.player.hidden) {
      dom.interaction.classList.remove('hidden');
      dom.interactionText.textContent = 'E — LEAVE LOCKER';
    } else if (this.player.interaction) {
      const { type, elapsed, duration } = this.player.interaction;
      const amount = Math.floor((elapsed / duration) * 100);
      dom.interaction.classList.remove('hidden');
      dom.interactionText.textContent = `${type === 'sabotage' ? 'OVERLOADING' : 'REPAIRING'} ${amount}% — HOLD E`;
    } else {
      const target = this.getNearestInteractable();
      const label = this.interactionLabel(target);
      if (label) {
        dom.interaction.classList.remove('hidden');
        dom.interactionText.textContent = this.isTouchDevice ? label.replace(/^HOLD E/, 'HOLD USE').replace(/^E/, 'USE') : label;
      } else dom.interaction.classList.add('hidden');
    }
    let action = null;
    if (this.player.role === 'killer') action = 'F — STRIKE';
    else if (this.player.held === 'taser') action = 'F — FIRE TASER';
    else if (this.player.held === 'pipe') action = 'F — SWING PIPE (LETHAL)';
    if (action && !this.player.hidden) {
      dom.action.classList.remove('hidden');
      dom.actionText.textContent = this.isTouchDevice ? action.replace(/^F/, 'ACT') : action;
    } else dom.action.classList.add('hidden');
  }

  updateHud() {
    dom.matchClock.textContent = formatClock(this.matchTime);
    const alive = getAliveCount(this.player, this.bots);
    dom.aliveCount.textContent = `${alive} / 8`;
    dom.healthFill.style.width = `${this.player.health}%`;
    dom.healthValue.textContent = Math.ceil(this.player.health);
    dom.staminaFill.style.width = `${this.player.stamina}%`;
    dom.heldItem.textContent = this.player.held ? this.player.held.toUpperCase() : 'EMPTY';
    if (this.isTutorial && this.interactiveTutorialState && !this.interactiveTutorialState.complete) {
      // Tutorial HUD is driven by refreshTutorialCard; keep objective hidden
      dom.objectiveCard.classList.add('hidden');
      dom.tutorialCard.classList.remove('hidden');
      this.refreshTutorialCard();
      return;
    }
    // Normal HUD
    dom.tutorialCard.classList.add('hidden');
    dom.objectiveCard.classList.remove('hidden');
    const state = getObjectiveState({
      playerRole: this.player.role,
      generators: this.generators,
      powerRestored: this.securityUnlocked,
      keycardTaken: this.keycardTaken,
      exitOpen: this.exitOpen,
      survivorsRemaining: getSurvivorCount(this.player, this.bots),
    });
    dom.objectiveTitle.textContent = state.title;
    dom.objectiveCopy.textContent = state.copy;
    dom.objectiveFill.style.width = `${clamp(state.progress, 0, 1) * 100}%`;
  }

  logEvent(text, type = 'normal') {
    if (this.phase === 'menu') return;
    const line = document.createElement('div');
    line.className = `event-line ${type === 'normal' ? '' : type}`;
    const time = document.createElement('time');
    time.textContent = formatClock(this.matchTime);
    const copy = document.createElement('span');
    copy.textContent = text;
    line.append(time, copy);
    dom.eventLog.prepend(line);
    this.eventLines.unshift(line);
    while (this.eventLines.length > 4) this.eventLines.pop().remove();
  }

  showSubtitle(text, duration = 2200) {
    dom.subtitle.textContent = text;
    dom.subtitle.classList.add('visible');
    if (this.subtitleTimer) window.clearTimeout(this.subtitleTimer);
    this.subtitleTimer = window.setTimeout(() => dom.subtitle.classList.remove('visible'), duration);
  }

  drawMinimap() {
    const canvas = dom.minimap;
    const context = canvas.getContext('2d');
    const width = canvas.width;
    const center = width / 2;
    const scale = 2.15;
    context.clearRect(0, 0, width, width);
    context.save();
    context.beginPath();
    context.arc(center, center, center - 4, 0, Math.PI * 2);
    context.clip();
    context.fillStyle = 'rgba(4, 18, 19, .92)';
    context.fillRect(0, 0, width, width);
    context.strokeStyle = 'rgba(118, 255, 195, .17)';
    context.lineWidth = 1;
    for (let x = -30; x <= 30; x += 10) {
      context.beginPath(); context.moveTo(center + x * scale, 0); context.lineTo(center + x * scale, width); context.stroke();
      context.beginPath(); context.moveTo(0, center + x * scale); context.lineTo(width, center + x * scale); context.stroke();
    }
    context.strokeStyle = 'rgba(164, 245, 202, .54)';
    context.strokeRect(center - 34 * scale, center - 34 * scale, 68 * scale, 68 * scale);
    const roomOutline = (x, z) => context.strokeRect(center + (x - 6) * scale, center + (z - 6) * scale, 12 * scale, 12 * scale);
    context.strokeStyle = 'rgba(117, 201, 166, .42)';
    roomOutline(-23, -20); roomOutline(23, -20); roomOutline(-23, 20); roomOutline(23, 20);
    for (const generator of this.generators) {
      context.fillStyle = generator.repaired ? '#79ffca' : '#efb64a';
      context.fillRect(center + generator.position.x * scale - 2, center + generator.position.z * scale - 2, 4, 4);
    }
    for (const evidence of this.evidence) {
      if (!evidence.inspected) continue;
      context.fillStyle = 'rgba(252, 76, 80, .8)';
      context.fillRect(center + evidence.position.x * scale - 1, center + evidence.position.z * scale - 1, 2, 2);
    }
    for (const bot of this.bots) {
      if (!bot.alive || bot.escaped || vecDistance(bot.position, this.player.position) > 23) continue;
      context.fillStyle = bot.stunUntil > this.matchTime ? '#f7bd4e' : '#b6c9c0';
      context.beginPath();
      context.arc(center + bot.position.x * scale, center + bot.position.z * scale, 2.5, 0, Math.PI * 2);
      context.fill();
    }
    context.save();
    context.translate(center + this.player.position.x * scale, center + this.player.position.z * scale);
    context.rotate(-this.yaw);
    context.fillStyle = this.player.role === 'killer' ? '#ff666a' : '#80ffc8';
    context.beginPath();
    context.moveTo(0, -5.2); context.lineTo(3.9, 4); context.lineTo(-3.9, 4); context.closePath(); context.fill();
    context.restore();
    context.restore();
    context.strokeStyle = 'rgba(160,255,205,.45)';
    context.beginPath(); context.arc(center, center, center - 3, 0, Math.PI * 2); context.stroke();
  }

  checkMatchState() {
    if (this.phase !== 'playing' || this.isTutorial) return;
    if (this.player.role === 'killer') {
      const survivors = getSurvivorCount(this.player, this.bots);
      if (survivors === 0) this.endMatch(true, 'The facility is silent. No witness remains to tell the story.', 'killer-win');
    }
  }

  endMatch(won, copy, reason) {
    if (this.phase === 'ended') return;
    this.phase = 'ended';
    this.keys.clear();
    this.briefingOpen = false;
    dom.briefing.classList.add('hidden');
    if (document.pointerLockElement === dom.canvas) document.exitPointerLock?.();
    dom.hud.classList.add('hidden');
    dom.pause.classList.add('hidden');
    dom.result.classList.remove('hidden');
    dom.result.classList.toggle('lost', !won);
    const killerResult = this.player.role === 'killer';
    dom.resultKicker.textContent = won ? 'INCIDENT REPORT // OUTCOME CONFIRMED' : 'INCIDENT REPORT // CONTAINMENT FAILED';
    dom.resultHeading.textContent = won ? (killerResult ? 'NO WITNESSES' : 'YOU ESCAPED') : (reason === 'innocent-killed' ? 'WRONG PERSON' : 'BLACKSITE CLAIMED YOU');
    dom.resultCopy.textContent = copy;
    const alive = getAliveCount(this.player, this.bots);
    const bodies = this.bots.filter((bot) => !bot.alive && !bot.escaped).length;
    dom.reportGrid.innerHTML = '';
    const report = [
      [formatClock(this.matchTime), 'INCIDENT TIME'],
      [this.player.role.toUpperCase(), 'YOUR ROLE'],
      [`${alive}/8`, 'STILL PRESENT'],
      [String(bodies), 'BODIES FOUND'],
      [String(this.evidence.filter((item) => item.inspected).length), 'CLUES LOGGED'],
      [won ? 'SURVIVED' : 'LOST', 'STATUS'],
    ];
    for (const [value, label] of report) {
      const cell = document.createElement('div');
      const strong = document.createElement('b');
      const span = document.createElement('span');
      strong.textContent = value;
      span.textContent = label;
      cell.append(strong, span);
      dom.reportGrid.append(cell);
    }
    this.audio.cue(won ? 'escape' : 'death');
  }
}

new UnmarkedGame();
