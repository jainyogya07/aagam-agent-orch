# AAGAM

**Give us a problem, not a workflow.**

You write a question in ordinary English. AAGAM decides who should work, how much they may spend, whether the result is good enough, and whether the team itself should change. It does not pretend a spinner is thinking. It does not clamp quality to 99%. It does not invent an [Agent Orchestrator](https://github.com) session that is not actually running.

Live product: **[https://aagam-ten.vercel.app](https://aagam-ten.vercel.app)**  
Source: **[https://github.com/jainyogya07/aagam-agent-orch](https://github.com/jainyogya07/aagam-agent-orch)**

---

## What you get

Paste a problem — a market, a wedge, a “should we even build this?”. AAGAM runs a short loop:

**Understand → Architect → Allocate → Execute → Evaluate → Evolve**

Then it shows a decision memo you can actually keep: bottom line, the job that is still unserved, a unit-economics table that can fail, named players when they are real, a 90-day proof, and follow-up chat on the **same** run. Export a PDF if you want to send it.

Quality is scored from the goal, fairly, on eight dimensions. V2 only exists if dropping low-value work was expected to pay. The header never lies about AO: live on `localhost:3001`, or honestly offline.

---

## Who does the work

| Partner | Role | Link |
| --- | --- | --- |
| **OpenAI** | Research + structured memo (`gpt-5-nano`, Responses API, tables). | [platform.openai.com](https://platform.openai.com) |
| **Agent Orchestrator (AO)** | Isolated coding worktrees on `localhost:3001`. We never fake a session. | Status in the header of the live app |
| **Neatlogs** | Observes agent → model → tool. Camera, not the coach. | [app.neatlogs.com](https://app.neatlogs.com) · [docs.neatlogs.com](https://docs.neatlogs.com) |
| **TensorMux** | Routes cheaper or harder models when the work needs it. | [tensormux.com](https://tensormux.com) |
| **AI Grant** | The grant that let this loop exist as a product. | [aigrant.org](https://aigrant.org) |

Traces in Neatlogs are tagged as **AAGAM Agent Resource Exchange**. They do not pick the team. They show the team.

---

## Quick start

You need **Node 20+** and npm.

```bash
git clone https://github.com/jainyogya07/aagam-agent-orch.git
cd aagam-agent-orch
npm install
cp .env.example .env
```

Edit `.env` (never commit it):

```bash
OPENAI_API_KEY=          # required for live memos (gpt-5-nano)
NEATLOGS_API_KEY=        # project API key — traces export to Neatlogs
TENSORMUX_API_KEY=       # optional
DATABASE_URL=            # optional; local Postgres. On Vercel without a reachable DB, /api/runs returns 503
```

Then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Type a problem. Hit **Analyze**. After the run, continue the chat, open the right-hand inspect rail (V1 / V2 / Quality / Proof), export PDF.

### Optional: live AO

If an Agent Orchestrator daemon is on `localhost:3001`, coding workers spawn a real isolated session. If it is not, the UI says so. No invented “thinking” bar.

### Optional: Neatlogs seed traces

With `NEATLOGS_API_KEY` set:

```bash
node --env-file=.env scripts/seed-neatlogs-traces.mjs
node --env-file=.env scripts/extract-neatlogs.mjs
```

Dashboard: [https://app.neatlogs.com](https://app.neatlogs.com)

---

## How a run feels

1. **Splash** — the pitch, then the composer.
2. **Problem cards** — examples you can click; they hide after you analyze.
3. **Loop** — understand the English, pick specialists, execute, score, maybe mutate.
4. **Decision surface** — bottom line, recommendation, 90-day plan, tables.
5. **Inspect rail** — V1, V2, quality dimensions, reliability pack, team, proof, spec. Click the icon; hover **i** for what it means.
6. **Continue** — follow-ups use the same goal and evidence, plus OpenAI when the key is present.
7. **PDF** — memo, tables, metrics, follow-ups.

Honesty rules we keep:

- No 99% quality clamp.
- V2 is not hardcoded. It appears when expected value of change is positive.
- Conservative payback is the gate. TAM dollars are not invented.
- Public company names only when you wrote them or they are the obvious landscape for the parsed domain.

---

## Repo structure

```
aagam-agent-orch/
├── src/app/                    # Next.js App Router
│   ├── page.tsx                # Product UI — analyze loop
│   └── api/
│       ├── analysis/memo       # OpenAI decision memo + tables
│       ├── analysis/follow-up  # Continue chat
│       ├── ao/                 # Live AO daemon (never faked)
│       ├── benchmark/          # Catalog + V1/V2
│       ├── history/            # Saved runs
│       └── v1/                 # Public API (coming soon on prod)
├── src/components/
│   ├── analysis/               # Report, tables, continue chat
│   ├── bits/                   # Motion, inspect rail, magnet
│   ├── evolution/              # V1 → V2
│   ├── intro/                  # Splash + thanks
│   └── shell/                  # Header: AO, Docs, PDF
├── src/lib/
│   ├── analysis/               # Scores, memo, metrics, tables
│   ├── architect/              # Goal parser
│   ├── openai/                 # gpt-5-nano research + JSON schema
│   ├── observability/          # Neatlogs wrap
│   ├── orchestrator/           # DAG, budget, mutation
│   ├── runtime/ao/             # Isolated coding worker
│   └── export/                 # PDF
├── scripts/                    # Neatlogs seed + extract
├── .env.example
└── package.json
```

Stack: **Next.js 16**, React 19, TypeScript, Tailwind 4, OpenAI SDK 7, `@openai/agents`, Neatlogs, Framer Motion.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local app on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the build |
| `npm run lint` | ESLint |

---

## Environment

See [`.env.example`](./.env.example). Keys stay **server-side**. They are never sent to the browser, SSE, or the PDF.

On Vercel, set `OPENAI_API_KEY` (full name — not a truncated key name) and `NEATLOGS_API_KEY` in **Project → Settings → Environment Variables → Production**.

---

## Links

- **Live:** [aagam-ten.vercel.app](https://aagam-ten.vercel.app)
- **GitHub:** [jainyogya07/aagam-agent-orch](https://github.com/jainyogya07/aagam-agent-orch)
- **Neatlogs:** [app.neatlogs.com](https://app.neatlogs.com) · [docs](https://docs.neatlogs.com)
- **OpenAI:** [platform.openai.com](https://platform.openai.com)
- **Next.js:** [nextjs.org/docs](https://nextjs.org/docs)

---

## People

Built by [Yogay Jain](https://github.com/jainyogya07) and Lakshay Jain, with thanks to AI Grant, TensorMux, Neatlogs, and Agent Orchestrator.

MIT — see [LICENSE](./LICENSE).
