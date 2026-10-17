# 🗺️ UNMARKED — Master Roadmap v2
## From working prototype to a game nobody has seen before

> **Created:** 17 October 2026
> **Supersedes:** the original 10-week roadmap for execution. The original is preserved in
> [`docs/planning/UNMARKED_roadmap.md`](planning/UNMARKED_roadmap.md) for history.
> **Current build:** v0.1.0 — playable vertical slice, 37/37 tests passing, production build green.

---

## 1. What "unbeatable" means

**Unbeatable does not mean unwinnable.** A game players cannot beat is a broken game, not a scary one.
UNMARKED should be *unmatched*: a game people cannot stop describing to their friends.

The target:

> A browser and phone horror game where eight people are trapped, one is lying, and the only way
> to survive is to **read behaviour** — because there are no role markers, no meetings, no votes,
> and no trustworthy narrator. Every match writes a different story. The game remembers the last one.

Five sentences we want players to say:

1. *"The killer helped me repair a generator, then killed the person standing next to me."*
2. *"I knew something was wrong — they always avoided the east corridor. The reveal confirmed it."*
3. *"I accused the wrong person and she never trusted me again. The real killer comforted me."*
4. *"The gate opened and the killer just… walked out. I looked away for one second."*
5. *"I guessed wrong. I need one more match."*

If players say those things, we have won. Everything below exists to produce those sentences.

### Why this is different

| Game | Its loop | UNMARKED's difference |
| --- | --- | --- |
| Among Us | Meetings, voting, visible tasks | **No meetings, no votes, no role reveal.** Behaviour and evidence only. |
| Dead by Daylight | You always know who the killer is | **The killer is one of the eight.** You may be joking with them. |
| Alien Isolation | One scripted hunter | **Emergent social simulation.** The killer manipulates the group. |
| Single-player horror | Scripted scares | **A social system that generates stories**, seeded and shareable. |

Almost no single-player horror game runs a hidden-identity social simulation offline in a browser.
That is the gap. That is the moat.

---

## 2. The six signature systems (the moat)

These are not "features". They are the reasons UNMARKED exists. Everything else supports them.

### 1. The Living Suspects — a social simulation, not bot behaviour trees
Every survivor keeps a private memory of what they personally saw, who they were near, and who they
trust. They gossip. They misremember. They lie to protect themselves. Suspicion changes behaviour:
they avoid you, follow you, watch you, whisper to someone else, or confront you. The killer's real
weapon is not the knife — it is **the group's suspicion**.

**Example:** June saw you leave the generator room one second before the lights died. She tells Noah.
Noah stops repairing with you. The killer notices the split and follows Noah.

### 2. The Tell — every killer has one, and it is learnable
At the start of each match, the killer receives **one subtle, consistent behavioural tell** from a pool
of 20+ (always avoids one room, always volunteers last, always answers a question half a second late,
always checks the same door twice, always comforts the person who just lost a friend). The tell never
glows, never changes, and is never announced. After the match, the case file reveals it.

**Why it matters:** it turns the game into a skill. Players stop looking at a HUD and start
reading people. This is the single most "nobody has done this" mechanic in the design.

### 3. The Blacksite Remembers — the game learns you across matches
A small local profile remembers your last ten incidents: who you trusted, who died beside you, where
you hid, whether you abandoned anyone, whether you killed an innocent. Survivors reference it. The
killer adapts to it — it checks your favourite hiding places and targets the people you protect.

**Example:** "You left June behind last time. She remembers." No server, no account, fully offline.

### 4. The Case Board — investigation without meetings
A diegetic notebook (Tab) collects evidence, builds a timeline, and lets you pin clues to suspects.
Clues can be combined (blood + footprints + time = someone moved the body). The killer plants fake
evidence that fits your existing suspicions. Your board is private, but the questions you ask change
how bots behave toward you.

### 5. Incident Files & Daily Incidents — every match becomes a story
Every match uses a seed. The same seed always produces the same killer, spawns, objectives, and event
pattern. After the match, the game generates a **case file**: who the killer was, the timeline of
deaths, the evidence you missed, the killer's route replayed on a map, and the tell you failed to spot.
Before the reveal, the game asks: **"Who was it?"** Your guess is recorded.

A **Daily Incident** seed is shared with every player in the world (offline, locally verified), plus a
local streak and stats. Case codes can be shared as text.

### 6. The Director — adaptive horror that is always fair
A hidden Director tracks tension, time since the last scare, player health, how many people are
nearby, and how confident the player seems. It paces blackouts, fog, alarms, bot help, and killer
aggression. It never cheats: no off-screen cheap kill, no strike while observed, no permanent
darkness. The post-match report explains every major event, so players trust it.

---

## 3. Design laws (non-negotiable, forever)

1. **Nobody is marked.** No outlines, no role colours, no special animations that reveal the killer.
2. **The killer is more helpful than suspicious.** It repairs, shares, comforts, and only strikes when
   it can get away with it.
3. **Witnesses and light are safety.** Bright light stops a strike. Another living person watching
   stops a strike. Blackouts break both — that is their horror.
4. **Every death is explainable.** If a player cannot answer "why did I die?", the death is a bug.
5. **Clues never reveal roles.** Evidence is suggestive, incomplete, and sometimes planted. Only the
   end-of-match reveal is certain.
6. **No meetings, no votes, no global chat.** All social information travels through proximity,
   behaviour, and conversation.
7. **The player's own choices are the difficulty.** Randomness sets the stage; decisions decide it.
8. **One milestone at a time, playable at the end of every milestone.** No invisible work phases.
9. **The five known prototype bugs stay dead** (see Appendix B).
10. **Desktop and phone are equal citizens.** Every feature ships with touch and keyboard paths.
11. **No online multiplayer until the single-player game has been shipped and playtested.**
12. **If it needs a paragraph to explain, it is not finished.** Teach by doing.

---

## 4. The roadmap at a glance

```text
PHASE A — MAKE IT FAIR            PHASE B — MAKE IT ALIVE
M0 Baseline & rules               M4 Living Suspects I
M1 The Stalker's Rules            M5 Living Suspects II + The Tell
M2 The Director                   M6 The Blacksite Remembers
M3 Fairness & Comfort Pack
                │                                   │
                ▼                                   ▼
PHASE C — MAKE IT A DETECTIVE GAME     PHASE D — MAKE IT UNFORGETTABLE
M7 The Case Board                      M10 Art & Audio Pass
M8 Objective Engine + Third Ending     M11 Onboarding, Modes & Access 2.0
M9 Incident Files + The Final Guess    M12 Ship on itch.io
```

| # | Milestone | Player-facing outcome | Sessions | Phase |
| --- | --- | --- | --- | --- |
| M0 | Baseline & Rules of the Build | A stable reference build and a bug list | 1 | A |
| M1 | The Stalker's Rules | Deaths feel earned; camping has counters | 2 | A |
| M2 | The Director | Tension rises and falls; no unfair streaks | 2 | A |
| M3 | Fairness & Comfort Pack | Difficulty, rebinding, battery, settings saved | 2 | A |
| M4 | Living Suspects I | Bots observe, remember, gossip, avoid | 4 | B |
| M5 | Living Suspects II + The Tell | Lies, questions, framing, a learnable tell | 4 | B |
| M6 | The Blacksite Remembers | Survivors and killer remember past matches | 2 | B |
| M7 | The Case Board | Real deduction: pin clues, catch contradictions | 4 | C |
| M8 | Objective Engine + Third Ending | Random routes; killer escapes in plain sight | 4 | C |
| M9 | Incident Files + Final Guess | Seeded cases, guess screen, killer route replay | 3 | C |
| M10 | Art & Audio Pass | A coherent, cold, readable horror identity | 5 | D |
| M11 | Onboarding, Modes & Access 2.0 | A stranger can play without help | 3 | D |
| M12 | Ship | Public itch.io build, 10 external playtests | 4 | D |

**Total: ~40 sessions.** One session = one focused 2–4 hour sitting.
At **2 sessions per week: ~20 weeks (about 5 months)**. At 1 per week: ~9 months.
That is the honest cost of "unbeatable". The current prototype already removed the hardest 30%.

> **Fast path (recommended first):** M0 → M1 → M2 → M3 takes **7 sessions (~4 weekends)** and turns
> the current build into something you can confidently put in front of a stranger.

---

## 5. The milestones in detail

### M0 — Baseline & Rules of the Build
**Sessions:** 1 · **Depends on:** nothing

**Goal:** create a trustworthy reference point so we never lose the project again.

**Build**
- Tag the current build as `v0.1-prototype` and record three full matches (video or screenshots).
- Write a prioritised bug list (max 20 items) with reproduction steps.
- Set the performance budget: 60 FPS desktop, 30 FPS mobile, < 600 draw calls, < 15 MB initial download.
- Create the decision log (`docs/DECISIONS.md`): every design choice, one line each, with date.
- Define the playtest note template (what confused them, what they feared, what they remembered).

**Definition of Done**
- [ ] `v0.1-prototype` tag exists and builds from a clean checkout.
- [ ] Bug list exists with severity and reproduction steps.
- [ ] Baseline videos/screenshots stored in `docs/media/` (or linked).
- [ ] Decision log started.
- [ ] Existing 37 tests still pass.

**Risk:** turning this into a week of documentation. Timebox to one session.

---

### M1 — The Stalker's Rules
**Sessions:** 2 · **Depends on:** M0

**Goal:** make the killer obey the UNMARKED fantasy. This is the most important gameplay fix in the project.

**Build**
- **Observation check:** the killer can strike only when no other living survivor has line of sight
  to the victim. If watched, it keeps pretending to help, then withdraws and waits.
- **Light check:** standing inside a working lamp's safe radius prevents a strike. Flashlight does
  *not* count as safe light — only fixed facility lights.
- **Blackout exception:** during a blackout, light no longer protects, and the killer gains speed.
- **Retarget every ~20 s**, preferring the most isolated survivor, so no one can camp forever.
- **Heartbeat warning:** a generated heartbeat that intensifies with proximity, plus a caption for
  players who cannot hear it.
- **Two-hit health with an escape window:** first strike damages and staggers; the player gets a short
  window to break line of sight before a second strike can kill.
- **Spawn grace:** no killer aggression for the first 15 seconds.
- **Fairness log (dev only):** every strike records why it was legal (witness count, light state).

**Definition of Done**
- [ ] A staged test with a witness in the room never produces a kill.
- [ ] A player standing in a lit room is never struck (outside blackouts).
- [ ] Camping in a lit room for 2 minutes makes the killer retarget, not idle.
- [ ] Heartbeat starts at a fair distance and is captioned.
- [ ] Player can always explain the death in a post-match review.
- [ ] Pure rule functions live in `src/game-logic.js` with tests.

**Tests to add**
- `canKillerStrike` — watched, unwatched, lit, dark, blackout.
- Retarget selection — most isolated wins, ties broken deterministically.
- No strike during spawn grace.
- Blackout state always expires.

**Risk:** line-of-sight checks are expensive or buggy. Mitigation: distance + angle + a single raycast
against walls, capped to survivors within 12 m.

---

### M2 — The Director
**Sessions:** 2 · **Depends on:** M1

**Goal:** horror that breathes — tension, release, tension — without ever feeling unfair.

**Build**
- **Tension score** from proximity, darkness, health, isolation, time since last scare.
- **Event budget:** minimum 20 s between events, no two blackouts in a row, blackout share 10–20% of
  match time, always a guaranteed calm window after a death.
- **Mercy rules:** if the player is at 1 HP and alone, the Director holds the killer for a few seconds
  and gives a directional cue (a sound, a flicker) instead of a silent kill.
- **Escalation:** events become more frequent in the final third of the match, but never during the
  first 45 seconds.
- **Debug overlay (dev only):** current tension, next event, why it was chosen.
- **Post-match director report:** "Blackout at 03:12 because you had been safe for 68 seconds."

**Definition of Done**
- [ ] A 1-hour session has no permanent darkness and no event spam.
- [ ] Blackout time stays between 10% and 20% of a match.
- [ ] Every death has an explainable preceding cue.
- [ ] A 1,000-match headless simulation passes all invariants.
- [ ] The player can read the director report after a match.

**Risk:** over-tuning. Keep the Director's knobs in one config object so it can be tuned in minutes.

---

### M3 — Fairness & Comfort Pack
**Sessions:** 2 · **Depends on:** M1, M2

**Goal:** let every kind of player play — and let them adjust without breaking fairness.

**Build**
- **Difficulty modes:** Calm / Standard / Nightmare. They change warning time, killer patience, event
  rate, and repair speed — never the core rules (witnesses and light always matter).
- **Key rebinding** for move, sprint, interact, item, flashlight, briefing, pause, case board.
  Conflict detection, reset to defaults, persistence.
- **Flashlight battery:** drains slowly, warned at 25%, replaced by batteries found in the world.
  Battery never creates a soft-lock: there is always a spare battery somewhere reachable.
- **Settings persistence:** all settings saved locally and restored on load.
- **Accessibility:** colour-blind-safe palette check, photosensitivity warning, screen-shake slider,
  subtitle size/background, hold-vs-toggle for interactions, left-handed touch layout.
- **Mobile parity:** every setting reachable on a phone in landscape.

**Definition of Done**
- [ ] Each difficulty produces a measurably different but fair match.
- [ ] Every action can be rebound; conflicts are explained; defaults restore.
- [ ] Battery can run out, but the player can always recover.
- [ ] Settings survive a reload.
- [ ] A colour-blind player can distinguish every critical cue by shape/text, not colour alone.

**Tests to add**
- Binding conflict model, reset, persistence (pure functions).
- Battery drain/recovery simulation — no soft-lock.
- Difficulty modifiers change only the allowed knobs.

---

### M4 — Living Suspects I: Observation & Suspicion
**Sessions:** 4 · **Depends on:** M1

**Goal:** the seven survivors stop being props and start being people with opinions.

**Build**
- **Observation events** each bot can witness: repair, sabotage, running, holding a weapon, standing
  over a body, entering a room, staring too long, abandoning someone.
- **Private memory** per bot: event, subject, time, confidence, decay. Bots never share a global truth.
- **Trust matrix:** each bot has an opinion of every other character, updated by observations and gossip.
- **Behaviours:** avoid, follow, watch, whisper to a neighbour, confront, refuse to work nearby.
- **Gossip:** information passes only when two bots are close, and it distorts (confidence drops,
  details may be wrong). The player can overhear it if close enough.
- **Debug social graph** (dev only): see who believes what, to tune without guessing.

**Definition of Done**
- [ ] Ten matches produce visibly different social dynamics.
- [ ] A bot that saw you near a body behaves differently toward you.
- [ ] No bot ever knows something it did not see or hear.
- [ ] Gossip happens only in proximity and is captioned when audible.
- [ ] Suspicion decays so an early mistake is not a life sentence.
- [ ] Tests: observation, memory decay, gossip transfer, no global leaks.

**Risk:** emergent chaos. Cap active observations per bot (e.g., 12) and log every behaviour change.

---

### M5 — Living Suspects II: Lies, Questions & The Tell
**Sessions:** 4 · **Depends on:** M4

**Goal:** conversation becomes the real weapon, and every killer has a tell worth learning.

**Build**
- **Contextual question wheel** (no free text): "Where were you?", "Did you see anyone?",
  "Stay with me", "I don't trust you", "Who was with you?".
- **Answer model:** truth, lie, half-truth, deflection — driven by role, fear, loyalty, and what the
  bot actually knows. Innocents lie too (self-preservation), so a lie is never proof.
- **Alibis** stored and cross-checked: contradictions can be caught later, in conversation or on the
  case board.
- **Killer social play:** grooms the player, gives real help, frames others, plants evidence near
  someone you already suspect, and mirrors your own suspicion to gain trust.
- **The Tell system:** 20+ behavioural tells, one per killer per match, consistent and subtle.
  Examples: never enters Security; always volunteers to go last; pauses before answering; always
  checks the same door; always comforts the most recently bereaved.
- **Tell difficulty scaling:** clearer on Calm, subtler on Nightmare.
- **Post-match reveal** shows the tell, so players learn.

**Definition of Done**
- [ ] At least 4 truthful and 4 deceptive answer archetypes exist.
- [ ] Every match contains gossip about at least two characters.
- [ ] No dialogue line ever reveals a role directly.
- [ ] Each tell is observable at least twice per match, but never obvious on first sight.
- [ ] The reveal names the tell and shows the moments it happened.
- [ ] Tests: answer selection, alibi consistency, tell assignment and observability.

**Risk:** dialogue volume and repetition. Budget 200 hand-written lines maximum, with variables;
test for repeats within a match.

---

### M6 — The Blacksite Remembers
**Sessions:** 2 · **Depends on:** M5

**Goal:** make the facility feel like it has a memory, and the player feel known.

**Build**
- **Local profile** (versioned JSON): last 10 matches — deaths, escapes, betrayals, innocent kills,
  who the player followed, where the player hid, which suspects the player trusted.
- **Echoes:** survivors reference one high-confidence memory at the start of a match ("You left June
  behind"). The killer adapts: checks your favourite hiding spot, targets your most-protected survivor.
- **Privacy:** a "Forget me" button wipes the profile; nothing leaves the device.
- **Versioned schema** with migration and corruption fallback.

**Definition of Done**
- [ ] A five-match arc produces at least three recognisable callbacks.
- [ ] A wipe removes all traces immediately.
- [ ] Corrupt or old profile data never crashes a match.
- [ ] Memory caps and expiry prevent stale or creepy over-fitting.
- [ ] Tests: schema migration, memory selection, wipe.

**Risk:** flaky memory. Only store high-confidence events; never fabricate.

---

### M7 — The Case Board
**Sessions:** 4 · **Depends on:** M5

**Goal:** turn "press E on blood" into actual detective work.

**Build**
- **Diegetic notebook** (Tab / touch button) with evidence cards, a timeline, and a suspect board.
- **Auto-collection:** inspected clues are pinned automatically; the player can place them on the
  timeline or against a suspect.
- **Combinations:** blood + footprints + time => "the body was moved"; tool marks + power outage =>
  "sabotage, not a fault". Wrong combinations produce uncertainty, not false certainty.
- **Killer counter-play:** after the player marks a suspect, the killer may plant evidence that fits
  the theory (adaptive framing), but never more than once per match.
- **Audio logs:** 4–6 per match, unreliable narrators, drip-fed story; transcript always available.
- **Questions from the board:** ask a suspect about a pinned clue; their answer may contradict an alibi.
- **Accusation:** a private final accusation is possible at any time; accusing wrong damages trust
  globally and may push the accused to flee. Accusing right gives a temporary safety window or a trap.

**Definition of Done**
- [ ] A player can solve a match using only the board and conversations.
- [ ] Evidence never states a role.
- [ ] Fake evidence is indistinguishable in the UI from real evidence.
- [ ] The board is fully usable on a phone in landscape.
- [ ] Contradictions are discoverable but not highlighted as "the answer".
- [ ] Tests: clue generation, combination rules, board state, accusation consequences.

**Risk:** UI complexity. Build a paper prototype first, then implement the simplest two-pane board.

---

### M8 — Objective Engine + The Third Ending
**Sessions:** 4 · **Depends on:** M1, M2, M4

**Goal:** no two matches follow the same route, and the worst ending becomes possible.

**Build**
- **Seeded RNG** for every match: killer, spawns, objective pool, item spots, event pattern.
- **Objective pool:** repair generators, restore breaker fuses, find keys, collect fuel, activate the
  comms array. Pick 3 per match with valid dependencies. Power is a **level check**, never a counter.
- **Gate sequence:** power → security unlock → keycard/final objective → gate. Each route has a
  different physical flow through the map.
- **Killer escape ending:** after 2+ kills, if the gate is open and no one is watching, the killer
  walks out. Result: **"ESCAPED IN PLAIN SIGHT"** — a loss for the survivors. If the player sees it,
  they can trigger the alarm to lock the gate, at the cost of revealing their own position.
- **Ending matrix:** escaped, killed, killer eliminates all, killer escapes, innocent killed,
  witness escaped. Every ending has a unique screen and case-file entry.
- **Soft-lock simulation:** 1,000 seeded matches must all reach an ending.

**Definition of Done**
- [ ] All objective types appear across 50 seeds.
- [ ] No seed can soft-lock (validated by simulation).
- [ ] Killer escape requires 2+ kills, an open gate, and no witness.
- [ ] Watching the gate can prevent the escape.
- [ ] Every ending is reachable and has a distinct result screen.
- [ ] Tests: 1,000-run simulation, dependency validity, ending distribution.

**Risk:** scope explosion. Ship with three objective types first; add the rest behind the same interface.

---

### M9 — Incident Files + The Final Guess
**Sessions:** 3 · **Depends on:** M8

**Goal:** every match becomes a shareable story, and every player gets one more reason to replay.

**Build**
- **Seed & case code:** short human-readable code (e.g., `E17-4F2A`) that reproduces the exact match.
- **The Final Guess:** when the match ends (win or lose), before the reveal, ask **"Who was it?"**
  with the eight names. Record correct/incorrect. This is the meta-loop's emotional peak.
- **Case file:** killer identity, the tell, timeline of deaths, evidence found vs missed, the player's
  accusation history, a 2D route replay of the killer, and a 30-second killer POV recap (optional 3D).
- **Share text:** a spoiler-free summary plus a spoiler section, copyable offline.
- **Daily Incident:** one deterministic seed per date, local streak, best time, guess accuracy.
- **Career stats:** escapes, deaths, correct guesses, tells identified, innocent kills. Stored locally.

**Definition of Done**
- [ ] The same case code produces identical killer/spawns/objectives on any device.
- [ ] The guess screen appears before any reveal and cannot be skipped by accident.
- [ ] Case files are generated offline with no network.
- [ ] Daily seed changes at local midnight and cannot be rerolled into a different match.
- [ ] Stats survive reloads and can be wiped.
- [ ] Tests: determinism, guess tracking, daily rollover, stats persistence.

**Risk:** replay storage size. Cap at 60 seconds of samples at 5 Hz (a few KB per match).

---

### M10 — Art & Audio Pass
**Sessions:** 5 · **Depends on:** M4–M9 for final content

**Goal:** a coherent identity you can recognise from one screenshot.

**Build**
- **Art direction:** stylised low-poly, cold blue-grey arctic brutalism, warm flashlight contrast.
  One silhouette language per survivor, with **no role tells** in the art.
- **Map kit:** dormitory, generator hall, control room, storage, connecting corridors — rebuilt from
  the current blacksite geometry with modular walls, props, signage, and wear.
- **Animation:** walk, run, repair, panic, hide, die, and the killer's "helping" idle. Use free
  animation libraries where possible; hand-key only what is essential.
- **Lighting:** fixed safe lamps, flicker, blackout falloff, fog layers, emissive signage.
- **Audio:** layered ambience, directional footsteps, breathing, heartbeat, radio, stingers, dynamic
  music. Every critical sound is captioned. Volume sliders for master/music/SFX.
- **Before/after capture** for the devlog.

**Definition of Done**
- [ ] A screenshot is recognisably UNMARKED with the logo covered.
- [ ] 60 FPS desktop / 30 FPS mobile maintained after the pass.
- [ ] Every sound has a caption and a volume control.
- [ ] No copyrighted asset is used; licences recorded in `docs/ASSETS.md`.
- [ ] Survivors are distinguishable without colour alone.

**Risk:** the art rabbit hole. Timebox to five sessions and use Kenney / Quaternius / KayKit assets.

---

### M11 — Onboarding, Modes & Accessibility 2.0
**Sessions:** 3 · **Depends on:** M4–M10

**Goal:** a stranger understands the fantasy in five minutes and can play on any device.

**Build**
- **Rebuilt tutorial (5 minutes):** move → repair → witness a staged "death" → inspect evidence →
  ask a question → use the board → final guess. It teaches *suspicion*, not just controls.
- **Modes:** Story (Calm), Standard, Nightmare, Daily Incident, Cinema (no HUD), Custom seed.
- **Onboarding rule:** every new system ships with a discoverable hint, a PC instruction, a phone
  instruction, a safe practice moment, and a failure explanation.
- **Accessibility 2.0:** rebinding, colour palettes, text size, subtitle backgrounds, photosensitivity,
  shake slider, hold/toggle, left-handed layout, one-handed touch option.
- **First-five-minutes test:** five strangers play silently; fix everything that needs explaining.

**Definition of Done**
- [ ] Five strangers complete a first match without verbal help.
- [ ] Every mode is selectable and clearly described.
- [ ] The tutorial can be skipped and replayed.
- [ ] All accessibility settings work on phone and desktop.
- [ ] No feature is discoverable only through this document.

**Risk:** tutorial bloat. Teach the core loop only; advanced systems get contextual hints.

---

### M12 — Ship
**Sessions:** 4 · **Depends on:** all

**Goal:** a public build anyone can play in one click, and evidence that strangers finish it.

**Build**
- **Performance:** instancing, texture budgets, draw-call reduction, adaptive quality, shadow fallback,
  memory-leak test across ten restarts.
- **Compatibility:** Chrome, Safari, Firefox; iOS and Android; pointer-lock fallback; audio unlock.
- **PWA:** installable, offline, icon, manifest; a single-file build as a fallback.
- **itch.io page:** title, 6 screenshots, animated GIF, 60-second trailer, description, controls,
  accessibility notes, devlog, free build with optional donation.
- **Playtest 10 strangers.** Record where they get stuck. Fix the top ten issues.
- **Launch checklist:** crash-free one-hour session, 37+ tests green, build reproducible, backup of
  the source, a "how to play" page, a feedback form.

**Definition of Done**
- [ ] Public URL works on a mid-range phone and a normal laptop.
- [ ] 10 external playtests completed; notes and fixes documented.
- [ ] 60 FPS desktop / 30 FPS mobile targets met or documented.
- [ ] Zero crashes in a one-hour session.
- [ ] A stranger can explain the game back to you in one sentence.

**Risk:** launch perfectionism. Ship when the quality gates pass, then improve in public.

---

## 6. Schedule and effort

**Assumption:** one session = one focused 2–4 hour sitting. Two sessions per week.

| Phase | Milestones | Sessions | Calendar |
| --- | --- | --- | --- |
| A — Fair | M0–M3 | 7 | ~4 weeks |
| B — Alive | M4–M6 | 10 | ~5 weeks |
| C — Detective | M7–M9 | 11 | ~6 weeks |
| D — Unforgettable | M10–M12 | 12 | ~6 weeks |
| **Total** | **13** | **~40** | **~20 weeks** |

### Three honest paths

- **Weekend path (recommended):** two sessions per week → ship in about five months.
- **Slow path:** one session per week → about nine months. Still fine. Momentum beats speed.
- **Sprint path:** four sessions per week → about ten weeks, but only if you can protect the time.

### What to do if you only have two weeks
Build M0 → M1 → M3 (skip M2 temporarily). That alone fixes fairness, adds difficulty and rebinding,
and makes the current prototype presentable. Then stop and playtest before continuing.

### The "minimum unbeatable build"
If the goal is to prove the fantasy as fast as possible: **M0 → M1 → M4 → M5 → M9** (14 sessions,
~7 weeks). That gives you the Living Suspects, the Tell, and the Final Guess — the three things no
other build has. The Case Board and objective engine can follow.

---

## 7. Playtest protocol and success metrics

**How to run a playtest (30 minutes)**
1. Say only: "Play this. I won't help unless you're stuck for two minutes."
2. Watch silently. Note the first confusion, the first scare, the first suspicion.
3. At the end ask: "What was the goal?", "Who did you suspect?", "What will you tell a friend?"
4. Record the answers in `docs/PLAYTESTS.md` with the build version.

**Quality gates**

| Metric | Target |
| --- | --- |
| Understands the goal in 5 minutes | 80% of strangers |
| Can name a suspect and a reason | 70% |
| Reports at least one "I trusted the wrong person" story | 60% |
| Wants another match immediately | 70% |
| Says the death felt unfair | under 10% |
| Crash-free session | 60 minutes |
| Frame rate | 60 desktop / 30 mobile |
| Match length | 7–12 minutes |
| Blackout share of match | 10–20% |
| Witnessed kills | 0 |
| Soft-locks | 0 |

**Kill criteria:** if fewer than 60% of playtesters understand the goal after five minutes, stop
building new systems and fix onboarding first. If fewer than 50% want another match, the problem is
the core loop, not the content.

---

## 8. Anti-goals — what we will NOT build

- ❌ Online multiplayer, lobbies, matchmaking, accounts, servers (until after launch and proof of fun)
- ❌ Proximity voice chat or any microphone access
- ❌ Microtransactions, battle passes, ads, crypto, NFTs
- ❌ Runtime generative-AI dialogue (offline game, no server, no unpredictable content)
- ❌ Jumpscare spam, gore for shock value, or harm to children/animals
- ❌ An unwinnable game. Difficulty is fair; losses are explainable
- ❌ A second map before the first map is excellent
- ❌ A game engine (Unity/Unreal/Godot) — Three.js and hand-written code only
- ❌ Feature creep disguised as "polish" before M3 is finished

---

## 9. What happens next

**The first build task is M1 — The Stalker's Rules.** M0 is a one-session bookkeeping step; we can do
it in the same session as M1 if you prefer.

Three defaults I am assuming unless you say otherwise:

1. **Tone:** psychological dread with rare, earned scares — not jumpscare spam.
2. **Art:** stylised low-poly (fast to make, reads well in darkness, runs on phones).
3. **You can still be the killer:** the current game assigns the killer among all eight, including
   you. It is a strong twist and it stays.

If those are right, say "start M1" and I will build the fairness rules, the heartbeat, and the tests.

---

## 10. Glossary (plain words)

- **Milestone:** a group of work that ends with something playable and testable.
- **Definition of Done:** the checklist that proves a milestone is actually finished.
- **Seed:** a number that decides all random choices, so the same seed always creates the same match.
- **Deterministic:** same input, same result, every time.
- **State machine:** a character's current mode (roam, repair, panic, hunt) and the rules for switching.
- **Line of sight:** whether a straight line between two characters is blocked by a wall.
- **Tension score:** a number the Director uses to decide when the player needs pressure or relief.
- **Headless test:** running the game rules in Node without graphics, thousands of times, to catch bugs.
- **Telemetry:** measurements recorded locally to tune the game; never sent anywhere.
- **PWA:** a website that can be installed like an app and works offline.

---

## Appendix A — Feature → promise map

| Promise | Systems that deliver it | Milestones |
| --- | --- | --- |
| "The killer is one of us" | Hidden assignment, Living Suspects, The Tell | M1, M4, M5 |
| "I can read people" | Observation, tells, questions, case board | M4, M5, M7 |
| "The game remembers me" | Blacksite Remembers | M6 |
| "Every match is a story" | Seeded objectives, endings, incident files | M8, M9 |
| "It is scary but fair" | Stalker's Rules, Director, difficulty | M1, M2, M3 |
| "I can play anywhere" | Mobile parity, PWA, accessibility | M3, M11, M12 |
| "I need one more match" | Final Guess, daily incident, stats | M9 |

## Appendix B — The five permanent bug laws

1. **Power-on is a level check,** never a counter event. Always test `all generators repaired`.
2. **The killer must retarget** if its victim camps in safety (every ~20 seconds).
3. **Killer escape requires 2+ kills** and no witness. No clean getaways.
4. **Every blackout timer resets.** No permanent darkness, ever.
5. **Bots walk straight to adjacent destinations.** No orbiting, no NaN positions, no infinite loops.

Any feature that touches these systems must include a regression test.

## Appendix C — Free asset sources

- **Kenney.nl**, **Quaternius.com**, **KayKit** — CC0 low-poly models and props
- **Poly Haven**, **AmbientCG** — CC0 textures and HDRIs
- **Mixamo** — free character animations
- **Freesound.org**, **Sonniss GDC packs**, **Kenney audio** — sound effects
- **itch.io** — free hosting when we ship

Record every asset and its licence in `docs/ASSETS.md` as it is added.
