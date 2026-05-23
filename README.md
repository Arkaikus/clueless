# 🎮 Clueless

> Bluff first, panic later.

A colorful browser party game where everyone knows the secret word — except one. That one person is **Clueless**. Can they fake it long enough to survive?

## Tech Stack

| Layer | Tech |
|---|---|
| Runtime / package manager | Bun |
| Frontend | Vite + React + TypeScript |
| Styling | Tailwind CSS v4 |
| P2P Networking | PeerJS (WebRTC) |
| Backend | Cloudflare Workers + Wrangler |
| Room Registry | Cloudflare KV (TTL: 2h) |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Install

```bash
bun install
```

### Dev

```bash
bun run dev
```

This starts:
- Frontend at `http://localhost:5173`
- Worker at `http://localhost:8787`

### Build

```bash
bun run build
```

### Deploy

```bash
bun --filter @clueless/frontend build
bun --filter @clueless/worker deploy
```
