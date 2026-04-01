# OpenEntry

> **GitAgent Hackathon 2026** — A GitAgent-powered Chrome Extension that scans any public GitHub repository and generates a contributor roadmap for new developers.

---

## What It Does

OpenEntry appears as a floating **"OE" bubble** in the bottom-right corner of any GitHub repository page. When clicked, it:

1. Scans the repository's file tree and detects the tech stack
2. Scores and selects the **top 8 most important files** to analyze
3. Sends the code context to **Groq (LLaMA 3.3 70B)** for deep analysis
4. Generates a **structured contributor roadmap** categorized by difficulty:
   - 🟢 BEGINNER
   - 🟡 INTERMEDIATE
   - 🔴 ADVANCED
5. Auto-downloads a **professionally styled HTML report** — printable as PDF

---

## GitAgent Structure

This project follows the [GitAgent open standard](https://gitagent.sh):

| File | Purpose |
|---|---|
| `agent.yaml` | Agent manifest — model, tools, skills, workflow pipeline |
| `SOUL.md` | Agent identity, personality, and behavioral principles |
| `DUTIES.md` | Segregation of Duties — responsibilities, hard limits, error handling |
| `skills/analyze-repo/SKILL.md` | The core repo analysis skill definition |

---

## Chrome Extension Files

```
openentry-extension/
├── manifest.json       ← Chrome MV3 manifest
├── content.js          ← Bubble UI + scan pipeline + HTML report builder
├── background.js       ← Download handler (service worker)
├── popup-bubble.css    ← Floating pill styles and animations
└── icons/
    └── icon48.png      ← Extension icon
```

---

## How to Install

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **"Load unpacked"**
4. Select the `openentry-extension/` folder

---

## How to Use

1. Navigate to any public GitHub repo (e.g. `https://github.com/LUCIFERLAMO/Maldives`)
2. Hover over the **OE bubble** in the bottom-right corner
3. The repo URL is pre-filled — click **Scan**
4. Wait ~10–20 seconds — the bubble turns green when done
5. A roadmap HTML file auto-downloads to your Downloads folder
6. Open it in browser → `Ctrl+P` → **Save as PDF**

---

## Tech Stack

- **Runtime**: Chrome Extension (Manifest V3)
- **AI Model**: `llama-3.3-70b-versatile` via [Groq](https://groq.com)
- **APIs**: GitHub REST API (public, no auth required)
- **Standard**: [GitAgent Open Standard](https://gitagent.sh) by Lyzr AI

---

## Hackathon

Built for the **GitAgent Hackathon 2026** by Lyzr AI × HackCulture.

Submission: https://hackculture.io/hackathons/gitagent-hackathon