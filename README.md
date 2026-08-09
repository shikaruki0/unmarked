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

To make a production web bundle:

```bash
npm run build
```

To run the automated gameplay-rule tests:

```bash
npm test
```

## First-run onboarding

A brand-new player can start a match and understand the game without help:

1. Every match begins facing a **briefing desk** in the lobby with a glowing **INCIDENT BRIEFING** letter on it (pale paper, gentle amber glow, floating label above it).
2. Walk close and press `E` (prompt: `E — READ INCIDENT BRIEFING`) to open a full briefing page: what the game is about, the survivor objective, the killer objective, controls, defense, investigation, and a final warning.
3. The briefing **pauses the simulation** while open and releases the mouse. Close it with `E`, `Esc`, or the **CLOSE** button; mouse control and pointer lock are restored afterwards.
4. A short sequence of non-blocking subtitle hints teaches the objective, generator repair, defensive items, power restoration, and the escape route — each appears once, only when relevant.
5. **HOW TO PLAY** in the pause menu reopens the exact same briefing (press `H` at any time in a match as a shortcut). Your secret role is still shown only on your role card and spawn message — never in the letter.

## Controls

| Control | Action |
| --- | --- |
| `W` `A` `S` `D` | Move |
| Mouse | Look |
| `Shift` | Sprint |
| Hold `E` | Repair / sabotage a power node |
| `E` | Interact, read the briefing, investigate, hide, collect items, or use the exit |
| `F` | Strike as killer / use your held defense item |
| `Q` | Toggle flashlight |
| `H` | Open or close the briefing letter |
| `Esc` | Pause and release the mouse (or close the briefing first) |

The Accessibility & Controls panel includes high-contrast and reduced-motion settings (reduced motion disables the letter's pulse animation and keeps a steady glow). Critical sound events always also appear as captions.

## Current playable loop

1. A hidden killer is assigned randomly every match. You only know **your own** role.
2. As a survivor, restore three power nodes, retrieve the exit keycard from Security, open the north quarantine exit, and escape alive.
3. As the killer, blend in, sabotage working nodes, and eliminate every survivor before anyone escapes.
4. Seven AI characters move through the same objective loop. The killer AI first behaves helpfully, then stalks isolated survivors and may manipulate the facility.
5. Investigate blood, footprints, dropped badges, tampered equipment, and corrupted security feeds. Evidence is deliberately suggestive rather than a role reveal.
6. Find a taser, a lethal pipe, or a locker. The pipe can stop the killer temporarily—but killing an innocent survivor ends your match.
7. Power outages, fog surges, alarms, and radio interference reshape the tension during each incident.

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
- Pure match-rule unit tests (including the tutorial state machine and briefing content)

## Intentional scope boundary

This is a **vertical slice**, not a finished commercial 8–12 player online release. It proves the core player fantasy in a reliable offline form first. A full online game should be built only after playtesting confirms that its trust-and-investigation loop is fun.

The next production milestones would be:

1. Replace local AI authority with a server-authoritative multiplayer simulation.
2. Add 8–12 real-player lobbies, matchmaking, reconnects, moderation, and anti-cheat validation.
3. Integrate an opt-in, moderated proximity-voice provider.
4. Build multiple maps, objective variants, animation, authored sound, onboarding, and real playtests.
5. Package the proven game as a desktop application and perform performance / accessibility testing on target hardware.

## Project layout

```text
index.html              Game UI and menus
src/main.js             Three.js world, interaction, AI, UI, audio, and match loop
src/game-logic.js       Pure match rules shared by runtime and tests
src/three-utils.js      Pure Three.js resource cleanup (prevents match-restart leaks)
src/style.css           Horror UI, responsive layout, and accessibility styles
tests/game-logic.test.mjs   Rule-level regression tests
tests/three-utils.test.mjs  Match-restart resource-disposal regression tests
vite.config.js          Local and Arena preview server configuration
```
