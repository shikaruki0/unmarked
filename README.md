# UNMARKED — Blacksite Escape

> **Eight entered. One is lying.**

A self-contained, offline 3D social-horror prototype. You play in a stylized research facility with **seven AI-controlled survivors**. One of the eight people is secretly a killer—there are no meetings, votes, visual role markers, or safe conversations.

This build deliberately uses a browser-based 3D runtime instead of Unity or Unreal, so it can be run and developed without downloading or learning a game engine.

## Play it locally

You only need [Node.js](https://nodejs.org/) 22 or newer.

```bash
npm install
npm run dev
```

Open the address printed by Vite (normally `http://localhost:5173`) in a desktop browser. Click **ENTER BLACKSITE**, then click the game view if your browser asks to capture the mouse.

The same web build also supports modern Android and iPhone browsers. Rotate the phone to **landscape**: use the left virtual stick to move (push fully to sprint), drag the right side to look, hold **USE** to interact or repair, press **ACT** to use an item/attack, and press **LAMP** for the flashlight. Mobile is an experimental target and should be tested on real devices.

Landscape is required for gameplay; portrait shows a **ROTATE YOUR PHONE** overlay. The home screen itself remains usable in portrait (scrollable) but gameplay is landscape-first. Safe-area insets (`env(safe-area-inset-*)`), `viewport-fit=cover`, and notch-aware padding keep essential buttons clear of browser chrome, notches, and rounded corners.

To make a production web bundle:

```bash
npm run build
```

To run the automated gameplay-rule tests:

```bash
npm test
```

## Home screen

The opening screen shows:

- **UNMARKED** title and tagline *Eight entered. One is lying.*
- Short incident description and three feature pillars
- **Primary:** `ENTER BLACKSITE` — start a real match
- **Secondary:** `TUTORIAL — LEARN TO SURVIVE` — start the interactive hands-on training
- **Tertiary:** `Accessibility & controls` — high-contrast, reduced-motion, and control reference
- Offline build footer

On short landscape phones (e.g., 844×390, 800×360, 740×360, 667×375, 915×412) the home screen collapses gracefully: decorative copy and feature-grid descriptions shrink first, then hide, while the title, tagline, and the three buttons remain visible and tappable without scrolling the browser chrome. If the viewport is extremely short, only the intro content area scrolls vertically — the game canvas and HUD never become a scrollable web page.

## First-run onboarding

A brand-new player can start a match and understand the game without help:

1. Every match begins facing a **briefing desk** in the lobby with a glowing **INCIDENT BRIEFING** letter on it (pale paper, gentle amber glow, floating label above it).
2. Walk close and press `E` (or tap `USE` on phone) to open a full briefing page: what the game is about, the survivor objective, the killer objective, controls, defense, investigation, and a final warning.
3. The briefing **pauses the simulation** while open and releases the mouse. Close it with `E`, `Esc`, or the **CLOSE** button; mouse control and pointer lock are restored afterwards.
4. A short sequence of non-blocking subtitle hints teaches the objective, generator repair, defensive items, power restoration, and the escape route — each appears once, only when relevant. These hints are suppressed during the interactive tutorial so training stays deterministic.
5. **HOW TO PLAY** in the pause menu reopens the exact same briefing (press `H` at any time in a match as a shortcut). Your secret role is still shown only on your role card and spawn message — never in the letter.

### Interactive tutorial — learn by doing (3–5 minutes)

Press **TUTORIAL — LEARN TO SURVIVE** on the home screen. The tutorial reuses the existing blacksite (no second map) in a safe, deterministic training mode: no hidden-killer assignment, no killer AI attacks, no environmental blackouts/fog, and no accidental game-over. Bots wander passively and never steal the training objective.

The dedicated **TRAINING** card (replacing the normal objective card) shows `TRAINING — STEP N / 12`, a short instruction, progress, and `SKIP TUTORIAL` / `EXIT TRAINING` controls. Required objects pulse gently (not flashing) and respect reduced-motion.

**PC vs phone instructions are shown automatically:**

| Step | PC | Phone | Completion |
| --- | --- | --- | --- |
| 1 Look around | Move the mouse to look around. | Drag the right side to look around. | Rotate camera meaningfully |
| 2 Move | Use W A S D toward the glowing desk. | Use left joystick toward the desk. | Walk a few meters |
| 3 Interact | Press E to read the briefing letter. | Tap USE to read the briefing letter. | Open then close letter |
| 4 Flashlight | Press Q off then on again. | Tap LAMP off then on. | 2 toggles |
| 5 Sprint | Hold Shift while moving. | Push stick fully to edge. | Sprint ~1s (shows stamina) |
| 6 Repair | Hold E near power node. | Hold USE near power node. | One tutorial node (faster, bots ignore it) |
| 7 Taser | Press E to collect, F near target. | Tap USE, then ACT near target. | Stun TRAINING TARGET (nobody dies) |
| 8 Pipe | Dangerous — last resort. | Same | View pipe + optional dummy swing (no kill) |
| 9 Keycard | Emergency power unlocks Security. | Same | Collect glowing keycard |
| 10 Escape | Take keycard to north exit. | Same | Open and reach quarantine exit |
| 11 Trust lesson | One person is secretly the killer… No meetings/votes. | Same | Acknowledge with E / USE |
| 12 Complete | You now know how to survive… | Same | Choose START REAL MATCH / REPEAT / HOME |

Finishing shows **TRAINING COMPLETE** with a checklist of everything learned and three large touch-friendly buttons: `START A REAL MATCH`, `REPEAT TUTORIAL`, and `RETURN TO HOME`. The player can also pause, open How to Play, resume, restart, or exit to home at any time. Tutorial objects, lights, and timers are fully cleaned up on exit so no state leaks into the next match.

## Controls

### Desktop (keyboard + mouse)

| Control | Action |
| --- | --- |
| `W` `A` `S` `D` | Move |
| Mouse | Look |
| `Shift` | Sprint (drains stamina) |
| Hold `E` | Repair / sabotage a power node (tutorial node repairs slightly faster) |
| `E` | Interact, read the briefing, investigate, hide, collect items, use the exit, acknowledge trust lesson |
| `F` | Strike as killer / use held defense item (taser stuns, pipe is lethal) |
| `Q` | Toggle flashlight (tutorial step 4 requires off→on) |
| `H` | Open or close the briefing letter |
| `Esc` | Pause and release mouse, or close briefing first |

### Phone (touch)

| Control | Action |
| --- | --- |
| Left virtual stick | Move; push fully to edge to sprint |
| Drag on right side | Look around |
| Hold `USE` | Interact / repair power node / read briefing |
| `ACT` | Use held item (taser) / safe swing on dummy |
| `LAMP` | Toggle flashlight |
| `Ⅱ` Pause | Pause and show EXIT TRAINING during tutorial |

Touch targets are ≥44 px, use `touch-action:none`, and live inside safe-area insets. USE can be held continuously to repair. The browser never scrolls, zooms, or selects text during gameplay. Returning home restores normal page interaction and pointer-lock state.

The Accessibility & Controls panel includes high-contrast and reduced-motion settings (reduced motion disables the letter's pulse animation and keeps a steady glow). Critical sound events always also appear as captions. Tutorial progress never depends only on color — text, labels, and captions are used.

## Current playable loop

1. A hidden killer is assigned randomly every match. You only know **your own** role.
2. As a survivor, restore three power nodes, retrieve the exit keycard from Security, open the north quarantine exit, and escape alive. In the tutorial, one node unlocks Security for a focused lesson.
3. As the killer, blend in, sabotage working nodes, and eliminate every survivor before anyone escapes. The tutorial disables the killer role entirely.
4. Seven AI characters move through the same objective loop. The killer AI first behaves helpfully, then stalks isolated survivors and may manipulate the facility. In tutorial, all bots are passive survivors and never repair the training node or steal the keycard.
5. Investigate blood, footprints, dropped badges, tampered equipment, and corrupted security feeds. Evidence is deliberately suggestive rather than a role reveal.
6. Find a taser (nonlethal, stuns without revealing guilt) or a lethal pipe, or hide in a locker. The pipe can stop the killer temporarily—but killing an innocent survivor ends your match. The tutorial teaches the taser on a safe target and explains the pipe via a nonliving dummy — it never encourages harming survivors.
7. Power outages, fog surges, alarms, and radio interference reshape the tension during each incident. Tutorial suppresses these events for determinism.

## What is included

- First-person 3D movement with collision, sprinting, flashlight, pause, and mouse-look
- One stylized abandoned blacksite map with generator wings, a Security room, lockers, and a quarantine exit
- Randomized hidden killer assignment across a roster of eight
- Seven state-driven AI actors: goal selection, generator work, keycard retrieval, escape behavior, stalking, sabotage, panic, and stun states
- Survivor and killer win conditions
- Power repair / sabotage, keycard, exit-door, evidence, defense, hiding, and dynamic-event systems
- Generated ambient audio and feedback effects—no copyrighted or downloaded art/audio assets
- HUD, event log, captions, minimap, match report, high-contrast mode, and reduced-motion mode
- First-run onboarding: glowing briefing letter on the lobby desk, a paused-reading briefing overlay with controls, non-blocking tutorial hints, and a HOW TO PLAY entry in the pause menu
- **Interactive tutorial:** dedicated training mode reusing the blacksite, 12-step state machine (`createInteractiveTutorialState` / `advanceInteractiveTutorial` / `getTutorialInstruction` / `isTutorialComplete` in `src/game-logic.js`), `TRAINING` HUD card, `TRAINING TARGET` / `TRAINING DUMMY` props, deterministic safe flow, and `TRAINING COMPLETE` end screen with Start / Repeat / Home
- Responsive home-screen fix for short landscape phones (scrollable intro content area only, safe-area aware, decorative content collapses before controls, canvas/HUD never scroll)
- Pure match-rule unit tests (including the tutorial state machine and briefing content) and match-restart resource-disposal tests
- Full production build passes (`npm run build`) and 27 passing automated tests

## Intentional scope boundary

This is a **vertical slice**, not a finished commercial 8–12 player online release. It proves the core player fantasy in a reliable offline form first. A full online game should be built only after playtesting confirms that its trust-and-investigation loop is fun.

The next production milestones would be:

1. Replace local AI authority with a server-authoritative multiplayer simulation.
2. Add 8–12 real-player lobbies, matchmaking, reconnects, moderation, and anti-cheat validation.
3. Integrate an opt-in, moderated proximity-voice provider.
4. Build multiple maps, objective variants, animation, authored sound, onboarding, and real playtests.
5. Package the proven game as a desktop application and perform performance / accessibility testing on target hardware.

## Onboarding requirement for all future features

> **A feature is not complete if players cannot discover, understand, and use it without the developer explaining it personally.**

Every new player-facing feature must include onboarding in the same task. For each new feature, development must answer:

1. How does the player discover it?
2. How is it explained on computer?
3. How is it explained on phone?
4. Does it require a tutorial step, contextual hint, briefing update, icon, caption, or control label?
5. How does the player practice it safely?
6. How is successful use communicated?
7. How is failure explained?
8. Is it accessible in high-contrast and reduced-motion modes?
9. Are touch controls and PC controls both documented?
10. Are onboarding tests included?

Apply this rule automatically to all future feature work. If onboarding is missing or only one platform is covered, the feature is considered incomplete.

## Project layout

```text
index.html                         Game UI and menus (home screen with Tutorial button, tutorial card, completion overlay)
src/main.js                        Three.js world, interaction, AI, UI, audio, match loop, and interactive tutorial mode
src/game-logic.js                  Pure match rules and tutorial state machines shared by runtime and tests
src/three-utils.js                 Pure Three.js resource cleanup (prevents match-restart leaks)
src/style.css                      Horror UI, responsive layout, accessibility, home-screen safe-area fix, and tutorial styles
src/mobile.css                     Touch controls, safe-area handling, short-landscape home fix, and gameplay HUD adaptation
tests/game-logic.test.mjs          Rule-level regression tests (killer assignment, objectives, briefing)
tests/interactive-tutorial.test.mjs Interactive tutorial state-machine tests (12 steps, guards, determinism, normal-match isolation)
tests/three-utils.test.mjs         Match-restart resource-disposal regression tests
vite.config.js                     Local and Arena preview server configuration
```
