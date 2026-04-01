---
name: analyze-repo
description: "Analyzes a GitHub repository and generates a contributor roadmap as a PDF"
allowed-tools: Bash Read Write
---

# Analyze Repo Skill

When the user gives you a GitHub repository URL, follow these 
steps in order:

## Step 1 — Read the README
Fetch and read the README.md from the repo:
```
curl -s https://raw.githubusercontent.com/{owner}/{repo}/main/README.md
```
Understand what the project is, its purpose, and tech stack.

## Step 2 — Read the folder structure
```
curl -s https://api.github.com/repos/{owner}/{repo}/git/trees/main?recursive=1
```
Identify key files and folders. Focus on src/, backend/, 
frontend/, utils/.

## Step 3 — Read recent commit history
```
curl -s https://api.github.com/repos/{owner}/{repo}/commits?per_page=20
```
Understand what has recently been worked on so you don't 
suggest changes to freshly modified areas.

## Step 4 — Read key source files
Pick the 3-5 most important files based on the folder structure 
and read their raw content using:
```
curl -s https://raw.githubusercontent.com/{owner}/{repo}/main/{filepath}
```

## Step 5 — Analyze and generate PDF
After reading everything, run this Node.js script to generate 
the PDF:
```
node generate-pdf.js
```

The PDF must have exactly 3 sections:

### Section 1: Project Overview
- What this project does
- Tech stack detected
- Folder structure explained simply

### Section 2: Issues Found
- Specific weak spots found in the code
- Each issue must mention the exact file name
- Label each: [BEGINNER] [INTERMEDIATE] [ADVANCED]

### Section 3: Your Contribution Roadmap
- For each issue: what to do, which file, how to approach it
- Estimated time for each
- What to be careful about (what NOT to break)
