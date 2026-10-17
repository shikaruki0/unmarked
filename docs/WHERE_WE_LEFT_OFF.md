# 📍 Where we left off — UNMARKED

> **Recovery note, 17 October 2026.** You came back after a break and weren't sure
> what was in this repo. This page is the short answer: what the game is, what is
> actually built, what is still missing, and the one thing to do next.

---

## The game in three lines

**UNMARKED — Blacksite Escape** is a first-person 3D social-horror game that runs in
the browser. You and seven AI survivors are trapped in a dark research facility, and
one of the eight is secretly the killer. Fix the power, take the keycard, open the
quarantine exit, and escape — but the person helping you may be the one hunting you.

**Tagline:** *Eight entered. One is lying.*

---

## The good news

This is **not just the planning documents**. The playable 3D game is already in the
repo, built with Three.js and hand-written JavaScript. I re-checked it today:

| Check | Result |
| --- | --- |
| `npm install` | ✅ clean install |
| `npm test` | ✅ **37 / 37 tests passing** |
| `npm run build` | ✅ production build succeeds |
| `npm run dev` | ✅ dev server starts on port 5173 |
| Git history | 6 merged pull requests, last one **11 Aug 2026** (“Fix mobile match and tutorial startup regression”) |

So the project was left at a **working, playable vertical slice** — not at Stage 0.

---

## How to run it

```bash
npm install
npm run dev
```

Open the printed address (normally `http://localhost:5173`), press **ENTER BLACKSITE**,
then click the game view to capture the mouse.

**Desktop:** `WASD` move · mouse look · `Shift` sprint · `E` interact / hold to repair ·
`F` use item or attack · `Q` flashlight · `H` briefing · `Esc` pause.
**Phone:** landscape only · left stick move (push to edge to sprint) · drag right side
to look · `USE` interact · `ACT` item · `LAMP` flashlight.

A guided **12-step TUTORIAL** is on the home screen and teaches every mechanic safely.

---

## What is already built (v0.1.0)

**World & controls**
- ✅ First-person movement, mouse look, sprint/stamina, collision, ceiling/floors
- ✅ Flashlight spotlight, pause menu, pointer lock, mobile touch controls
- ✅ One stylised blacksite map: lobby, three generator wings, Security office, generators, lockers, quarantine exit
- ✅ Fog, darkness, flickering lights, ambient audio synthesised in code (no external assets)

**Match loop**
- ✅ 8 characters: you + 7 named AI survivors (`MARA`, `ELIAS`, `JUNE`, `NOAH`, `IRIS`, `ROWAN`, `KAI`)
- ✅ Hidden killer assigned randomly at the start of every match
- ✅ Survivor route: repair 3 power nodes → Security unlocks → take keycard → open exit → escape
- ✅ Killer route (if you are the killer): pretend to repair, sabotage nodes, eliminate witnesses
- ✅ Win/loss screens: escape, killed, killer eliminates everyone, innocent killed, witness escaped
- ✅ Match report (time, role, alive count, bodies, clues logged)

**AI**
- ✅ Seven state-driven bots: roam, work generators, fetch keycard, escape, panic at corpses, follow routes
- ✅ Killer AI: pretends to help, sabotages repaired nodes, scores targets by isolation, attacks on proximity
- ✅ Bots react to bodies, chat through subtitles, and flee when the exit opens

**Investigation & defence**
- ✅ Evidence: blood, footprints, dropped badges, tampered equipment, corrupted security terminal
- ✅ Locker hiding, taser (nonlethal stun), metal pipe (lethal, but killing an innocent ends your run)
- ✅ Dynamic events: blackouts, fog surges, movement alarms, radio interference

**Onboarding & comfort**
- ✅ Home screen, first-run briefing letter on the lobby desk, pausable briefing overlay
- ✅ 12-step interactive tutorial with completion checklist
- ✅ Subtitles/captions for critical sound events
- ✅ High-contrast mode and reduced-motion mode
- ✅ Responsive layout for short landscape phones, safe-area aware

---

## Where it sits on your roadmap

| Phase | Status | Notes |
| --- | --- | --- |
| **0 — Foundation** | ✅ Done | Stack, name, tooling, planning docs all settled |
| **1 — Greybox facility** | ✅ Done | Walkable, dark, flashlight, collision, mobile controls |
| **2 — The killer stalks** | 🟡 Mostly | Killer exists, blackouts exist, deaths and reveal exist — but it can strike while watched and in bright light, and there is no heartbeat warning |
| **3 — Survivors + objectives** | 🟡 Mostly | 7 bots, objectives, escape, killer-win all work — but the objective route is fixed (no pool of random objectives), and the “killer escapes through the gate” ending is not implemented |
| **4 — Investigation + defence** | 🟡 Mostly | Clues, weapons and innocent-kill penalty are in — but the killer does not plant fake evidence, and there are no audio logs |
| **5 — Polish + ship** | 🟡 Partial | Menus, tutorial, high-contrast, reduced-motion, captions are in — but no difficulty modes, no key rebinding, no flashlight battery, no persistent stats, and it is not published yet |

---

## Honest gaps versus the master prompt

These are real, verified gaps — not guesses:

1. **Killer strikes while observed, and in bright light.** The design’s central fairness
   rule (“only kills when the victim is unobserved… not in bright light”) is missing.
2. **No heartbeat / proximity warning.** Players get no escalating cue before a strike.
3. **No “killer escapes through the gate” ending.** `isMatchOver` accepts a
   `killerEscaped` flag, but the runtime never triggers it, and its current semantics
   mark the survivors as the winner — the opposite of the design.
4. **No randomised objective pool.** Every match is the same route: 3 generators →
   keycard → exit. Only item/evidence placement varies.
5. **No flashlight battery.** The roadmap’s “light is safety, but light runs out”
   pressure does not exist yet.
6. **No fake evidence planted by the killer.** All current clues are consequences of
   real events.
7. **No audio logs.** Story is delivered through subtitles and the security terminal.
8. **No difficulty modes** (calm / normal / nightmare).
9. **No key rebinding.**
10. **No persistent stats** (escapes, deaths, correct/incorrect killer guesses).
11. **Not published** on itch.io or anywhere else.

---

## ▶️ My one recommendation for the next session

**Make the killer obey the UNMARKED rules.**

This is Phase 2’s unfinished Definition of Done, and it is the difference between
“a monster walks up and hits you” and the game on the box:

- The killer **only strikes when no other living survivor can see the victim**.
  If it is watched, it keeps pretending to help, then withdraws and waits.
- **Bright light protects you.** Standing in a working lamp is a safe zone — except
  during a blackout, when the killer is faster and light no longer protects you.
- **Re-target every ~20 seconds**, preferring the most isolated survivor, so no one
  can camp a lit room forever.
- **Heartbeat + audio cue** that rises as the killer gets closer.
- Pure rule functions in `src/game-logic.js` with unit tests for “watched”, “lit”,
  “blackout”, and “retarget” cases, so the 5 known prototype bugs cannot return.

That is one focused, testable feature, and it makes every later system (clues,
weapons, endings, difficulty) feel honest.

---

## Project map

```text
index.html                         All screens and HUD
src/main.js                        Three.js world, AI, interaction, audio, match loop, tutorial
src/game-logic.js                  Pure rules + tutorial state machine (unit tested)
src/three-utils.js                 GPU/resource cleanup between matches
src/style.css / src/mobile.css     Horror UI, responsive + touch layouts
tests/                             37 automated tests
docs/WHERE_WE_LEFT_OFF.md          This page
docs/planning/                     Your original three planning documents (archived)
```

## Planning documents preserved

The three files you uploaded are now stored in the repo so they cannot get lost again:

- [`docs/planning/UNMARKED_master_prompt.md`](planning/UNMARKED_master_prompt.md) — the studio brief
- [`docs/planning/UNMARKED_roadmap.md`](planning/UNMARKED_roadmap.md) — the 10-week roadmap
- [`docs/planning/UNMARKED_project_board.md`](planning/UNMARKED_project_board.md) — task card 1 (greybox)
