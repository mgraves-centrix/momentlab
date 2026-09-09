# MomentLab — 3:00 demo voiceover script

ElevenLabs voice: `oXuGG4PpSq1U1YAFxeEO`

Generate **one audio file per segment**, named `01.mp3` … `11.mp3`. Per-segment files let the
edit sync each shot independently — a single continuous track would force the screen action to
match the narration exactly on the first take.

**As cut:** each generated clip is trimmed to a 0.10s pad so its own trailing silence does not
stack on the gap, segments are separated by 1.6 seconds of silence, and a 5-second end card
crossfades in over the closing narration. Measured gaps in the render are 1.65-1.81s. Final
runtime is 2:48.16, inside the 3-minute limit. `momentlab-demo.srt` is timed to this
arrangement and was verified against the rendered audio -- all eleven segment onsets align
within 0.11s.

Write technical terms the way they should be *heard* in the narration and the way they should
be *read* in the captions: the voice track says "Aggregating Merge Tree" so the engine name is
not slurred, while `momentlab-demo.srt` spells it `AggregatingMergeTree`. Acronyms need the same
care: write an initialism that must be spelled out with periods, as "I.D.", never with spaces as
"I D" -- spaces make the voice pause between the letters. The caption spells it `ID`. Watch
homographs too: "rows" alone was read as the word meaning a quarrel, so the line places it
mid-phrase as "rows returned". SSML phoneme tags are not a workaround -- `eleven_multilingual_v2`
does not honor them reliably.

Every figure below is measured against production, not estimated.

---

## 01 — Cold open (~14s)
A test screening tells you the audience got bored. It does not tell you where.
MomentLab answers that question with a timestamp.

## 02 — The finding (~18s)
Thirty-five thousand and one respondents watched this scene. Across roughly two million
playback events, retention drops eighteen point one percent at thirty-seven seconds, inside a
window from thirty-three to forty-one seconds.

## 03 — Cohorts and speed (~17s)
Retention is aggregated per age cohort inside ClickHouse, in an Aggregating Merge Tree
materialized view. The curve you are seeing came back in about forty-five milliseconds. The
same question against raw events takes roughly three times that.

## 04 — Invoke the agent (~16s)
This is a Google ADK agent running Gemini two point five Pro on Vertex AI. When I re-run the
analysis, it queries ClickHouse through the official ClickHouse MCP server and forms a
hypothesis from what it finds.

## 05 — Agents online (~14s)
The indicator is not decorative. It reflects real service health and the number of agent runs
in the last fifteen minutes. When nothing has run, it says idle.

## 06 — The telemetry trail (~16s)
Every query the agent ran is recorded — up to fifty executions, with duration and row counts.
This is the agent's actual work, not a summary of it.

## 07 — Provenance (~15s)
Open any one of them and you get the query I.D., the execution time, the row count, and the
exact SQL. Three milliseconds, seven hundred and thirty-seven rows returned. You can verify the
number instead of trusting it.

## 08 — Honest labels (~18s)
Every figure carries its state. Predicted means a forecast. Measured means a result. Grounded
means real ClickHouse queries back it. Nothing is called verified unless the system actually
confirmed it.

## 09 — The human decides (~15s)
The agent proposes. A person approves. This edit is a testable proposal with a predicted effect
and a reviewer gate — not an instruction.

## 10 — The measured result (~18s)
The cut measured an eleven point one percent engagement lift, with a ninety-five percent
confidence interval from ten point nine to eleven point four percent, across seventeen
thousand five hundred respondents per arm. Only then is it labeled measured.

## 11 — Close (~19s)
No cameras. No facial recognition. Only consented in-player reactions, aggregated behind a
minimum cohort size of ten. The demo runs on a seeded dataset — the agent, the queries and the
measurement path are real. MomentLab turns "it dragged" into a frame range you can act on.

---

**Total target: 3:00.** Roughly 400 words. If ElevenLabs runs long, segments 03, 06 and 08 are
the safest to trim — each drops a sentence without losing a requirement.
