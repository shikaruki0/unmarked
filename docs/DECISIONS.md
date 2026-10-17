# 🧾 UNMARKED — Decision Log

> One line per design or technical decision. **Locked** decisions need an explicit,
> written reason to reverse. **Provisional** decisions are expected to change after playtests.

## Locked

| Date | Decision | Why |
| --- | --- | --- |
| 2026-10-17 | **Three.js + hand-written JavaScript. No game engine.** | Creator's hard rule; keeps the browser build instant and install-free. |
| 2026-10-17 | **Browser + mobile, offline, no install, no account.** | The game must be playable by anyone with a link. |
| 2026-10-17 | **Hidden killer among eight; no meetings, votes, or role markers.** | This is the entire fantasy. Any UI that reveals a role breaks the game. |
| 2026-10-17 | **The player can be the killer.** | It already works, it is a strong twist, and it doubles replayability. |
| 2026-10-17 | **Witnesses and fixed light stop a strike; blackouts break both.** | The fairness contract with the player. |
| 2026-10-17 | **Evidence never reveals a role. Only the end-of-match reveal is certain.** | Keeps investigation honest and tense. |
| 2026-10-17 | **No multiplayer, servers, accounts, voice chat, or microtransactions until after launch.** | Protect scope; prove the single-player fantasy first. |
| 2026-10-17 | **All persistence is local-only. No telemetry leaves the device.** | Privacy by default; no backend cost. |
| 2026-10-17 | **"Unbeatable" means unmatched, not unwinnable.** | An unwinnable game is a broken game. Losses must be fair and explainable. |
| 2026-10-17 | **One milestone at a time; every milestone ends playable and tested.** | Prevents another five-month gap with no playable progress. |

## Provisional

| Date | Decision | Why | Revisit |
| --- | --- | --- | --- |
| 2026-10-17 | **Tone: psychological dread with rare, earned scares.** | Fits the hidden-identity fantasy better than jumpscare spam. | After the first 5 external playtests. |
| 2026-10-17 | **Art: stylised low-poly, cold blue-grey arctic brutalism.** | Fast to produce, reads in darkness, runs on phones. | At M10, after a screenshot test. |
| 2026-10-17 | **One map (blacksite) until it is excellent.** | A great small map beats five mediocre ones. | After M9 playtests. |
| 2026-10-17 | **Match length target: 7–12 minutes.** | Long enough for attachment, short enough for "one more". | After M2 pacing tests. |
| 2026-10-17 | **Seeded, deterministic matches with shareable case codes.** | Replayability and shareable stories with zero servers. | After M9. |

## How to add a decision

```md
| YYYY-MM-DD | **Decision in one sentence.** | Why it was made. | (Provisional only) when to revisit |
```
