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

To make a production web bundle:

```bash
npm run build
```

To run the automated gameplay-rule tests:

```bash
npm test
```

## Controls

| Control | Action |
| --- | --- |
| `W` `A` `S` `D` | Move |
| Mouse | Look |
| `Shift` | Sprint |
| Hold `E` | Repair / sabotage a power node |
| `E` | Interact, investigate, hide, collect items, or use the exit |
| `F` | Strike as killer / use your held defense item |
| `Q` | Toggle flashlight |
| `Esc` | Pause and release the mouse |

The Accessibility & Controls panel includes high-contrast and reduced-motion settings. Critical sound events always also appear as captions.

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
- Pure match-rule unit tests

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
src/style.css           Horror UI, responsive layout, and accessibility styles
tests/game-logic.test.mjs  Rule-level regression tests
vite.config.js          Local and Arena preview server configuration
```
