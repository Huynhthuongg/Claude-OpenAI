// Minimal Express backend with model adapter pattern, embeddings and simple skill registry.
// NOTE: Set OPENAI_API_KEY or ANTHROPIC_API_KEY in env if you want to call real APIs.
const express = require('express');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const openaiAdapter = require('./adapters/openaiAdapter'); // optional
const anthropicAdapter = require('./adapters/anthropicAdapter'); // optional

const app = express();
app.use(bodyParser.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Simple in-memory skill registry (persist in DB for prod)
const skillsDir = path.join(__dirname, 'skills');
if (!fs.existsSync(skillsDir)) fs.mkdirSync(skillsDir);

// --- Chat endpoint: choose model via body.model === 'openai'|'claude'|'local' ---
app.post('/api/chat', async (req, res) => {
  const { input, model = 'openai', meta = {} } = req.body;
  try {
    let out;
    if (model === 'openai') {
      out = await openaiAdapter.generate(input, meta).catch(e=>({error: String(e)}));
    } else if (model === 'claude') {
      out = await anthropicAdapter.generate(input, meta).catch(e=>({error: String(e)}));
    } else {
      // local stub
      out = { text: `Echo (local): ${input}` };
    }
    return res.json({ output: out.text || out });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// --- Embeddings (store/search using Postgres+pgvector recommended) ---
// Minimal: store vectors in local JSON for demo (replace with DB for prod)
const MEMFILE = path.join(__dirname, 'memory.json');
if (!fs.existsSync(MEMFILE)) fs.writeFileSync(MEMFILE, JSON.stringify([]));
app.post('/api/embeddings', async (req, res) => {
  const { id, text } = req.body;
  // for demo we store text only; in prod compute embedding via adapter and store vector to pgvector
  const mem = JSON.parse(fs.readFileSync(MEMFILE));
  mem.push({ id, text, ts: Date.now() });
  fs.writeFileSync(MEMFILE, JSON.stringify(mem, null, 2));
  res.json({ ok: true });
});
app.get('/api/embeddings', (req, res) => {
  const mem = JSON.parse(fs.readFileSync(MEMFILE));
  res.json(mem);
});

// --- Skills registry endpoints ---
app.get('/api/skills', (req, res) => {
  const files = fs.readdirSync(skillsDir).filter(f => f.endsWith('.json'));
  const skills = files.map(f => JSON.parse(fs.readFileSync(path.join(skillsDir,f))));
  res.json(skills);
});
app.post('/api/skills', (req, res) => {
  const skill = req.body;
  if (!skill || !skill.id) return res.status(400).json({error:'skill.id required'});
  const file = path.join(skillsDir, `${skill.id}.json`);
  fs.writeFileSync(file, JSON.stringify(skill, null, 2));
  res.json({ok:true});
});

// --- Tool executor (VERY minimal & safe demo) ---
// For safety demo we only allow http fetch tool or JS "action" predefined
const axios = require('axios');
app.post('/api/execute', async (req, res) => {
  const { tool, params } = req.body;
  try {
    if (tool === 'http_fetch') {
      const { url, method='GET', body=null } = params;
      const r = await axios({ url, method, data: body, timeout: 10000 });
      return res.json({ status: r.status, data: r.data });
    }
    // sample skill execution: load local skill script (trusted only)
    if (tool === 'skill_run') {
      const { skillId, input } = params;
      const skillPath = path.join(skillsDir, `${skillId}.js`);
      if (!fs.existsSync(skillPath)) return res.status(404).json({error:'skill not found'});
      // require skill module - only allow trusted skills on server
      const skill = require(skillPath);
      const out = await skill.run(input);
      return res.json({ result: out });
    }
    res.status(400).json({ error: 'unknown tool' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('Server running on', PORT));
