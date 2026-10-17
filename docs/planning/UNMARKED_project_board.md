# 🎮 GOS v1.0 — PROJECT BOARD + TASK CARD 1 (GREYBOX)

## HOW THIS SYSTEM WORKS (read once)

**Roles:**
- 🧠 **Brain** = this document's author. Strategy, design, QA, direction.
- 👷 **Worker** = the AI chat that builds. You paste task cards into it.
- 📋 **Messenger** = you. You carry cards to the Worker and results back to the Brain.

**Session ritual (every time you open a new Worker chat):**
1. Paste the file `UNMARKED_master_prompt.md` (the studio contract — gives the Worker the full vision).
2. Then paste THIS task card (the specific job for this session).
3. Then write: **"Build this task. Follow the Definition of Done. Report back using the Report Format at the end."**

**One task per session. No skipping ahead. When the Worker reports back, bring the result to the Brain for QA before starting the next task.**

---

## THE PROJECT (reminder for the Worker)

**UNMARKED** — first-person 3D horror survival. You + 7 AI survivors trapped in an abandoned arctic research facility (Sector 9). One of the 8 is a hidden killer with no visual markers. No voting, no meetings, no role reveal. Fix objectives → restore power → open the gate → escape. The killer eliminates survivors in the dark and can escape itself. The reveal only comes at the end.

**Tech constraints (hard rules):**
- ✅ Three.js (a 3D library) from CDN — the Worker writes ALL game code by hand. No Unity/Unreal/Godot/GameMaker/Phaser editor.
- ✅ Single self-contained HTML file (or minimal file set) that runs by double-clicking / opening in a browser. No build step, no installs.
- ✅ Runs on desktop (keyboard+mouse) AND mobile (touch).
- ✅ Free assets only (CC0) or simple geometric greybox shapes.

---

# 📋 TASK CARD 1 — GREYBOX THE FACILITY

**Stage:** 0 of the master prompt (Greybox 3D facility).
**Goal of this task:** the player can WALK inside a dark 3D facility with a flashlight. That's it. Nothing else yet. No killer, no bots, no objectives.

## WHAT TO BUILD (requirements)

1. **First-person controller**
   - WASD or Arrow keys to move. Mouse to look around (pointer lock on click; ESC releases).
   - Mobile: left-half virtual joystick to move, right-half drag to look, on-screen flashlight button.
   - Walk speed ≈ 3.5 m/s. No jumping yet.

2. **Flashlight**
   - Toggle with F key (desktop) / button (mobile).
   - A spotlight attached to the camera, warm color, reasonable range (~18 m), soft cone.

3. **The Facility (greybox: boxes/planes, no fancy art)**
   - Cold, dark, blue-grey palette. Heavy fog. Dim ambient light so the flashlight matters.
   - Layout — 4 rooms around a cross-shaped corridor system:
     - **Dormitory** (top-left): large room, 6–8 bed-shaped boxes.
     - **Generator Room** (top-right): 3 generator-shaped boxes (inactive, unlit).
     - **Control Room** (bottom-left): 3 console-shaped boxes.
     - **Storage** (bottom-right): crate-shaped boxes in clusters.
     - Vertical corridor connects top rooms to bottom rooms; horizontal corridor connects left rooms to right rooms; they cross in the middle.
     - At the TOP end of the vertical corridor: a **locked gate** (a big closed door shape, unopenable, marked with a red light). Placeholder only.
   - All walls, floors, ceilings solid with working collision (player cannot walk through or fall through).

4. **Minimal HUD**
   - Text hint at start: movement keys, flashlight key.
   - Small flashlight battery icon (full for now — battery drain comes in a later task).

5. **Performance**
   - 60 FPS on a normal laptop. No real-time shadows if they cost performance (bake darkness into lighting instead).

## QUALITY GATES (self-verify before reporting done)

- [ ] I can walk through every room and both corridors without clipping through walls or falling through floors.
- [ ] The flashlight toggles, points where I look, and makes the dark feel survivable.
- [ ] The facility feels dark, cold, and slightly ominous even with nothing in it yet.
- [ ] Mouse look is smooth on desktop; joystick + look work on mobile (test by resizing the browser to phone width — touch should activate).
- [ ] No console errors. No jitter. 60 FPS.
- [ ] Single file (or clearly listed files) that runs by opening in a browser.

## REPORT FORMAT (reply to the messenger with EXACTLY this)

```
✅ TASK 1 COMPLETE
📦 FILES: [list files / or paste the full HTML]
▶️ HOW TO RUN: [one line]
🎮 WHAT WORKS: [3 bullets]
⚠️ WHAT'S ROUGH: [2 honest bullets]
📸 SCREENSHOTS: [paste 2-3 if you can]
```

## ⚠️ KNOWN-BUG PROTECTION (from the 2D prototype — do not reintroduce)

1. Never let a "counter event" gate critical progression (e.g., power-on) — use level checks on the actual state.
2. Keep entities from orbiting their destination — walk straight to it when adjacent.
3. No infinite loops or NaN positions — always clamp movement.
4. Blackout/event timers must reset after each event.

*(Only #3–4 apply to this task, but they're now permanent project law.)*

## AFTER THIS TASK (do NOT do this now — the Brain decides)

The Killer bot, survivor bots, objectives, clues, weapons, polish, and publishing are all future tasks. Build ONLY Task 1. When done, stop and report.
