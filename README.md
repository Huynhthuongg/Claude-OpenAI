# 🚀 Sanbox — AI Agent Sandbox (Claude · OpenAI · Multi‑Tool)

[![Release](https://img.shields.io/badge/release-v0.1.0-blue.svg)](https://github.com/Huynhthuongg/Sanbox)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build](https://img.shields.io/badge/build-ready-yellow)](#)
[![Demo](https://img.shields.io/badge/demo-online-lightgrey)](#)

> Một sandbox mạnh mẽ để phát triển và triển khai Agent AI: hỗ trợ đa‑model (OpenAI / Claude / local), executor tools (HTTP, WASM), long‑term memory (pgvector), và một hệ thống skills/agents dễ mở rộng.

---

![hero-demo](assets/demo.gif)

(Mẹo: thay `assets/demo.gif` bằng GIF/ảnh demo của bạn để README sinh động)

---

## ✨ Tại sao Sanbox?
Sanbox được thiết kế cho mục tiêu:
- Khởi tạo nhanh một Agent AI đa‑mô‑đun, dễ cấu hình.
- Hỗ trợ workflow: train/embed → nhớ lâu → truy vấn RAG → chạy tools/sandboxed skills.
- An toàn: tách skill trusted/untrusted, chạy untrusted code trong WASM/WASI.
- Phù hợp để demo, dev, và mở rộng thành hệ thống production.

---

## 🔥 Tính năng nổi bật
- Hệ thống adapter cho nhiều model: OpenAI, Claude, local LLM.
- Endpoints API chuẩn: /api/chat, /api/embeddings, /api/skills, /api/execute.
- Long‑term memory: mẫu lưu local (memory.json) → dễ chuyển sang Postgres + pgvector.
- Skill registry: đăng ký, quản lý, chạy các "skills" (trusted server module hoặc WASM).
- UI demo (chat) + mẫu React/Vite/Tailwind scaffold sẵn.
- CI/CD: GitHub Actions template để build & deploy static frontend.

---

## 🎯 Demo nhanh (Local)
1. Clone repo
```bash
git clone https://github.com/Huynhthuongg/Sanbox.git
cd Sanbox
```

2. Cài phụ thuộc backend (Node)
```bash
npm install
# Nếu dùng OpenAI adapter:
# npm i openai
```

3. Khởi động server demo
```bash
node server.js
# Mở http://localhost:3000
```

4. (Tùy chọn) Chạy Frontend React (nếu đã thêm scaffold)
```bash
cd web
npm install
npm run dev
```

---

## 🧭 Kiến trúc tổng quan

```mermaid
flowchart LR
  Browser[User UI]
  Browser -->|/api/chat| Backend[Server (Express)]
  Backend --> AdapterOpenAI(OpenAI Adapter)
  Backend --> AdapterClaude(Claude Adapter)
  Backend --> LocalLLM(Local LLM)
  Backend --> MemoryDB[Postgres + pgvector]
  Backend --> SkillRegistry[Skills (trusted & wasm)]
  SkillRegistry --> WASM[WASM Sandbox]
  Backend --> Tools[HTTP Executors / External Tools]
```

---

## 🛠️ API chính (mẫu)
- POST /api/chat  
  Body: `{ "input": "Xin chào", "model": "openai" }`  
  Response: `{ "output": "..." }`

- POST /api/embeddings  
  Body: `{ "id":"doc1", "text":"..." }` → Lưu vào memory (demo JSON hoặc DB)

- GET /api/skills  
  Response: danh sách skills đã đăng ký

- POST /api/execute  
  Body: `{ "tool":"http_fetch", "params":{ "url":"https://..." } }`

---

## 🔐 Bảo mật & Best practices
- Không chạy mã untrusted với quyền root.  
- Skills cần `trusted: true` mới được require/exec trực tiếp trên server. Untrusted → bắt buộc đóng gói thành WASM/WASI.  
- Luôn giữ bí mật (OPENAI_API_KEY, ANTHROPIC_API_KEY) trong ENV / Secrets, không commit vào git.  
- Nếu token/PAT lộ: revoke ngay trên provider.

---

## ☁️ Triển khai (recommend)
- Frontend: Vercel / Netlify / GitHub Pages  
- Backend: Railway / Fly.io / Render / VPS  
- Database: Supabase (Postgres + pgvector) hoặc self‑hosted Postgres + pgvector extension

Ví dụ deploy bằng GitHub Actions → Vercel: kết nối repo, chọn folder `web` (nếu dùng React/Vite) hoặc build static `dist`.

---

## 🧩 Mở rộng & Roadmap
- [ ] Embeddings pipeline (OpenAI / sentence-transformers) → RAG chuẩn.  
- [ ] WASM runtime (wasmtime/wasmer) để chạy untrusted skills.  
- [ ] Job queue & orchestration (Redis + BullMQ) cho multi‑step agents.  
- [ ] Streamed responses (SSE/WebSocket) cho UI realtime.  
- [ ] Role‑based access & auditing logs.

---

## 🧪 Contribution (Rất hoan nghênh)
1. Fork → tạo branch `feature/xxx`  
2. Viết test & mô tả PR rõ ràng  
3. Gửi PR → maintainer review

Một số task gợi ý:
- Thêm endpoint GET /v1/health (Good-first)
- Tạo adapter cho Claude (production)
- Triển khai pgvector example & migration

---

## 📁 Cấu trúc file (gợi ý)
```
/
├─ server.js
├─ adapters/
│  ├─ openaiAdapter.js
│  └─ anthropicAdapter.js
├─ skills/
│  ├─ sample-skill.json
│  └─ website-builder.js
├─ web/ (React app)
├─ memory.json
├─ docker-compose.yml
└─ README.md
```

---

## 🎨 Tips để README trông “pro” hơn
- Thêm GIF/Ảnh demo (assets/demo.gif). GIF tạo ấn tượng lập tức.  
- Dùng badges (build | coverage | license).  
- Thêm quick GIF showing chat + skill execution (120–200px high).  
- Viết vài câu “One-liner” mạnh mẽ ở đầu (headline).  
- Ghi rõ Next steps & How to contribute.

---

## 📞 Liên hệ
Owner: **Huynhthuongg** — GitHub  
Nếu cần mình hỗ trợ: tạo PR, upload files, hoặc hướng dẫn deploy → reply ở issue hoặc chat.

---

## ⚖️ License
MIT — xem file LICENSE
