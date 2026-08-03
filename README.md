# MomentLab

Private build repository for **MomentLab**, an Agentic Cinema hackathon project that turns aggregated, consented audience-response data into evidence-backed edit hypotheses and approval-gated A/B tests.

This initial commit is the complete product/design handoff. It intentionally does not contain a speculative application scaffold: the implementation agent should first inspect the visual contract and follow the locked architecture prompt.

## Start here

1. Read [`MOMENTLAB-BUILD-PROMPT.md`](MOMENTLAB-BUILD-PROMPT.md).
2. Read [`momentlab-reference-pack/HANDOFF.md`](momentlab-reference-pack/HANDOFF.md).
3. Review the screen map in [`momentlab-reference-pack/README.md`](momentlab-reference-pack/README.md).
4. Open all desktop, mobile, and system references before implementing the app shell.
5. Build the product as live, accessible components—never as screenshot backgrounds.

## Repository contents

```text
MOMENTLAB-BUILD-PROMPT.md        Locked implementation and hackathon specification
GEMINI.md                        Antigravity/Gemini repository instructions
momentlab-reference-pack/
  index.html                     Searchable local review gallery
  HANDOFF.md                     Recommended implementation sequence
  GENERATION-PROMPTS.md          Image-generation provenance
  desktop/                       Eight desktop screen references
  mobile/                        Canonical composite and three mobile routes
  system/                        Design-system and complete state boards
design/reference-originals/      Original approved desktop/mobile mockups
```

## Review the visual pack locally

From the repository root:

```powershell
python -m http.server 4173 --bind 127.0.0.1 --directory momentlab-reference-pack
```

Then open `http://127.0.0.1:4173/`.

## Product invariants

- ClickHouse is the selected partner track and analytical system of record.
- Gemini provides the agentic reasoning layer; GCP hosts the application services.
- Observations, inferences, uncertainty, and forecasts remain visibly distinct.
- A server-confirmed authorized human must approve an experiment before launch.
- Demo forecasts/results are clearly labeled as simulated.
- Only aggregated, consented responses are used. No biometrics or emotion recognition.

## Ownership

This repository is private and no open-source license is granted. All rights are reserved by the repository owner unless a later written license states otherwise.
