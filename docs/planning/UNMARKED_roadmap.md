# 🗺️ UNMARKED — 3D Horror Game ROADMAP (v1.0)

> Your personal game development roadmap. Cost: **₹0**. Time: ~1–2 months of
> weekend sessions to ship a playable 3D game. Read this once, then follow Phase by Phase.

---

## 🎯 The Destination

**UNMARKED** — first-person 3D horror survival. You + 7 AI survivors in an abandoned
arctic facility. One of them is the killer. No markers, no voting, no reveal until the end.
Fix the generators, restore power, open the gate, escape — or become another body in the dark.

**The rule that makes it scary:** the killer looks and acts exactly like everyone else.

---

## 🧭 THE MAP AT A GLANCE

```
PHASE 0        PHASE 1         PHASE 2          PHASE 3            PHASE 4           PHASE 5
FOUNDATION ──► GREYBOX ─────► THE KILLER ────► SURVIVORS + ────► INVESTIGATION ──► POLISH + SHIP
(1 week)      (1 week)       (1-2 weeks)      OBJECTIVES         + DEFENSE         (1-2 weeks)
                                             (1-2 weeks)        (1-2 weeks)
```

Each phase ends with something **you can play**. Never a phase of "invisible work."

---

## PHASE 0 — FOUNDATION (Week 1) · Goal: pick your tools

| Task | What to do | Tools (all free) |
|---|---|---|
| ☐ Pick the name | UNMARKED (recommended) or ONE OF US / THE EIGHTH | — |
| ☐ Pick your builder | See the comparison table below — my recommendation: **this workspace's agent (me) or Rosebud AI free tier** | — |
| ☐ Start the master prompt | Open the new chat → paste `UNMARKED_master_prompt.md` → answer its ≤5 questions | Any AI chat |
| ☐ Bookmark free 3D assets | Kenney.nl, Quaternius.com, KayKit (itch.io), Poly Haven, AmbientCG, Mixamo | Browser |
| ☐ Learn the 3 magic words | "object", "position", "camera" — that's 80% of understanding a 3D scene | — |

**Definition of done:** you have a builder chosen, a chat running with the master prompt, and you know where to download free models.

---

## PHASE 1 — GREYBOX THE FACILITY (Week 2) · Goal: walk in the dark

**What gets built:** first-person camera, WASD + mouse look, mobile joystick, flashlight with battery, a simple facility of rooms + corridors (boxes as walls), darkness + fog, collision.

**You do:** walk around. Feel the darkness. Test flashlight.

**Definition of done:**
- ☐ You can walk through every room without falling through floors or walking through walls
- ☐ Darkness feels scary but you can always find your way back
- ☐ It runs smooth on your PC (and phone if possible)

---

## PHASE 2 — THE KILLER STALKS (Weeks 3–4) · Goal: be hunted

**What gets built:** the killer AI (9 rules from the master prompt — hidden identity, unobserved kills only, targets the most isolated, blackout events, heartbeat warning). Death screen with the reveal. "Survive 5 minutes" victory for now.

**You do:** get hunted. Test fairness — *can* you escape? Is it ever unfair?

**Definition of done:**
- ☐ The killer can find you, stalk you, kill you when you're alone in the dark
- ☐ It never kills in front of witnesses or in bright light (only blackouts change this)
- ☐ You can genuinely escape by running to people/lights — it's scary, not unfair
- ☐ Heartbeat + sound cues warn you before it strikes

---

## PHASE 3 — SURVIVORS + OBJECTIVES (Weeks 5–6) · Goal: the full match

**What gets built:** 7 AI survivor bots (roam / repair / follow / panic / flee), 3 randomized escape objectives from a pool (generators, fuses, keys, fuel, comms), power + gate sequence, three endings (you escape / you die / killer escapes in plain sight).

**You do:** play full matches. Watch bots. Trust them. Get betrayed.

**Definition of done:**
- ☐ Every match is different (objectives, item spots, killer behavior randomized)
- ☐ Bots feel alive: they help, they panic, they die, they say believable things
- ☐ All 3 endings trigger correctly — no soft-locks (tested: the 5 known bugs from the 2D prototype must not appear)

---

## PHASE 4 — INVESTIGATION + SELF-DEFENSE (Weeks 7–8) · Goal: trust becomes a skill

**What gets built:** clues (fresh vs planted blood, footprints, audio logs, notes), the killer plants fake evidence, weapons (pipe/bat/wrench/taser) at random spots, **innocent-kill penalty** (kill a good bot → you're eliminated), sabotage events, blackout pacing (~10–20% of match).

**You do:** become a detective. Read the logs. Study the stains. Decide who to trust. Defend yourself — carefully.

**Definition of done:**
- ☐ You can genuinely investigate and make wrong AND right calls
- ☐ Weapons feel risky, not free power
- ☐ Clues are sometimes lies — and you can't tell which

---

## PHASE 5 — POLISH + SHIP (Weeks 9–10) · Goal: strangers can play it

**What gets built:** menus, tutorials (first 5 minutes teach everything), subtitles, rebindable keys, colorblind-safe colors, difficulty options (calm / normal / nightmare), synthesized or CC0 sound, performance to 60 FPS, end-of-match reveal + stats.

**You do:** hand it to a friend. Watch them play WITHOUT you explaining. Fix what confuses them.

**Definition of done:**
- ☐ A stranger understands the goal in 5 minutes
- ☐ Zero crashes in a 1-hour session
- ☐ It's published: **itch.io** (free account, free hosting) — anyone in the world can play your game with a link

---

## PHASE 6 — THE DREAM (much later, optional)

Multiplayer with real humans. Honest truth: after you've shipped UNMARKED single-player,
you'll have the skills to have a *realistic* conversation about multiplayer (server costs,
proximity voice, anti-cheat). The master prompt hard-cuts this until the game ships. Respect that.

---

# 🤖 FREE AGENTS THAT CAN BUILD GAMES — RESEARCH RESULTS (2026)

## Tier 1 — General AI coding agents (they write the game code; you run it)

| Agent | Free? | How good | Best for you? |
|---|---|---|---|
| **This workspace agent (Arena.ai)** | ✅ Free | Builds + **runs + tests** the game, live preview in your browser, explains everything | ⭐ **Best for beginners** — nothing to install, you see the game working |
| **Claude Code** | ⚠️ Limited free daily | Strongest reasoning agent | Only if you're OK with terminal |
| **Gemini CLI / Antigravity** | ✅ Free tier | Good, free | Terminal setup needed |
| **GitHub Copilot** | ✅ Free (2K completions/mo) | Good autocomplete | Needs VS Code install |
| **Cursor (Hobby)** | ✅ Free tier | Full AI editor | Needs install, limited premium |
| **OpenHands** | ✅ Free (open source) | Fully autonomous | Needs Docker — too technical for now |
| **Cline / OpenCode / Aider** | ✅ Free (open source) | Good agents | Need setup — revisit later |

## Tier 2 — Game-specific AI makers (describe the game, it builds it for you)

| Tool | Free tier | Can it do 3D? | Honest limits |
|---|---|---|---|
| **Rosebud AI** | ✅ 20 prompts/week | 2D great, 3D OK (Three.js) | Browser-only, no Steam export, ~2,500-line code ceiling, weak on complex systems |
| **SEELE AI (SeeleAgent)** | ✅ Free to start | Yes, 2D+3D | Cloud workspace; check export/watermark limits |
| **Nilo** | ✅ Open beta | Yes, browser 3D | Roblox-focused, C++ physics, AI-native |
| **Summer Engine** | ✅ Widest free tier | Yes, 3D | Free tier commercial + Steam export — strong option |
| **Ludo.ai** | ✅ Free | Idea/concept only | Not a builder — use for ideas |
| **Godot + free AI chat** | ✅ 100% free | Yes, full 3D | It IS an engine — only if you relax the no-engine rule |

## Tier 3 — Free 3D assets (use these no matter what)

- **Kenney.nl** · **Quaternius.com** · **KayKit** — CC0 low-poly 3D packs (public domain, commercial OK, no credit needed)
- **Poly Haven** · **AmbientCG** — CC0 textures + HDRIs (lighting)
- **Mixamo** — free character animations (walking, running, idle — your survivors need these)
- **Poly Pizza** — Google's old 3D archive, mostly CC-BY
- **Sketchfab** — filter by "CC0" only
- **Freesound.org** · **Sonniss GDC packs** · **Kenney audio** — free sound effects
- **itch.io** — free game hosting when you ship

---

# ✅ MY RECOMMENDATION (one clear answer)

**You have two honest paths:**

1. **Path A (easiest, zero setup): stay in this workspace.** I can build the 3D UNMARKED here with Three.js — free, tested, live-previewed, explained step by step — exactly like the 2D prototype. Your "planning-only" rule is respected, but if you ever want, flip a switch and the studio builds it.

2. **Path B (as you planned): new AI chat + master prompt.** Works on any free AI (Claude, ChatGPT, Gemini). Caveats: free chats have message limits, they write code but you must run it yourself (host on GitHub Pages or itch.io), and they can't test/preview for you like this workspace does.

**If you pick Path B**, use **Rosebud AI's free tier** as the easiest entry (no setup, chat-driven) OR a free AI chat + the master prompt for full control.

---

# 📅 WEEKLY CHECKLIST (print this)

- [ ] **Week 1:** Name chosen · builder chosen · master prompt started · assets bookmarked
- [ ] **Week 2:** Greybox facility playable — walk in the dark
- [ ] **Week 3–4:** Killer stalking — survive 5 minutes
- [ ] **Week 5–6:** Full match — bots, objectives, 3 endings
- [ ] **Week 7–8:** Clues + weapons + innocent-kill penalty
- [ ] **Week 9–10:** Polish + publish on itch.io — link goes to friends

**Golden rule of this roadmap:** never work more than one phase ahead.
Ship each phase, play it, feel it, THEN build the next.
