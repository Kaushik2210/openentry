# OpenEntry

> **GitAgent Hackathon 2026** — A GitAgent-powered Chrome Extension that scans any public GitHub repository and generates a contributor roadmap for new developers.

---

## 🚀 Quick Setup (Judges — Start Here)

**Step 1 — Get a free Groq API key**
→ Go to [https://console.groq.com](https://console.groq.com), sign up, click **API Keys → Create API Key**. Takes 30 seconds.

**Step 2 — Add your key**

Inside the `openentry-extension/` folder you'll see:
```
config.example.js   ← template (already in the repo)
```
Create a new file in the same folder called **`config.js`** (just copy `config.example.js` and rename it), then paste your key:

```js
// openentry-extension/config.js
const GROQ_API_KEY = 'your_actual_key_here';
```

**Step 3 — Load the extension in Chrome**
1. Open Chrome → address bar → `chrome://extensions`
2. Toggle **Developer mode** ON (top right)
3. Click **"Load unpacked"**
4. Select the **`openentry-extension/`** folder from this repo

**Step 4 — Open any GitHub repo and test it**
→ Go to [https://github.com/LUCIFERLAMO/Maldives](https://github.com/LUCIFERLAMO/Maldives)
→ A dark **"OE"** bubble appears in the bottom-right corner
→ Hover → it expands with the repo URL pre-filled → click **Scan**
→ Wait ~15 seconds → bubble turns green → roadmap downloads automatically

---

## What It Does

OpenEntry appears as a floating **"OE" bubble** in the bottom-right corner of any GitHub repository page. When clicked, it:

1. Scans the repository's full file tree via the GitHub public API
2. Detects the tech stack (Node.js, Python, React, TypeScript, etc.)
3. Scores and selects the **top 8 most important source files** to analyze
4. Sends the code context to **Groq (LLaMA 3.3 70B)** for deep analysis
5. Generates a **structured contributor roadmap** categorized by difficulty:
   - 🟢 BEGINNER
   - 🟡 INTERMEDIATE
   - 🔴 ADVANCED
6. Auto-downloads a **professionally styled HTML report** — printable as PDF

---

## GitAgent Structure

This project follows the [GitAgent open standard](https://gitagent.sh):

| File | Purpose |
|---|---|
| `agent.yaml` | Agent manifest — model, tools, skills, 10-step workflow pipeline |
| `SOUL.md` | Agent identity, personality, and behavioral principles |
| `DUTIES.md` | Segregation of Duties — responsibilities, hard limits, error handling |
| `skills/analyze-repo/SKILL.md` | The core repo analysis skill definition |

---

## File Structure

```
openentry/
├── agent.yaml                      ← GitAgent manifest
├── SOUL.md                         ← Agent identity
├── DUTIES.md                       ← Agent responsibilities & guardrails
├── skills/
│   └── analyze-repo/SKILL.md       ← GitAgent skill definition
└── openentry-extension/
    ├── config.example.js           ← Copy this → config.js and add your key
    ├── config.js                   ← (YOU CREATE THIS — gitignored)
    ├── manifest.json               ← Chrome MV3 manifest
    ├── content.js                  ← Bubble UI + scan pipeline + report builder
    ├── background.js               ← Download handler (service worker)
    ├── popup-bubble.css            ← Floating pill UI styles
    └── icons/
        └── icon48.png              ← Extension icon
```

---

## Tech Stack

- **Runtime**: Chrome Extension (Manifest V3)
- **AI Model**: `llama-3.3-70b-versatile` via [Groq](https://groq.com)
- **APIs**: GitHub REST API (public, no auth required)
- **Standard**: [GitAgent Open Standard](https://gitagent.sh) by Lyzr AI

---

## How to Use After Setup

1. Navigate to any public GitHub repo
2. Hover over the **OE bubble** (bottom-right corner)
3. The repo URL auto-fills — click **Scan**
4. Wait ~15 seconds — bubble pulses while scanning
5. Bubble turns **green "PDF Ready!"** → HTML roadmap auto-downloads
6. Open the downloaded file → `Ctrl+P` → **Save as PDF**

---

## Hackathon

Built for the **GitAgent Hackathon 2026** by Lyzr AI × HackCulture.

Submission: https://hackculture.io/hackathons/gitagent-hackathon