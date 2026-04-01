// ============================================================
//  OpenEntry ΓÇö content.js
//  Injects a floating bubble on github.com/owner/repo pages.
//  Scans repo via GitHub + Groq API and downloads a roadmap.
// ============================================================

const GROQ_API_KEY = 'YOUR_GROQ_API_KEY_HERE';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';

// ΓöÇΓöÇ Detect if we are on a valid repo page ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function getRepoFromPath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts.length >= 2 && !['topics','explore','marketplace','notifications',
      'login','signup','settings','pulls','issues','codespaces'].includes(parts[0])) {
    return { owner: parts[0], repo: parts[1] };
  }
  return null;
}

// ΓöÇΓöÇ Build the bubble DOM ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function createBubble() {
  if (document.getElementById('openentry-bubble')) return;

  const bubble = document.createElement('div');
  bubble.id = 'openentry-bubble';

  const label = document.createElement('span');
  label.className = 'oe-label';
  label.id = 'openentry-label';
  label.textContent = 'OE';

  const input = document.createElement('input');
  input.className = 'oe-input';
  input.id = 'openentry-input';
  input.type = 'text';
  input.placeholder = 'Paste GitHub repo URLΓÇª';

  const btn = document.createElement('button');
  btn.className = 'oe-scan-btn';
  btn.id = 'openentry-scan-btn';
  btn.textContent = 'Scan';

  bubble.appendChild(label);
  bubble.appendChild(input);
  bubble.appendChild(btn);
  document.body.appendChild(bubble);

  // ΓöÇΓöÇ Expand on mouse-enter ΓöÇΓöÇ
  bubble.addEventListener('mouseenter', () => {
    if (bubble.classList.contains('loading') ||
        bubble.classList.contains('done')    ||
        bubble.classList.contains('error'))  return;
    bubble.classList.add('expanded');
    // Pre-fill with current page URL
    const r = getRepoFromPath();
    if (r && !input.value) {
      input.value = `https://github.com/${r.owner}/${r.repo}`;
    }
    setTimeout(() => input.focus(), 50);
  });

  // ΓöÇΓöÇ Collapse on mouse-leave (unless input focused) ΓöÇΓöÇ
  bubble.addEventListener('mouseleave', () => {
    if (document.activeElement !== input) {
      bubble.classList.remove('expanded');
    }
  });
  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (!bubble.matches(':hover')) bubble.classList.remove('expanded');
    }, 150);
  });

  // ΓöÇΓöÇ Scan triggers ΓöÇΓöÇ
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerScan(bubble, input);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') triggerScan(bubble, input);
  });
}

// ΓöÇΓöÇ Trigger the full scan pipeline ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
async function triggerScan(bubble, input) {
  const url = input.value.trim();
  if (!url) return;
  setLoading(bubble);
  try {
    await scanRepo(url, bubble);
  } catch (err) {
    console.error('[OpenEntry]', err);
    setError(bubble, err.message || 'Unknown error');
  }
}

// ΓöÇΓöÇ State helpers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function setLoading(bubble) {
  bubble.classList.remove('expanded', 'done', 'error');
  bubble.classList.add('loading');
  document.getElementById('openentry-label').textContent = 'ScanningΓÇª';
}

function setDone(bubble) {
  bubble.classList.remove('loading', 'error', 'expanded');
  bubble.classList.add('done');
  document.getElementById('openentry-label').textContent = 'PDF Ready!';
  setTimeout(() => {
    bubble.classList.remove('done');
    document.getElementById('openentry-label').textContent = 'OE';
  }, 2500);
}

function setError(bubble, msg) {
  bubble.classList.remove('loading', 'done', 'expanded');
  bubble.classList.add('error');
  document.getElementById('openentry-label').textContent = 'Error';
  console.warn('[OpenEntry] Error:', msg);
  setTimeout(() => {
    bubble.classList.remove('error');
    document.getElementById('openentry-label').textContent = 'OE';
    document.getElementById('openentry-input').value = '';
  }, 3000);
}

// ΓöÇΓöÇ Main scan function ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
async function scanRepo(repoUrl, bubble) {

  // Step 1 ΓÇö Parse URL
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/?#]+)/);
  if (!match) throw new Error('Invalid GitHub URL');
  const owner = match[1];
  const repo  = match[2].replace(/\.git$/, '');

  const ghHeaders = { 'Accept': 'application/vnd.github.v3+json' };

  // Step 2 ΓÇö Fetch repo info
  const infoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders });
  if (!infoRes.ok) throw new Error(`Repo not found or private (${infoRes.status})`);
  const info = await infoRes.json();
  const description = info.description || 'No description provided';
  const language    = info.language    || 'Unknown';
  const topics      = (info.topics || []).join(', ');

  // Step 3 ΓÇö Fetch file tree
  let treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, { headers: ghHeaders });
  if (!treeRes.ok) {
    // fallback to master branch
    treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`, { headers: ghHeaders });
  }
  if (!treeRes.ok) throw new Error('Could not fetch file tree');
  const treeData = await treeRes.json();
  const allFiles = (treeData.tree || [])
    .filter(f => f.type === 'blob')
    .map(f => f.path);

  if (allFiles.length > 300) {
    throw new Error('Repository too large for free analysis (max 300 files)');
  }

  const defaultBranch = treeRes.url.includes('/main?') ? 'main' : 'master';

  // Step 4 ΓÇö Detect tech stack
  const techStack = [];
  if (allFiles.some(f => f === 'package.json')) techStack.push('JavaScript/Node.js');
  if (allFiles.some(f => f.endsWith('.py')))     techStack.push('Python');
  if (allFiles.some(f => f.endsWith('.jsx') || f.endsWith('.tsx'))) techStack.push('React');
  if (allFiles.some(f => f.endsWith('.ts')))     techStack.push('TypeScript');
  if (allFiles.some(f => f.endsWith('.html')))   techStack.push('HTML/CSS');
  if (allFiles.some(f => f === 'vercel.json'))   techStack.push('Vercel deployment');

  // Step 5 ΓÇö Score and pick top 8 key files
  const SKIP = ['/tests/', '/test/', '/fixtures/', 'node_modules', '.min.js', '.d.ts'];
  const scored = allFiles.map(path => {
    let score = 0;
    const name = path.split('/').pop();
    if (SKIP.some(s => path.includes(s))) return { path, score: -99 };
    const rootLevel = !path.includes('/');
    if (rootLevel && ['server.js','app.js','index.js'].includes(name)) score += 10;
    if (path.includes('/routes/'))     score += 8;
    if (path.includes('/pages/'))      score += 8;
    if (path.includes('/models/'))     score += 7;
    if (path.includes('/controllers/')) score += 6;
    if (path.includes('/src/') || path.includes('/frontend/') || path.includes('/backend/')) score += 5;
    if (/\.(js|jsx|ts|tsx)$/.test(name)) score += 3;
    return { path, score };
  });

  const topFiles = scored
    .filter(f => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(f => f.path);

  // Step 6 ΓÇö Fetch file contents
  const fileContents = [];
  for (const filePath of topFiles) {
    try {
      const raw = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${filePath}`
      );
      if (raw.ok) {
        const text = await raw.text();
        fileContents.push({ path: filePath, content: text.slice(0, 3000) });
      }
    } catch (_) { /* skip unreadable files */ }
  }

  // Step 7 ΓÇö Build prompt
  const keyFilesBlock = fileContents.map(f =>
    `\n=== FILE: ${f.path} ===\n${f.content}`
  ).join('\n');

  const prompt = `You are analyzing a GitHub repository to find valid contribution opportunities for new developers.

REPO: ${owner}/${repo}
DESCRIPTION: ${description}
LANGUAGE: ${language}
TOPICS: ${topics}
TECH STACK: ${techStack.join(', ')}
ALL FILES:
${allFiles.join('\n')}

KEY FILE CONTENTS:
${keyFilesBlock}

RULES - READ CAREFULLY:
1. Skip any file in /tests/ /test/ /fixtures/ folders
2. Skip barrel files that only contain export statements
3. Skip files that only do res.send() or context.res.send()
4. Only suggest issues you can see CLEAR EVIDENCE of
5. If a feature already exists in the code, do NOT suggest it
6. Never suggest README, CI/CD, or .env file changes
7. If you cannot find real issues, return empty issues array
8. Each issue MUST include an evidenceLine - paste real code

Return ONLY this JSON, no backticks, no explanation:
{
  "appSummary": "one sentence about the app",
  "issues": [
    {
      "level": "BEGINNER or INTERMEDIATE or ADVANCED",
      "title": "specific title",
      "file": "exact/file/path.js",
      "description": "what is wrong and why it matters",
      "evidenceLine": "exact copied code from the file"
    }
  ],
  "roadmap": [
    {
      "title": "same as issue title",
      "file": "exact/file/path.js",
      "time": "X to Y hours",
      "whatToDo": "step by step instructions",
      "dontBreak": "what not to touch"
    }
  ]
}`;

  // Step 7 ΓÇö Call Groq API
  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.1,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    throw new Error(`Groq API error ${groqRes.status}: ${errText.slice(0, 200)}`);
  }

  const groqData = await groqRes.json();
  const rawContent = groqData.choices?.[0]?.message?.content || '';

  // Step 8 ΓÇö Parse JSON
  let analysis;
  try {
    // Strip potential markdown fences
    const cleaned = rawContent.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    analysis = JSON.parse(cleaned);
  } catch (e) {
    throw new Error('Analysis failed ΓÇö could not parse AI response. Try again.');
  }

  // Step 9 ΓÇö Generate & download HTML roadmap
  // Extract unique top-level folders for folder structure display
  const folderSet = new Set();
  allFiles.forEach(f => {
    const parts = f.split('/');
    if (parts.length > 1) folderSet.add(parts[0]);
    else folderSet.add(f);
  });
  const folderStructure = Array.from(folderSet).slice(0, 20);

  const htmlContent = buildRoadmapHTML(owner, repo, description, language, techStack, analysis, allFiles, topFiles, folderStructure);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);
  const filename = `openentry-roadmap-${repo}.html`;

  // Ask background to download (blob URLs work from content scripts too)
  chrome.runtime.sendMessage({
    type: 'DOWNLOAD_PDF',
    url: blobUrl,
    filename: filename
  });

  setDone(bubble);
}

// ΓöÇΓöÇ Build polished HTML roadmap ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function buildRoadmapHTML(owner, repo, description, language, techStack, data, allFiles, topFiles, folderStructure) {
  const levelColor = { BEGINNER: '#16a34a', INTERMEDIATE: '#d97706', ADVANCED: '#dc2626' };
  const levelBg    = { BEGINNER: '#dcfce7', INTERMEDIATE: '#fef3c7', ADVANCED: '#fee2e2' };

  // 1. Filter out issues where evidenceLine contains existing try-block error handling
  let filteredIssues = (data.issues || []).filter(issue =>
    !issue.evidenceLine.includes('try {') &&
    !issue.evidenceLine.includes('try{')
  );

  const issueCards = filteredIssues.map((issue, i) => {
    const lc = levelColor[issue.level] || '#64748b';
    const lb = levelBg[issue.level]   || '#f1f5f9';
    // Find matching roadmap entry by title (safer than index after filtering)
    const roadmapItem = (data.roadmap || []).find(r => r.title === issue.title) || (data.roadmap || [])[i] || {};
    return `
      <div class="issue-card">
        <div class="issue-header">
          <span class="badge" style="background:${lb};color:${lc};">${issue.level || 'GENERAL'}</span>
          <span class="issue-number">#${String(i + 1).padStart(2, '0')}</span>
        </div>
        <h3 class="issue-title">${esc(issue.title)}</h3>
        <div class="issue-file">≡ƒôü ${esc(issue.file)}</div>
        <p class="issue-desc">${esc(issue.description)}</p>
        ${issue.evidenceLine ? `<div class="evidence-block"><code>${esc(issue.evidenceLine)}</code></div>` : ''}
        ${roadmapItem.whatToDo ? `
        <div class="roadmap-box">
          <div class="roadmap-label">ΓÅ▒ ${esc(roadmapItem.time || '')}</div>
          <div class="roadmap-steps">${esc(roadmapItem.whatToDo)}</div>
          ${roadmapItem.dontBreak ? `<div class="dont-break">ΓÜá∩╕Å Don't break: ${esc(roadmapItem.dontBreak)}</div>` : ''}
        </div>` : ''}
      </div>`;
  }).join('');

  const now = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const nowFull = new Date().toLocaleString();

  // Tech stack color map for pill tags
  const stackColors = {
    'JavaScript/Node.js': { bg: '#fef9c3', color: '#854d0e' },
    'Python':             { bg: '#e0f2fe', color: '#075985' },
    'React':              { bg: '#fce7f3', color: '#9d174d' },
    'TypeScript':         { bg: '#ede9fe', color: '#5b21b6' },
    'HTML/CSS':           { bg: '#ffedd5', color: '#9a3412' },
    'Vercel deployment':  { bg: '#f0fdf4', color: '#166534' },
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>OpenEntry Roadmap ΓÇö ${owner}/${repo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;background:#f8fafc;color:#1e293b;line-height:1.6;}

    /* ΓöÇΓöÇ Hero header ΓöÇΓöÇ */
    .hero{background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%);color:#fff;padding:48px 56px 40px;}
    .hero-top{display:flex;align-items:center;gap:16px;margin-bottom:24px;}
    .logo{width:48px;height:48px;background:#2563eb;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;flex-shrink:0;}
    .brand{font-size:28px;font-weight:800;letter-spacing:-0.5px;}
    .brand span{color:#60a5fa;}
    .repo-title{font-size:22px;font-weight:700;margin-bottom:6px;color:#e2e8f0;}
    .repo-desc{font-size:14px;color:#94a3b8;max-width:680px;}
    .meta-pills{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px;}
    .pill{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);
          border-radius:20px;padding:4px 14px;font-size:12px;color:#cbd5e1;}
    /* ΓöÇΓöÇ Stats row ΓöÇΓöÇ */
    .stats-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;}
    .stat-box{background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.08);border-radius:6px;
              padding:6px 14px;display:flex;flex-direction:column;gap:1px;}
    .stat-box .stat-val{font-size:15px;font-weight:700;color:#fff;}
    .stat-box .stat-lbl{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.6px;}

    /* ΓöÇΓöÇ Summary banner ΓöÇΓöÇ */
    .summary-banner{background:#eff6ff;border-left:4px solid #2563eb;margin:32px 56px 0;padding:16px 20px;border-radius:0 8px 8px 0;}
    .summary-banner p{font-size:15px;color:#1e40af;font-weight:500;}

    /* ΓöÇΓöÇ Section heading ΓöÇΓöÇ */
    .section-head{background:#0f172a;color:#fff;margin:32px 56px 0;padding:12px 20px;border-radius:8px 8px 0 0;
                  display:flex;align-items:center;gap:10px;font-size:13px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;}
    .section-num{background:#2563eb;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;
                 justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;}

    /* ΓöÇΓöÇ Project snapshot ΓöÇΓöÇ */
    .snapshot-wrap{margin:0 56px 0;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;
                   background:#fff;display:grid;grid-template-columns:1fr 1fr;gap:0;overflow:hidden;}
    .snapshot-col{padding:24px 28px;}
    .snapshot-col:first-child{border-right:1px solid #f1f5f9;}
    .snapshot-col-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;margin-bottom:14px;}
    .tech-tags{display:flex;flex-wrap:wrap;gap:8px;}
    .tech-tag{padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;}
    .folder-list{display:flex;flex-direction:column;gap:4px;}
    .folder-row{font-family:'JetBrains Mono',monospace;font-size:12px;color:#334155;
                background:#f8fafc;padding:4px 10px;border-radius:4px;border-left:3px solid #2563eb;}

    /* ΓöÇΓöÇ Cards container ΓöÇΓöÇ */
    .cards-wrap{margin:0 56px 0;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;overflow:hidden;background:#fff;}
    .issue-card{padding:24px 28px;border-bottom:1px solid #f1f5f9;}
    .issue-card:last-child{border-bottom:none;}
    .issue-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
    .badge{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;}
    .issue-number{font-size:12px;color:#94a3b8;font-weight:600;}
    .issue-title{font-size:17px;font-weight:700;color:#0f172a;margin-bottom:6px;}
    .issue-file{font-size:12px;color:#64748b;font-family:'JetBrains Mono',monospace;margin-bottom:10px;background:#f8fafc;
                display:inline-block;padding:2px 8px;border-radius:4px;border:1px solid #e2e8f0;}
    .issue-desc{font-size:14px;color:#475569;margin-bottom:12px;}
    .evidence-block{background:#1e293b;border-radius:6px;padding:10px 14px;margin-bottom:14px;overflow-x:auto;}
    .evidence-block code{font-family:'JetBrains Mono',monospace;font-size:12px;color:#94a3b8;white-space:pre-wrap;word-break:break-all;}
    .roadmap-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 16px;}
    .roadmap-label{font-size:12px;font-weight:700;color:#15803d;margin-bottom:6px;}
    .roadmap-steps{font-size:13px;color:#166534;white-space:pre-line;}
    .dont-break{font-size:12px;color:#92400e;margin-top:8px;background:#fef3c7;padding:6px 10px;border-radius:4px;}

    /* ΓöÇΓöÇ Quick start section ΓöÇΓöÇ */
    .quickstart-wrap{margin:0 56px 0;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;overflow:hidden;background:#fff;padding:24px 28px;}
    .quickstart-steps{display:flex;flex-direction:column;gap:12px;margin-top:4px;}
    .qs-step{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-radius:8px;border:1px solid #e2e8f0;background:#f8fafc;}
    .qs-num{width:28px;height:28px;background:#2563eb;border-radius:50%;display:flex;align-items:center;
            justify-content:center;font-size:13px;font-weight:800;color:#fff;flex-shrink:0;}
    .qs-text{font-size:14px;color:#334155;font-weight:500;padding-top:3px;}

    /* ΓöÇΓöÇ Empty state ΓöÇΓöÇ */
    .empty{padding:40px;text-align:center;color:#64748b;font-size:15px;}

    /* ΓöÇΓöÇ Footer ΓöÇΓöÇ */
    .footer{text-align:center;padding:28px 56px 32px;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;margin-top:32px;
            display:flex;flex-direction:column;align-items:center;gap:6px;}
    .footer strong{color:#2563eb;}
    .footer-repo{font-family:'JetBrains Mono',monospace;font-size:11px;color:#64748b;
                 background:#f1f5f9;padding:3px 10px;border-radius:4px;}
    .footer-hackathon{font-size:11px;color:#94a3b8;letter-spacing:0.3px;}

    /* ΓöÇΓöÇ Print ΓöÇΓöÇ */
    @media print {
      body{background:#fff;}
      .hero{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .section-head{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .evidence-block{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .stat-box{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .qs-num{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    }
  </style>
</head>
<body>

<!-- ΓöÇΓöÇ HERO ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ -->
<div class="hero">
  <div class="hero-top">
    <div class="logo">OE</div>
    <div class="brand">Open<span>Entry</span></div>
  </div>
  <div class="repo-title">Contributor Roadmap ΓÇö ${esc(owner)}/${esc(repo)}</div>
  <div class="repo-desc">${esc(description)}</div>
  <div class="meta-pills">
    <span class="pill">≡ƒîÉ Language: ${esc(language)}</span>
    ${techStack.map(t => `<span class="pill">ΓÜí ${esc(t)}</span>`).join('')}
    <span class="pill">≡ƒôï ${filteredIssues.length} issues found</span>
  </div>
  <!-- Stats row -->
  <div class="stats-row">
    <div class="stat-box">
      <span class="stat-val">${(allFiles || []).length}</span>
      <span class="stat-lbl">Files Scanned</span>
    </div>
    <div class="stat-box">
      <span class="stat-val">${(topFiles || []).length}</span>
      <span class="stat-lbl">Files Analyzed</span>
    </div>
    <div class="stat-box">
      <span class="stat-val">${filteredIssues.length}</span>
      <span class="stat-lbl">Issues Found</span>
    </div>
    <div class="stat-box">
      <span class="stat-val" style="font-size:12px;">${nowFull}</span>
      <span class="stat-lbl">Generated</span>
    </div>
  </div>
</div>

<!-- ΓöÇΓöÇ APP SUMMARY ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ -->
${data.appSummary ? `
<div class="summary-banner">
  <p>≡ƒÆí ${esc(data.appSummary)}</p>
</div>` : ''}

<!-- ΓöÇΓöÇ SECTION 01: PROJECT SNAPSHOT ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ -->
<div class="section-head">
  <span class="section-num">01</span> PROJECT SNAPSHOT
</div>
<div class="snapshot-wrap">
  <div class="snapshot-col">
    <div class="snapshot-col-title">≡ƒ¢á Tech Stack</div>
    <div class="tech-tags">
      ${techStack.length > 0
        ? techStack.map(t => {
            const c = stackColors[t] || { bg: '#f1f5f9', color: '#334155' };
            return `<span class="tech-tag" style="background:${c.bg};color:${c.color};">${esc(t)}</span>`;
          }).join('')
        : `<span class="tech-tag" style="background:#f1f5f9;color:#64748b;">Not detected</span>`
      }
    </div>
  </div>
  <div class="snapshot-col">
    <div class="snapshot-col-title">≡ƒôé Folder Structure</div>
    <div class="folder-list">
      ${(folderStructure || []).map(f => `<div class="folder-row">${esc(f)}</div>`).join('')}
    </div>
  </div>
</div>

<!-- ΓöÇΓöÇ SECTION 02: CONTRIBUTION OPPORTUNITIES ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ -->
<div class="section-head">
  <span class="section-num">02</span> CONTRIBUTION OPPORTUNITIES
</div>
<div class="cards-wrap">
  ${issueCards || '<div class="empty">Γ£à No clear contribution opportunities were detected in the analysed files. The codebase looks clean!</div>'}
</div>

<!-- ΓöÇΓöÇ SECTION 03: QUICK START FOR CONTRIBUTORS ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ -->
<div class="section-head">
  <span class="section-num">03</span> QUICK START FOR CONTRIBUTORS
</div>
<div class="quickstart-wrap">
  <div class="quickstart-steps">
    <div class="qs-step">
      <div class="qs-num">1</div>
      <div class="qs-text">≡ƒì┤ <strong>Fork this repository</strong> on GitHub by clicking the Fork button at the top of the repo page.</div>
    </div>
    <div class="qs-step">
      <div class="qs-num">2</div>
      <div class="qs-text">≡ƒÆ╗ <strong>Clone your fork</strong> locally and install dependencies:<br>
        <code style="font-family:JetBrains Mono,monospace;font-size:12px;background:#1e293b;color:#94a3b8;padding:2px 8px;border-radius:4px;">git clone https://github.com/YOUR_USERNAME/${esc(repo)}.git &amp;&amp; cd ${esc(repo)} &amp;&amp; npm install</code></div>
    </div>
    <div class="qs-step">
      <div class="qs-num">3</div>
      <div class="qs-text">≡ƒî┐ <strong>Pick an issue above</strong>, create a new branch, make your changes, and open a Pull Request back to <code style="font-family:JetBrains Mono,monospace;font-size:12px;background:#1e293b;color:#94a3b8;padding:2px 6px;border-radius:4px;">${esc(owner)}/${esc(repo)}</code>.</div>
    </div>
  </div>
</div>

<!-- ΓöÇΓöÇ FOOTER ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ -->
<div class="footer">
  <div>Generated by <strong>OpenEntry</strong> for <span class="footer-repo">github.com/${esc(owner)}/${esc(repo)}</span></div>
  <div class="footer-hackathon">OpenEntry ΓÇö GitAgent Hackathon 2026</div>
  <div><small>Open this file in a browser and press <kbd>Ctrl+P</kbd> ΓåÆ Save as PDF for a printable version.</small></div>
</div>

</body>
</html>`;
}

// ΓöÇΓöÇ HTML escape helper ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ΓöÇΓöÇ Init ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function init() {
  if (getRepoFromPath()) createBubble();
}

// Also re-check on GitHub's SPA navigation
let lastPath = location.pathname;
const observer = new MutationObserver(() => {
  if (location.pathname !== lastPath) {
    lastPath = location.pathname;
    const existing = document.getElementById('openentry-bubble');
    if (existing) existing.remove();
    init();
  }
});
observer.observe(document.body, { childList: true, subtree: true });

init();
