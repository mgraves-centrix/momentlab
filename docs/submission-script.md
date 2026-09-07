# 3-Minute Hackathon Demonstration Video Script

**Project**: MomentLab  
**Track**: ClickHouse Track (Agentic Cinema: The Blockbuster Hackathon)  
**Target Video Length**: 2 mins 45 secs (Max 3 mins)  

---

## Video Script & Timestamp Timeline

| Timestamp | Visual Screen / Viewport | Narration Script & Key Feature Highlights | Judge Proof |
|---|---|---|---|
| **00:00 – 00:30** | `/projects` & `/screen/demo_token_123` | *"Welcome to MomentLab — an autonomous audience-experiment agent for filmmakers. Here in Northlight, we capture consented second-by-second audience reactions during scene screenings with ZERO biometric tracking."* | Privacy disclosure badge & consent flow. |
| **00:30 – 01:15** | `/finding` (Desktop 1568px & Mobile 390px) | *"Our response timeline reveals a severe -28.4% audience retention cliff at 00:37 during Scene 12. Notice how our mobile composition seamlessly adapts with a dedicated 4-item bottom nav."* | Synchronized response timeline & mobile route fidelity. |
| **01:15 – 02:00** | `.../evidence` & `.../hypothesis` | *"Here is the judge-visible chain: Our Google ADK agent calls the official ClickHouse/mcp-clickhouse server at runtime to investigate. Gemini analyzes the retention series and proposes Cut B: Move reveal 6s earlier."* | Live ClickHouse MCP telemetry trail & Gemini proposal card with `SIMULATED` label. |
| **02:00 – 02:30** | `.../test` (Approval Gate) | *"Before any A/B experiment launches, MomentLab enforces a server-confirmed human approval gate requiring authorized reviewer identity and explicit consent."* | Server-signed approval gate verification. |
| **02:30 – 02:45** | `/results` | *"Once Cut B screening completes, statistical evaluation confirms hypothesis supported with +11.1% measured engagement lift at 99% confidence (versus +18% forecast). Powered by Gemini on Vertex AI and ClickHouse."* | Statistical outcome report & GCP Cloud Run hosted URL. |
