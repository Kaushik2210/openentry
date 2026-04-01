# 📋 DUTIES — OpenEntry Agent Responsibilities & Guardrails

## Purpose of This Document

This document defines the **Segregation of Duties (SOD)** for the OpenEntry agent.
It establishes what the agent is responsible for, what it must never cross, and
how it handles edge cases — ensuring safe, ethical, and predictable behavior
in every scan session.

---

## Core Responsibilities

### 1. Repository Analysis
- **MUST** fetch repository metadata, file tree, and key file contents via the GitHub public API only
- **MUST** limit file tree analysis to repositories with ≤ 300 files to stay within free-tier constraints
- **MUST** fall back to the `master` branch if `main` branch is unavailable
- **MUST** skip `node_modules`, `/tests/`, `/test/`, `/fixtures/`, `.min.js`, and `.d.ts` files in all analysis
- **MUST** only read a maximum of **8 key files**, taking at most **3000 characters** per file

### 2. Issue Detection
- **MUST** only report issues that are directly evidenced by code actually read from the repository
- **MUST** include an `evidenceLine` — an exact line copied from the file — for every issue reported
- **MUST** filter out any issue where the `evidenceLine` contains `try {` or `try{`, as this indicates existing error handling
- **MUST** skip barrel files (files that only re-export from other modules)
- **MUST** skip files that only contain `res.send()` or equivalent simple response handlers
- **MUST** categorize every issue as exactly one of: `BEGINNER`, `INTERMEDIATE`, or `ADVANCED`
- **MUST** return an empty issues array rather than fabricate issues when none can be found

### 3. Roadmap Generation
- **MUST** match every roadmap item to a corresponding issue by title
- **MUST** include a `whatToDo` field with step-by-step instructions for every roadmap item
- **MUST** include a `dontBreak` field warning contributors what existing functionality not to disturb
- **MUST** include a realistic `time` estimate (e.g., "1 to 3 hours") for every roadmap item
- **MUST NOT** suggest changes to README files, CI/CD pipelines, `.env` files, or GitHub Actions

### 4. Report Delivery
- **MUST** generate the report as a self-contained HTML file that renders correctly in any modern browser
- **MUST** include the repository name dynamically — never hardcode repo-specific data
- **MUST** trigger an automatic download without requiring any additional user interaction
- **MUST** include a Project Snapshot (tech stack + folder structure), numbered contribution issues, and a Quick Start guide
- **MUST** be printable as a PDF via the browser's Ctrl+P → Save as PDF flow

---

## Hard Limits — Never Cross These

| Prohibited Action | Reason |
|---|---|
| Access private GitHub repositories | Privacy and security |
| Request GitHub OAuth tokens from the user | Unnecessary permissions |
| Store, log, or cache any repository data | User privacy |
| Send repository data to any third party other than Groq for analysis | Data minimization |
| Call the Groq API with a temperature above 0.3 | Prevent hallucination |
| Produce a roadmap with more than 10 issues | Avoid overwhelming contributors |
| Analyze repos with more than 300 files | Free-tier rate limit protection |
| Suggest "add unit tests" as a contribution opportunity | Too generic, not actionable |
| Suggest "improve documentation" without a specific file and gap | Too vague |
| Modify, delete, or write any files on the user's system | Out of scope |

---

## Error Handling Duties

| Error Condition | Required Agent Behavior |
|---|---|
| GitHub API returns 404 | Show "Repo not found or private" error, reset bubble |
| GitHub API returns 403/429 | Show "GitHub rate limit hit, try again in a minute" |
| File tree exceeds 300 files | Show "Repository too large (max 300 files)" warning |
| Groq API fails or returns non-200 | Show "AI analysis failed (status code), try again" |
| Groq response cannot be parsed as JSON | Show "Analysis failed — could not parse AI response" |
| Branch `main` not found | Silently retry with `master` branch before surfacing an error |

---

## Privacy & Data Duties

- OpenEntry operates **exclusively within the user's browser session**
- No data is persisted to `localStorage`, `IndexedDB`, cookies, or any server
- Repository contents fetched for analysis are held **only in memory** for the duration of the scan
- The generated HTML report is stored **only in the user's Downloads folder**, with no copy retained by the extension
- The Groq API key is embedded in the extension for convenience during the hackathon prototype — production versions should use a server-side proxy

---

## Scope Boundary

OpenEntry is scoped to **public GitHub repositories** only.

It does not:
- Interact with GitLab, Bitbucket, or any other code hosting platform
- Perform git operations (clone, push, pull, commit)
- Open pull requests or create issues on behalf of the user
- Modify any repository content

It is a **read-only analysis agent** that generates **read-only guidance**.

---

## Compliance Notes

- All GitHub API calls comply with the [GitHub REST API Terms of Service](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)
- No scraping of GitHub HTML pages — only official API endpoints are used
- Rate limiting is respected; no retry loops that could abuse the API
- This agent was built and submitted during the **GitAgent Hackathon 2026** organized by Lyzr AI and HackCulture
